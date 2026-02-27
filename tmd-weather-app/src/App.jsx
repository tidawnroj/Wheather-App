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
  Bell,
  Globe,
  TrendingUp,
  TrendingDown,
  Plus,
  Minus,
  Terminal,
  Settings
} from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
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

function CopernicusPortal() {
  const [showSplash, setShowSplash] = useState(true);
  const [fadingSplash, setFadingSplash] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    // Progress bar animation
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += Math.floor(Math.random() * 15) + 5; // Random jump between 5 and 20
      if (progress >= 99) {
        progress = 99; // Hold at 99% until fade starts
        clearInterval(progressInterval);
      }
      setLoadingProgress(progress);
    }, 150);

    const fadeTimer = setTimeout(() => {
      setLoadingProgress(100);
      setFadingSplash(true); // Start fading out
    }, 2500);
    const removeTimer = setTimeout(() => {
      setShowSplash(false); // Remove from DOM after fade finishes
    }, 3000); // 500ms fade duration
    return () => { clearInterval(progressInterval); clearTimeout(fadeTimer); clearTimeout(removeTimer); };
  }, []);

  // === DATA STATE ===
  const [activePanel, setActivePanel] = useState(null);
  const [ecmwfData, setEcmwfData] = useState(null);
  const [camsData, setCamsData] = useState(null);
  const [c3sData, setC3sData] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [marineData, setMarineData] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const servicesRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [ecmwf, cams, c3s, marine] = await Promise.all([
          fetch('https://api.open-meteo.com/v1/forecast?latitude=13.75&longitude=100.52&hourly=temperature_2m,wind_speed_10m,wind_direction_10m,precipitation,relative_humidity_2m,surface_pressure&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max&forecast_days=7&timezone=Asia%2FBangkok').then(r => r.json()),
          fetch('https://air-quality-api.open-meteo.com/v1/air-quality?latitude=13.75&longitude=100.52&hourly=pm2_5,pm10,european_aqi,us_aqi,nitrogen_dioxide,ozone,sulphur_dioxide,carbon_monoxide&timezone=Asia%2FBangkok&forecast_days=3').then(r => r.json()),
          fetch(`https://archive-api.open-meteo.com/v1/archive?latitude=13.75&longitude=100.52&start_date=${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}&end_date=${new Date(Date.now() - 86400000).toISOString().split('T')[0]}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=Asia%2FBangkok`).then(r => r.json()),
          fetch('https://marine-api.open-meteo.com/v1/marine?latitude=12.5&longitude=100.9&hourly=wave_height,wave_direction,wave_period,wind_wave_height,swell_wave_height,swell_wave_period&daily=wave_height_max,wave_period_max&forecast_days=7&timezone=Asia%2FBangkok').then(r => r.json()),
        ]);
        setEcmwfData(ecmwf);
        setCamsData(cams);
        setC3sData(c3s);
        setMarineData(marine);
      } catch (e) {
        console.error('Copernicus data fetch error:', e);
      }
      setDataLoading(false);
    };
    fetchAllData();
  }, []);

  // === HELPERS ===
  const glassStyle = { background: 'rgba(6, 78, 59, 0.3)', backdropFilter: 'blur(12px)', border: '1px solid rgba(16, 185, 129, 0.2)' };

  const getAqiInfo = (aqi) => {
    if (!aqi) return { label: '—', color: '#94a3b8' };
    if (aqi <= 20) return { label: 'Good', color: '#13ec92' };
    if (aqi <= 40) return { label: 'Fair', color: '#a3e635' };
    if (aqi <= 60) return { label: 'Moderate', color: '#facc15' };
    if (aqi <= 80) return { label: 'Poor', color: '#f97316' };
    if (aqi <= 100) return { label: 'Very Poor', color: '#ef4444' };
    return { label: 'Hazardous', color: '#dc2626' };
  };

  const scrollToServices = () => servicesRef.current?.scrollIntoView({ behavior: 'smooth' });

  const hi = (() => {
    if (!ecmwfData?.hourly?.time) return 0;
    const now = new Date();
    const idx = ecmwfData.hourly.time.findIndex(t => new Date(t) > now);
    return Math.max(0, idx - 1);
  })();

  const currentPm25 = camsData?.hourly?.pm2_5?.[hi];
  const currentEuAqi = camsData?.hourly?.european_aqi?.[hi];
  const aqiInfo = getAqiInfo(currentEuAqi);


  // ============ SPLASH SCREEN (exact Stitch code) ============
  if (showSplash) {
    return (
      <div className={`fixed inset-0 flex flex-col items-center justify-center overflow-hidden bg-[#10221a] font-['Space_Grotesk'] text-slate-100 z-[200] transition-opacity duration-500 ease-out ${fadingSplash ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100'}`}>
        {/* Background Ambient Elements */}
        <div className="absolute inset-0 z-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#13ec92]/20 via-transparent to-transparent"></div>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#13ec92]/30 to-transparent"></div>

        {/* Main Content Container */}
        <div className="flex h-full w-full flex-col relative z-10">
          <div className="flex flex-1 items-center justify-center p-6">
            <div className="flex flex-col items-center w-full max-w-[640px] gap-12">

              {/* Icon Section */}
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 bg-[#13ec92]/20 blur-[60px] rounded-full w-64 h-64"></div>
                <div className="relative z-10 p-10 rounded-full border border-[#13ec92]/20 bg-[#042f20]/50 backdrop-blur-sm" style={{ boxShadow: '0 0 40px rgba(19, 236, 146, 0.15)' }}>
                  <Globe className="w-[120px] h-[120px] text-[#13ec92] stroke-[0.8]" />
                </div>
                {/* Orbital rings decoration */}
                <div className="absolute w-[300px] h-[300px] border border-[#13ec92]/10 rounded-full"></div>
                <div className="absolute w-[400px] h-[400px] border border-dashed border-[#13ec92]/5 rounded-full rotate-45"></div>
              </div>

              {/* Status Text */}
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-3xl font-bold tracking-tight text-white" style={{ textShadow: '0 0 20px rgba(19, 236, 146, 0.5)' }}>Connecting to Copernicus Network</h1>
                <p className="text-slate-400 text-sm tracking-widest uppercase">Initializing Secure Environment</p>
              </div>

              {/* Progress Section */}
              <div className="w-full flex flex-col gap-4 px-8 sm:px-16">
                <div className="flex justify-between items-end text-xs font-medium text-[#13ec92]/80 uppercase tracking-wider">
                  <span>Loading environmental data modules</span>
                  <span>{loadingProgress}%</span>
                </div>
                {/* Progress Bar */}
                <div className="relative h-2 w-full bg-[#042f20]/80 rounded-full overflow-hidden border border-[#13ec92]/10">
                  <div className="h-full bg-[#13ec92] relative shadow-[0_0_15px_rgba(19,236,146,0.6)] transition-all duration-200 ease-out" style={{ width: `${loadingProgress}%` }}>
                    <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/50"></div>
                  </div>
                </div>
                {/* System metrics */}
                <div className="grid grid-cols-3 gap-4 mt-2">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-slate-500 uppercase">Latency</span>
                    <span className="text-xs text-[#13ec92] font-mono">24ms</span>
                  </div>
                  <div className="flex flex-col gap-1 text-center">
                    <span className="text-[10px] text-slate-500 uppercase">Encryption</span>
                    <span className="text-xs text-[#13ec92] font-mono">AES-256</span>
                  </div>
                  <div className="flex flex-col gap-1 text-right">
                    <span className="text-[10px] text-slate-500 uppercase">Node</span>
                    <span className="text-xs text-[#13ec92] font-mono">EU-WEST-4</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Footer */}
          <div className="w-full p-8 text-center z-10">
            <p className="text-slate-600 text-xs">© Copernicus Open Data Hub. Accessing restricted satellite telemetry.</p>
          </div>
        </div>

        {/* Background Grid Texture */}
        <div className="absolute inset-0 z-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(19, 236, 146, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(19, 236, 146, 0.03) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      </div>
    );
  }

  // ============ LANDING PAGE ============
  return (
    <div className={`bg-[#10221a] font-['Space_Grotesk'] text-slate-100 antialiased overflow-x-hidden min-h-screen flex flex-col z-[100] relative transition-opacity duration-700 ease-in-out ${showSplash && !fadingSplash ? 'opacity-0' : 'opacity-100'}`}>

      {/* ========== DATA PANELS ========== */}
      {activePanel && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={() => setActivePanel(null)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>
          <div className="relative z-10 max-w-4xl w-full max-h-[85vh] overflow-y-auto rounded-2xl p-6 md:p-8" onClick={e => e.stopPropagation()} style={glassStyle}>
            <button onClick={() => setActivePanel(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"><X className="w-6 h-6" /></button>

            {/* ECMWF PANEL */}
            {activePanel === 'ecmwf' && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-emerald-900/50 text-[#13ec92]"><Globe className="w-6 h-6" /></div>
                  <div>
                    <h2 className="text-xl font-bold text-white">ECMWF Weather Forecast</h2>
                    <p className="text-[#13ec92]/60 text-xs uppercase tracking-wider">Bangkok, Thailand — 7-Day Outlook</p>
                  </div>
                </div>
                {dataLoading ? <p className="text-slate-400 animate-pulse">Loading forecast data...</p> : ecmwfData?.hourly ? (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                      <div className="p-4 rounded-xl bg-[#10221a]/60 border border-[#13ec92]/10">
                        <p className="text-[10px] text-[#13ec92]/60 uppercase font-bold">Temperature</p>
                        <p className="text-2xl font-bold">{ecmwfData.hourly.temperature_2m?.[hi]?.toFixed(1)}°C</p>
                      </div>
                      <div className="p-4 rounded-xl bg-[#10221a]/60 border border-[#13ec92]/10">
                        <p className="text-[10px] text-[#13ec92]/60 uppercase font-bold">Wind Speed</p>
                        <p className="text-2xl font-bold">{ecmwfData.hourly.wind_speed_10m?.[hi]?.toFixed(1)} <span className="text-sm">km/h</span></p>
                      </div>
                      <div className="p-4 rounded-xl bg-[#10221a]/60 border border-[#13ec92]/10">
                        <p className="text-[10px] text-[#13ec92]/60 uppercase font-bold">Humidity</p>
                        <p className="text-2xl font-bold">{ecmwfData.hourly.relative_humidity_2m?.[hi]}%</p>
                      </div>
                      <div className="p-4 rounded-xl bg-[#10221a]/60 border border-[#13ec92]/10">
                        <p className="text-[10px] text-[#13ec92]/60 uppercase font-bold">Pressure</p>
                        <p className="text-2xl font-bold">{ecmwfData.hourly.surface_pressure?.[hi]?.toFixed(0)} <span className="text-sm">hPa</span></p>
                      </div>
                    </div>
                    <h3 className="text-sm font-bold text-[#13ec92]/80 uppercase tracking-wider mb-3">7-Day Forecast</h3>
                    <div className="grid grid-cols-7 gap-2">
                      {ecmwfData.daily?.time?.map((day, i) => (
                        <div key={day} className="p-3 rounded-xl bg-[#10221a]/60 border border-[#13ec92]/10 text-center">
                          <p className="text-[10px] text-slate-400 font-bold">{new Date(day).toLocaleDateString('en', { weekday: 'short' })}</p>
                          <p className="text-lg font-bold text-white mt-1">{ecmwfData.daily.temperature_2m_max?.[i]?.toFixed(0)}°</p>
                          <p className="text-xs text-slate-500">{ecmwfData.daily.temperature_2m_min?.[i]?.toFixed(0)}°</p>
                          <div className="mt-2 flex items-center justify-center gap-1">
                            <CloudRain className="w-3 h-3 text-blue-400" />
                            <span className="text-[10px] text-blue-400">{ecmwfData.daily.precipitation_sum?.[i]?.toFixed(1)}mm</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-600 mt-4">Data: ECMWF IFS via Open-Meteo • Updated hourly</p>
                  </>
                ) : <p className="text-slate-400">No data available</p>}
              </div>
            )}

            {/* CAMS PANEL */}
            {activePanel === 'cams' && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-emerald-900/50 text-[#13ec92]"><Wind className="w-6 h-6" /></div>
                  <div>
                    <h2 className="text-xl font-bold text-white">CAMS Air Quality</h2>
                    <p className="text-[#13ec92]/60 text-xs uppercase tracking-wider">Bangkok, Thailand — Live Monitoring</p>
                  </div>
                </div>
                {dataLoading ? <p className="text-slate-400 animate-pulse">Loading air quality data...</p> : camsData?.hourly ? (
                  <>
                    <div className="flex flex-col md:flex-row gap-6 mb-6">
                      <div className="flex-shrink-0 flex flex-col items-center justify-center p-6 rounded-2xl bg-[#10221a]/60 border border-[#13ec92]/10">
                        <div className="w-28 h-28 rounded-full flex items-center justify-center border-4" style={{ borderColor: aqiInfo.color }}>
                          <div className="text-center">
                            <p className="text-3xl font-bold" style={{ color: aqiInfo.color }}>{currentEuAqi || '—'}</p>
                            <p className="text-[10px] uppercase tracking-wider text-slate-400">EU AQI</p>
                          </div>
                        </div>
                        <p className="mt-3 text-sm font-bold" style={{ color: aqiInfo.color }}>{aqiInfo.label}</p>
                        <p className="text-xs text-slate-500 mt-1">US AQI: {camsData.hourly.us_aqi?.[hi] || '—'}</p>
                      </div>
                      <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-3">
                        {[
                          { label: 'PM2.5', value: currentPm25, unit: 'μg/m³', warn: currentPm25 > 25 },
                          { label: 'PM10', value: camsData.hourly.pm10?.[hi], unit: 'μg/m³', warn: camsData.hourly.pm10?.[hi] > 50 },
                          { label: 'NO₂', value: camsData.hourly.nitrogen_dioxide?.[hi], unit: 'μg/m³' },
                          { label: 'O₃', value: camsData.hourly.ozone?.[hi], unit: 'μg/m³' },
                          { label: 'SO₂', value: camsData.hourly.sulphur_dioxide?.[hi], unit: 'μg/m³' },
                          { label: 'CO', value: camsData.hourly.carbon_monoxide?.[hi], unit: 'μg/m³' },
                        ].map(p => (
                          <div key={p.label} className={`p-3 rounded-xl bg-[#10221a]/60 border ${p.warn ? 'border-orange-400/30' : 'border-[#13ec92]/10'}`}>
                            <p className="text-[10px] uppercase font-bold text-slate-500">{p.label}</p>
                            <p className={`text-xl font-bold ${p.warn ? 'text-orange-400' : 'text-white'}`}>{p.value?.toFixed(1) || '—'}</p>
                            <p className="text-[10px] text-slate-600">{p.unit}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <h3 className="text-sm font-bold text-[#13ec92]/80 uppercase tracking-wider mb-3">PM2.5 — 48h Trend</h3>
                    <div className="flex items-end gap-[2px] h-20 rounded-lg bg-[#10221a]/60 border border-[#13ec92]/10 p-2 overflow-hidden">
                      {camsData.hourly.pm2_5?.slice(0, 48).map((v, i) => (
                        <div key={i} className="flex-1 rounded-t" style={{ height: `${Math.min(100, (v / 75) * 100)}%`, background: v > 50 ? '#ef4444' : v > 25 ? '#f97316' : '#13ec92', minWidth: '2px', opacity: 0.8 }}></div>
                      ))}
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-600 mt-1"><span>Now</span><span>+48h</span></div>
                    <p className="text-[10px] text-slate-600 mt-4">Data: Copernicus CAMS via Open-Meteo • Updated hourly</p>
                  </>
                ) : <p className="text-slate-400">No data available</p>}
              </div>
            )}

            {/* C3S PANEL */}
            {activePanel === 'c3s' && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-emerald-900/50 text-[#13ec92]"><Thermometer className="w-6 h-6" /></div>
                  <div>
                    <h2 className="text-xl font-bold text-white">C3S Climate Data</h2>
                    <p className="text-[#13ec92]/60 text-xs uppercase tracking-wider">Bangkok — Last 30 Days (ERA5 Reanalysis)</p>
                  </div>
                </div>
                {dataLoading ? <p className="text-slate-400 animate-pulse">Loading climate data...</p> : c3sData?.daily ? (
                  <>
                    <div className="grid grid-cols-3 gap-3 mb-6">
                      <div className="p-4 rounded-xl bg-[#10221a]/60 border border-[#13ec92]/10 text-center">
                        <p className="text-[10px] text-[#13ec92]/60 uppercase font-bold">Avg High</p>
                        <p className="text-2xl font-bold">{(c3sData.daily.temperature_2m_max?.reduce((a, b) => a + b, 0) / c3sData.daily.temperature_2m_max?.length).toFixed(1)}°C</p>
                      </div>
                      <div className="p-4 rounded-xl bg-[#10221a]/60 border border-[#13ec92]/10 text-center">
                        <p className="text-[10px] text-[#13ec92]/60 uppercase font-bold">Avg Low</p>
                        <p className="text-2xl font-bold">{(c3sData.daily.temperature_2m_min?.reduce((a, b) => a + b, 0) / c3sData.daily.temperature_2m_min?.length).toFixed(1)}°C</p>
                      </div>
                      <div className="p-4 rounded-xl bg-[#10221a]/60 border border-[#13ec92]/10 text-center">
                        <p className="text-[10px] text-[#13ec92]/60 uppercase font-bold">Total Rain</p>
                        <p className="text-2xl font-bold">{c3sData.daily.precipitation_sum?.reduce((a, b) => a + b, 0).toFixed(1)} <span className="text-sm">mm</span></p>
                      </div>
                    </div>
                    <h3 className="text-sm font-bold text-[#13ec92]/80 uppercase tracking-wider mb-3">Temperature — 30 Days</h3>
                    <div className="flex items-end gap-1 h-32 rounded-lg bg-[#10221a]/60 border border-[#13ec92]/10 p-3 overflow-hidden">
                      {c3sData.daily.temperature_2m_max?.map((v, i) => (
                        <div key={i} className="flex-1 flex flex-col gap-[1px] justify-end" style={{ minWidth: '4px' }}>
                          <div className="rounded-t bg-orange-400/70" style={{ height: `${((v - 20) / 20) * 100}%` }}></div>
                          <div className="rounded-b bg-blue-400/50" style={{ height: `${((c3sData.daily.temperature_2m_min?.[i] - 15) / 20) * 100}%` }}></div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-600 mt-1 mb-1">
                      <span>{c3sData.daily.time?.[0]}</span>
                      <div className="flex gap-3"><span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400"></span>Max</span><span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400"></span>Min</span></div>
                      <span>{c3sData.daily.time?.[c3sData.daily.time.length - 1]}</span>
                    </div>
                    <p className="text-[10px] text-slate-600 mt-4">Data: Copernicus C3S ERA5 Reanalysis via Open-Meteo</p>
                  </>
                ) : <p className="text-slate-400">No data available</p>}
              </div>
            )}

            {/* MARINE PANEL */}
            {activePanel === 'marine' && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-emerald-900/50 text-[#13ec92]"><Droplets className="w-6 h-6" /></div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Marine & Ocean Data</h2>
                    <p className="text-[#13ec92]/60 text-xs uppercase tracking-wider">Gulf of Thailand — Wave Forecast</p>
                  </div>
                </div>
                {dataLoading ? <p className="text-slate-400 animate-pulse">Loading marine data...</p> : marineData?.hourly ? (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                      <div className="p-4 rounded-xl bg-[#10221a]/60 border border-[#13ec92]/10">
                        <p className="text-[10px] text-[#13ec92]/60 uppercase font-bold">Wave Height</p>
                        <p className="text-2xl font-bold">{marineData.hourly.wave_height?.[hi]?.toFixed(2)} <span className="text-sm">m</span></p>
                      </div>
                      <div className="p-4 rounded-xl bg-[#10221a]/60 border border-[#13ec92]/10">
                        <p className="text-[10px] text-[#13ec92]/60 uppercase font-bold">Wave Period</p>
                        <p className="text-2xl font-bold">{marineData.hourly.wave_period?.[hi]?.toFixed(1)} <span className="text-sm">s</span></p>
                      </div>
                      <div className="p-4 rounded-xl bg-[#10221a]/60 border border-[#13ec92]/10">
                        <p className="text-[10px] text-[#13ec92]/60 uppercase font-bold">Swell Height</p>
                        <p className="text-2xl font-bold">{marineData.hourly.swell_wave_height?.[hi]?.toFixed(2)} <span className="text-sm">m</span></p>
                      </div>
                      <div className="p-4 rounded-xl bg-[#10221a]/60 border border-[#13ec92]/10">
                        <p className="text-[10px] text-[#13ec92]/60 uppercase font-bold">Direction</p>
                        <p className="text-2xl font-bold">{marineData.hourly.wave_direction?.[hi]?.toFixed(0)}<span className="text-sm">°</span></p>
                      </div>
                    </div>
                    <h3 className="text-sm font-bold text-[#13ec92]/80 uppercase tracking-wider mb-3">7-Day Max Wave Height</h3>
                    <div className="grid grid-cols-7 gap-2">
                      {marineData.daily?.time?.map((day, i) => (
                        <div key={day} className="p-3 rounded-xl bg-[#10221a]/60 border border-[#13ec92]/10 text-center">
                          <p className="text-[10px] text-slate-400 font-bold">{new Date(day).toLocaleDateString('en', { weekday: 'short' })}</p>
                          <p className="text-lg font-bold text-white mt-1">{marineData.daily.wave_height_max?.[i]?.toFixed(1)}</p>
                          <p className="text-[10px] text-slate-500">m max</p>
                          <p className="text-[10px] text-blue-400 mt-1">{marineData.daily.wave_period_max?.[i]?.toFixed(0)}s</p>
                        </div>
                      ))}
                    </div>
                    <h3 className="text-sm font-bold text-[#13ec92]/80 uppercase tracking-wider mb-3 mt-6">Wave Height — 48h Trend</h3>
                    <div className="flex items-end gap-[2px] h-20 rounded-lg bg-[#10221a]/60 border border-[#13ec92]/10 p-2 overflow-hidden">
                      {marineData.hourly.wave_height?.slice(0, 48).map((v, i) => (
                        <div key={i} className="flex-1 rounded-t" style={{ height: `${Math.min(100, (v / 3) * 100)}%`, background: v > 2 ? '#ef4444' : v > 1 ? '#3b82f6' : '#13ec92', minWidth: '2px', opacity: 0.8 }}></div>
                      ))}
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-600 mt-1"><span>Now</span><span>+48h</span></div>
                    <p className="text-[10px] text-slate-600 mt-4">Data: Open-Meteo Marine API • Gulf of Thailand (12.5°N, 100.9°E)</p>
                  </>
                ) : <p className="text-slate-400">No data available</p>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Liquid Glass Header — Skitbit Style */}
      <header className="fixed top-0 left-0 right-0 z-50 w-full flex justify-center transition-all duration-500 ease-out" style={{ padding: scrolled ? '8px 16px' : '14px 16px' }}>
        <div className="w-full max-w-6xl transition-all duration-500 ease-out" style={{
          background: 'linear-gradient(135deg, rgba(10, 28, 18, 0.75) 0%, rgba(16, 34, 25, 0.85) 50%, rgba(10, 28, 18, 0.75) 100%)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRadius: scrolled ? '16px' : '20px',
          border: '1px solid rgba(19, 236, 146, 0.12)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -1px 0 rgba(0,0,0,0.2)',
          padding: scrolled ? '6px 20px' : '10px 24px',
        }}>
          <div className="flex items-center justify-between">
            {/* Left Section: TMD Back Button + Logo */}
            <div className="flex items-center gap-3 md:gap-4 flex-shrink-0">
              <Link to="/" className={`flex items-center justify-center font-bold text-white transition-all duration-300 hover:scale-105 group ${scrolled ? 'h-8 px-3 text-xs rounded-xl' : 'h-10 px-4 text-sm rounded-2xl'}`} style={{
                background: 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)',
                boxShadow: scrolled ? '0 2px 10px rgba(37, 99, 235, 0.4)' : '0 4px 20px rgba(37, 99, 235, 0.5), inset 0 1px 0 rgba(255,255,255,0.3)',
              }}>
                <ArrowRight className="w-4 h-4 rotate-180 mr-1 group-hover:-translate-x-1 transition-transform" />
                <span>TMD</span>
              </Link>

              <div className="w-px h-6 bg-emerald-900/50 hidden md:block"></div>

              <div className="flex items-center gap-2.5">
                <Globe className={`text-[#13ec92] transition-all duration-500 ${scrolled ? 'w-5 h-5' : 'w-6 h-6'}`} />
                <span className={`text-white font-bold tracking-tight transition-all duration-500 hidden sm:inline ${scrolled ? 'text-sm' : 'text-base'}`}>Copernicus</span>
              </div>
            </div>

            {/* Center Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {[
                { label: 'Services', action: scrollToServices },
                { label: 'Data', action: () => setActivePanel('ecmwf') },
                { label: 'Marine', action: () => setActivePanel('marine') },
                { label: 'Air Quality', action: () => window.location.href = '/copernicus/cams' },
                { label: 'Climate', action: () => setActivePanel('c3s') },
              ].map(item => (
                <button key={item.label} onClick={item.action} className={`px-4 text-slate-300 hover:text-white font-medium transition-all duration-300 rounded-lg hover:bg-white/5 ${scrolled ? 'py-1.5 text-xs' : 'py-2 text-sm'}`}>
                  {item.label}
                </button>
              ))}
            </nav>

            {/* CTA Right */}
            <button onClick={() => window.open('https://accounts.ecmwf.int/auth/realms/ecmwf/login-actions/registration?client_id=cds', '_blank')} className={`flex-shrink-0 flex items-center justify-center font-bold text-[#0a1c12] transition-all duration-300 hover:brightness-110 ${scrolled ? 'h-8 px-5 text-xs rounded-xl' : 'h-10 px-6 text-sm rounded-2xl'}`} style={{
              background: 'linear-gradient(135deg, #13ec92 0%, #a3f76e 100%)',
              boxShadow: '0 4px 15px rgba(19, 236, 146, 0.35), inset 0 1px 0 rgba(255,255,255,0.25)',
            }}>
              Register
            </button>
          </div>
        </div>
      </header>
      {/* Spacer for fixed header */}
      <div className={`transition-all duration-500 ${scrolled ? 'h-16' : 'h-20'}`}></div>

      <main className="flex-grow flex flex-col relative">
        {/* Background Ambient Glow */}
        <div className="absolute top-0 left-0 w-full h-[600px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/40 via-[#10221a] to-transparent -z-10 pointer-events-none"></div>

        <div className="mx-auto px-6 md:px-12 py-8 max-w-7xl w-full">
          {/* Hero Section */}
          <div className="mb-16 animate-slide-up" style={{ animationFillMode: 'both', animationDelay: '200ms', animationDuration: '800ms' }}>
            <div className="flex flex-col gap-6 items-center justify-center text-center max-w-4xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#13ec92]/20 bg-[#13ec92]/10 text-[#13ec92] text-xs font-bold tracking-wider uppercase">
                <span className="w-2 h-2 rounded-full bg-[#13ec92] animate-pulse"></span>
                Live Data Stream
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #13ec92 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Copernicus: European Union Open Data Hub
              </h1>
              <p className="text-slate-300 text-lg md:text-xl font-light max-w-2xl leading-relaxed">
                Access high-quality operational data services for environmental monitoring, atmosphere composition, and climate change security.
              </p>
              <div className="flex flex-wrap gap-4 justify-center mt-4">
                <button onClick={scrollToServices} className="flex items-center gap-2 rounded-lg h-12 px-6 bg-[#13ec92] text-[#10221a] text-base font-bold hover:bg-emerald-400 transition-all shadow-[0_4px_20px_rgba(19,236,146,0.25)] hover:shadow-[0_4px_25px_rgba(19,236,146,0.4)]">
                  <Globe className="w-5 h-5" />
                  Explore Data
                </button>
                <button onClick={() => window.open('https://cds.climate.copernicus.eu/how-to-api', '_blank')} className="flex items-center gap-2 rounded-lg h-12 px-6 text-white text-base font-bold hover:bg-emerald-900/50 transition-all" style={{ background: 'rgba(6, 78, 59, 0.3)', backdropFilter: 'blur(12px)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <FileText className="w-5 h-5" />
                  Documentation
                </button>
              </div>
            </div>
          </div>

          {/* Services Grid */}
          <div className="space-y-6 animate-slide-up" ref={servicesRef} style={{ animationFillMode: 'both', animationDelay: '400ms', animationDuration: '800ms' }}>
            <div className="flex items-center justify-between border-b border-emerald-900/50 pb-4 mb-8">
              <h2 className="text-white text-2xl font-bold tracking-tight">Operational Services</h2>
              <button onClick={() => window.open('https://cds.climate.copernicus.eu/datasets', '_blank')} className="text-[#13ec92] text-sm font-medium hover:text-emerald-300 flex items-center gap-1 group">
                View All Services
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Card 1: ECMWF */}
              <div className="rounded-xl overflow-hidden group hover:border-[#13ec92]/40 transition-all duration-300 flex flex-col h-full" style={{ background: 'rgba(6, 78, 59, 0.3)', backdropFilter: 'blur(12px)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <div className="relative h-48 w-full overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-[#10221a] to-transparent z-10"></div>
                  <div className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-700" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuD1rt7abKEay0cWbMlgtyTCwHrkDSv9SztOAU0UCgPBqQ1K1q3-ADRruz58aTsWNCwFDuvAB_lC_sLtvW-Da-HYGKgS37OClMnzzQ_vK74Nls1HIZE1Wf4RpkuvfgIOZxnjz0VsCImvPo4EPzlI24eOMtxX3TO6qRwjiyIV898TZyVgUK6xNNGmxx3esZdPHDoVmNvfjV0tAoRe1wZqA_ZBcNleCKxRdAIS-Fg7ctOEXrXZsQhtHHyF10oBXQiJGwo5viuKXEwsXAc')" }}></div>
                  <div className="absolute top-3 right-3 z-20 bg-black/60 backdrop-blur-sm rounded px-2 py-1 text-xs font-mono text-[#13ec92] border border-[#13ec92]/20">
                    UPDATED 15m AGO
                  </div>
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 rounded-lg bg-emerald-900/50 text-[#13ec92]">
                      <Globe className="w-6 h-6" />
                    </div>
                  </div>
                  <h3 className="text-white text-xl font-bold mb-2 group-hover:text-[#13ec92] transition-colors">ECMWF Forecasts</h3>
                  <p className="text-slate-400 text-sm mb-6 flex-grow leading-relaxed">
                    Global medium-range weather forecasts and atmospheric monitoring. Access real-time wind speed, pressure, and precipitation models.
                  </p>
                  <button onClick={() => setActivePanel('ecmwf')} className="w-full py-2 rounded border border-[#13ec92]/30 text-[#13ec92] text-sm font-medium hover:bg-[#13ec92] hover:text-[#10221a] transition-all flex items-center justify-center gap-2">
                    Access Forecasts
                  </button>
                </div>
              </div>

              {/* Card 2: CAMS Air Quality */}
              <div className="rounded-xl overflow-hidden group hover:border-[#13ec92]/40 transition-all duration-300 flex flex-col h-full" style={{ background: 'rgba(6, 78, 59, 0.3)', backdropFilter: 'blur(12px)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <div className="relative h-48 w-full overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-[#10221a] to-transparent z-10"></div>
                  <div className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-700" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDRwBfHWEZQNgBhrObmzbig0KSiMhXTfxMIpUbY35WGkTqQQL6YQZZUdOrJFwVzxfnSZl7HnZIN0Z74Ty06fF6n65bfrg7o0bBufYwDna0dLJrQAnFmgQsgoV8zfZoGRtJkp_riWTjw8rPSXXuGBaUxqEQhfXdZvHw_gEjZ4cB3kXII0Q64D29UAQYn0wRYtqa8O_s1MfMsO_NgCNz20hZXMO0AP_dbIsROKlbDGNORbUWTpxlUE34v3cZ8nPx6Jk-2E5V_kAUGZvA')" }}></div>
                  <div className="absolute top-3 right-3 z-20 bg-black/60 backdrop-blur-sm rounded px-2 py-1 text-xs font-mono border" style={{ color: aqiInfo.color, borderColor: `${aqiInfo.color}33` }}>
                    PM2.5: {currentPm25 ? `${currentPm25.toFixed(0)} μg/m³` : 'LOADING...'}
                  </div>
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 rounded-lg bg-emerald-900/50 text-[#13ec92]">
                      <Wind className="w-6 h-6" />
                    </div>
                  </div>
                  <h3 className="text-white text-xl font-bold mb-2 group-hover:text-[#13ec92] transition-colors">CAMS Air Quality</h3>
                  <p className="text-slate-400 text-sm mb-6 flex-grow leading-relaxed">
                    Continuous monitoring of atmospheric composition. Visualize PM2.5/PM10 heatmaps and ozone layer depletion data globally.
                  </p>
                  <button onClick={() => setActivePanel('cams')} className="w-full py-2 rounded border border-[#13ec92]/30 text-[#13ec92] text-sm font-medium hover:bg-[#13ec92] hover:text-[#10221a] transition-all flex items-center justify-center gap-2">
                    View Air Quality
                  </button>
                </div>
              </div>

              {/* Card 3: C3S Climate Hub */}
              <div className="rounded-xl overflow-hidden group hover:border-[#13ec92]/40 transition-all duration-300 flex flex-col h-full" style={{ background: 'rgba(6, 78, 59, 0.3)', backdropFilter: 'blur(12px)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <div className="relative h-48 w-full overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-[#10221a] to-transparent z-10"></div>
                  <div className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-700" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDjPtZXJYuoUJqpECerJc-FBDVCW9BWf_BZBf1Sfo3nVPT1v2Xmmy25YUjaSFiAytGSAhjSWYGeTN1DVEYeGVcaIeOTegab-dSyYrDK7pql-9KaDIcJxX9Y7OUIqufr1Ug9moQmRnAF2qUB9LyEQV4VUj87XYBEuueKxEH93Di8RA0hHyxUzWrN20dJhvnK0Av2I8E8v_UG5ylZ39gTEue6vzdX7-QSuMs6zCcy3jTPYJc_em6_pvstvIpq797gwDdtfnRFs-VqaUU')" }}></div>
                  <div className="absolute top-3 right-3 z-20 bg-black/60 backdrop-blur-sm rounded px-2 py-1 text-xs font-mono text-blue-300 border border-blue-300/20">
                    SST ANOMALY
                  </div>
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 rounded-lg bg-emerald-900/50 text-[#13ec92]">
                      <Thermometer className="w-6 h-6" />
                    </div>
                  </div>
                  <h3 className="text-white text-xl font-bold mb-2 group-hover:text-[#13ec92] transition-colors">C3S Climate Hub</h3>
                  <p className="text-slate-400 text-sm mb-6 flex-grow leading-relaxed">
                    Authoritative information about the past, present and future climate. Track sea surface temperature trends and anomalies.
                  </p>
                  <button onClick={() => setActivePanel('c3s')} className="w-full py-2 rounded border border-[#13ec92]/30 text-[#13ec92] text-sm font-medium hover:bg-[#13ec92] hover:text-[#10221a] transition-all flex items-center justify-center gap-2">
                    Analyze Trends
                  </button>
                </div>
              </div>

              {/* Card 4: Marine & Ocean */}
              <div className="rounded-xl overflow-hidden group hover:border-[#13ec92]/40 transition-all duration-300 flex flex-col h-full" style={{ background: 'rgba(6, 78, 59, 0.3)', backdropFilter: 'blur(12px)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <div className="relative h-48 w-full overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-[#10221a] to-transparent z-10"></div>
                  <div className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-700" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=800&q=80')" }}></div>
                  <div className="absolute top-3 right-3 z-20 bg-black/60 backdrop-blur-sm rounded px-2 py-1 text-xs font-mono text-cyan-300 border border-cyan-300/20">
                    WAVE: {marineData?.hourly?.wave_height?.[hi]?.toFixed(1) || '—'}m
                  </div>
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 rounded-lg bg-emerald-900/50 text-[#13ec92]">
                      <Droplets className="w-6 h-6" />
                    </div>
                  </div>
                  <h3 className="text-white text-xl font-bold mb-2 group-hover:text-[#13ec92] transition-colors">Marine & Ocean</h3>
                  <p className="text-slate-400 text-sm mb-6 flex-grow leading-relaxed">
                    Gulf of Thailand wave forecasts. Monitor wave height, swell conditions, and wave period for maritime safety.
                  </p>
                  <button onClick={() => setActivePanel('marine')} className="w-full py-2 rounded border border-[#13ec92]/30 text-[#13ec92] text-sm font-medium hover:bg-[#13ec92] hover:text-[#10221a] transition-all flex items-center justify-center gap-2">
                    View Wave Data
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-4 gap-4 pb-12 animate-slide-up" style={{ animationFillMode: 'both', animationDelay: '600ms', animationDuration: '800ms' }}>
            <div className="p-6 rounded-xl flex flex-col items-center justify-center text-center" style={{ background: 'rgba(6, 78, 59, 0.3)', backdropFilter: 'blur(12px)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <span className="text-4xl font-bold text-white mb-1">12PB</span>
              <span className="text-emerald-400/80 text-xs font-medium uppercase tracking-wider">Data Archived</span>
            </div>
            <div className="p-6 rounded-xl flex flex-col items-center justify-center text-center" style={{ background: 'rgba(6, 78, 59, 0.3)', backdropFilter: 'blur(12px)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <span className="text-4xl font-bold text-white mb-1">24/7</span>
              <span className="text-emerald-400/80 text-xs font-medium uppercase tracking-wider">Satellite Monitoring</span>
            </div>
            <div className="p-6 rounded-xl flex flex-col items-center justify-center text-center" style={{ background: 'rgba(6, 78, 59, 0.3)', backdropFilter: 'blur(12px)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <span className="text-4xl font-bold text-white mb-1">60k+</span>
              <span className="text-emerald-400/80 text-xs font-medium uppercase tracking-wider">Active Users</span>
            </div>
            <div onClick={() => window.open('https://www.ecmwf.int/en/forecasts/datasets/open-data', '_blank')} className="p-6 rounded-xl flex flex-col items-center justify-center text-center border-[#13ec92]/30 bg-[#13ec92]/5 cursor-pointer hover:bg-[#13ec92]/10 transition-colors" style={{ background: 'rgba(19, 236, 146, 0.05)', backdropFilter: 'blur(12px)', border: '1px solid rgba(19, 236, 146, 0.3)' }}>
              <div className="flex items-center gap-2 mb-1">
                <Download className="w-6 h-6 text-[#13ec92]" />
                <span className="text-2xl font-bold text-white">API</span>
              </div>
              <span className="text-[#13ec92] text-xs font-medium uppercase tracking-wider">Access Developer Tools</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-emerald-900/30 bg-[#0d1c15] py-12">
        <div className="mx-auto px-6 md:px-12 max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
            <div className="flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
              <Globe className="w-5 h-5 text-white" />
              <span className="text-white text-sm font-medium">Copernicus Europe</span>
            </div>
            <div className="text-slate-500 text-sm">
              © {new Date().getFullYear()} European Union. All rights reserved.
            </div>
            <div className="flex gap-6">
              <span onClick={() => window.open('https://www.copernicus.eu/en/access-data/privacy-policy', '_blank')} className="text-slate-500 hover:text-[#13ec92] transition-colors text-sm cursor-pointer">Privacy Policy</span>
              <span onClick={() => window.open('https://www.copernicus.eu/en/access-data/copyright-and-licences', '_blank')} className="text-slate-500 hover:text-[#13ec92] transition-colors text-sm cursor-pointer">Terms of Use</span>
            </div>
          </div>

          {/* Developer Credits */}
          <div className="pt-8 border-t border-emerald-900/30">
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-6">
              <div className="text-center md:text-left w-full md:w-auto">
                <div className="text-[10px] font-black tracking-widest text-[#13ec92] uppercase mb-2">Developed By</div>
                <h4 className="text-xl font-black text-white mb-3">Tichakorn Rojsiraphisal</h4>
                <div className="flex flex-wrap justify-center md:justify-start gap-3 md:gap-5 text-sm font-semibold text-slate-500 bg-[#10221a] px-5 py-3 rounded-2xl border border-emerald-900/30">
                  <a href="https://instagram.com/dxwntichakn" target="_blank" rel="noreferrer" className="hover:text-pink-500 transition-colors flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-pink-500"></span> IG: @dxwntichakn
                  </a>
                  <a href="https://github.com/tidawnroj" target="_blank" rel="noreferrer" className="hover:text-white transition-colors flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-white"></span> GitHub: @tidawnroj
                  </a>
                  <a href="mailto:tidawnroj@gmail.com" className="hover:text-orange-500 transition-colors flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-orange-500"></span> tidawnroj@gmail.com
                  </a>
                  <a href="tel:+660929159230" className="hover:text-[#13ec92] transition-colors flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#13ec92]"></span> +66 0929159230
                  </a>
                </div>
              </div>
              <p className="text-xs font-semibold text-slate-600 w-full text-center md:text-right md:w-auto mt-4 md:mt-0">© {new Date().getFullYear()} Thai Meteorological Division Data.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
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
  const location = useLocation()
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
      const proxy = 'https://api.allorigins.win/raw?url='
      const articles = []

      // Helper: parse RSS XML into article objects
      // Helper: parse RSS XML into article objects
      const parseRSS = (xmlText, sourceName, limit = 6, filterRegex = null) => {
        const parser = new DOMParser()
        const xml = parser.parseFromString(xmlText, 'text/xml')
        const items = Array.from(xml.querySelectorAll('item'))
        const result = []

        for (let i = 0; i < items.length; i++) {
          if (result.length >= limit) break

          const item = items[i]
          const title = item.querySelector('title')?.textContent || 'Untitled'
          const desc = item.querySelector('description')?.textContent || ''
          const link = item.querySelector('link')?.textContent || '#'
          const pubDate = item.querySelector('pubDate')?.textContent

          if (filterRegex && !filterRegex.test(title) && !filterRegex.test(desc)) {
            continue
          }

          result.push({
            id: `${sourceName}-${i}`,
            title: title.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&mdash;/g, '—').replace(/&ldquo;|&rdquo;/g, '"'),
            url: link,
            source: sourceName,
            date: pubDate ? new Date(pubDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent',
            timestamp: pubDate ? new Date(pubDate).getTime() : 0,
          })
        }
        return result
      }

      // Regex for weather and disaster related keywords
      const weatherRegex = /weather|storm|rain|flood|typhoon|monsoon|drought|heatwave|temperature|climate|disaster|earthquake|tsunami|warning|alert|smog|pm2\.5|pollution/i;

      // Fetch all sources in parallel, each with independent error handling
      const results = await Promise.allSettled([
        // 1. Bangkok Post RSS (Thai news) - Filtered for weather/disaster
        fetch(proxy + encodeURIComponent('https://www.bangkokpost.com/rss/data/most-recent.xml'))
          .then(r => { if (!r.ok) throw new Error(r.status); return r.text() })
          .then(text => parseRSS(text, 'Bangkok Post', 6, weatherRegex)),

        // 2. GDACS (Global Disaster Alert and Coordination System)
        fetch(proxy + encodeURIComponent('https://www.gdacs.org/xml/rss_7d.xml'))
          .then(r => { if (!r.ok) throw new Error(r.status); return r.text() })
          .then(text => parseRSS(text, 'GDACS', 6)),

        // 3. TMD Earthquake Feed
        fetch(proxy + encodeURIComponent('https://earthquake.tmd.go.th/feed/rss-local-quake.xml'))
          .then(r => { if (!r.ok) throw new Error(r.status); return r.text() })
          .then(text => parseRSS(text, 'TMD Earthquake', 4)),
      ])

      // Collect all successful results
      results.forEach(r => {
        if (r.status === 'fulfilled' && r.value) articles.push(...r.value)
      })

      // Sort by date (newest first), take top 12
      articles.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      setNewsFeed(articles.slice(0, 12))
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


  const isCopernicusPage = location.pathname.startsWith('/copernicus');

  return (
    <div className={`${isDarkMode ? 'dark' : ''}`}>
      <div className="min-h-screen bg-[#f5f7fa] dark:bg-[#000000] text-slate-900 dark:text-white font-sans selection:bg-blue-500/30 overflow-x-hidden relative transition-colors duration-500 flex flex-col">

        {/* Ambient Left Background Blob matches the design */}
        {!isCopernicusPage && <div className="absolute top-0 left-0 w-[500px] lg:w-[800px] h-[600px] lg:h-[800px] bg-gradient-to-br from-blue-300/40 to-blue-500/10 dark:from-blue-600/20 dark:to-transparent rounded-full blur-[80px] lg:blur-[120px] -translate-x-1/2 -translate-y-1/4 pointer-events-none z-0"></div>}

        {/* Top Navbar */}
        {!isCopernicusPage && (
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
              <button className={`transition-colors flex items-center gap-1.5 ${location.pathname === '/' && activeScreen === 'alerts' ? 'text-red-500' : 'hover:text-red-500'}`} onClick={() => setActiveScreen('alerts')}>
                <Bell className="w-4 h-4" /> Alerts
                {weatherAlerts.length > 0 && <span className="bg-red-500 text-white rounded-full w-4 h-4 text-[9px] flex items-center justify-center animate-pulse">{weatherAlerts.length}</span>}
              </button>
              <Link to="/copernicus" className="transition-all flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-[#0a1c12] hover:brightness-110 hover:scale-105 active:scale-95" style={{
                background: 'linear-gradient(135deg, #13ec92 0%, #a3f76e 100%)',
                boxShadow: '0 4px 15px rgba(19, 236, 146, 0.4), inset 0 1px 0 rgba(255,255,255,0.3)',
              }}>
                <Globe className="w-4 h-4" /> Copernicus
              </Link>
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
        )}

        {/* Main Content Area */}
        <Routes>
          <Route path="/" element={
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
                              <span className={`px-3 py-1 rounded-lg ${article.source === 'Bangkok Post' ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400' :
                                article.source === 'GDACS' ? 'bg-red-100 dark:bg-red-500/20 text-red-500' :
                                  article.source === 'TMD Earthquake' ? 'bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400' :
                                    'bg-slate-100 dark:bg-white/5 text-slate-500'
                                }`}>{article.source}</span>
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
          } />

          {/* Copernicus Landing Page Route */}
          <Route path="/copernicus" element={<CopernicusPortal />} />
          <Route path="/copernicus/cams" element={<CamsDashboard />} />
        </Routes>

        {/* Footer */}
        {!isCopernicusPage && (
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
        )}
        {/* Floating Feedback Button */}
        {!isCopernicusPage && (
          <button
            onClick={() => setShowFeedbackModal(true)}
            className="fixed bottom-6 right-6 z-40 bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-full shadow-[0_10px_30px_rgba(11,132,255,0.4)] transition-transform hover:scale-110 flex items-center gap-3 animate-fade-in group border-none cursor-pointer"
          >
            <Mail className="w-6 h-6" />
            <span className="hidden bg-white/20 text-white rounded-xl py-1 md:group-hover:block transition-all font-bold pr-2 pl-2 text-sm overflow-hidden whitespace-nowrap">
              Send Feedback
            </span>
          </button>
        )}

      </div>

      {/* =========================================
          MODALS
          ========================================= */}

      {/* Advanced Weather Insights Modal */}
      {
        showAdvancedWeatherModal && liveHourly && liveDaily && (
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
        )
      }

      {/* Feedback Form Modal */}
      {
        showFeedbackModal && (
          {/* ... */ }
        )
      }

    </div>
  )
}

function CamsDashboard() {
  const [activeTab, setActiveTab] = useState('Overview');
  const [smogTab, setSmogTab] = useState('PM2.5');

  // Hardcoded map points to match the design visually
  const mapPoints = [
    { city: 'Paris', aqi: 42, lat: 48.8566, lon: 2.3522, color: '#13ec92' },
    { city: 'Berlin', aqi: 85, lat: 52.52, lon: 13.405, color: '#facc15' },
    { city: 'Blank', aqi: 0, lat: 46.5, lon: 18.0, color: '#facc15' } // extra dot from image
  ];

  const hotspots = [
    { rank: '01', city: 'Kraków, PL', category: 'PM2.5 Alert', aqi: 142, color: '#ef4444' },
    { rank: '02', city: 'Milan, IT', category: 'High Traffic', aqi: 128, color: '#ef4444' },
    { rank: '03', city: 'Sofia, BG', category: 'Industrial', aqi: 115, color: '#facc15' },
    { rank: '04', city: 'Bucharest, RO', category: 'Moderate', aqi: 98, color: '#facc15' },
    { rank: '05', city: 'Paris, FR', category: 'Moderate', aqi: 42, color: '#13ec92' },
  ];

  // Dummy chart data for "Smog Tracking (24h)"
  const chartData = [
    { time: '00:00', value: 20 },
    { time: '04:00', value: 25 },
    { time: '08:00', value: 45 },
    { time: '12:00', value: 70 },
    { time: '14:00', value: 42 },
    { time: '16:00', value: 35 },
    { time: '20:00', value: 25 },
    { time: '23:59', value: 20 },
  ];

  return (
    <div className="bg-[#051c14] min-h-screen font-['Space_Grotesk'] text-slate-100 p-4 md:p-6 lg:p-8">
      {/* HEADER */}
      <header className="flex flex-wrap items-center justify-between border-b border-[#13ec92]/20 pb-4 mb-6 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-[#13ec92]/20 flex items-center justify-center border border-[#13ec92]/30">
            <Globe className="w-6 h-6 text-[#13ec92]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">CAMS Dashboard</h1>
            <p className="text-[#13ec92] text-xs font-medium">Copernicus Atmosphere Monitoring Service</p>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <Link to="/copernicus" className="text-slate-300 hover:text-white flex items-center gap-2 text-sm font-medium transition-colors">
            <ArrowRight className="w-4 h-4 rotate-180" /> Back to Copernicus Hub
          </Link>
          <div className="w-px h-6 bg-[#13ec92]/20 hidden md:block"></div>
          <nav className="hidden md:flex gap-6">
            {['Overview', 'Analysis', 'Reports'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-sm font-medium pb-2 border-b-2 transition-all ${activeTab === tab ? 'text-[#13ec92] border-[#13ec92]' : 'text-slate-400 border-transparent hover:text-white'}`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <button className="relative text-slate-300 hover:text-white">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#13ec92] rounded-full"></span>
          </button>
          <div className="w-9 h-9 rounded-full bg-slate-700 overflow-hidden border-2 border-[#13ec92]/50">
            <img src="https://i.pravatar.cc/100?img=33" alt="User" className="w-full h-full object-cover" />
          </div>
        </div>
      </header>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT COLUMN (Map + Chart) */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* MAP SECTION */}
          <div className="bg-[#0a2319] rounded-2xl border border-[#13ec92]/10 p-5 flex flex-col relative overflow-hidden h-[450px]">
            <div className="flex justify-between items-start mb-4 relative z-10 w-full">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#13ec92]/10 rounded-lg"><Sun className="w-5 h-5 text-[#13ec92]" /></div>
                <div>
                  <h2 className="text-white font-bold text-base">European Air Quality Monitor</h2>
                  <p className="text-[#13ec92] text-xs">Real-time PM2.5 & PM10 visualization</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#13ec92]/50" />
                  <input type="text" placeholder="Search city or region..." className="bg-[#051c14] border border-[#13ec92]/20 rounded-lg py-2 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-[#13ec92]/50 w-48 transition-all xl:w-64" />
                </div>
                <button className="bg-[#13ec92] hover:bg-[#10c87a] text-[#051c14] px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors">
                  <Download className="w-4 h-4" /> Export
                </button>
              </div>
            </div>

            {/* Fake Map Visualization */}
            <div className="flex-1 w-full bg-gradient-to-br from-[#103024] to-[#0a2319] rounded-xl relative overflow-hidden border border-[#13ec92]/5">
              {/* Map Lines */}
              <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
                <line x1="20%" y1="0" x2="60%" y2="100%" stroke="#13ec92" strokeWidth="1" strokeDasharray="5,5" />
                <line x1="0" y1="30%" x2="100%" y2="10%" stroke="#13ec92" strokeWidth="1" strokeDasharray="5,5" />
                <line x1="80%" y1="0" x2="90%" y2="100%" stroke="#13ec92" strokeWidth="1" strokeDasharray="5,5" />
              </svg>

              {/* Markers */}
              {/* Paris */}
              <div className="absolute top-[40%] left-[25%] flex flex-col items-center group cursor-pointer transition-transform hover:scale-110">
                <div className="w-4 h-4 rounded-full bg-[#13ec92] border-2 border-white shadow-[0_0_15px_rgba(19,236,146,0.8)] relative z-10 animate-pulse"></div>
                <div className="mt-2 bg-[#051c14]/80 backdrop-blur-sm border border-[#13ec92]/20 px-3 py-1 rounded-md text-xs font-bold text-white shadow-lg opacity-80 group-hover:opacity-100 transition-opacity">Paris: 42 AQI</div>
              </div>

              {/* Berlin */}
              <div className="absolute top-[60%] left-[45%] flex flex-col items-center group cursor-pointer transition-transform hover:scale-110">
                <div className="w-4 h-4 rounded-full bg-[#facc15] border-2 border-white shadow-[0_0_15px_rgba(250,204,21,0.8)] relative z-10 animate-pulse"></div>
                <div className="mt-2 bg-[#051c14]/80 backdrop-blur-sm border border-[#13ec92]/20 px-3 py-1 rounded-md text-xs font-bold text-white shadow-lg opacity-80 group-hover:opacity-100 transition-opacity">Berlin: 85 AQI</div>
              </div>

              {/* Blank dot */}
              <div className="absolute top-[65%] left-[65%] flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-[#13ec92] border-2 border-[#13ec92]/30 shadow-[0_0_10px_rgba(19,236,146,0.5)] relative z-10"></div>
              </div>

              {/* City text on map */}
              <span className="absolute top-[10%] left-[15%] text-xs font-bold text-[#13ec92]/20 -rotate-45">Travemünde</span>

              {/* Zoom Buttons */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2">
                <button className="w-8 h-8 bg-[#051c14]/80 backdrop-blur-sm border border-[#13ec92]/20 rounded-lg flex items-center justify-center text-white hover:bg-[#13ec92] hover:text-[#051c14] transition-colors"><Plus className="w-4 h-4" /></button>
                <button className="w-8 h-8 bg-[#051c14]/80 backdrop-blur-sm border border-[#13ec92]/20 rounded-lg flex items-center justify-center text-white hover:bg-[#13ec92] hover:text-[#051c14] transition-colors"><Minus className="w-4 h-4" /></button>
                <button className="w-8 h-8 bg-[#051c14]/80 backdrop-blur-sm border border-[#13ec92]/20 rounded-lg flex items-center justify-center text-white hover:bg-[#13ec92] hover:text-[#051c14] transition-colors mt-2"><Layers className="w-4 h-4" /></button>
              </div>

              {/* Legend */}
              <div className="absolute bottom-4 left-4 bg-[#051c14]/80 backdrop-blur-md rounded-lg border border-[#13ec92]/20 p-3 w-48">
                <span className="text-[10px] font-bold text-white uppercase tracking-wider mb-2 block">Pollution Intensity</span>
                <div className="h-2 w-full bg-gradient-to-r from-[#13ec92] via-[#facc15] to-[#ef4444] rounded-full mb-1"></div>
                <div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase">
                  <span>Low</span><span>Med</span><span>High</span>
                </div>
              </div>
            </div>
          </div>

          {/* SMOG TRACKING CHART */}
          <div className="bg-[#0a2319] rounded-2xl border border-[#13ec92]/10 p-5 flex flex-col h-[300px]">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-white font-bold text-base">Smog Tracking (24h)</h2>
                <p className="text-[#13ec92] text-xs">Regional average across monitored stations</p>
              </div>
              <div className="flex bg-[#051c14] rounded-lg p-1 border border-[#13ec92]/20">
                {['PM2.5', 'PM10', 'NO2'].map(t => (
                  <button
                    key={t}
                    onClick={() => setSmogTab(t)}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${smogTab === t ? 'bg-[#13ec92]/10 text-[#13ec92]' : 'text-slate-400 hover:text-white'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSmog" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#13ec92" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#13ec92" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#4ade80', fontSize: 10, fontWeight: 700 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={false} />
                  <CartesianGrid strokeDasharray="5 5" stroke="#13ec92" opacity={0.1} vertical={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#051c14', borderColor: '#13ec92', borderRadius: '8px' }}
                    itemStyle={{ color: '#13ec92', fontWeight: 'bold' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#13ec92" strokeWidth={3} fillOpacity={1} fill="url(#colorSmog)" />
                </AreaChart>
              </ResponsiveContainer>

              {/* Floating Value Point */}
              <div className="absolute left-[50%] top-[40%] flex flex-col items-center">
                <div className="bg-[#051c14] border border-[#13ec92] px-2 py-1 rounded-md text-center mb-2 shadow-[0_0_15px_rgba(19,236,146,0.3)]">
                  <div className="text-[10px] font-bold text-white">14:00</div>
                  <div className="text-[10px] font-bold text-[#13ec92]">AQI 42</div>
                </div>
                <div className="w-3 h-3 rounded-full bg-[#051c14] border-2 border-[#13ec92] relative z-10 shadow-[0_0_10px_rgba(19,236,146,0.8)]"></div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col gap-6">

          {/* CURRENT AQI */}
          <div className="bg-[#0a2319] rounded-2xl border border-[#13ec92] p-5 relative overflow-hidden shadow-[0_4px_30px_rgba(19,236,146,0.1)]">
            {/* Background icon */}
            <Leaf className="absolute -right-4 top-10 w-48 h-48 text-[#13ec92]/5 -rotate-12 pointer-events-none" />

            <div className="flex items-center gap-2 text-[#13ec92] font-bold text-xs uppercase tracking-widest mb-4">
              <Sun className="w-4 h-4" /> CURRENT AQI
            </div>

            <div className="flex items-baseline gap-2 mb-8">
              <span className="text-6xl font-black text-white">85</span>
              <span className="text-xl font-bold text-[#facc15]">Moderate</span>
            </div>

            <div className="flex justify-between items-end border-t border-[#13ec92]/20 pt-4">
              <div>
                <span className="text-xs text-[#13ec92] block mb-1">Smog Level</span>
                <span className="text-lg font-bold text-white">Medium</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-[#13ec92] block mb-1">Trend (1h)</span>
                <span className="text-sm font-bold text-[#ef4444] flex items-center gap-1 justify-end">
                  <TrendingUp className="w-4 h-4" /> +2.4%
                </span>
              </div>
            </div>
          </div>

          {/* POLLUTANT GRID */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#0a2319] rounded-xl border border-[#13ec92]/10 p-4 hover:border-[#13ec92]/40 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold text-[#13ec92] uppercase">PM 2.5</span>
                <CloudRain className="w-3 h-3 text-slate-500" />
              </div>
              <div className="text-2xl font-black text-white mb-1">12.4</div>
              <div className="text-[10px] text-[#13ec92]/60">µg/m³</div>
            </div>
            <div className="bg-[#0a2319] rounded-xl border border-[#13ec92]/10 p-4 hover:border-[#13ec92]/40 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold text-[#13ec92] uppercase">PM 10</span>
                <CloudRain className="w-3 h-3 text-slate-500" />
              </div>
              <div className="text-2xl font-black text-white mb-1">24.8</div>
              <div className="text-[10px] text-[#13ec92]/60">µg/m³</div>
            </div>
            <div className="bg-[#0a2319] rounded-xl border border-[#13ec92]/10 p-4 hover:border-[#13ec92]/40 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold text-[#13ec92] uppercase">O3</span>
                <Wind className="w-3 h-3 text-slate-500" />
              </div>
              <div className="text-2xl font-black text-white mb-1">45.2</div>
              <div className="text-[10px] text-[#13ec92]/60">µg/m³</div>
            </div>
            <div className="bg-[#0a2319] rounded-xl border border-[#13ec92]/10 p-4 hover:border-[#13ec92]/40 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold text-[#13ec92] uppercase">NO2</span>
                <Thermometer className="w-3 h-3 text-slate-500" />
              </div>
              <div className="text-2xl font-black text-white mb-1">18.1</div>
              <div className="text-[10px] text-[#13ec92]/60">µg/m³</div>
            </div>
          </div>

          {/* HOTSPOTS */}
          <div className="bg-[#0a2319] rounded-2xl border border-[#13ec92]/10 p-5 flex flex-col flex-grow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-white font-bold text-sm">Pollution Hotspots</h2>
              <button className="text-[#13ec92] text-xs font-bold hover:underline">View All</button>
            </div>

            <div className="flex flex-col gap-3">
              {hotspots.map((spot, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-[#051c14] rounded-xl border border-[#13ec92]/5 hover:border-[#13ec92]/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-[#13ec92]/50">{spot.rank}</span>
                    <div>
                      <div className="text-sm font-bold text-white">{spot.city}</div>
                      <div className="text-[10px] text-[#13ec92]">{spot.category}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black" style={{ color: spot.color }}>{spot.aqi} AQI</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* FOOTER */}
      <footer className="mt-8 pt-4 border-t border-[#13ec92]/20 flex justify-between items-center text-xs font-medium">
        <div className="flex items-center gap-2 text-[#13ec92]">
          <div className="w-2 h-2 rounded-full bg-[#13ec92] animate-pulse"></div>
          System Operational <span className="text-[#13ec92]/50 ml-2">Last Updated: 14:02 UTC</span>
        </div>
        <div className="flex gap-4 text-[#13ec92]/70">
          <a href="#" className="hover:text-[#13ec92]">Privacy Policy</a>
          <a href="#" className="hover:text-[#13ec92]">Data Sources</a>
          <a href="#" className="hover:text-[#13ec92]">Copernicus API</a>
        </div>
      </footer>
    </div>
  );
}

export default App
