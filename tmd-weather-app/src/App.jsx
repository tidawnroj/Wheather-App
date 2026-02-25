import { useState, useEffect, useMemo, useRef } from 'react'
import Papa from 'papaparse'
import {
  CloudRain,
  Wind,
  Thermometer,
  Droplets,
  MapPin,
  Search,
  Sun,
  Moon,
  ArrowRight,
  Leaf,
  Radio,
  User,
  FileText,
  Snowflake,
  Cloud,
  Info,
  Layers,
  LocateFixed,
  Calendar,
  History,
  LayoutGrid,
  AlertTriangle,
  BarChart3,
  X,
  Download,
  Database,
  Mail,
  ChevronDown,
  ChevronUp,
  Newspaper,
  ExternalLink,
  Bell
} from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix Leaflet default marker icons for Vite bundler
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

import { findNearestStation, STATION_COORDINATES } from './utils/geo'
import './index.css'

const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQJXklPJR4YW55WZxQnfoPqjWK6dpXwWA4sBmAHVeGHXStzjk0UCdZNs002Vow_9T_-xn4P02-JFl8T/pub?gid=130093209&single=true&output=csv'

function MapClickHandler({ setLocation }) {
  useMapEvents({
    click(e) {
      setLocation({ lat: e.latlng.lat, lon: e.latlng.lng })
    }
  })
  return null
}

function MapRelocator({ center }) {
  const map = useMap()
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, map.getZoom())
    }
  }, [center, map])
  return null
}

function App() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [isDarkMode, setIsDarkMode] = useState(false)

  // States for Tabs and Features
  const [activeScreen, setActiveScreen] = useState('dashboard') // dashboard, national, history, compare
  const [searchTerm, setSearchTerm] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [compareList, setCompareList] = useState([])
  const [compareMetrics, setCompareMetrics] = useState(['Temp_C']) // Multiple selected
  const [chartType, setChartType] = useState('bar') // 'bar' or 'line'

  // Geo & Live API States
  const [userLocation, setUserLocation] = useState(null)
  const [nearestStation, setNearestStation] = useState(null)
  const [liveWeather, setLiveWeather] = useState(null)
  const [liveDaily, setLiveDaily] = useState(null)
  const [liveHourly, setLiveHourly] = useState(null)
  const [liveAirQuality, setLiveAirQuality] = useState(null)
  const [weatherAlerts, setWeatherAlerts] = useState([])
  const [radarTime, setRadarTime] = useState(null)
  const [showAdvancedWeatherModal, setShowAdvancedWeatherModal] = useState(false)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [liveLocationName, setLiveLocationName] = useState({ city: 'Locating...', country: '' })
  const [newsFeed, setNewsFeed] = useState([])
  const [newsLoading, setNewsLoading] = useState(false)

  const latestDate = useMemo(() => {
    if (!data || data.length === 0) return '';
    return data.reduce((latest, row) => row.Extraction_Date > latest ? row.Extraction_Date : latest, data[0].Extraction_Date);
  }, [data]);

  const compareHistoryData = useMemo(() => {
    if (compareList.length === 0 || data.length === 0) return [];
    const selectedStations = compareList.map(s => s.Station);
    const relevantData = data.filter(row => selectedStations.includes(row.Station));

    // Group by Extraction_Date
    const dateMap = {};
    relevantData.forEach(row => {
      const date = row.Extraction_Date;
      if (!dateMap[date]) {
        dateMap[date] = { date };
      }
      compareMetrics.forEach(m => {
        dateMap[date][`${row.Station}_${m}`] = parseFloat(row[m]);
      });
    });

    return Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date));
  }, [compareList, compareMetrics, data]);

  const fetchRadarTime = async () => {
    try {
      const res = await fetch('https://api.rainviewer.com/public/weather-maps.json')
      const data = await res.json()
      if (data && data.radar && data.radar.past && data.radar.past.length > 0) {
        setRadarTime(data.radar.past[data.radar.past.length - 1].time)
      }
    } catch (e) {
      console.error("Radar err", e)
    }
  }

  useEffect(() => {
    fetchData()
    detectLocation()
    fetchRadarTime()
    fetchWeatherNews()
  }, [])

  useEffect(() => {
    if (userLocation) {
      fetchLiveWeather(userLocation.lat, userLocation.lon)

      if (data.length > 0) {
        const nearest = findNearestStation(userLocation.lat, userLocation.lon, data)
        setNearestStation(nearest)
      }
    }
  }, [userLocation, data])

  const fetchData = async () => {
    try {
      setLoading(true)
      Papa.parse(GOOGLE_SHEET_CSV_URL, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setData(results.data)
          setLoading(false)
        },
        error: (error) => {
          console.error("Error fetching CSV:", error)
          setLoading(false)
        }
      })
    } catch (err) {
      console.error(err)
      setLoading(false)
    }
  }

  const detectLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lon: position.coords.longitude
        })
      }, (error) => {
        console.log("Geo error:", error)
        // Fallback to Bangkok if geo fails or is denied
        setUserLocation({ lat: 13.7275, lon: 100.5244 })
      })
    } else {
      setUserLocation({ lat: 13.7275, lon: 100.5244 })
    }
  }

  const fetchLiveWeather = async (lat, lon) => {
    try {
      // 1. Fetch Live Weather Data from Open-Meteo with Hourly and Expanded Daily metrics
      const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_gusts_10m,cloud_cover,visibility,surface_pressure,shortwave_radiation&hourly=temperature_2m,relative_humidity_2m,uv_index&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,uv_index_max,precipitation_probability_max&timezone=auto`)
      const weatherData = await weatherRes.json()
      setLiveWeather(weatherData.current)
      setLiveDaily(weatherData.daily)
      setLiveHourly(weatherData.hourly)

      // 1.5 Fetch AQI from Open-Meteo Air Quality API
      const aqRes = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm10,pm2_5,us_aqi&timezone=auto`)
      const aqData = await aqRes.json()
      setLiveAirQuality(aqData.current)

      // 1.6 Generate Alerts
      const alerts = []
      if (weatherData.current?.temperature_2m > 36) alerts.push("⚠️ Extreme Heat Warning (> 36°C)")
      if (weatherData.current?.wind_gusts_10m > 40) alerts.push("⚠️ High Wind Gusts Warning")
      if (weatherData.current?.precipitation > 10) alerts.push("🌧️ Heavy Rainfall Alert")
      if (aqData.current?.pm2_5 > 50) alerts.push("😷 Unhealthy Air Quality (PM2.5)")
      if (weatherData.daily?.uv_index_max?.[0] >= 8) alerts.push("☀️ Extreme UV Levels - Protect Skin")
      setWeatherAlerts(alerts)

      // 2. Reverse Geocoding to get City/Country Name via Nominatim (OpenStreetMap)
      const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`)
      const geoData = await geoRes.json()

      if (geoData && geoData.address) {
        setLiveLocationName({
          city: geoData.address.city || geoData.address.town || geoData.address.state || 'Local Area',
          country: geoData.address.country || 'Thailand'
        })
      }
    } catch (error) {
      console.error("Error fetching live API data:", error)
    }
  }

  const fetchWeatherNews = async () => {
    try {
      setNewsLoading(true)
      // Use GDACS (Global Disaster Alert and Coordination System) RSS feed
      const proxyUrl = 'https://api.allorigins.win/raw?url='
      const feedUrl = encodeURIComponent('https://www.gdacs.org/xml/rss_7d.xml')
      const res = await fetch(proxyUrl + feedUrl)
      if (!res.ok) throw new Error(`Feed ${res.status}`)
      const text = await res.text()
      const parser = new DOMParser()
      const xml = parser.parseFromString(text, 'text/xml')
      const items = xml.querySelectorAll('item')
      const articles = []
      items.forEach((item, i) => {
        if (i >= 12) return
        const title = item.querySelector('title')?.textContent || 'Untitled Alert'
        const link = item.querySelector('link')?.textContent || '#'
        const pubDate = item.querySelector('pubDate')?.textContent
        const desc = item.querySelector('description')?.textContent || ''
        // Filter for weather-related alerts (SE Asia focus)
        articles.push({
          id: i,
          title: title,
          url: link,
          source: 'GDACS',
          date: pubDate ? new Date(pubDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent',
        })
      })
      setNewsFeed(articles)
    } catch (e) {
      console.error('News fetch err:', e)
      setNewsFeed([])
    } finally {
      setNewsLoading(false)
    }
  }

  // Calculate real stats from CSV data for the National Records
  const stats = useMemo(() => {
    if (!data || data.length === 0) return null;

    let maxTemp = data[0] || {};
    let minTemp = data[0] || {};
    let maxRain = data[0] || {};
    let maxHumid = data[0] || {};

    data.forEach(row => {
      if (row.Tmax_C && parseFloat(row.Tmax_C) > parseFloat(maxTemp.Tmax_C || 0)) maxTemp = row;
      if (row.Tmin_C && parseFloat(row.Tmin_C) < parseFloat(minTemp.Tmin_C || 100)) minTemp = row;
      if (row.Rain_mm && parseFloat(row.Rain_mm) > parseFloat(maxRain.Rain_mm || 0)) maxRain = row;
      if (row.RH_percent && parseFloat(row.RH_percent) > parseFloat(maxHumid.RH_percent || 0)) maxHumid = row;
    });

    return { maxTemp, minTemp, maxRain, maxHumid }
  }, [data])


  // --- Data Filtering Logic for National & History Tabs ---
  const filteredByDate = useMemo(() => {
    return data.filter(row => row.Extraction_Date === selectedDate)
  }, [data, selectedDate])

  const searchResults = useMemo(() => {
    const list = activeScreen === 'history' ? filteredByDate : data

    // De-duplicate stations for the National view so we only show the latest
    // Assuming CSV is sorted with newest at top, or we just grab the first instance
    const uniqueStationsMap = new Map();
    list.forEach(row => {
      if (row.Station && !uniqueStationsMap.has(row.Station)) {
        uniqueStationsMap.set(row.Station, row);
      }
    });
    const uniqueList = Array.from(uniqueStationsMap.values());

    return uniqueList.filter(row => {
      if (!row.Station) return false;
      return row.Station.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (row.Region && row.Region.toLowerCase().includes(searchTerm.toLowerCase()))
    })
  }, [data, filteredByDate, activeScreen, searchTerm])

  const toggleCompare = (station) => {
    if (compareList.find(s => s.Station === station.Station)) {
      setCompareList(compareList.filter(s => s.Station !== station.Station))
    } else {
      if (compareList.length < 4) setCompareList([...compareList, station])
    }
  }

  const exportCSV = () => {
    const csv = Papa.unparse(searchResults)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `tmd-weather-pro-${selectedDate}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Map WMO Weather Codes to text
  const getWeatherDescription = (code) => {
    if (code === undefined) return 'Loading...';
    if (code === 0) return 'Clear sky';
    if (code === 1 || code === 2 || code === 3) return 'Partly cloudy';
    if (code >= 45 && code <= 48) return 'Foggy';
    if (code >= 51 && code <= 67) return 'Rainy';
    if (code >= 71 && code <= 77) return 'Snow';
    if (code >= 80 && code <= 82) return 'Rain showers';
    if (code >= 95) return 'Thunderstorm';
    return 'Cloudy';
  }


  return (
    <div className={`${isDarkMode ? 'dark' : ''}`}>
      <div className="min-h-screen bg-[#f5f7fa] dark:bg-[#000000] text-slate-900 dark:text-white font-sans selection:bg-blue-500/30 overflow-x-hidden relative transition-colors duration-500 flex flex-col">

        {/* Ambient Left Background Blob matches the design */}
        <div className="absolute top-0 left-0 w-[500px] lg:w-[800px] h-[600px] lg:h-[800px] bg-gradient-to-br from-blue-300/40 to-blue-500/10 dark:from-blue-600/20 dark:to-transparent rounded-full blur-[80px] lg:blur-[120px] -translate-x-1/2 -translate-y-1/4 pointer-events-none z-0"></div>

        {/* Top Navbar */}
        <nav className="fixed top-0 left-0 w-full z-50 bg-white/90 dark:bg-[#050505]/90 backdrop-blur-xl flex items-center justify-between px-6 lg:px-10 py-4 border-b border-transparent dark:border-white/5 shadow-sm transition-colors duration-500">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveScreen('dashboard')}>
            <div className="w-8 h-8 lg:w-10 lg:h-10 bg-blue-500 rounded-full flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-500/30">
              <Cloud className="w-5 h-5 fill-current" />
            </div>
            <div className="hidden sm:flex flex-col justify-center">
              <span className="text-xl lg:text-2xl font-black tracking-tight whitespace-nowrap leading-none">TMD Weather Pro</span>
              {latestDate && <span className="text-[10px] font-bold text-blue-500 mt-1 uppercase tracking-wider">CSV Updated: {latestDate}</span>}
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-6 xl:gap-10 text-[14px] xl:text-[15px] font-bold text-slate-500 dark:text-slate-400">
            <button className={`transition-colors ${activeScreen === 'dashboard' ? 'text-blue-500' : 'hover:text-slate-900 dark:hover:text-white'}`} onClick={() => setActiveScreen('dashboard')}>Live Dashboard</button>
            <button className={`transition-colors ${activeScreen === 'national' ? 'text-blue-500' : 'hover:text-slate-900 dark:hover:text-white'}`} onClick={() => setActiveScreen('national')}>National Grid</button>
            <button className={`transition-colors ${activeScreen === 'history' ? 'text-blue-500' : 'hover:text-slate-900 dark:hover:text-white'}`} onClick={() => setActiveScreen('history')}>Historical Data</button>
            <button className={`transition-colors flex items-center gap-1.5 ${activeScreen === 'compare' ? 'text-blue-500' : 'hover:text-slate-900 dark:hover:text-white'}`} onClick={() => setActiveScreen('compare')}>
              Compare {compareList.length > 0 && <span className="bg-blue-500 text-white rounded-full w-4 h-4 text-[9px] flex items-center justify-center">{compareList.length}</span>}
            </button>
            <button className={`transition-colors flex items-center gap-1.5 ${activeScreen === 'alerts' ? 'text-red-500' : 'hover:text-red-500'}`} onClick={() => setActiveScreen('alerts')}>
              <Bell className="w-4 h-4" /> Alerts
              {weatherAlerts.length > 0 && <span className="bg-red-500 text-white rounded-full w-4 h-4 text-[9px] flex items-center justify-center animate-pulse">{weatherAlerts.length}</span>}
            </button>
          </div>

          <div className="flex items-center gap-3 xl:gap-4">
            <div className="hidden md:block relative">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
              <input
                type="text"
                placeholder="Search stations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                className="bg-slate-100 dark:bg-[#141414] border-none rounded-full py-2.5 pl-10 pr-4 w-[180px] xl:w-[280px] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 dark:text-white relative z-0"
              />
              {/* Search Suggestions Dropdown */}
              {isSearchFocused && searchTerm.length > 0 && searchResults.length > 0 && (
                <div className="absolute top-[calc(100%+0.5rem)] left-0 w-full bg-white dark:bg-[#141414] border border-slate-100 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden z-50 max-h-[300px] overflow-y-auto">
                  {searchResults.slice(0, 8).map((station, i) => (
                    <div
                      key={i}
                      className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer flex justify-between items-center border-b border-slate-50 dark:border-white/5 last:border-none"
                      onClick={() => {
                        setSearchTerm(station.Station);
                        setIsSearchFocused(false);
                        if (activeScreen === 'dashboard' || activeScreen === 'compare') setActiveScreen('national');
                      }}
                    >
                      <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white">{station.Station}</div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest">{station.Region}</div>
                      </div>
                      <div className="text-sm font-black text-blue-500">{station.Temp_C}°</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile Menu Dropdown Toggle (Visual Only) */}
            <div className="lg:hidden flex gap-2">
              <button className={`p-2 rounded-lg text-xs font-bold ${activeScreen === 'national' ? 'bg-blue-500 text-white' : 'bg-black/5 dark:bg-white/5'}`} onClick={() => setActiveScreen('national')}><LayoutGrid className="w-4 h-4" /></button>
              <button className={`p-2 rounded-lg text-xs font-bold ${activeScreen === 'history' ? 'bg-blue-500 text-white' : 'bg-black/5 dark:bg-white/5'}`} onClick={() => setActiveScreen('history')}><History className="w-4 h-4" /></button>
            </div>

            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="w-10 h-10 shrink-0 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
              aria-label="Toggle Theme"
            >
              {isDarkMode ? <Moon className="w-5 h-5 text-slate-300" /> : <Sun className="w-5 h-5 text-slate-600" />}
            </button>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="relative z-10 w-full max-w-[1500px] mx-auto px-6 lg:px-12 pt-[120px] pb-24 flex-grow">

          {/* =========================================
              SCREEN 1: LIVE DASHBOARD (API DATA) 
              ========================================= */}
          {activeScreen === 'dashboard' && (
            <div className="animate-fade-in">
              {/* Hero Section */}
              <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 mb-20">
                <div className="flex-1 flex flex-col justify-center">
                  <span className="text-blue-500 font-black uppercase tracking-[0.15em] text-xs mb-6 flex items-center gap-2">
                    <Radio className="w-4 h-4 animate-pulse" /> LIVE LOCAL CONDITIONS
                  </span>
                  <h1 className="text-6xl lg:text-[5.5rem] font-black leading-[0.9] tracking-tight mb-2">
                    {liveLocationName.city},
                  </h1>
                  <h1 className="text-6xl lg:text-[5.5rem] font-black leading-[0.9] tracking-tight text-blue-500 mb-8">
                    {liveLocationName.country}
                  </h1>

                  {/* Alert Banner */}
                  {weatherAlerts.length > 0 && (
                    <div className="mb-8 flex flex-col gap-3">
                      {weatherAlerts.map((alert, i) => (
                        <div key={i} className="w-full bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-2xl p-4 flex items-center gap-3 animate-fade-in shadow-sm">
                          <AlertTriangle className="w-5 h-5 shrink-0" />
                          <span className="font-bold">{alert}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-end gap-4 lg:gap-6 mb-8">
                    <div className="text-7xl lg:text-[7rem] font-black tracking-tighter leading-[0.8]">
                      {liveWeather ? liveWeather.temperature_2m : '--'}
                    </div>
                    <div className="flex flex-col pb-2">
                      <span className="text-4xl lg:text-5xl text-blue-500 font-light leading-none mb-2">°C</span>
                      <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">{liveWeather ? getWeatherDescription(liveWeather.weather_code) : 'Connecting...'}</span>
                    </div>
                  </div>

                  <p className="text-lg lg:text-xl text-slate-600 dark:text-slate-400 font-medium max-w-md leading-relaxed mb-10">
                    Feels like {liveWeather?.apparent_temperature || '--'}°C. Current relative humidity is {liveWeather?.relative_humidity_2m || '--'}% with wind speeds up to {liveWeather?.wind_speed_10m || '--'} km/h.
                  </p>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 lg:gap-10">
                    <button onClick={() => setShowAdvancedWeatherModal(true)} className="bg-[#0b84ff] text-white px-8 py-4 rounded-full font-bold shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all w-full sm:w-auto text-center flex items-center justify-center gap-2">
                      Advanced Hourly Insights
                    </button>
                    <div className="pl-2 border-l-2 border-slate-200 dark:border-white/10 hidden sm:block">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">DATA SOURCE</div>
                      <div className="flex items-center gap-1.5 text-blue-500 font-bold text-sm">
                        <MapPin className="w-4 h-4" /> Open-Meteo API
                      </div>
                    </div>
                  </div>

                  {/* Permanent 7-Day Forecast Module */}
                  {liveDaily && (
                    <div className="mt-10 animate-fade-in bg-white dark:bg-[#141414] rounded-3xl p-6 shadow-xl border border-transparent dark:border-white/5">
                      <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6">7-Day Local Forecast</h4>
                      <div className="flex overflow-x-auto gap-4 pb-4 snap-x">
                        {liveDaily.time.map((timeStr, idx) => {
                          const dateObj = new Date(timeStr);
                          const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                          return (
                            <div key={idx} className="bg-slate-50 dark:bg-white/5 rounded-2xl p-4 min-w-[100px] flex-shrink-0 flex flex-col items-center justify-center snap-center hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
                              <span className="text-xs font-bold text-slate-500 mb-2">{idx === 0 ? 'Today' : dayName}</span>
                              <div className="text-2xl mb-2">{[0, 1, 2].includes(liveDaily.weather_code[idx]) ? '☀️' : [3].includes(liveDaily.weather_code[idx]) ? '⛅' : '🌧️'}</div>
                              <span className="font-black text-lg text-slate-900 dark:text-white">{Math.round(liveDaily.temperature_2m_max[idx])}°</span>
                              <span className="text-sm font-bold text-slate-400">{Math.round(liveDaily.temperature_2m_min[idx])}°</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                </div>

                {/* Right Map Module */}
                <div className="flex-[1.2] lg:flex-[1.4] relative rounded-[2.5rem] overflow-hidden shadow-[0_20px_60px_rgb(0,0,0,0.08)] dark:shadow-[0_20px_60px_rgb(0,0,0,0.4)] min-h-[400px] h-[500px] lg:h-auto bg-slate-200 dark:bg-slate-800 border border-black/5 dark:border-white/5">
                  <iframe
                    title="Live GPS Map Location"
                    width="100%"
                    height="100%"
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                    frameBorder="0"
                    scrolling="no"
                    marginHeight="0"
                    marginWidth="0"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${userLocation ? userLocation.lon - 0.1 : 100.4}%2C${userLocation ? userLocation.lat - 0.1 : 13.6}%2C${userLocation ? userLocation.lon + 0.1 : 100.6}%2C${userLocation ? userLocation.lat + 0.1 : 13.8}&layer=mapnik&marker=${userLocation?.lat}%2C${userLocation?.lon}`}
                    style={{ filter: isDarkMode ? 'invert(90%) hue-rotate(180deg) contrast(90%)' : 'contrast(105%) brightness(105%)' }}
                  ></iframe>

                  {/* Custom Marker Overlay */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[100%]">
                    <div className="w-8 h-8 bg-blue-500 rounded-full border-4 border-white shadow-xl animate-bounce flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  </div>

                  <div className="absolute right-6 top-6 flex flex-col gap-2">
                    <button className="w-10 h-10 rounded-full bg-white dark:bg-[#1c1c1e] text-slate-900 dark:text-white shadow-lg flex items-center justify-center hover:scale-105 transition-transform"><Layers className="w-5 h-5" /></button>
                    <button className="w-10 h-10 rounded-full bg-blue-500 text-white shadow-lg flex items-center justify-center hover:scale-105 transition-transform"><LocateFixed className="w-5 h-5" /></button>
                  </div>

                  <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
                    <div className="bg-white/95 dark:bg-[#1c1c1e]/95 backdrop-blur-md p-4 pr-12 rounded-2xl flex items-center gap-4 shadow-xl border border-white/20 dark:border-white/5">
                      <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                        <LocateFixed className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white leading-none mb-1">Exact GPS Match</div>
                        <div className="text-[11px] font-semibold text-slate-500">Live coordinates synced</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* National Top Records Grid */}
              <div className="mb-20">
                <div className="flex justify-between items-end mb-8 pl-1 border-t border-slate-200 dark:border-white/5 pt-12">
                  <div>
                    <h3 className="text-2xl lg:text-3xl font-black tracking-tight flex items-center gap-3">
                      <Thermometer className="w-6 h-6 text-orange-500" />
                      National Extremes
                    </h3>
                    <p className="text-slate-500 mt-2 text-sm font-medium">Pulled daily from the central TMD dataset</p>
                  </div>
                  <button onClick={() => setActiveScreen('national')} className="text-blue-500 font-bold text-sm flex items-center gap-1.5 hover:text-blue-600 transition-colors uppercase tracking-wider hidden sm:flex">
                    Browse Grid <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

                  {/* Highest Temp */}
                  <div className="bg-white dark:bg-[#141414] rounded-3xl p-8 hover:-translate-y-1 transition-all duration-300 shadow-[0_8px_30px_rgb(0,0,0,0.03)] dark:shadow-none border border-transparent dark:border-white/5">
                    <div className="w-12 h-12 rounded-full bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center text-orange-500 mb-6">
                      <Thermometer className="w-6 h-6" />
                    </div>
                    <div className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase mb-2">HIGHEST TEMP</div>
                    <div className="text-[2.5rem] font-black leading-none mb-2">{stats?.maxTemp?.Tmax_C || '--'}°C</div>
                    <div className="text-sm font-semibold text-slate-500 truncate">{stats?.maxTemp?.Station || '--'}</div>
                  </div>

                  {/* Lowest Temp */}
                  <div className="bg-white dark:bg-[#141414] rounded-3xl p-8 hover:-translate-y-1 transition-all duration-300 shadow-[0_8px_30px_rgb(0,0,0,0.03)] dark:shadow-none border border-transparent dark:border-white/5">
                    <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-500 mb-6">
                      <Snowflake className="w-6 h-6" />
                    </div>
                    <div className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase mb-2">LOWEST TEMP</div>
                    <div className="text-[2.5rem] font-black leading-none mb-2">{stats?.minTemp?.Tmin_C || '--'}°C</div>
                    <div className="text-sm font-semibold text-slate-500 truncate">{stats?.minTemp?.Station || '--'}</div>
                  </div>

                  {/* Max Rainfall */}
                  <div className="bg-white dark:bg-[#141414] rounded-3xl p-8 hover:-translate-y-1 transition-all duration-300 shadow-[0_8px_30px_rgb(0,0,0,0.03)] dark:shadow-none border border-transparent dark:border-white/5">
                    <div className="w-12 h-12 rounded-full bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center text-purple-500 mb-6">
                      <CloudRain className="w-6 h-6" />
                    </div>
                    <div className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase mb-2">MAX RAINFALL</div>
                    <div className="text-[2.5rem] font-black leading-none mb-2">{stats?.maxRain?.Rain_mm ? `${stats.maxRain.Rain_mm}mm` : '--'}</div>
                    <div className="text-sm font-semibold text-slate-500 truncate">{stats?.maxRain?.Station || '--'}</div>
                  </div>

                  {/* Peak Humidity */}
                  <div className="bg-white dark:bg-[#141414] rounded-3xl p-8 hover:-translate-y-1 transition-all duration-300 shadow-[0_8px_30px_rgb(0,0,0,0.03)] dark:shadow-none border border-transparent dark:border-white/5">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-6">
                      <Wind className="w-6 h-6" />
                    </div>
                    <div className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase mb-2">MAX HUMIDITY</div>
                    <div className="text-[2.5rem] font-black leading-none mb-2">{stats?.maxHumid?.RH_percent || '--'}%</div>
                    <div className="text-sm font-semibold text-slate-500 truncate">{stats?.maxHumid?.Station || '--'}</div>
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* =========================================
              SCREEN 2: NATIONAL GRID (CSV DATA)
              ========================================= */}
          {activeScreen === 'national' && (
            <div className="animate-fade-in space-y-10">
              <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-12">
                <div>
                  <h2 className="text-4xl lg:text-5xl font-black tracking-tight mb-3">National Network CSV</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-lg flex items-center gap-2">
                    <Database className="w-4 h-4" /> Browsing full dataset from daily TMD extracts.
                  </p>
                </div>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
                {searchResults.slice(0, 100).map((station, i) => (
                  <div key={i} className="relative bg-white dark:bg-[#141414] rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.03)] dark:shadow-none border border-transparent dark:border-white/5 hover:-translate-y-1 transition-transform group">
                    <button
                      onClick={() => toggleCompare(station)}
                      className={`absolute top-6 right-6 p-2 rounded-xl transition-all shadow-sm ${compareList.find(s => s.Station === station.Station)
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-100 dark:bg-white/5 text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
                        }`}
                      title={compareList.find(s => s.Station === station.Station) ? "Remove from comparison" : "Add to comparison"}
                    >
                      <Layers className="w-4 h-4" />
                    </button>

                    <div className="pr-12">
                      <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-2 block">{station.Region}</span>
                      <h4 className="text-2xl font-black leading-tight line-clamp-1 mb-6 text-slate-900 dark:text-white" title={station.Station}>{station.Station}</h4>
                    </div>

                    <div className="flex justify-between items-end mb-6">
                      <span className="text-[3.5rem] font-black tracking-tighter leading-none text-slate-900 dark:text-white">{station.Temp_C}°</span>
                      <div className="flex flex-col items-end gap-1 font-bold text-xs">
                        <span className="text-red-500 bg-red-50 dark:bg-red-500/10 px-2 py-0.5 rounded-lg">H {station.Tmax_C}°</span>
                        <span className="text-blue-500 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded-lg">L {station.Tmin_C}°</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-4 border-t border-slate-100 dark:border-white/5">
                      <div className="flex items-center gap-2 bg-slate-50 dark:bg-white/5 rounded-xl p-2.5">
                        <Droplets className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-bold text-slate-600 dark:text-slate-300">{station.RH_percent}%</span>
                      </div>
                      <div className="flex items-center gap-2 bg-slate-50 dark:bg-white/5 rounded-xl p-2.5">
                        <CloudRain className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-bold text-slate-600 dark:text-slate-300">{station.Rain_mm}mm</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* =========================================
              SCREEN 3: COMPARE STATIONS 
              ========================================= */}
          {activeScreen === 'compare' && (
            <div className="animate-fade-in space-y-12">
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-4xl lg:text-5xl font-black tracking-tight mb-3">Parallel Analysis</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-lg">Compare metrics across {compareList.length}/4 selected stations</p>
                </div>
                {compareList.length > 0 && (
                  <button onClick={() => setCompareList([])} className="text-xs font-bold bg-red-50 dark:bg-red-500/10 text-red-500 px-4 py-2 rounded-full hover:bg-red-100 transition-colors uppercase tracking-widest">
                    Clear All
                  </button>
                )}
              </div>

              {compareList.length > 0 ? (
                <>
                  {/* Graph Section */}
                  <div className="bg-white dark:bg-[#141414] rounded-[2.5rem] p-6 lg:p-10 shadow-lg border border-transparent dark:border-white/5">
                    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-6">
                      <div className="flex flex-col gap-3">
                        <h3 className="text-2xl font-black">Multi-Variable Analysis</h3>
                        <div className="flex flex-wrap gap-2">
                          {['Temp_C', 'Tmax_C', 'Tmin_C', 'RH_percent', 'Rain_mm'].map(m => (
                            <button
                              key={m}
                              onClick={() => {
                                if (compareMetrics.includes(m)) {
                                  if (compareMetrics.length > 1) setCompareMetrics(compareMetrics.filter(x => x !== m))
                                } else {
                                  setCompareMetrics([...compareMetrics, m])
                                }
                              }}
                              className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${compareMetrics.includes(m) ? 'bg-blue-500 border-blue-500 text-white shadow-md shadow-blue-500/20' : 'bg-transparent border-slate-200 dark:border-white/10 text-slate-500 hover:border-slate-300 dark:hover:border-white/20 hover:text-slate-900 dark:hover:text-white'}`}
                            >
                              {m === 'Temp_C' ? 'Temperature' : m === 'Tmax_C' ? 'Max Temp' : m === 'Tmin_C' ? 'Min Temp' : m === 'RH_percent' ? 'Humidity' : 'Rainfall'}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex bg-slate-100 dark:bg-[#202020] rounded-xl p-1 shrink-0 w-full xl:w-auto">
                        <button onClick={() => setChartType('bar')} className={`flex-1 xl:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${chartType === 'bar' ? 'bg-white dark:bg-[#333] shadow text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Bar</button>
                        <button onClick={() => setChartType('line')} className={`flex-1 xl:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${chartType === 'line' ? 'bg-white dark:bg-[#333] shadow text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Line</button>
                      </div>
                    </div>
                    <div className="h-[350px] w-full mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        {chartType === 'bar' ? (
                          <BarChart data={compareList} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#333' : '#eee'} vertical={false} />
                            <XAxis dataKey="Station" tick={{ fill: isDarkMode ? '#888' : '#666', fontSize: 12, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: isDarkMode ? '#888' : '#666', fontSize: 12 }} axisLine={false} tickLine={false} />
                            <Tooltip
                              contentStyle={{ borderRadius: '16px', border: 'none', backgroundColor: isDarkMode ? '#1c1c1e' : '#fff', color: isDarkMode ? '#fff' : '#000', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                              cursor={{ fill: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
                            />
                            <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px', fontWeight: 'bold' }} />
                            {compareMetrics.map((m, idx) => (
                              <Bar key={m} dataKey={m} name={m === 'Temp_C' ? 'Temperature (°C)' : m === 'Tmax_C' ? 'Max Temp (°C)' : m === 'Tmin_C' ? 'Min Temp (°C)' : m === 'RH_percent' ? 'Humidity (%)' : 'Rainfall (mm)'} fill={['#0b84ff', '#ff9f0a', '#32ade6', '#34c759', '#af52de'][idx % 5]} radius={[4, 4, 0, 0]} maxBarSize={40} />
                            ))}
                          </BarChart>
                        ) : (
                          <LineChart data={compareHistoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#333' : '#eee'} vertical={false} />
                            <XAxis dataKey="date" tick={{ fill: isDarkMode ? '#888' : '#666', fontSize: 12, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: isDarkMode ? '#888' : '#666', fontSize: 12 }} axisLine={false} tickLine={false} />
                            <Tooltip
                              contentStyle={{ borderRadius: '16px', border: 'none', backgroundColor: isDarkMode ? '#1c1c1e' : '#fff', color: isDarkMode ? '#fff' : '#000', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                            />
                            <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px', fontWeight: 'bold' }} />
                            {compareList.map((station, sIdx) =>
                              compareMetrics.map((m, mIdx) => {
                                const colors = ['#0b84ff', '#ff9f0a', '#32ade6', '#34c759', '#af52de', '#ff3b30', '#ffcc00', '#5856d6'];
                                const color = colors[(sIdx * compareMetrics.length + mIdx) % colors.length];
                                const vName = m === 'Temp_C' ? 'Temp' : m === 'Tmax_C' ? 'Max Temp' : m === 'Tmin_C' ? 'Min Temp' : m === 'RH_percent' ? 'Humidity' : 'Rainfall';
                                return (
                                  <Line key={`${station.Station}_${m}`} type="monotone" dataKey={`${station.Station}_${m}`} name={`${station.Station} - ${vName}`} stroke={color} strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                )
                              })
                            )}
                          </LineChart>
                        )}
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                    {compareList.map((station, i) => (
                      <div key={i} className="relative bg-blue-500 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-blue-500/20 transform transition-transform hover:-translate-y-2">
                        <button
                          onClick={() => toggleCompare(station)}
                          className="absolute top-6 right-6 w-10 h-10 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>

                        <div className="space-y-2 mb-8 pr-12">
                          <span className="text-[10px] font-black tracking-[0.2em] text-white/70 uppercase">{station.Region}</span>
                          <h3 className="text-3xl font-black leading-tight line-clamp-2">{station.Station}</h3>
                        </div>

                        <div className="bg-white/10 rounded-3xl p-6 mb-6">
                          <span className="text-xs font-bold text-white/50 uppercase tracking-widest block mb-1">Current</span>
                          <span className="text-6xl font-black">{station.Temp_C}°</span>
                        </div>

                        <div className="space-y-4 px-2">
                          <div className="flex justify-between items-center pb-4 border-b border-white/10">
                            <span className="text-sm font-bold text-white/70">High / Low</span>
                            <span className="text-base font-black">{station.Tmax_C}° / {station.Tmin_C}°</span>
                          </div>
                          <div className="flex justify-between items-center pb-4 border-b border-white/10">
                            <span className="text-sm font-bold text-white/70">Humidity</span>
                            <span className="text-base font-black">{station.RH_percent}%</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-white/70">Rainfall</span>
                            <span className="text-base font-black">{station.Rain_mm} mm</span>
                          </div>
                        </div>
                      </div>
                    ))}

                    {compareList.length < 4 && (
                      <div
                        onClick={() => setActiveScreen('national')}
                        className="rounded-[2.5rem] border-4 border-dashed border-slate-300 dark:border-white/10 flex flex-col items-center justify-center gap-6 cursor-pointer hover:bg-slate-100 dark:hover:bg-[#141414] transition-colors min-h-[400px] group"
                      >
                        <div className="w-20 h-20 rounded-full bg-slate-200 dark:bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Search className="w-8 h-8 text-slate-400" />
                        </div>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest text-center px-8">Add Station from Grid</p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="py-20 text-center bg-white dark:bg-[#141414] rounded-[3rem] border border-slate-100 dark:border-white/5">
                  <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-8">
                    <Layers className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                  </div>
                  <h3 className="text-3xl font-black mb-4">No Stations Selected</h3>
                  <p className="text-slate-500 text-lg mb-8 max-w-md mx-auto">Build your comparison deck by adding up to 4 stations from the National grid.</p>
                  <button
                    onClick={() => setActiveScreen('national')}
                    className="px-10 py-4 bg-blue-500 text-white rounded-full font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition-transform"
                  >
                    Browse National Network
                  </button>
                </div>
              )}
            </div>
          )}

          {/* =========================================
              SCREEN 4: HISTORICAL ARCHIVE
              ========================================= */}
          {activeScreen === 'history' && (
            <div className="animate-fade-in space-y-8 flex flex-col h-full">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-8">
                <div>
                  <h2 className="text-4xl lg:text-5xl font-black tracking-tight mb-3">Database Archive</h2>
                  <p className="text-slate-500 text-lg">Access comprehensive historical records from CSV storage.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                  <div className="bg-white dark:bg-[#141414] shadow-sm border border-slate-200 dark:border-white/5 rounded-2xl p-2 flex items-center px-4 w-full sm:w-64">
                    <Calendar className="w-5 h-5 text-blue-500 mr-3" />
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="bg-transparent border-none outline-none font-bold text-sm w-full cursor-pointer focus:text-blue-500 text-slate-900 dark:text-white"
                    />
                  </div>
                  <button onClick={exportCSV} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-4 sm:py-0 rounded-2xl flex items-center justify-center gap-2 font-bold hover:scale-105 transition-all text-sm w-full sm:w-auto">
                    <Download className="w-4 h-4" /> Export CSV
                  </button>
                </div>
              </div>

              <div className="bg-white dark:bg-[#141414] rounded-[2rem] border border-slate-200 dark:border-white/5 overflow-hidden flex-grow flex flex-col shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left whitespace-nowrap min-w-[800px]">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-[var(--glass-border)]">
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Location ID / Node</th>
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Recorded Temp</th>
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Extremes (H/L)</th>
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Rainfall Extent</th>
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-[var(--glass-border)]">
                      {filteredByDate.length > 0 ? filteredByDate.slice(0, 100).map((row, i) => (
                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                          <td className="px-8 py-5">
                            <div className="font-bold text-base text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors">{row.Station}</div>
                            <div className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-1">{row.Region}</div>
                          </td>
                          <td className="px-8 py-5 text-right font-black text-2xl text-slate-900 dark:text-white">{row.Temp_C}°</td>
                          <td className="px-8 py-5 text-right">
                            <div className="flex justify-end items-center gap-3">
                              <span className="font-bold text-red-500 text-sm bg-red-50 dark:bg-red-500/10 px-2 py-1 rounded-md">{row.Tmax_C}°</span>
                              <span className="font-bold text-blue-500 text-sm bg-blue-50 dark:bg-blue-500/10 px-2 py-1 rounded-md">{row.Tmin_C}°</span>
                            </div>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <span className="font-bold text-slate-600 dark:text-slate-300 text-sm">{row.Rain_mm} mm</span>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <span className="font-mono text-xs font-bold text-slate-400 bg-slate-100 dark:bg-white/5 px-3 py-1.5 rounded-lg">{row.Extraction_Date}</span>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan="5" className="px-10 py-32 text-center">
                            <History className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-6" />
                            <p className="text-xl font-black mb-2 text-slate-900 dark:text-white">No Archive Records</p>
                            <p className="text-slate-500 font-medium">The dataset is empty for the selected temporal coordinates.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =========================================
              SCREEN 5: ALERT CENTER
              ========================================= */}
          {activeScreen === 'alerts' && (
            <div className="animate-fade-in">
              <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 mb-20">
                {/* Left: Main Content */}
                <div className="flex-1 flex flex-col">
                  <span className="text-red-500 font-black uppercase tracking-[0.15em] text-xs mb-6 flex items-center gap-2">
                    <Bell className="w-4 h-4 animate-pulse" /> ALERT CENTER
                  </span>
                  <h1 className="text-5xl lg:text-7xl font-black leading-[0.9] tracking-tight mb-4">
                    Weather
                  </h1>
                  <h1 className="text-5xl lg:text-7xl font-black leading-[0.9] tracking-tight text-red-500 mb-8">
                    Alerts & News
                  </h1>
                  <p className="text-lg text-slate-500 dark:text-slate-400 font-medium max-w-lg mb-10">
                    Real-time weather warnings, disaster reports, and live radar tracking for Thailand and the region.
                  </p>

                  {/* Current Condition Alerts */}
                  {weatherAlerts.length > 0 ? (
                    <div className="flex flex-col gap-3 mb-10">
                      <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-2">Active Warnings ({liveLocationName.city})</h3>
                      {weatherAlerts.map((alert, i) => (
                        <div key={i} className="w-full bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-2xl p-5 flex items-center gap-3 shadow-sm">
                          <AlertTriangle className="w-5 h-5 shrink-0" />
                          <span className="font-bold">{alert}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 rounded-2xl p-5 flex items-center gap-3 mb-10 shadow-sm">
                      <Info className="w-5 h-5 shrink-0" />
                      <span className="font-bold">All clear! No active weather warnings for {liveLocationName.city}.</span>
                    </div>
                  )}
                </div>

                {/* Right: Live Radar Map */}
                <div className="flex-[1.2] lg:flex-[1.4] relative rounded-[2.5rem] overflow-hidden shadow-[0_20px_60px_rgb(0,0,0,0.08)] dark:shadow-[0_20px_60px_rgb(0,0,0,0.4)] min-h-[400px] h-[500px] lg:h-auto bg-slate-200 dark:bg-slate-800 border border-black/5 dark:border-white/5">
                  <div className="absolute top-6 left-6 z-[400] bg-white/90 dark:bg-black/80 backdrop-blur border border-black/10 dark:border-white/10 px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 pointer-events-none">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <span className="text-xs font-bold whitespace-nowrap text-slate-900 dark:text-white">Live Weather Radar<br />
                      <span className="text-[10px] text-slate-500 font-normal">RainViewer Cloud & Precipitation</span>
                    </span>
                  </div>
                  <MapContainer center={[13.75, 100.5]} zoom={6} scrollWheelZoom={true} style={{ height: '100%', width: '100%', zIndex: 1 }}>
                    <TileLayer
                      attribution='&copy; <a href="https://osm.org/copyright">OSM</a>'
                      url={isDarkMode
                        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"}
                    />
                    {radarTime && (
                      <TileLayer
                        url={`https://tilecache.rainviewer.com/v2/radar/${radarTime}/256/{z}/{x}/{y}/2/1_1.png`}
                        opacity={0.7}
                        zIndex={10}
                      />
                    )}
                    {userLocation && (
                      <Marker position={[userLocation.lat, userLocation.lon]}>
                        <Popup>Your Location</Popup>
                      </Marker>
                    )}
                  </MapContainer>
                </div>
              </div>

              {/* News Feed Section */}
              <div className="mb-16">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                  <Newspaper className="w-4 h-4" /> Latest Disaster & Weather Reports
                </h3>
                {newsLoading ? (
                  <div className="text-center py-20 text-slate-400 font-bold animate-pulse">Loading news feed...</div>
                ) : newsFeed.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {newsFeed.map((article) => (
                      <a
                        key={article.id}
                        href={article.url}
                        target="_blank"
                        rel="noreferrer"
                        className="group bg-white dark:bg-[#141414] rounded-3xl p-6 shadow-md border border-transparent dark:border-white/5 hover:shadow-xl hover:scale-[1.02] transition-all flex flex-col gap-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <h4 className="font-bold text-slate-900 dark:text-white leading-snug line-clamp-3 group-hover:text-red-500 transition-colors">{article.title}</h4>
                          <ExternalLink className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-red-500 transition-colors mt-1" />
                        </div>
                        <div className="mt-auto flex items-center justify-between text-xs font-bold text-slate-400">
                          <span className="bg-slate-100 dark:bg-white/5 px-3 py-1 rounded-lg">{article.source}</span>
                          <span>{article.date}</span>
                        </div>
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 bg-white dark:bg-[#141414] rounded-3xl border border-transparent dark:border-white/5 shadow-sm">
                    <Newspaper className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-4" />
                    <p className="text-xl font-black text-slate-900 dark:text-white mb-2">No Reports Available</p>
                    <p className="text-slate-500 font-medium">Could not load disaster reports at this time.</p>
                  </div>
                )}
              </div>
            </div>
          )}

        </main>

        {/* Footer */}
        <footer className="w-full bg-[#f8f9fa] dark:bg-[#050505] border-t border-slate-200 dark:border-white/5 py-12 transition-colors">
          <div className="max-w-[1500px] mx-auto px-6 lg:px-12">
            <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-8">
              <div className="flex flex-col gap-2 text-center md:text-left">
                <div className="flex items-center gap-3 justify-center md:justify-start">
                  <Cloud className="w-6 h-6 text-blue-500 fill-current" />
                  <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white">TMD Weather Pro</span>
                </div>
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Advanced meteorological data visualization.</p>
              </div>
              <div className="flex flex-wrap justify-center gap-6 text-sm font-bold text-slate-400 dark:text-slate-500">
                <a href="#" className="hover:text-blue-500 transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-blue-500 transition-colors">Data Licensing</a>
                <a href="#" className="hover:text-blue-500 transition-colors">API Docs</a>
              </div>
            </div>

            <div className="pt-8 border-t border-slate-200 dark:border-white/5 flex flex-col md:flex-row justify-between items-end md:items-center gap-6">
              <div className="text-center md:text-left w-full md:w-auto">
                <div className="text-[10px] font-black tracking-widest text-blue-500 uppercase mb-2">Developed By</div>
                <h4 className="text-xl font-black text-slate-900 dark:text-white mb-3">Tichakorn Rojsiraphisal</h4>
                <div className="flex flex-wrap justify-center md:justify-start gap-3 md:gap-5 text-sm font-semibold text-slate-500 bg-white dark:bg-[#141414] px-5 py-3 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5">
                  <a href="https://instagram.com/dxwntichakn" target="_blank" rel="noreferrer" className="hover:text-pink-500 transition-colors flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-pink-500"></span> IG: @dxwntichakn
                  </a>
                  <a href="https://github.com/tidawnroj" target="_blank" rel="noreferrer" className="hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-900 dark:bg-white"></span> GitHub: @tidawnroj
                  </a>
                  <a href="mailto:tidawnroj@gmail.com" className="hover:text-orange-500 transition-colors flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-orange-500"></span> tidawnroj@gmail.com
                  </a>
                  <a href="tel:+660929159230" className="hover:text-green-500 transition-colors flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span> +66 0929159230
                  </a>
                </div>
              </div>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-600 w-full text-center md:text-right md:w-auto mt-4 md:mt-0">© {new Date().getFullYear()} Thai Meteorological Division Data.</p>
            </div>
          </div>
        </footer>
        {/* Floating Feedback Button */}
        <button
          onClick={() => setShowFeedbackModal(true)}
          className="fixed bottom-6 right-6 z-40 bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-full shadow-[0_10px_30px_rgba(11,132,255,0.4)] transition-transform hover:scale-110 flex items-center gap-3 animate-fade-in group border-none cursor-pointer"
        >
          <Mail className="w-6 h-6" />
          <span className="hidden bg-white/20 text-white rounded-xl py-1 md:group-hover:block transition-all font-bold pr-2 pl-2 text-sm overflow-hidden whitespace-nowrap">
            Send Feedback
          </span>
        </button>

      </div>

      {/* =========================================
          MODALS
          ========================================= */}

      {/* Advanced Weather Insights Modal */}
      {showAdvancedWeatherModal && liveHourly && liveDaily && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in text-slate-900 dark:text-white">
          <div className="bg-white dark:bg-[#1c1c1e] w-full max-w-4xl max-h-[90vh] rounded-[32px] overflow-hidden flex flex-col shadow-2xl relative border border-white/10">
            <div className="p-6 md:p-8 flex justify-between items-center border-b border-black/5 dark:border-white/5">
              <h2 className="text-2xl font-black">Advanced Weather Insights</h2>
              <button onClick={() => setShowAdvancedWeatherModal(false)} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-grow space-y-8">

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-6">
                  <h4 className="text-sm font-bold text-slate-400 mb-2">AQI (US)</h4>
                  <p className={`text-4xl font-black font-mono ${liveAirQuality?.us_aqi > 100 ? 'text-red-500' : liveAirQuality?.us_aqi > 50 ? 'text-orange-500' : 'text-green-500'}`}>{liveAirQuality?.us_aqi || '--'}</p>
                </div>
                <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-6">
                  <h4 className="text-sm font-bold text-slate-400 mb-2">PM2.5</h4>
                  <p className={`text-4xl font-black font-mono ${liveAirQuality?.pm2_5 > 50 ? 'text-red-500' : liveAirQuality?.pm2_5 > 25 ? 'text-orange-500' : 'text-slate-800 dark:text-white'}`}>{liveAirQuality?.pm2_5 || '--'} <span className="text-lg">µg/m³</span></p>
                </div>
                <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-6">
                  <h4 className="text-sm font-bold text-slate-400 mb-2">Solar Radiation</h4>
                  <p className="text-4xl font-black font-mono text-orange-500">{liveWeather?.shortwave_radiation || 0} <span className="text-lg">W/m²</span></p>
                </div>
                <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-6">
                  <h4 className="text-sm font-bold text-slate-400 mb-2">Rain Prob.</h4>
                  <p className="text-4xl font-black font-mono text-blue-500">{liveDaily?.precipitation_probability_max?.[0] || '--'}%</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-6">
                  <h4 className="text-sm font-bold text-slate-400 mb-2">Wind Gusts</h4>
                  <p className="text-2xl font-black font-mono">{liveWeather?.wind_gusts_10m || '--'} <span className="text-sm">km/h</span></p>
                </div>
                <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-6">
                  <h4 className="text-sm font-bold text-slate-400 mb-2">Cloud Cover</h4>
                  <p className="text-2xl font-black font-mono">{liveWeather?.cloud_cover || '--'}%</p>
                </div>
                <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-6">
                  <h4 className="text-sm font-bold text-slate-400 mb-2">Visibility</h4>
                  <p className="text-2xl font-black font-mono">{((liveWeather?.visibility || 0) / 1000).toFixed(1)} <span className="text-sm">km</span></p>
                </div>
                <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-6">
                  <h4 className="text-sm font-bold text-slate-400 mb-2">Pressure</h4>
                  <p className="text-2xl font-black font-mono">{liveWeather?.surface_pressure || '--'} <span className="text-sm">hPa</span></p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold mb-4">Hourly Temperature (Next 24 Hrs)</h3>
                <div className="h-[300px] w-full border border-black/5 dark:border-white/5 rounded-2xl p-4 bg-white dark:bg-[#141414]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={liveHourly.time.slice(0, 24).map((t, i) => ({
                      time: new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                      temp: liveHourly.temperature_2m[i]
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#333' : '#eee'} vertical={false} />
                      <XAxis dataKey="time" tick={{ fill: isDarkMode ? '#888' : '#666', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: isDarkMode ? '#888' : '#666', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', backgroundColor: isDarkMode ? '#1c1c1e' : '#fff', color: isDarkMode ? '#fff' : '#000' }} />
                      <Line type="monotone" dataKey="temp" name="Temp °C" stroke="#0b84ff" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Feedback Form Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in text-slate-900 dark:text-white">
          <div className="bg-white dark:bg-[#1c1c1e] w-full max-w-2xl rounded-[32px] overflow-hidden flex flex-col shadow-2xl relative border border-white/10">
            <div className="p-6 md:p-8 flex justify-between items-center border-b border-black/5 dark:border-white/5">
              <h2 className="text-2xl font-black">Send Feedback</h2>
              <button onClick={() => setShowFeedbackModal(false)} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* FormSubmit Logic */}
            <form action="https://formsubmit.co/tidawnroj@gmail.com" method="POST" className="p-6 md:p-8 flex-grow space-y-5 overflow-y-auto max-h-[80vh] custom-scrollbar">

              {/* Important: Disable Captcha and Set Next parameters (Optional) */}
              <input type="hidden" name="_captcha" value="false" />

              {/* Dynamically generated timestamp submitted implicitly */}
              <input type="hidden" name="Timestamp" value={new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' })} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="firstName" className="text-sm font-bold text-slate-500">First Name <span className="text-red-500">*</span></label>
                  <input type="text" name="First Name" id="firstName" required className="bg-slate-100 dark:bg-white/5 border-none rounded-xl p-3 focus:ring-2 focus:ring-blue-500 text-black dark:text-white" placeholder="John" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="lastName" className="text-sm font-bold text-slate-500">Last Name <span className="text-red-500">*</span></label>
                  <input type="text" name="Last Name" id="lastName" required className="bg-slate-100 dark:bg-white/5 border-none rounded-xl p-3 focus:ring-2 focus:ring-blue-500 text-black dark:text-white" placeholder="Doe" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-sm font-bold text-slate-500">Email Address <span className="text-red-500">*</span></label>
                <input type="email" name="email" id="email" required className="bg-slate-100 dark:bg-white/5 border-none rounded-xl p-3 focus:ring-2 focus:ring-blue-500 text-black dark:text-white" placeholder="john.doe@example.com" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="phone" className="text-sm font-bold text-slate-500">Phone Number (Optional)</label>
                <input type="tel" name="Phone" id="phone" className="bg-slate-100 dark:bg-white/5 border-none rounded-xl p-3 focus:ring-2 focus:ring-blue-500 text-black dark:text-white" placeholder="+66 80 000 0000" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="message" className="text-sm font-bold text-slate-500">Feedback / Message <span className="text-red-500">*</span></label>
                <textarea name="Message" id="message" required rows="4" className="bg-slate-100 dark:bg-white/5 border-none rounded-xl p-3 focus:ring-2 focus:ring-blue-500 text-black dark:text-white resize-none" placeholder="Tell us what you think..."></textarea>
              </div>

              <button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold text-lg py-4 rounded-xl shadow-lg shadow-blue-500/30 transition-transform active:scale-95 mt-4">
                Submit Feedback
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}

export default App
