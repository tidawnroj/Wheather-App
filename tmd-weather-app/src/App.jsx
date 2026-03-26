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
  Activity,
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
  Settings,
  Zap,
  Lock,
  Waves,
  Menu,
  Calculator,
  Table2,
  Loader2,
  Compass,
  ShieldAlert
} from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, ReferenceDot, ReferenceLine, Cell
} from 'recharts'
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents, useMap, Rectangle, ZoomControl, ImageOverlay, Polygon } from 'react-leaflet'
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom'
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

// === NEW COMPONENTS FOR COPERNICUS ===

// --- SUBSYSTEM 1: EARTH HEATMAP (SPATIAL ANALYSIS) ---
function EarthHeatmapView({ overlayType, setOverlayType, activeArea, setActiveArea, isNested = false }) {
  const content = (
    <div className="bg-background-dark/50 backdrop-blur-xl rounded-[2.5rem] p-6 md:p-8 border border-primary/10 shadow-2xl relative z-10 w-full max-w-6xl mx-auto">
      <div className="relative aspect-[16/9] md:aspect-[21/9] rounded-2xl overflow-hidden border border-primary/20 bg-[#020b08] flex items-center justify-center group shadow-inner">
        <MapContainer
          center={[15, 100]}
          zoom={3}
          minZoom={2}
          className="w-full h-full z-0"
          zoomControl={false}
          maxBounds={[[-90, -180], [90, 180]]}
          maxBoundsViscosity={1.0}
        >
          <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}" noWrap={true} bounds={[[-90, -180], [90, 180]]} />
          <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}" noWrap={true} bounds={[[-90, -180], [90, 180]]} />
          <ZoomControl position="bottomright" />
          {overlayType !== 'SCSI' && (
            <ImageOverlay
              url={overlayType === 'SSTA' ? "/copernicus_live_heatmap_ssta.png" : "/copernicus_live_heatmap_ssha.png"}
              bounds={[[-85.0511, -180], [85.0511, 180]]}
              opacity={0.7}
              zIndex={10}
            />
          )}
          <Rectangle bounds={[[15, 115], [20, 120.25]]} pathOptions={{ color: '#000000', weight: 4, fillOpacity: 0 }} />
          <Rectangle bounds={[[5, 49], [14, 105]]} pathOptions={{ color: '#000000', weight: 4, fillOpacity: 0 }} />
          <Marker position={[17.5, 117.625]} icon={L.divIcon({ className: 'custom-region-label', html: '<div class="text-white font-black text-2xl drop-shadow-md">A</div>' })} />
          <Marker position={[9.5, 77]} icon={L.divIcon({ className: 'custom-region-label', html: '<div class="text-white font-black text-2xl drop-shadow-md">B</div>' })} />
        </MapContainer>

        {overlayType === 'SCSI' && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm p-12 text-center">
            <div className="size-20 rounded-full bg-primary/20 flex items-center justify-center border border-primary/40 mb-6 animate-pulse">
              <Activity className="w-10 h-10 text-primary" />
            </div>
            <h4 className="text-2xl font-black text-white uppercase tracking-widest mb-2">SCSI Scalar Mode</h4>
            <p className="text-slate-300 text-sm max-w-md font-medium"> The Southern China Sea Index (SCSI) is a monthly statistical summary and does not possess a direct spatial grid layer. Use the <strong className="text-primary uppercase">Temporal Analytics</strong> section below for historical trend visualization.</p>
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#051c14] to-transparent pointer-events-none z-10"></div>
        <div className="absolute bottom-6 left-6 right-6 z-20 pointer-events-none flex items-end justify-between">
          <div>
            <h3 className="text-xl font-black text-white drop-shadow-md uppercase tracking-tight">Spatial Distribution (Real-Time)</h3>
            <p className="text-xs text-slate-300 mt-1 max-w-xl font-medium">Dominant EOF-2 modes for {overlayType === 'SSTA' ? 'Sea Surface Temperature' : 'Sea Level Height'}.</p>
          </div>
          <div className="pointer-events-auto flex gap-2 p-1 bg-black/60 backdrop-blur-md rounded-xl border border-white/10">
            <button onClick={() => setOverlayType('SSHA')} className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${overlayType === 'SSHA' ? 'bg-[#13ec92] text-black' : 'text-slate-400 hover:text-white'}`}>SSHA</button>
            <button onClick={() => setOverlayType('SSTA')} className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${overlayType === 'SSTA' ? 'bg-[#13ec92] text-black' : 'text-slate-400 hover:text-white'}`}>SSTA</button>
            <button onClick={() => setOverlayType('SCSI')} className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${overlayType === 'SCSI' ? 'bg-[#13ec92] text-black' : 'text-slate-400 hover:text-white'}`}>SCSI</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <button onClick={() => setActiveArea('A')} className={`p-4 rounded-2xl border transition-all text-left ${activeArea === 'A' ? 'bg-[#13ec92]/10 border-[#13ec92]/40 ring-1 ring-[#13ec92]/20' : 'bg-black/20 border-white/5 opacity-60 hover:opacity-100'}`}>
          <h4 className="font-bold flex items-center gap-2 text-white">Region A: South China Sea</h4>
          <p className="text-[10px] text-slate-400 mt-1">115°E-120.25°E | 15°N-20°N</p>
        </button>
        <button onClick={() => setActiveArea('B')} className={`p-4 rounded-2xl border transition-all text-left ${activeArea === 'B' ? 'bg-[#13ec92]/10 border-[#13ec92]/40 ring-1 ring-[#13ec92]/20' : 'bg-black/20 border-white/5 opacity-60 hover:opacity-100'}`}>
          <h4 className="font-bold flex items-center gap-2 text-white">Region B: Indian Ocean</h4>
          <p className="text-[10px] text-slate-400 mt-1">49°E-105°E | 5°N-14°N</p>
        </button>
      </div>
    </div>
  );

  if (isNested) return content;

  return (
    <div className="flex flex-col min-h-screen bg-[#051c14] text-slate-100 selection:bg-[#13ec92]/30 pt-24">
      <CopernicusDataHubHeader active="marine" />
      <main className="flex-1 overflow-y-auto p-12 flex flex-col copernicus-page-enter">
        <header className="mb-12">
          <h1 className="text-4xl font-black mb-2 uppercase tracking-tighter">Earth Heat Map</h1>
          <p className="text-primary/70 font-medium">Empirical Orthogonal Function (EOF-2) Surface Analysis</p>
        </header>
        {content}
        <div className="flex-1" />
        <CopernicusFooter />
      </main>
    </div>
  );
}

// --- SUBSYSTEM 2: OCEAN ANOMALIES (TEMPORAL ANALYSIS) ---
function OceanAnomaliesDashboard({ data, loading, overlayType, activeArea, scsiHistory = [], scsiHistoryLoading = false, isNested = false }) {
  // Format data for Recharts
  const chartData = useMemo(() => {
    if (overlayType === 'SCSI') {
      return scsiHistory.map(row => ({
        date: row.Date,
        value: parseFloat(row.SCSI) || 0
      }));
    }
    return data.map(row => {
      let value = row[`Area_${activeArea}_${overlayType}`] || 0;
      if (overlayType === 'SSTA' && value > 100) value = value - 273.15;
      else if (overlayType === 'SSHA') value = value * 100;
      return { date: row.date, value: value };
    });
  }, [data, scsiHistory, activeArea, overlayType]);

  const content = (
    <div className="bg-[#0a2319] rounded-[2.5rem] p-8 border border-[#13ec92]/20 shadow-2xl w-full max-w-6xl mx-auto">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-black text-white tracking-tight uppercase tracking-widest">Temporal Analytics (1993 - Present)</h3>
          <p className="text-slate-400 text-sm mt-1">Long-term variations for <span className="text-cyan-400 font-bold">{overlayType}</span> in <span className="text-[#13ec92] font-bold">Region {activeArea}</span></p>
        </div>
      </header>

      <div className="h-[400px] w-full bg-black/20 rounded-3xl p-6 border border-white/5">
        {loading || scsiHistoryLoading && overlayType === 'SCSI' ? (
          <div className="h-full flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 border-4 border-[#13ec92]/20 border-t-[#13ec92] rounded-full animate-spin"></div>
            <p className="text-xs text-[#13ec92] font-black animate-pulse uppercase tracking-[0.3em]">Syncing Copernicus Archive...</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="oceanGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={overlayType === 'SSTA' ? '#22d3ee' : overlayType === 'SCSI' ? '#13ec92' : '#f59e0b'} stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#13ec92" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#13ec92" opacity={0.05} vertical={false} />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 10, fontWeight: 700 }} tickFormatter={(val) => val && (val.endsWith("-01") || val.endsWith("-01-01")) ? val.substring(0, 4) : ""} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 10, fontWeight: 700 }} />
              <Tooltip contentStyle={{ backgroundColor: "#020b08", borderColor: "#13ec92", borderRadius: "12px", border: "1px solid rgba(19,236,146,0.3)" }} labelStyle={{ fontWeight: "black", marginBottom: "4px" }} />
              <Area type="monotone" dataKey="value" stroke={overlayType === 'SSTA' ? '#22d3ee' : overlayType === 'SCSI' ? '#13ec92' : '#f59e0b'} strokeWidth={3} fillOpacity={1} fill="url(#oceanGradient)" animationDuration={1500} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );

  if (isNested) return content;

  return (
    <div className="flex flex-col min-h-screen bg-[#051c14] text-slate-100 selection:bg-[#13ec92]/30 pt-24">
      <CopernicusDataHubHeader active="marine" />
      <main className="flex-1 overflow-y-auto p-12 flex flex-col copernicus-page-enter">
        <header className="mb-12">
          <h1 className="text-4xl font-black mb-2 uppercase tracking-tighter">Oceanic Anomalies</h1>
          <p className="text-primary/70 font-medium">Historical Time-Series Analysis (CMEMS 1993-2024)</p>
        </header>
        {content}
        <div className="flex-1" />
        <CopernicusFooter />
      </main>
    </div>
  );
}

// --- UNIFIED DASHBOARD: COMBINES THE TWO FUNCTIONS ABOVE ---
function MarineDashboard() {
  const [overlayType, setOverlayType] = useState('SSHA');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeArea, setActiveArea] = useState('A');
  const [lastSync, setLastSync] = useState(null);

  // Data Downloader State
  const [dlYear, setDlYear] = useState('2024');
  const [dlMonth, setDlMonth] = useState('01');
  const [dlArea, setDlArea] = useState('A');
  const [dlData, setDlData] = useState(null);
  const [dlLoading, setDlLoading] = useState(false);
  const [dlError, setDlError] = useState(null);

  // SCSI State
  const [scsiYear, setScsiYear] = useState('2569'); // 2026 BE
  const [scsiMonth, setScsiMonth] = useState('02');
  const [scsiLoading, setScsiLoading] = useState(false);
  const [scsiStats, setScsiStats] = useState(null);
  const [scsiHistory, setScsiHistory] = useState([]);
  const [scsiHistoryLoading, setScsiHistoryLoading] = useState(true);

  useEffect(() => {
    document.documentElement.classList.add('dark');
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    // Fetch real-time sync metadata
    fetch('/copernicus_metadata.json')
      .then(res => res.json())
      .then(meta => {
        setLastSync(meta.last_ocean_sync || meta.last_heatmap_sync);
      })
      .catch(() => setLastSync(null));

    Papa.parse('/ocean_anomalies_history.csv', {
      download: true,
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data && results.data.length > 0 && results.data[0].Area_A_SSTA !== undefined) {
          setData(results.data);
        }
        setLoading(false);
      },
      error: () => setLoading(false)
    });

    // Fetch SCSI Summary from Google Sheets
    Papa.parse('https://docs.google.com/spreadsheets/d/1q6gtAcB10WJ26zfr_6R7MKfCcwx-p8HesliGMOw7UQA/gviz/tq?tqx=out:csv&sheet=SCSI_SUMMARY', {
      download: true,
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        setScsiHistory(results.data);
        setScsiHistoryLoading(false);
      },
      error: () => setScsiHistoryLoading(false)
    });
  }, []);

  const fetchSpatialGrid = (year, month, area) => {
    return new Promise((resolve, reject) => {
      const sheetName = `${year}-${month}_Area_${area}`;
      const url = `https://docs.google.com/spreadsheets/d/1q6gtAcB10WJ26zfr_6R7MKfCcwx-p8HesliGMOw7UQA/gviz/tq?tqx=out:csv&sheet=${sheetName}&headers=0`;

      Papa.parse(url, {
        download: true,
        header: false,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.data && results.data.length > 1 && results.data[0].length > 1) {
            resolve(results.data);
          } else {
            reject(`Tab '${sheetName}' not found or formatted incorrectly.`);
          }
        },
        error: (error) => {
          reject(error.message || 'Error fetching data from Google Sheets');
        }
      });
    });
  };

  const computeGridStats = (matrix) => {
    let sum = 0;
    let count = 0;
    let values = [];

    for (let r = 1; r < matrix.length; r++) {
      for (let c = 1; c < matrix[r].length; c++) {
        let val = matrix[r][c];
        if (val !== null && val !== undefined && val !== '') {
          let n = parseFloat(val);
          if (!isNaN(n)) {
            values.push(n);
            sum += n;
            count++;
          }
        }
      }
    }

    if (count === 0) return { mean: 0, std: 0, count: 0 };
    let mean = sum / count;
    let sqSum = values.reduce((s, val) => s + Math.pow(val - mean, 2), 0);
    let std = Math.sqrt(sqSum / (count - 1));
    return { mean, std, count };
  };

  const handleDownloadGrid = () => {
    setDlLoading(true);
    setDlError(null);
    setDlData(null);

    fetchSpatialGrid(dlYear, dlMonth, dlArea)
      .then(matrix => {
        setDlData(matrix);
        setDlLoading(false);
      })
      .catch(err => {
        const year = parseInt(dlYear);
        if (year < 2026) {
          setDlError(`Spatial grid for ${dlYear}-${dlMonth} has been archived to save storage. Only pre-calculated results are available in the summary.`);
        } else {
          setDlError(`The spatial data for ${dlYear}-${dlMonth} is not yet synchronized or the tab is missing in Google Sheets.`);
        }
        setDlLoading(false);
      });
  };

  const handleDownloadCSVFile = () => {
    if (!dlData) return;
    const csvContent = "data:text/csv;charset=utf-8," + dlData.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `CMEMS_${dlYear}_${dlMonth}_Area_${dlArea}_Grid.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCalculateSCSI = () => {
    setScsiLoading(true);
    setScsiStats(null);

    const targetDate = `${scsiYear}-${scsiMonth}`;

    // DAB_mean is derived from the historical SSHA data, not specific to the current month's grid.
    const DAB_mean = data && data.length > 0
      ? data.reduce((sum, row) => sum + (parseFloat(row.Area_A_SSHA || 0) - parseFloat(row.Area_B_SSHA || 0)), 0) / data.length
      : 0.125; // Default value if no historical data

    // Case 1: Search in pre-loaded local scsiHistory
    const summaryMatch = scsiHistory.find(row => row.Date === targetDate);

    if (summaryMatch) {
      console.log(`SCSI Cache Hit for ${targetDate}`);
      setScsiStats({
        XA: parseFloat(summaryMatch.Xa),
        XB: parseFloat(summaryMatch.Xb),
        SA: parseFloat(summaryMatch.Sa),
        SB: parseFloat(summaryMatch.Sb),
        nA: parseInt(summaryMatch.nA),
        nB: parseInt(summaryMatch.nB),
        Sp: parseFloat(summaryMatch.Sp),
        DAB: parseFloat(summaryMatch.DAB),
        DAB_mean: DAB_mean,
        SCSI: parseFloat(summaryMatch.SCSI)
      });
      setScsiLoading(false);
    } else {
      // Case 2: Deep check - fetch from Sheets (Direct) or fallback to grid processing
      console.log(`SCSI Cache Miss for ${targetDate}. Attempting direct sheet fetch...`);
      const summaryUrl = `https://docs.google.com/spreadsheets/d/1q6gtAcB10WJ26zfr_6R7MKfCcwx-p8HesliGMOw7UQA/gviz/tq?tqx=out:csv&sheet=SCSI_SUMMARY`;
      
      Papa.parse(summaryUrl, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: (summaryResults) => {
          const freshMatch = summaryResults.data.find(row => row.Date === targetDate);
          if (freshMatch) {
            setScsiStats({
              XA: parseFloat(freshMatch.Xa),
              XB: parseFloat(freshMatch.Xb),
              SA: parseFloat(freshMatch.Sa),
              SB: parseFloat(freshMatch.Sb),
              nA: parseInt(freshMatch.nA),
              nB: parseInt(freshMatch.nB),
              Sp: parseFloat(freshMatch.Sp),
              DAB: parseFloat(freshMatch.DAB),
              DAB_mean: DAB_mean,
              SCSI: parseFloat(freshMatch.SCSI)
            });
            setScsiLoading(false);
          } else {
            // Case 3: Ultimate Fallback - fetch Area A and Area B grids manually
            Promise.all([
              fetchSpatialGrid(scsiYear, scsiMonth, 'A'),
              fetchSpatialGrid(scsiYear, scsiMonth, 'B')
            ])
              .then(([gridA, gridB]) => {
                const statsA = computeGridStats(gridA);
                const statsB = computeGridStats(gridB);
                const nA = statsA.count;
                const nB = statsB.count;
                const SA = statsA.std;
                const SB = statsB.std;
                const XA = statsA.mean;
                const XB = statsB.mean;
                const Sp2 = ((nA - 1) * Math.pow(SA, 2) + (nB - 1) * Math.pow(SB, 2)) / (nA + nB - 2);
                const Sp = Math.sqrt(Sp2);
                const DAB = XA - XB;
                const scsi = (DAB - DAB_mean) / Sp;
                setScsiStats({ XA, XB, SA, SB, nA, nB, Sp, DAB, DAB_mean: DAB_mean, SCSI: scsi });
                setScsiLoading(false);
              })
              .catch(err => {
                console.error(err);
                alert(`Error: The spatial data for ${targetDate} is not available in the summary tab or archived grids.`);
                setScsiLoading(false);
              });
          }
        },
        error: () => setScsiLoading(false)
      });
    }
  };

  const years = Array.from({ length: 32 }, (_, i) => (2024 - i).toString());
  const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const areas = ['A', 'B', 'Thailand Coastal', 'Andaman Deep'];

  return (
    <div className="min-h-screen hero-gradient font-body text-on-background selection:bg-primary/30 antialiased overflow-x-hidden">
      <CopernicusDataHubHeader active="marine" />

      {/* Background Grid Layer */}
      <div className="fixed inset-0 oscilloscope-grid opacity-10 pointer-events-none z-0"></div>

      <main className="relative z-10 pt-32 pb-20 px-6 max-w-7xl mx-auto flex flex-col gap-24">

        {/* Dashboard Header */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/5 pb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-[9px] font-black tracking-widest uppercase mb-4">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Operational Mode: Aquatic Telemetry
            </div>
            <h1 className="font-headline text-5xl md:text-7xl font-black tracking-tighter text-white drop-shadow-2xl italic leading-none">
              MARINE<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-emerald-400 to-cyan-500 uppercase text-4xl md:text-6xl">Intelligence</span>
            </h1>
            <div className="mt-4 flex items-center gap-3">
              <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-[9px] font-black text-emerald-400 uppercase tracking-widest">Algorithm v4.2 Loaded</span>
              <span className="px-3 py-1 rounded-md bg-primary/10 border border-primary/20 text-[9px] font-black text-primary uppercase tracking-widest">0.25° Optimized Resolution</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="glass-panel px-6 py-3 rounded-2xl beveled-edge flex items-center gap-4 bg-white/5">
              <div className="flex flex-col text-right">
                <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em] leading-none mb-1">Global Sync</span>
                <span className="text-sm font-headline font-bold text-white uppercase tracking-wider leading-none">
                  {lastSync ? `NODAL_${lastSync.split(' ')[0].replace(/-/g, '_')}` : 'ESTABLISHING...'}
                </span>
              </div>
              <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <Activity className="w-5 h-5 text-primary animate-pulse" />
              </div>
            </div>
          </div>
        </section>

        {/* Section 1: Heatmap HUD */}
        <section>
          <div className="flex items-center gap-4 mb-10 group">
            <div className="size-12 rounded-2xl glass-panel beveled-edge flex items-center justify-center text-primary font-headline font-black text-xl group-hover:scale-110 transition-transform">01</div>
            <div>
              <h2 className="font-headline text-2xl font-bold text-white tracking-tight uppercase tracking-widest">Spatial Distribution</h2>
              <p className="text-emerald-100/40 text-[10px] uppercase font-bold tracking-[0.2em]">Live Earth Heatmap Matrix</p>
            </div>
          </div>

          <div className="glass-panel rounded-[2.5rem] overflow-hidden beveled-edge shadow-2xl relative">
            {/* HUD Decoration */}
            <div className="absolute top-4 left-6 z-20 flex gap-2">
              <div className="px-2 py-0.5 rounded-sm bg-primary/20 text-primary text-[8px] font-black uppercase tracking-tighter border border-primary/30">SCAN_MODE:ACTV</div>
              <div className="px-2 py-0.5 rounded-sm bg-white/5 text-white/40 text-[8px] font-black uppercase tracking-tighter border border-white/5">FRM:128ms</div>
            </div>

            <EarthHeatmapView
              overlayType={overlayType}
              setOverlayType={setOverlayType}
              activeArea={activeArea}
              setActiveArea={setActiveArea}
              isNested={true}
            />
          </div>
        </section>

        {/* Section 2: Temporal Telemetry */}
        <section>
          <div className="flex items-center gap-4 mb-10 group">
            <div className="size-12 rounded-2xl glass-panel beveled-edge flex items-center justify-center text-primary font-headline font-black text-xl group-hover:scale-110 transition-transform">02</div>
            <div>
              <h2 className="font-headline text-2xl font-bold text-white tracking-tight uppercase tracking-widest">Temporal Analytics</h2>
              <p className="text-emerald-100/40 text-[10px] uppercase font-bold tracking-[0.2em]">Multi-Decadal Anomaly Tracking</p>
            </div>
          </div>

          <div className="glass-panel rounded-[2.5rem] p-8 beveled-edge shadow-2xl bg-gradient-to-br from-white/5 to-transparent">
            <OceanAnomaliesDashboard
              data={data}
              loading={loading}
              overlayType={overlayType}
              activeArea={activeArea}
              scsiHistory={scsiHistory}
              scsiHistoryLoading={scsiHistoryLoading}
              isNested={true}
            />
          </div>
        </section>

        {/* Section 3: Data Ingestion Terminal */}
        <section>
          <div className="flex items-center gap-4 mb-10 group">
            <div className="size-12 rounded-2xl glass-panel beveled-edge flex items-center justify-center text-primary font-headline font-black text-xl group-hover:scale-110 transition-transform">03</div>
            <div>
              <h2 className="font-headline text-2xl font-bold text-white tracking-tight uppercase tracking-widest">Nodal Data Downloader</h2>
              <p className="text-emerald-100/40 text-[10px] uppercase font-bold tracking-[0.2em]">Raw CSV Matrix Extraction</p>
            </div>
          </div>

          <div className="glass-panel rounded-[2.5rem] p-10 beveled-edge shadow-2xl relative overflow-hidden bg-black/40">
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative z-10 mb-12 items-end">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-2">Temporal Node (Year)</label>
                <div className="relative">
                  <select value={dlYear} onChange={e => setDlYear(e.target.value)} className="w-full bg-white/5 text-white border border-white/10 rounded-2xl px-5 py-4 font-headline font-bold text-sm hover:border-primary/40 transition-all outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer">
                    {years.map(y => <option key={y} value={y} className="bg-emerald-950 text-white">{y}</option>)}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary pointer-events-none" />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-2">Temporal Axis (Month)</label>
                <div className="relative">
                  <select value={dlMonth} onChange={e => setDlMonth(e.target.value)} className="w-full bg-white/5 text-white border border-white/10 rounded-2xl px-5 py-4 font-headline font-bold text-sm hover:border-primary/40 transition-all outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer">
                    {months.map(m => <option key={m} value={m} className="bg-emerald-950 text-white">{m}</option>)}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary pointer-events-none" />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-2">Geospatial Sector</label>
                <div className="relative">
                  <select value={dlArea} onChange={e => setDlArea(e.target.value)} className="w-full bg-white/5 text-white border border-white/10 rounded-2xl px-5 py-4 font-headline font-bold text-sm hover:border-primary/40 transition-all outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer">
                    <option value="A" className="bg-emerald-950 text-white">Area A — South China Sea</option>
                    <option value="B" className="bg-emerald-950 text-white">Area B — Indian Ocean</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary pointer-events-none" />
                </div>
              </div>
              <button onClick={handleDownloadGrid} disabled={dlLoading} className="w-full h-14 bg-primary text-black font-black rounded-2xl uppercase tracking-widest text-[10px] hover:brightness-110 hover:shadow-[0_0_30px_rgba(59,254,161,0.4)] transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50">
                {dlLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Database className="w-5 h-5" />}
                {dlLoading ? 'PROCESSING...' : 'INITIALIZE QUERY'}
              </button>
            </div>

            {dlError && (
              <div className="mb-8 p-6 glass-panel border-red-500/20 bg-red-500/5 text-red-400 rounded-3xl flex items-center gap-4 animate-shake">
                <AlertTriangle className="size-6 shrink-0" />
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest mb-1">System Error</div>
                  <span className="text-sm font-bold leading-none">{dlError}</span>
                </div>
              </div>
            )}

            {dlData && !dlLoading && (
              <div className="relative z-10 animate-fade-in glass-panel border-white/10 rounded-3xl overflow-hidden bg-black/60 shadow-inner">
                <div className="flex justify-between items-center px-8 py-5 border-b border-white/5 bg-white/5 backdrop-blur-md">
                  <h3 className="text-primary text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-3">
                    <Table2 className="size-5" /> Ingested Matrix Preview
                  </h3>
                  <button onClick={handleDownloadCSVFile} className="px-5 py-2.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-3 transition-all hover:scale-105 active:scale-95">
                    <Download className="size-4" /> Export Telemetry
                  </button>
                </div>
                <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
                  <table className="w-full text-left text-[11px] text-emerald-100/60 font-mono">
                    <thead className="bg-black/40 text-primary uppercase font-black tracking-widest">
                      <tr>
                        {dlData[0].slice(0, 10).map((th, i) => (
                          <th key={i} className="px-8 py-4 border-b border-white/5 whitespace-nowrap">{th}{i === 9 ? '...' : ''}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {dlData.slice(1, 6).map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-primary/5 transition-colors">
                          {row.slice(0, 10).map((cell, cIdx) => (
                            <td key={cIdx} className="px-8 py-4 whitespace-nowrap">
                              {cell !== null && cell !== '' ? (typeof cell === 'number' ? cell.toFixed(4) : cell) : '—'}
                              {cIdx === 9 ? '...' : ''}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="px-8 py-4 text-[9px] font-black text-emerald-100/20 uppercase tracking-[0.4em] bg-black/20 text-center">
                    Matrix Sequence: TR7493_{dlYear}_{dlMonth}_{dlArea} // Node: EU-COP-4
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Section 4: SCSI Algorithmic Engine */}
        <section>
          <div className="flex items-center gap-4 mb-10 group">
            <div className="size-12 rounded-2xl glass-panel beveled-edge flex items-center justify-center text-primary font-headline font-black text-xl group-hover:scale-110 transition-transform">04</div>
            <div>
              <h2 className="font-headline text-2xl font-bold text-white tracking-tight uppercase tracking-widest">Interactive SCSI Engine</h2>
              <p className="text-emerald-100/40 text-[10px] uppercase font-bold tracking-[0.2em]">Atmosphere/Ocean Coupling Algos</p>
            </div>
          </div>

          <div className="glass-panel rounded-[2.5rem] p-10 beveled-edge shadow-2xl relative overflow-hidden bg-gradient-to-br from-emerald-950/20 to-black/60">
            <div className="flex flex-col lg:flex-row gap-12 items-stretch relative z-10">

              {/* Left Column: UI Controls */}
              <div className="w-full lg:w-1/3 flex flex-col justify-between py-2">
                <div>
                  <h3 className="font-headline text-3xl font-black text-white tracking-tight mb-4 italic">SCSI CORE v4.2</h3>
                  <p className="text-emerald-100/40 text-sm leading-relaxed mb-8 font-medium">
                    Run the standardized contrast sea-level index analysis protocol. Direct ingestion of Area Alpha (SCS) and Area Beta (IO) spatial grids via Google Cloud Pipeline.
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="flex-1 space-y-2">
                      <span className="text-[9px] font-black text-primary/60 uppercase tracking-widest ml-2">Ingestion Year</span>
                      <select value={scsiYear} onChange={e => setScsiYear(e.target.value)} className="w-full bg-white/5 text-white border border-white/10 rounded-2xl px-4 py-3 font-headline font-bold text-sm hover:border-primary/40 focus:border-primary transition-all outline-none">
                        {years.map(y => <option key={y} value={y} className="bg-emerald-950">{y}</option>)}
                      </select>
                    </div>
                    <div className="flex-1 space-y-2">
                      <span className="text-[9px] font-black text-primary/60 uppercase tracking-widest ml-2">Ingestion Month</span>
                      <select value={scsiMonth} onChange={e => setScsiMonth(e.target.value)} className="w-full bg-white/5 text-white border border-white/10 rounded-2xl px-4 py-3 font-headline font-bold text-sm hover:border-primary/40 focus:border-primary transition-all outline-none">
                        {months.map(m => <option key={m} value={m} className="bg-emerald-950">{m}</option>)}
                      </select>
                    </div>
                  </div>

                  <button onClick={handleCalculateSCSI} disabled={scsiLoading} className="w-full h-16 bg-gradient-to-r from-primary to-emerald-400 text-black font-black rounded-3xl uppercase tracking-[0.2em] text-xs hover:shadow-[0_0_40px_rgba(59,254,161,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4 disabled:opacity-50">
                    {scsiLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <ShieldAlert className="w-6 h-6" />}
                    {scsiLoading ? 'COMPUTING...' : 'INITIATE ANALYSIS'}
                  </button>
                </div>
              </div>

              {/* Right Column: Mathematical HUD Output */}
              <div className="w-full lg:w-2/3 glass-panel rounded-3xl border-white/10 p-10 min-h-[450px] relative bg-black/40 flex flex-col justify-center">
                {!scsiStats && !scsiLoading ? (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                    <Terminal className="size-20 text-primary mb-6 animate-pulse" />
                    <p className="text-white font-headline font-black uppercase tracking-[0.4em] text-sm">System Ready for Ingestion</p>
                    <p className="text-emerald-100/40 text-[10px] font-bold mt-2 uppercase">Awaiting Matrix Command Sequence</p>
                  </div>
                ) : scsiLoading ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <div className="relative flex items-center justify-center mb-10">
                      <div className="absolute inset-0 size-24 bg-primary/20 blur-3xl animate-pulse rounded-full"></div>
                      <Loader2 className="size-16 text-primary animate-spin-slow" />
                      <div className="absolute font-mono text-[10px] text-primary font-bold">CALC_4.0</div>
                    </div>
                    <p className="text-primary font-headline font-black uppercase tracking-[0.3em] text-xs animate-pulse">Fetching Cloud-Spatial Tensors...</p>
                    <div className="mt-8 flex gap-3">
                      <div className="w-8 h-1 bg-primary/20 rounded-full overflow-hidden">
                        <div className="h-full bg-primary animate-[loading_1s_infinite]"></div>
                      </div>
                      <div className="w-8 h-1 bg-primary/20 rounded-full overflow-hidden">
                        <div className="h-full bg-primary animate-[loading_1s_infinite_200ms]"></div>
                      </div>
                    </div>
                  </div>
                ) : scsiStats ? (
                  <div className="space-y-10 animate-fade-in flex flex-col h-full">
                    {/* Stat Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="glass-panel p-5 rounded-2xl border-white/5 flex flex-col relative group overflow-hidden">
                        <span className="text-[9px] font-black text-primary/40 uppercase tracking-widest mb-2 font-mono">μ_ALPHA (Mean)</span>
                        <span className="text-2xl text-white font-headline font-black">{scsiStats.XA.toFixed(4)}</span>
                        <div className="absolute -bottom-2 -right-2 opacity-5 group-hover:opacity-10 transition-opacity"><Zap className="size-12" /></div>
                      </div>
                      <div className="glass-panel p-5 rounded-2xl border-white/5 flex flex-col relative group overflow-hidden">
                        <span className="text-[9px] font-black text-primary/40 uppercase tracking-widest mb-2 font-mono">μ_BETA (Mean)</span>
                        <span className="text-2xl text-white font-headline font-black">{scsiStats.XB.toFixed(4)}</span>
                        <div className="absolute -bottom-2 -right-2 opacity-5 group-hover:opacity-10 transition-opacity"><Zap className="size-12" /></div>
                      </div>
                      <div className="glass-panel p-5 rounded-2xl border-white/5 flex flex-col relative group overflow-hidden">
                        <span className="text-[9px] font-black text-cyan-400/40 uppercase tracking-widest mb-2 font-mono">σ_ALPHA (SD)</span>
                        <span className="text-2xl text-cyan-400 font-headline font-black">{scsiStats.SA.toFixed(4)}</span>
                        <div className="absolute -bottom-2 -right-2 opacity-5 group-hover:opacity-10 transition-opacity"><Compass className="size-12" /></div>
                      </div>
                      <div className="glass-panel p-5 rounded-2xl border-white/5 flex flex-col relative group overflow-hidden">
                        <span className="text-[9px] font-black text-cyan-400/40 uppercase tracking-widest mb-2 font-mono">σ_BETA (SD)</span>
                        <span className="text-2xl text-cyan-400 font-headline font-black">{scsiStats.SB.toFixed(4)}</span>
                        <div className="absolute -bottom-2 -right-2 opacity-5 group-hover:opacity-10 transition-opacity"><Compass className="size-12" /></div>
                      </div>
                    </div>

                    {/* Calculation Sequence */}
                    <div className="flex-grow bg-black/40 border border-white/5 rounded-3xl p-8 font-mono relative overflow-hidden flex flex-col justify-center">
                      <div className="absolute -top-10 -right-10 p-4 opacity-[0.03] scale-150 rotate-12 cursor-default select-none"><ShieldAlert className="size-64" /></div>

                      <div className="space-y-6 z-10 relative">
                        <div className="flex justify-between items-center text-xs pb-3 border-b border-white/5 group">
                          <span className="text-emerald-100/30 font-black group-hover:text-primary transition-colors">01. GRAD_DIFF [ΔAB]</span>
                          <span className="text-white font-bold">X_A - X_B = <span className="text-primary">{scsiStats.DAB.toFixed(5)}</span></span>
                        </div>
                        <div className="flex justify-between items-center text-xs pb-3 border-b border-white/5 group">
                          <span className="text-emerald-100/30 font-black group-hover:text-cyan-400 transition-colors">02. POOLED_VAR [Sp²]</span>
                          <span className="text-white font-bold">{(Math.pow(scsiStats.Sp, 2)).toFixed(6)}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs pb-3 border-b border-white/5 group">
                          <span className="text-emerald-100/30 font-black group-hover:text-primary transition-colors">03. POOLED_SIGMA [Sp]</span>
                          <span className="text-primary font-black">√Sp² = {scsiStats.Sp.toFixed(6)}</span>
                        </div>
                      </div>

                      {/* Final Big Result Box */}
                      <div className="mt-12 p-8 glass-panel beveled-edge border-primary/30 bg-primary/5 flex flex-col items-center justify-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.5em] mb-4 relative z-10 animate-pulse">SCSI_INDEX_OUTPUT</span>

                        <div className="flex items-center gap-10 relative z-10 scale-110">
                          <div className="text-center font-mono">
                            <span className="block border-b-2 border-primary/40 pb-2 px-4 text-white text-sm font-bold">( {scsiStats.DAB.toFixed(4)} - {scsiStats.DAB_mean.toFixed(4)} )</span>
                            <span className="block pt-2 text-primary font-black text-sm">{scsiStats.Sp.toFixed(4)}</span>
                          </div>
                          <span className="text-4xl text-white/20 font-light italic">=</span>
                          <div className="relative">
                            <div className={`text-6xl font-headline font-black ${scsiStats.SCSI > 0.5 ? 'text-[#13ec92]' : scsiStats.SCSI < -0.5 ? 'text-red-400' : 'text-cyan-400'} drop-shadow-[0_0_25px_currentColor]`}>
                              {scsiStats.SCSI.toFixed(4)}
                            </div>
                            <div className="absolute -bottom-4 right-0 text-[10px] font-black uppercase text-primary tracking-widest opacity-40">CRITICAL_DELTA</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        {/* Observation Protocol Footer Summary */}
        <div className="px-10 py-12 rounded-[3rem] glass-panel beveled-edge bg-emerald-950/20 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-16 opacity-[0.03] group-hover:opacity-[0.07] transition-all group-hover:scale-110">
            <Globe className="size-64 rotate-12" />
          </div>
          <div className="relative z-10 max-w-3xl">
            <h4 className="font-headline text-lg font-black text-primary uppercase tracking-[0.3em] mb-6 flex items-center gap-4">
              <span className="w-12 h-px bg-primary/30"></span> Scientific Methodology
            </h4>
            <p className="text-emerald-100/60 leading-relaxed font-medium text-sm md:text-base italic">
              "This platform employs a unified spectral analysis matrix, integrating real-time satellite telemetry with multi-decadal historical controls from the
              <span className="text-white font-black"> Copernicus Marine Service</span>. The Standardized Contrast Sea-level Index (SCSI) provides an autonomous quantification of the baroclinic SSH gradient, facilitating advanced predictive modeling of oceanic climate shifts."
            </p>
          </div>
        </div>

      </main>

      <CopernicusFooter />
    </div>
  );
}

function CreditsView() {
  return (
    <main className="flex-1 overflow-y-auto p-12 relative flex flex-col copernicus-page-enter">
      {/* Animated Background Blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-[#13ec92]/5 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-[-5%] left-[5%] w-[400px] h-[400px] bg-[#13ec92]/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-5xl mx-auto relative z-10">
        <header className="mb-16 border-b border-[#13ec92]/20 pb-10">
          <h1 className="text-6xl font-black tracking-tighter mb-4 bg-gradient-to-br from-white via-white to-[#13ec92]/40 bg-clip-text text-transparent">
            Platform Metrics <span className="text-[#13ec92]">&</span> Credits
          </h1>
          <div className="flex items-center gap-4">
            <p className="text-[#13ec92] font-black text-xs uppercase tracking-[0.3em]">Documentation Center</p>
            <div className="h-px w-20 bg-[#13ec92]/30"></div>
            <p className="text-slate-500 font-medium text-xs">Official data providers & core technology contributors</p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <section className="bg-[#0a2319]/60 backdrop-blur-3xl rounded-[3rem] p-12 border border-[#13ec92]/20 shadow-2xl space-y-8 md:col-span-2">
            <div className="flex items-center gap-4 mb-2">
              <div className="size-12 rounded-2xl bg-[#13ec92]/10 flex items-center justify-center border border-[#13ec92]/30">
                <span className="material-symbols-outlined text-[#13ec92] text-2xl">database</span>
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight text-white">Data Ecosystem</h2>
                <p className="text-[#13ec92] text-[10px] font-black uppercase tracking-widest">Real-time & Historical Nodes</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                { name: 'Copernicus Marine (CMEMS)', role: 'Multi-year SSTA/SSHA time-series and oceanic shift detection.', icon: 'waves' },
                { name: 'Copernicus Atmosphere (CAMS)', role: 'Global air quality metrics including PM2.5 and aerosol monitoring.', icon: 'cloud' },
                { name: 'Open-Meteo Integration', role: 'Ultra-fast meteorological data points and station-based caching.', icon: 'bolt' },
                { name: 'Thai Meteorological Dept', role: 'National rainfall records and high-frequency local radar captures.', icon: 'location_on' }
              ].map(source => (
                <div key={source.name} className="flex flex-col p-6 rounded-3xl bg-[#051c14] border border-[#13ec92]/10 hover:border-[#13ec92]/40 transition-all group">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="material-symbols-outlined text-[#13ec92] text-xl opacity-40 group-hover:opacity-100 transition-opacity">{source.icon}</span>
                    <h3 className="font-black text-sm text-white group-hover:text-[#13ec92] transition-colors">{source.name}</h3>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">{source.role}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-[#0a2319]/60 backdrop-blur-3xl rounded-[3rem] p-10 border border-[#13ec92]/20 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-4 mb-8">
                <div className="size-10 rounded-xl bg-[#13ec92]/10 flex items-center justify-center border border-[#13ec92]/30">
                  <span className="material-symbols-outlined text-[#13ec92] text-xl">terminal</span>
                </div>
                <h2 className="text-xl font-black tracking-tight text-white uppercase tracking-widest text-sm">Core Stack</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {['React 18', 'Tailwind', 'Recharts', 'Leaflet', 'Papaparse', 'Python 3', 'Copernicus API'].map(tech => (
                  <span key={tech} className="px-4 py-2 rounded-2xl border border-[#13ec92]/10 bg-[#051c14] text-[10px] font-black text-slate-400 uppercase tracking-widest hover:border-[#13ec92]/40 hover:text-white transition-all cursor-default">{tech}</span>
                ))}
              </div>
            </div>
            <div className="mt-12 pt-8 border-t border-[#13ec92]/10 flex items-center justify-between">
              <span className="text-[10px] font-black text-[#13ec92] uppercase tracking-[0.2em]">Build Status</span>
              <span className="flex items-center gap-2 text-[10px] font-bold text-white bg-[#13ec92]/20 px-3 py-1 rounded-full border border-[#13ec92]/30">
                <span className="size-1.5 rounded-full bg-[#13ec92] animate-pulse"></span>
                OPTIMIZED
              </span>
            </div>
          </section>

          <section className="bg-[#0a2319]/60 backdrop-blur-3xl rounded-[3rem] p-10 border border-[#13ec92]/20 shadow-xl flex flex-col items-center justify-center text-center group overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-[#13ec92]/20 group-hover:bg-[#13ec92]/60 transition-all"></div>
            <span className="material-symbols-outlined text-[#13ec92] text-5xl mb-6 opacity-20 group-hover:scale-110 transition-transform duration-500">verified_user</span>
            <h3 className="text-white font-black text-lg mb-2">TMD Copernicus Open Hub</h3>
            <p className="text-slate-500 text-xs max-w-[200px] leading-relaxed">
              A non-official research implementation utilizing public Copernicus datasets.
            </p>
          </section>
        </div>
      </div>
      <div className="flex-1" />
      <CopernicusFooter />
    </main>
  );
}

function CopernicusDataHubHeader({ active }) {
  const navItems = [
    { id: 'home', label: 'Home', path: '/copernicus' },
    { id: 'marine', label: 'Marine Dashboard', path: '/copernicus/marine' },
    { id: 'cams', label: 'Cams Dashboard', path: '/copernicus/cams' },
    { id: 'credits', label: 'Credits', path: '/copernicus/credits' },
  ];

  return (
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 w-[95%] max-w-5xl rounded-full border border-primary/20 px-6 py-3 bg-emerald-950/70 backdrop-blur-2xl flex justify-between items-center z-[1000] shadow-[0_0_40px_rgba(19,236,146,0.05)]">
      <div className="text-primary font-black tracking-tighter text-xl font-headline">Copernicus</div>

      <div className="hidden md:flex items-center gap-8">
        {navItems.map((item) => {
          const isActive = active === item.id;
          return (
            <Link
              key={item.id}
              to={item.path}
              className={`font-headline tracking-tight text-sm uppercase font-bold transition-all duration-300 rounded-full px-2 py-1 ${isActive
                ? 'text-primary drop-shadow-[0_0_8px_rgba(19,236,146,0.8)] border-b-2 border-primary pb-1'
                : 'text-emerald-100/60 hover:text-emerald-500 hover:bg-emerald-400/10 hover:scale-105'
                }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      <Link
        to="/"
        className="bg-primary hover:bg-primary-container text-on-primary font-headline text-[10px] font-bold uppercase tracking-widest px-5 py-2 rounded-full transition-all duration-300 active:scale-95 shadow-lg shadow-primary/20"
      >
        Return to TMD
      </Link>
    </nav>
  );
}
const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQJXklPJR4YW55WZxQnfoPqjWK6dpXwWA4sBmAHVeGHXStzjk0UCdZNs002Vow_9T_-xn4P02-JFl8T/pub?gid=1977620023&single=true&output=csv'

function MapClickHandler({ setLocation }) {
  useMapEvents({
    click(e) {
      setLocation({ lat: e.latlng.lat, lon: e.latlng.lng })
    }
  })
  return null
}

function CopernicusPortal() {
  const navigate = useNavigate();
  const conversationId = "f4905be9-fc55-4951-951e-35f8b2ae27ab";
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

  // Force dark mode for Copernicus Portal
  useEffect(() => {
    document.documentElement.classList.add('dark');
    return () => {
      // Return to app logic when leaving
      if (document.getElementById('root')._reactRootContainer === undefined) {
        // Simple check or just let the main App useEffect handle it
      }
    };
  }, []);

  // === DATA STATE ===
  const [activePanel, setActivePanel] = useState(null);
  const [showToolSelector, setShowToolSelector] = useState(false);
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


  // ============ SPLASH SCREEN (Copernicus Branded) ============
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

  // ============ LANDING PAGE (Copernicus Observatory) ============
  return (
    <div className={`min-h-screen hero-gradient font-body text-on-background selection:bg-primary/30 antialiased overflow-x-hidden transition-opacity duration-1000 ${showSplash && !fadingSplash ? 'opacity-0' : 'opacity-100'}`}>
      <CopernicusDataHubHeader active="home" />

      {/* Background Grid Layer */}
      <div className="fixed inset-0 oscilloscope-grid opacity-20 pointer-events-none z-0"></div>

      <main className="relative z-10 pt-32 pb-20 px-6 max-w-7xl mx-auto">

        {/* Hero Section */}
        <section className="mb-24 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-[10px] font-black tracking-widest uppercase mb-8 animate-fade-in">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            System Live: Copernicus Telemetry Network
          </div>

          <h1 className="font-headline text-6xl md:text-8xl font-black tracking-tighter mb-6 leading-none glow-accent drop-shadow-2xl">
            SUBAQUATIC<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-primary to-emerald-500">OBSERVATORY</span>
          </h1>

          <p className="max-w-2xl mx-auto text-emerald-100/60 font-medium text-lg md:text-xl leading-relaxed">
            Autonomous spatial analysis matrix. Tracking oceanic anomalies and atmospheric composition across global observation nodes.
          </p>
        </section>

        {/* Regional Focus Matrix (Bento Grid) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mb-24">

          {/* Main Terminal Card (Area A) */}
          <div className="md:col-span-8 group">
            <div className="h-full glass-panel rounded-[2rem] p-8 beveled-edge relative overflow-hidden transition-all duration-500 hover:border-primary/40 hover:shadow-[0_0_50px_rgba(59,254,161,0.1)]">
              <div className="flex justify-between items-start mb-12">
                <div>
                  <div className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2 font-label">Regional Node</div>
                  <h3 className="font-headline text-4xl font-bold text-white tracking-tight">South China Sea</h3>
                  <p className="text-emerald-100/40 text-sm mt-1">Operational Area A — Primary Matrix</p>
                </div>
                <div className="glass-panel p-4 rounded-2xl border-white/5 bg-white/5">
                  <Globe className="w-8 h-8 text-primary opacity-80" />
                </div>
              </div>

              {/* Live Telemetry HUD Strip */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-auto">
                <div className="p-4 rounded-2xl bg-black/40 border border-white/5">
                  <div className="text-[9px] font-bold text-white/40 uppercase tracking-widest mb-1">Grid Resolution</div>
                  <div className="text-xl font-headline font-bold text-white">0.5° <span className="text-[10px] text-primary">DOWNSAMPLED</span></div>
                </div>
                <div className="p-4 rounded-2xl bg-black/40 border border-white/5">
                  <div className="text-[9px] font-bold text-white/40 uppercase tracking-widest mb-1">Data Pipeline</div>
                  <div className="text-xl font-headline font-bold text-white">SCSI v4.2</div>
                </div>
                <div className="p-4 rounded-2xl bg-black/40 border border-white/5">
                  <div className="text-[9px] font-bold text-white/40 uppercase tracking-widest mb-1">Coverage</div>
                  <div className="text-xl font-headline font-bold text-white">1993–2025</div>
                </div>
                <div className="p-4 rounded-2xl bg-black/40 border border-white/5">
                  <div className="text-[9px] font-bold text-white/40 uppercase tracking-widest mb-1">Status</div>
                  <div className="text-xl font-headline font-bold text-primary animate-pulse">OPTIMIZED</div>
                </div>
              </div>

              {/* Background Decoration */}
              <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-primary/5 blur-[100px] rounded-full group-hover:bg-primary/10 transition-colors"></div>
            </div>
          </div>

          {/* Secondary Hub Card (Area B) */}
          <div className="md:col-span-4 group">
            <div className="h-full glass-panel rounded-[2rem] p-8 beveled-edge bg-gradient-to-br from-emerald-950/40 to-transparent flex flex-col transition-all duration-500 hover:border-emerald-500/40">
              <div className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-2 font-label">Secondary Node</div>
              <h3 className="font-headline text-3xl font-bold text-white tracking-tight mb-4">Indian Ocean</h3>
              <p className="text-emerald-100/40 text-sm leading-relaxed mb-8 flex-grow">Monitoring thermal stratification and sea-level anomalies in Area B.</p>

              <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-400/5 border border-emerald-400/10 mb-2">
                <div className="p-2 rounded-lg bg-emerald-400/10"><Waves className="w-5 h-5 text-emerald-400" /></div>
                <div>
                  <div className="text-[9px] font-bold text-emerald-400/60 uppercase">Wave Energy</div>
                  <div className="text-lg font-headline font-bold text-white">2.14 <span className="text-[10px] text-emerald-400">m</span></div>
                </div>
              </div>

              <div className="mt-4 w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-center text-[10px] font-black uppercase tracking-[0.2em] text-emerald-100/40">
                Data Stream: Active
              </div>
            </div>
          </div>

          {/* Regional C: Gulf of Thailand */}
          <div className="md:col-span-4 group">
            <div className="h-full glass-panel rounded-[2rem] p-8 beveled-edge transition-all duration-500 hover:border-primary/40">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-primary/10 border border-primary/20"><MapPin className="w-5 h-5 text-primary" /></div>
                <div className="text-[10px] font-black text-primary uppercase tracking-widest font-label">Regional C</div>
              </div>
              <h3 className="font-headline text-2xl font-bold text-white tracking-tight mb-2">Gulf of Thailand</h3>
              <p className="text-emerald-100/30 text-xs mb-6">Primary coastal monitoring node for meteorological shifts.</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                  <div className="text-[8px] font-bold text-white/40 uppercase mb-1">Temp</div>
                  <div className="text-sm font-headline font-bold text-white">29.4°C</div>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                  <div className="text-[8px] font-bold text-white/40 uppercase mb-1">Salinity</div>
                  <div className="text-sm font-headline font-bold text-white">32.1</div>
                </div>
              </div>
            </div>
          </div>

          {/* Regional D: Andaman Sea */}
          <div className="md:col-span-4 group">
            <div className="h-full glass-panel rounded-[2rem] p-8 beveled-edge transition-all duration-500 hover:border-emerald-400/40">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-emerald-400/10 border border-emerald-400/20"><Waves className="w-5 h-5 text-emerald-400" /></div>
                <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest font-label">Regional D</div>
              </div>
              <h3 className="font-headline text-2xl font-bold text-white tracking-tight mb-2">Andaman Sea</h3>
              <p className="text-emerald-100/30 text-xs mb-6">Secondary deep-sea node for seismic and thermal vectors.</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                  <div className="text-[8px] font-bold text-white/40 uppercase mb-1">Depth</div>
                  <div className="text-sm font-headline font-bold text-white">3,800m</div>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                  <div className="text-[8px] font-bold text-white/40 uppercase mb-1">Pressure</div>
                  <div className="text-sm font-headline font-bold text-white">NOMINAL</div>
                </div>
              </div>
            </div>
          </div>

          {/* Regional E: Java Sea */}
          <div className="md:col-span-4 group">
            <div className="h-full glass-panel rounded-[2rem] p-8 beveled-edge bg-[#10221a]/20 border-white/5 flex flex-col justify-center items-center text-center relative overflow-hidden">
              <div className="absolute inset-0 oscilloscope-grid opacity-10"></div>
              <div className="relative z-10">
                <Activity className="w-8 h-8 text-white/20 mb-4 animate-pulse mx-auto" />
                <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-1">Node Status</div>
                <div className="text-xl font-headline font-bold text-white/40 italic">STABILIZING...</div>
              </div>
            </div>
          </div>

          {/* Navigation Nodes */}
          <div className="md:col-span-6 group cursor-pointer" onClick={() => navigate('/copernicus/marine')}>
            <div className="relative h-80 glass-panel rounded-[2rem] p-8 overflow-hidden beveled-edge transition-all duration-500 hover:scale-[1.02] hover:border-primary/50">
              <div className="relative z-20 h-full flex flex-col">
                <div className="size-16 rounded-2xl bg-primary/20 flex items-center justify-center mb-6 border border-primary/30">
                  <Droplets className="w-8 h-8 text-primary shadow-[0_0_15px_rgba(59,254,161,0.5)]" />
                </div>
                <h3 className="font-headline text-4xl font-bold text-white mb-2 italic">MARINE<br />DASHBOARD</h3>
                <p className="text-emerald-100/40 text-sm max-w-[200px]">Ocean physics matrix & anomaly triangulation.</p>
                <div className="mt-auto inline-flex items-center gap-2 text-primary text-[10px] font-black tracking-widest uppercase">
                  Access Portal <ArrowRight className="w-3 h-3" />
                </div>
              </div>
              {/* Background Pattern */}
              <div className="absolute inset-0 bg-blue-500/5 mix-blend-overlay"></div>
              <div className="absolute bottom-0 right-0 w-full h-full opacity-20 pointer-events-none group-hover:scale-110 transition-transform duration-700">
                <svg viewBox="0 0 200 200" className="w-full h-full text-primary fill-current"><path d="M44.7,-76.4C58.1,-69.2,69.2,-58.1,76.4,-44.7C83.7,-31.4,87.1,-15.7,85.1,-0.1C83,15.4,75.4,30.8,66,44.7C56.6,58.6,45.4,71.1,31.4,78.4C17.3,85.6,0.4,87.6,-16.1,84.7C-32.6,81.8,-48.6,73.9,-61.6,61.6C-74.6,49.3,-84.6,32.6,-88.4,14.6C-92.2,-3.4,-89.8,-22.7,-81.2,-38.7C-72.6,-54.6,-57.8,-67.2,-42,-74C-26.2,-80.7,-9.4,-81.6,4.7,-89.7C18.8,-97.8,31.3,-83.6,44.7,-76.4Z" transform="translate(100 100)" /></svg>
              </div>
            </div>
          </div>

          <div className="md:col-span-6 group cursor-pointer" onClick={() => navigate('/copernicus/cams')}>
            <div className="relative h-80 glass-panel rounded-[2rem] p-8 overflow-hidden beveled-edge bg-emerald-950/20 transition-all duration-500 hover:scale-[1.02] hover:border-emerald-400/50">
              <div className="relative z-20 h-full flex flex-col">
                <div className="size-16 rounded-2xl bg-emerald-400/20 flex items-center justify-center mb-6 border border-emerald-400/30">
                  <Wind className="w-8 h-8 text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.5)]" />
                </div>
                <h3 className="font-headline text-4xl font-bold text-white mb-2 italic">CAMS<br />DASHBOARD</h3>
                <p className="text-emerald-100/40 text-sm max-w-[200px]">Atmospheric chemical composition telemetry.</p>
                <div className="mt-auto inline-flex items-center gap-2 text-emerald-400 text-[10px] font-black tracking-widest uppercase">
                  Access Portal <ArrowRight className="w-3 h-3" />
                </div>
              </div>
              {/* Background Ornament */}
              <div className="absolute -top-10 -right-10 w-64 h-64 border border-emerald-400/5 rounded-full"></div>
              <div className="absolute -top-16 -right-16 w-80 h-80 border border-emerald-400/5 rounded-full border-dashed"></div>
            </div>
          </div>

        </div>

        {/* Scientific Telemetry Module */}
        <section className="mb-24 px-8 py-12 rounded-[3rem] bg-gradient-to-br from-[#13ec92]/5 to-transparent border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none group-hover:opacity-20 transition-opacity">
            <Activity className="w-full h-full text-primary" />
          </div>
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary text-[10px] font-black tracking-widest uppercase mb-4">
                Research Matrix
              </div>
              <h2 className="font-headline text-4xl font-bold text-white mb-6 leading-tight">Molecular Oceanography<br />& Climate Synthesis</h2>
              <p className="text-emerald-100/40 text-sm leading-relaxed mb-8 max-w-lg">
                The Subaquatic Observatory integrates raw satellite telemetry with autonomous SC-SI (Sub-surface Coastal Salinity Index) calculation matrices. Our engine triangulates sea-surface height anomalies with atmospheric chemical tracers to predict localized environmental shifts with 94.2% accuracy.
              </p>
              <div className="flex gap-4">
                <div className="flex items-center gap-2 text-[10px] font-bold text-white uppercase tracking-widest">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
                  Real-time Synthesis
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-white uppercase tracking-widest">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  Autonomous Ingestion
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 rounded-3xl glass-panel border-white/5 bg-black/40 flex flex-col items-center justify-center text-center">
                <div className="text-3xl font-headline font-black text-white mb-1">0.12%</div>
                <div className="text-[8px] font-black text-emerald-400/60 uppercase tracking-widest">Salinity Delta</div>
              </div>
              <div className="p-6 rounded-3xl glass-panel border-white/5 bg-black/40 flex flex-col items-center justify-center text-center">
                <div className="text-3xl font-headline font-black text-white mb-1">9.4m</div>
                <div className="text-[8px] font-black text-emerald-400/60 uppercase tracking-widest">Thermal Index</div>
              </div>
              <div className="p-6 rounded-3xl glass-panel border-white/5 bg-black/40 flex flex-col items-center justify-center text-center col-span-2">
                <div className="text-xl font-headline font-black text-white mb-1">AUTONOMOUS</div>
                <div className="text-[8px] font-black text-emerald-400/60 uppercase tracking-widest">Pipeline Operational</div>
              </div>
            </div>
          </div>
        </section>

        {/* Global Observation Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-12 border-t border-white/5">
          <div className="text-center">
            <div className="text-[10px] font-bold text-emerald-100/30 uppercase tracking-[0.2em] mb-3">Air Quality Node</div>
            <div className="text-4xl font-headline font-black text-white glow-accent">{currentEuAqi || '—'}</div>
            <div className="text-[9px] font-bold text-primary uppercase mt-1">Status: {aqiInfo.label}</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] font-bold text-emerald-100/30 uppercase tracking-[0.2em] mb-3">Thermal Vector</div>
            <div className="text-4xl font-headline font-black text-white glow-accent">{ecmwfData?.hourly?.temperature_2m?.[hi]?.toFixed(1) || '—'}°</div>
            <div className="text-[9px] font-bold text-emerald-400 uppercase mt-1">Bangkok Metropolitan</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] font-bold text-emerald-100/30 uppercase tracking-[0.2em] mb-3">Sustained Gusts</div>
            <div className="text-4xl font-headline font-black text-white glow-accent">{ecmwfData?.hourly?.wind_speed_10m?.[hi]?.toFixed(1) || '—'}</div>
            <div className="text-[9px] font-bold text-emerald-400 uppercase mt-1">km/h velocity</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] font-bold text-emerald-100/30 uppercase tracking-[0.2em] mb-3">Observation Nodes</div>
            <div className="text-4xl font-headline font-black text-white glow-accent">85+</div>
            <div className="text-[9px] font-bold text-emerald-400 uppercase mt-1">CAMS Global Network</div>
          </div>
        </div>

      </main>

      {/* Observation Protocol Footer */}
      <footer className="relative z-10 py-16 px-6 border-t border-white/5 bg-black/40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-end gap-12">
          <div className="max-w-md">
            <div className="text-primary font-black tracking-tighter text-3xl font-headline mb-4 italic">COP_DH_v3.0</div>
            <p className="text-emerald-100/30 text-xs italic leading-relaxed">
              Proprietary data harvesting protocol for the Thai Meteorological Division. Automated satellite ingestion from Copernicus Marine and CAMS infrastructure. Redesign authorized for the Subaquatic Observatory aesthetic.
            </p>
          </div>

          <div className="flex flex-wrap gap-8 justify-end text-right">
            <div>
              <div className="text-[10px] font-black text-primary uppercase mb-2">Developed By</div>
              <div className="text-white font-headline font-bold text-xl">Tichakorn Rojsiraphisal</div>
              <div className="text-emerald-100/40 text-xs font-mono mt-1 underline decoration-primary/20 hover:text-primary transition-colors cursor-pointer" onClick={() => window.open('https://github.com/tidawnroj', '_blank')}>@tidawnroj</div>
            </div>
            <Link to="/" className="size-16 rounded-2xl glass-panel flex items-center justify-center border-white/10 hover:border-primary/50 transition-all hover:scale-105">
              <Terminal className="w-8 h-8 text-primary opacity-80" />
            </Link>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-16 flex flex-col md:flex-row justify-between text-[9px] font-black text-emerald-100/20 uppercase tracking-[0.3em]">
          <span>Observatory ID: {conversationId?.slice(0, 18).toUpperCase() || '4905BE9-FC55-4951'}</span>
          <span>Authorized Personnel Only — 2025</span>
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

  // Sync App-level dark mode with document element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      // Only remove if not in a dashboard that requires it
      const isDashboard = location.pathname.includes('/copernicus');
      if (!isDashboard) {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [isDarkMode, location.pathname]);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
      <div className={`min-h-screen ${isCopernicusPage ? 'bg-[#051c14]' : 'bg-[#f5f7fa] dark:bg-[#000000]'} text-slate-900 dark:text-white font-sans selection:bg-blue-500/30 overflow-x-hidden relative transition-colors duration-500 flex flex-col`}>

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
              <Link to="/copernicus" className="transition-all flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-[#0a1c12] hover:brightness-110 hover:scale-105 active:scale-95 animate-border-glow" style={{
                background: 'linear-gradient(135deg, #13ec92 0%, #a3f76e 100%)',
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

              {/* Mobile Menu Dropdown Toggle */}
              <div className="lg:hidden flex gap-2">
                <button className={`p-2 rounded-lg text-xs font-bold ${activeScreen === 'national' ? 'bg-blue-500 text-white' : 'bg-black/5 dark:bg-white/5'}`} onClick={() => { setActiveScreen('national'); setMobileMenuOpen(false); }}><LayoutGrid className="w-4 h-4" /></button>
                <button className={`p-2 rounded-lg text-xs font-bold ${activeScreen === 'history' ? 'bg-blue-500 text-white' : 'bg-black/5 dark:bg-white/5'}`} onClick={() => { setActiveScreen('history'); setMobileMenuOpen(false); }}><History className="w-4 h-4" /></button>
                <button className="p-2 rounded-lg bg-black/5 dark:bg-white/5 text-slate-700 dark:text-slate-300" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                  {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                </button>
              </div>

              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="w-10 h-10 shrink-0 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                aria-label="Toggle Theme"
              >
                {isDarkMode ? <Moon className="w-5 h-5 text-slate-300" /> : <Sun className="w-5 h-5 text-slate-600" />}
              </button>
            </div>

            {/* Mobile Dropdown Menu */}
            {mobileMenuOpen && (
              <div className="absolute top-[100%] left-0 w-full bg-white/95 dark:bg-[#050505]/95 backdrop-blur-3xl border-b border-slate-200 dark:border-white/5 shadow-2xl lg:hidden flex flex-col p-6 gap-5 z-40 origin-top animate-fade-in">
                <button className={`text-left text-lg font-black flex items-center gap-3 ${activeScreen === 'dashboard' ? 'text-blue-500' : 'text-slate-700 dark:text-slate-300'}`} onClick={() => { setActiveScreen('dashboard'); setMobileMenuOpen(false); }}><Cloud className="w-5 h-5" /> Live Dashboard</button>
                <button className={`text-left text-lg font-black flex items-center gap-3 ${activeScreen === 'national' ? 'text-blue-500' : 'text-slate-700 dark:text-slate-300'}`} onClick={() => { setActiveScreen('national'); setMobileMenuOpen(false); }}><LayoutGrid className="w-5 h-5" /> National Grid</button>
                <button className={`text-left text-lg font-black flex items-center gap-3 ${activeScreen === 'history' ? 'text-blue-500' : 'text-slate-700 dark:text-slate-300'}`} onClick={() => { setActiveScreen('history'); setMobileMenuOpen(false); }}><History className="w-5 h-5" /> Historical Data</button>
                <button className={`text-left text-lg font-black flex items-center gap-3 ${activeScreen === 'compare' ? 'text-blue-500' : 'text-slate-700 dark:text-slate-300'}`} onClick={() => { setActiveScreen('compare'); setMobileMenuOpen(false); }}>
                  <BarChart3 className="w-5 h-5" /> Compare {compareList.length > 0 && <span className="bg-blue-500 text-white rounded-full w-5 h-5 text-[10px] flex items-center justify-center">{compareList.length}</span>}
                </button>
                <button className={`text-left text-lg font-black flex items-center gap-3 ${activeScreen === 'alerts' ? 'text-red-500' : 'text-slate-700 dark:text-slate-300'}`} onClick={() => { setActiveScreen('alerts'); setMobileMenuOpen(false); }}>
                  <Bell className="w-5 h-5" /> Alerts
                  {weatherAlerts.length > 0 && <span className="bg-red-500 text-white rounded-full w-5 h-5 text-[10px] flex items-center justify-center animate-pulse">{weatherAlerts.length}</span>}
                </button>

                <div className="h-px w-full bg-slate-200 dark:bg-white/10 my-2"></div>

                <Link to="/copernicus" onClick={() => setMobileMenuOpen(false)} className="py-4 rounded-xl font-black text-[#0a1c12] text-center flex justify-center items-center gap-2 shadow-[0_0_20px_rgba(19,236,146,0.3)]" style={{ background: 'linear-gradient(135deg, #13ec92 0%, #a3f76e 100%)' }}>
                  <Globe className="w-5 h-5" /> Copernicus Space Hub
                </Link>
              </div>
            )}
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
          <Route path="/copernicus/cams" element={
            <div className="flex flex-col bg-[#051c14] min-h-screen pt-24">
              <CopernicusDataHubHeader active="cams" />
              <div className="flex-1 overflow-hidden"><CamsDashboard /></div>
            </div>
          } />
          <Route path="/copernicus/marine" element={
            <div className="flex flex-col bg-[#10221a] min-h-screen pt-24">
              <CopernicusDataHubHeader active="marine" />
              <div className="flex-1 overflow-hidden"><MarineDashboard /></div>
            </div>
          } />
          <Route path="/copernicus/credits" element={
            <div className="flex flex-col bg-[#0a1c12] min-h-screen pt-24">
              <CopernicusDataHubHeader active="credits" />
              <div className="flex-1 overflow-hidden"><CreditsView /></div>
            </div>
          } />
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
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowFeedbackModal(false)}>
            <div className="bg-white dark:bg-[#1a1a2e] rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Send Feedback</h2>
                <button onClick={() => setShowFeedbackModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white text-xl font-bold">✕</button>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.target); window.open(`mailto:tichakorn.dev@gmail.com?subject=TMD Weather Feedback&body=${encodeURIComponent(`From: ${fd.get('name')} (${fd.get('email')})\n\n${fd.get('message')}`)}`); setShowFeedbackModal(false); }} className="space-y-3">
                <input name="name" placeholder="Your Name" required className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none" />
                <input name="email" type="email" placeholder="Email Address" required className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none" />
                <textarea name="message" placeholder="Your feedback..." rows={4} required className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
                <button type="submit" className="w-full py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-sm transition-colors">Send Feedback</button>
              </form>
            </div>
          </div>
        )
      }

    </div>
  )
}

function CamsDashboard() {
  const [activeTab, setActiveTab] = useState('Overview');
  const [smogTab, setSmogTab] = useState('PM2.5');
  const [searchQuery, setSearchQuery] = useState('');
  const [airData, setAirData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mapLayer, setMapLayer] = useState('air');

  // Override body background to dark when CAMS dashboard is active
  useEffect(() => {
    const origBody = document.body.style.background;
    const origHtml = document.documentElement.style.background;
    document.body.style.background = '#051c14';
    document.documentElement.style.background = '#051c14';
    document.documentElement.classList.add('dark');
    return () => {
      document.body.style.background = origBody;
      document.documentElement.style.background = origHtml;
      // Note: document class will be handled by App.jsx useEffect
    };
  }, []);
  const [mapMarkers, setMapMarkers] = useState([]);
  const [layerCache, setLayerCache] = useState({});
  const [layerLoading, setLayerLoading] = useState(false);
  const [selectedStation, setSelectedStation] = useState(null);
  const [stationData, setStationData] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [stationSearch, setStationSearch] = useState('');
  const [showStationPicker, setShowStationPicker] = useState(false);
  const [weatherTileLayer, setWeatherTileLayer] = useState('none');
  const OWM_API_KEY = '2af0d16d3eb5622702e2c1c21d7e4040';
  const [showCredits, setShowCredits] = useState(false);
  const [showAllHotspots, setShowAllHotspots] = useState(false);

  // 100 Global cities
  const GLOBAL_CITIES = useMemo(() => [
    // Asia (25)
    { name: 'Beijing', country: 'CN', lat: 39.9042, lon: 116.4074 },
    { name: 'Shanghai', country: 'CN', lat: 31.2304, lon: 121.4737 },
    { name: 'Delhi', country: 'IN', lat: 28.6139, lon: 77.2090 },
    { name: 'Mumbai', country: 'IN', lat: 19.0760, lon: 72.8777 },
    { name: 'Kolkata', country: 'IN', lat: 22.5726, lon: 88.3639 },
    { name: 'Tokyo', country: 'JP', lat: 35.6762, lon: 139.6503 },
    { name: 'Osaka', country: 'JP', lat: 34.6937, lon: 135.5023 },
    { name: 'Bangkok', country: 'TH', lat: 13.7563, lon: 100.5018 },
    { name: 'Jakarta', country: 'ID', lat: -6.2088, lon: 106.8456 },
    { name: 'Seoul', country: 'KR', lat: 37.5665, lon: 126.9780 },
    { name: 'Dubai', country: 'AE', lat: 25.2048, lon: 55.2708 },
    { name: 'Singapore', country: 'SG', lat: 1.3521, lon: 103.8198 },
    { name: 'Hong Kong', country: 'HK', lat: 22.3193, lon: 114.1694 },
    { name: 'Taipei', country: 'TW', lat: 25.0330, lon: 121.5654 },
    { name: 'Manila', country: 'PH', lat: 14.5995, lon: 120.9842 },
    { name: 'Hanoi', country: 'VN', lat: 21.0285, lon: 105.8542 },
    { name: 'Dhaka', country: 'BD', lat: 23.8103, lon: 90.4125 },
    { name: 'Karachi', country: 'PK', lat: 24.8607, lon: 67.0011 },
    { name: 'Tehran', country: 'IR', lat: 35.6892, lon: 51.3890 },
    { name: 'Riyadh', country: 'SA', lat: 24.7136, lon: 46.6753 },
    { name: 'Kuala Lumpur', country: 'MY', lat: 3.1390, lon: 101.6869 },
    { name: 'Chengdu', country: 'CN', lat: 30.5728, lon: 104.0668 },
    { name: 'Guangzhou', country: 'CN', lat: 23.1291, lon: 113.2644 },
    { name: 'Ho Chi Minh', country: 'VN', lat: 10.8231, lon: 106.6297 },
    { name: 'Baghdad', country: 'IQ', lat: 33.3152, lon: 44.3661 },
    // Europe (20)
    { name: 'London', country: 'GB', lat: 51.5074, lon: -0.1278 },
    { name: 'Paris', country: 'FR', lat: 48.8566, lon: 2.3522 },
    { name: 'Berlin', country: 'DE', lat: 52.5200, lon: 13.4050 },
    { name: 'Moscow', country: 'RU', lat: 55.7558, lon: 37.6173 },
    { name: 'Istanbul', country: 'TR', lat: 41.0082, lon: 28.9784 },
    { name: 'Madrid', country: 'ES', lat: 40.4168, lon: -3.7038 },
    { name: 'Rome', country: 'IT', lat: 41.9028, lon: 12.4964 },
    { name: 'Warsaw', country: 'PL', lat: 52.2297, lon: 21.0122 },
    { name: 'Vienna', country: 'AT', lat: 48.2082, lon: 16.3738 },
    { name: 'Amsterdam', country: 'NL', lat: 52.3676, lon: 4.9041 },
    { name: 'Stockholm', country: 'SE', lat: 59.3293, lon: 18.0686 },
    { name: 'Prague', country: 'CZ', lat: 50.0755, lon: 14.4378 },
    { name: 'Athens', country: 'GR', lat: 37.9838, lon: 23.7275 },
    { name: 'Bucharest', country: 'RO', lat: 44.4268, lon: 26.1025 },
    { name: 'Budapest', country: 'HU', lat: 47.4979, lon: 19.0402 },
    { name: 'Sofia', country: 'BG', lat: 42.6977, lon: 23.3219 },
    { name: 'Oslo', country: 'NO', lat: 59.9139, lon: 10.7522 },
    { name: 'Lisbon', country: 'PT', lat: 38.7223, lon: -9.1393 },
    { name: 'Dublin', country: 'IE', lat: 53.3498, lon: -6.2603 },
    { name: 'Zürich', country: 'CH', lat: 47.3769, lon: 8.5417 },
    // Americas (20)
    { name: 'New York', country: 'US', lat: 40.7128, lon: -74.0060 },
    { name: 'Los Angeles', country: 'US', lat: 34.0522, lon: -118.2437 },
    { name: 'Chicago', country: 'US', lat: 41.8781, lon: -87.6298 },
    { name: 'Houston', country: 'US', lat: 29.7604, lon: -95.3698 },
    { name: 'Miami', country: 'US', lat: 25.7617, lon: -80.1918 },
    { name: 'San Francisco', country: 'US', lat: 37.7749, lon: -122.4194 },
    { name: 'Toronto', country: 'CA', lat: 43.6532, lon: -79.3832 },
    { name: 'Vancouver', country: 'CA', lat: 49.2827, lon: -123.1207 },
    { name: 'São Paulo', country: 'BR', lat: -23.5505, lon: -46.6333 },
    { name: 'Rio de Janeiro', country: 'BR', lat: -22.9068, lon: -43.1729 },
    { name: 'Mexico City', country: 'MX', lat: 19.4326, lon: -99.1332 },
    { name: 'Buenos Aires', country: 'AR', lat: -34.6037, lon: -58.3816 },
    { name: 'Lima', country: 'PE', lat: -12.0464, lon: -77.0428 },
    { name: 'Bogotá', country: 'CO', lat: 4.7110, lon: -74.0721 },
    { name: 'Santiago', country: 'CL', lat: -33.4489, lon: -70.6693 },
    { name: 'Havana', country: 'CU', lat: 23.1136, lon: -82.3666 },
    { name: 'Washington DC', country: 'US', lat: 38.9072, lon: -77.0369 },
    { name: 'Atlanta', country: 'US', lat: 33.7490, lon: -84.3880 },
    { name: 'Denver', country: 'US', lat: 39.7392, lon: -104.9903 },
    { name: 'Seattle', country: 'US', lat: 47.6062, lon: -122.3321 },
    // Africa (15)
    { name: 'Cairo', country: 'EG', lat: 30.0444, lon: 31.2357 },
    { name: 'Lagos', country: 'NG', lat: 6.5244, lon: 3.3792 },
    { name: 'Nairobi', country: 'KE', lat: -1.2921, lon: 36.8219 },
    { name: 'Johannesburg', country: 'ZA', lat: -26.2041, lon: 28.0473 },
    { name: 'Cape Town', country: 'ZA', lat: -33.9249, lon: 18.4241 },
    { name: 'Casablanca', country: 'MA', lat: 33.5731, lon: -7.5898 },
    { name: 'Addis Ababa', country: 'ET', lat: 9.0250, lon: 38.7469 },
    { name: 'Accra', country: 'GH', lat: 5.6037, lon: -0.1870 },
    { name: 'Dar es Salaam', country: 'TZ', lat: -6.7924, lon: 39.2083 },
    { name: 'Kinshasa', country: 'CD', lat: -4.4419, lon: 15.2663 },
    { name: 'Dakar', country: 'SN', lat: 14.7167, lon: -17.4677 },
    { name: 'Algiers', country: 'DZ', lat: 36.7538, lon: 3.0588 },
    { name: 'Tunis', country: 'TN', lat: 36.8065, lon: 10.1815 },
    { name: 'Luanda', country: 'AO', lat: -8.8399, lon: 13.2894 },
    { name: 'Khartoum', country: 'SD', lat: 15.5007, lon: 32.5599 },
    // Oceania (5)
    { name: 'Sydney', country: 'AU', lat: -33.8688, lon: 151.2093 },
    { name: 'Melbourne', country: 'AU', lat: -37.8136, lon: 144.9631 },
    { name: 'Auckland', country: 'NZ', lat: -36.8485, lon: 174.7633 },
    { name: 'Perth', country: 'AU', lat: -31.9505, lon: 115.8605 },
    { name: 'Brisbane', country: 'AU', lat: -27.4698, lon: 153.0251 },
  ], []);

  // Coastal + Ocean Grid for Wave heat map (40 points)
  const OCEAN_GRID = useMemo(() => [
    // Coastal cities
    { name: 'Miami Coast', country: 'US', lat: 25.76, lon: -80.19 },
    { name: 'Lisbon Coast', country: 'PT', lat: 38.72, lon: -9.14 },
    { name: 'Cape Town Coast', country: 'ZA', lat: -33.92, lon: 18.42 },
    { name: 'Tokyo Bay', country: 'JP', lat: 35.44, lon: 139.84 },
    { name: 'Sydney Coast', country: 'AU', lat: -33.87, lon: 151.21 },
    { name: 'LA Coast', country: 'US', lat: 33.94, lon: -118.41 },
    { name: 'Mumbai Coast', country: 'IN', lat: 19.08, lon: 72.88 },
    { name: 'Rio Coast', country: 'BR', lat: -22.91, lon: -43.17 },
    { name: 'Honolulu', country: 'US', lat: 21.31, lon: -157.86 },
    { name: 'Singapore Strait', country: 'SG', lat: 1.35, lon: 103.82 },
    { name: 'Reykjavik', country: 'IS', lat: 64.15, lon: -21.94 },
    // North Atlantic grid
    { name: 'N. Atlantic 1', country: '', lat: 45, lon: -30 },
    { name: 'N. Atlantic 2', country: '', lat: 35, lon: -45 },
    { name: 'N. Atlantic 3', country: '', lat: 55, lon: -20 },
    { name: 'N. Atlantic 4', country: '', lat: 25, lon: -60 },
    // South Atlantic
    { name: 'S. Atlantic 1', country: '', lat: -15, lon: -20 },
    { name: 'S. Atlantic 2', country: '', lat: -30, lon: -10 },
    { name: 'S. Atlantic 3', country: '', lat: -5, lon: -30 },
    // North Pacific
    { name: 'N. Pacific 1', country: '', lat: 35, lon: -160 },
    { name: 'N. Pacific 2', country: '', lat: 45, lon: -140 },
    { name: 'N. Pacific 3', country: '', lat: 25, lon: 170 },
    { name: 'N. Pacific 4', country: '', lat: 15, lon: -130 },
    // South Pacific
    { name: 'S. Pacific 1', country: '', lat: -20, lon: -150 },
    { name: 'S. Pacific 2', country: '', lat: -35, lon: -120 },
    { name: 'S. Pacific 3', country: '', lat: -10, lon: 170 },
    // Indian Ocean
    { name: 'Indian Ocean 1', country: '', lat: -5, lon: 70 },
    { name: 'Indian Ocean 2', country: '', lat: -20, lon: 60 },
    { name: 'Indian Ocean 3', country: '', lat: 5, lon: 85 },
    { name: 'Indian Ocean 4', country: '', lat: -30, lon: 45 },
    // Mediterranean
    { name: 'Med Sea 1', country: '', lat: 36, lon: 15 },
    { name: 'Med Sea 2', country: '', lat: 34, lon: 25 },
    // Caribbean
    { name: 'Caribbean 1', country: '', lat: 18, lon: -70 },
    { name: 'Caribbean 2', country: '', lat: 15, lon: -80 },
    // Southern Ocean
    { name: 'Southern Ocean 1', country: '', lat: -50, lon: 30 },
    { name: 'Southern Ocean 2', country: '', lat: -55, lon: -60 },
    // Arctic
    { name: 'Norwegian Sea', country: '', lat: 65, lon: 5 },
    { name: 'Barents Sea', country: '', lat: 72, lon: 30 },
    // Bay of Bengal / South China Sea
    { name: 'Bay of Bengal', country: '', lat: 12, lon: 87 },
    { name: 'South China Sea', country: '', lat: 15, lon: 115 },
    { name: 'Gulf of Mexico', country: '', lat: 25, lon: -90 },
  ], []);

  // Fetch layer data
  useEffect(() => {
    async function fetchLayerData() {
      if (layerCache[mapLayer]) {
        setMapMarkers(layerCache[mapLayer]);
        return;
      }
      setLayerLoading(true);
      try {
        let markers = [];

        // Helper to batch fetch in groups to avoid overwhelming
        const batchFetch = async (items, batchSize, fetchFn) => {
          const results = [];
          for (let i = 0; i < items.length; i += batchSize) {
            const batch = items.slice(i, i + batchSize);
            const batchResults = await Promise.all(batch.map(fetchFn));
            results.push(...batchResults);
          }
          return results;
        };

        if (mapLayer === 'air') {
          markers = await batchFetch(GLOBAL_CITIES, 20, async (c) => {
            const r = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${c.lat}&longitude=${c.lon}&current=european_aqi,pm2_5,pm10`);
            const d = await r.json();
            const aqi = d.current?.european_aqi || 0;
            let color = '#13ec92';
            if (aqi > 80) color = '#ef4444';
            else if (aqi > 40) color = '#facc15';
            return { ...c, value: aqi, label: `AQI ${aqi}`, unit: 'AQI', detail: `PM2.5: ${d.current?.pm2_5?.toFixed(1) || 0} µg/m³`, color };
          });
        } else if (mapLayer === 'waves') {
          markers = await batchFetch(OCEAN_GRID, 15, async (c) => {
            const r = await fetch(`https://marine-api.open-meteo.com/v1/marine?latitude=${c.lat}&longitude=${c.lon}&current=wave_height,wave_period,wave_direction`);
            const d = await r.json();
            const wh = d.current?.wave_height || 0;
            let color = '#13ec92';
            if (wh > 3) color = '#ef4444';
            else if (wh > 1.5) color = '#facc15';
            else if (wh > 0.8) color = '#4ade80';
            return { ...c, value: wh, label: `${wh.toFixed(1)}m`, unit: 'm', detail: `Period: ${d.current?.wave_period?.toFixed(1) || 0}s`, color, radius: Math.max(wh * 120000, 150000) };
          });
        } else if (mapLayer === 'storms') {
          markers = await batchFetch(GLOBAL_CITIES, 20, async (c) => {
            const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lon}&current=wind_speed_10m,wind_gusts_10m,weather_code`);
            const d = await r.json();
            const gusts = d.current?.wind_gusts_10m || 0;
            const wCode = d.current?.weather_code || 0;
            let color = '#13ec92';
            if (gusts > 60 || wCode >= 95) color = '#ef4444';
            else if (gusts > 30 || wCode >= 61) color = '#facc15';
            const wDesc = wCode >= 95 ? 'Thunderstorm' : wCode >= 71 ? 'Snow' : wCode >= 61 ? 'Rain' : wCode >= 51 ? 'Drizzle' : wCode >= 45 ? 'Fog' : wCode >= 3 ? 'Cloudy' : 'Clear';
            return { ...c, value: gusts, label: `${gusts.toFixed(0)} km/h`, unit: 'km/h', detail: `${wDesc} • Wind: ${d.current?.wind_speed_10m?.toFixed(0) || 0} km/h`, color, radius: Math.max(gusts * 8000, 100000) };
          });
        } else if (mapLayer === 'hotspots') {
          const airResults = await batchFetch(GLOBAL_CITIES.slice(0, 30), 15, async (c) => {
            const r = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${c.lat}&longitude=${c.lon}&current=european_aqi,pm2_5`);
            const d = await r.json();
            return { ...c, aqi: d.current?.european_aqi || 0, pm25: d.current?.pm2_5 || 0 };
          });
          const stormResults = await batchFetch(GLOBAL_CITIES.slice(0, 30), 15, async (c) => {
            const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lon}&current=wind_gusts_10m,weather_code`);
            const d = await r.json();
            return { ...c, gusts: d.current?.wind_gusts_10m || 0, wCode: d.current?.weather_code || 0 };
          });
          const combined = airResults.map((a, i) => {
            const s = stormResults[i];
            const risk = a.aqi + (s.gusts > 40 ? 50 : 0) + (s.wCode >= 61 ? 30 : 0);
            let color = '#13ec92';
            if (risk > 100) color = '#ef4444';
            else if (risk > 50) color = '#facc15';
            const cat = a.aqi > 80 ? 'Air Quality Alert' : s.gusts > 40 ? 'High Wind' : s.wCode >= 61 ? 'Weather Alert' : 'Moderate';
            return { ...a, value: risk, label: `Risk ${risk}`, unit: '', detail: `AQI: ${a.aqi} • Gusts: ${s.gusts.toFixed(0)} km/h`, color, category: cat };
          });
          combined.sort((a, b) => b.value - a.value);
          markers = combined;
        }
        setMapMarkers(markers);
        setLayerCache(prev => ({ ...prev, [mapLayer]: markers }));
      } catch (e) {
        console.error('Layer fetch error', e);
      } finally {
        setLayerLoading(false);
      }
    }
    fetchLayerData();
  }, [mapLayer, GLOBAL_CITIES, OCEAN_GRID, layerCache]);

  // Auto-detect nearest station via geolocation
  useEffect(() => {
    if (selectedStation) return; // already set
    const fallback = { name: 'Bangkok', country: 'TH', lat: 13.7563, lon: 100.5018 };
    const haversine = (lat1, lon1, lat2, lon2) => {
      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          let nearest = GLOBAL_CITIES[0], minDist = Infinity;
          GLOBAL_CITIES.forEach(c => {
            const d = haversine(latitude, longitude, c.lat, c.lon);
            if (d < minDist) { minDist = d; nearest = c; }
          });
          setSelectedStation(nearest);
        },
        () => setSelectedStation(fallback),
        { timeout: 5000 }
      );
    } else {
      setSelectedStation(fallback);
    }
  }, [GLOBAL_CITIES, selectedStation]);

  // Fetch detailed data for selected station
  useEffect(() => {
    async function fetchStationData() {
      try {
        setLoading(true);
        const res = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${selectedStation.lat}&longitude=${selectedStation.lon}&current=european_aqi,pm10,pm2_5,ozone,nitrogen_dioxide&hourly=pm10,pm2_5,ozone,nitrogen_dioxide,european_aqi`);
        const data = await res.json();
        setStationData(data);
        setAirData({ paris: data }); // backward compat for chart
      } catch (e) {
        console.error("Station data fetch error", e);
      } finally {
        setLoading(false);
      }
    }
    if (!selectedStation) return;
    fetchStationData();
  }, [selectedStation]);

  // Trend Chart Data
  const chartData = useMemo(() => {
    if (!stationData?.hourly) return [];
    const hourly = stationData.hourly;
    const nowIdx = hourly.time.findIndex(t => new Date(t).getHours() === new Date().getHours() && new Date(t).getDate() === new Date().getDate());
    const startIdx = Math.max(0, (nowIdx !== -1 ? nowIdx : 23) - 23);
    const times = hourly.time.slice(startIdx, startIdx + 24);
    let key = 'pm2_5';
    if (smogTab === 'PM10') key = 'pm10';
    if (smogTab === 'NO2') key = 'nitrogen_dioxide';
    const values = hourly[key].slice(startIdx, startIdx + 24);
    return times.map((t, i) => {
      const d = new Date(t);
      return { time: `${d.getHours().toString().padStart(2, '0')}:00`, value: Math.round(values[i] || 0) };
    });
  }, [stationData, smogTab]);

  // Main Variables from selected station
  const currentAQI = stationData?.current?.european_aqi || 42;
  const currentPm25 = stationData?.current?.pm2_5 || 12.4;
  const currentPm10 = stationData?.current?.pm10 || 24.8;
  const currentO3 = stationData?.current?.ozone || 45.2;
  const currentNo2 = stationData?.current?.nitrogen_dioxide || 18.1;

  let aqiStatus = 'Good';
  let aqiColor = '#13ec92';
  if (currentAQI > 80) { aqiStatus = 'Poor'; aqiColor = '#ef4444'; }
  else if (currentAQI > 40) { aqiStatus = 'Moderate'; aqiColor = '#facc15'; }

  // Use map markers for hotspots display
  const displayHotspots = useMemo(() => {
    if (mapLayer === 'air' && mapMarkers.length > 0) {
      return [...mapMarkers].sort((a, b) => b.value - a.value).map((m, i) => ({
        rank: String(i + 1).padStart(2, '0'), city: `${m.name}, ${m.country}`, category: m.value > 80 ? 'High Pollution' : m.value > 40 ? 'Moderate' : 'Good', aqi: m.value, color: m.color, lat: m.lat, lon: m.lon, name: m.name, country: m.country
      }));
    }
    if (mapLayer === 'waves' && mapMarkers.length > 0) {
      return [...mapMarkers].sort((a, b) => b.value - a.value).map((m, i) => ({
        rank: String(i + 1).padStart(2, '0'), city: `${m.name}, ${m.country}`, category: m.value > 3 ? 'Heavy Seas' : m.value > 1.5 ? 'Moderate' : 'Calm', aqi: m.value, color: m.color, lat: m.lat, lon: m.lon, name: m.name, country: m.country, unit: 'm'
      }));
    }
    if (mapLayer === 'storms' && mapMarkers.length > 0) {
      return [...mapMarkers].sort((a, b) => b.value - a.value).map((m, i) => ({
        rank: String(i + 1).padStart(2, '0'), city: `${m.name}, ${m.country}`, category: m.value > 60 ? 'Severe' : m.value > 30 ? 'Strong' : 'Moderate', aqi: m.value, color: m.color, lat: m.lat, lon: m.lon, name: m.name, country: m.country, unit: 'km/h'
      }));
    }
    if (mapLayer === 'hotspots' && mapMarkers.length > 0) {
      return mapMarkers.slice(0, 8).map((m, i) => ({
        rank: String(i + 1).padStart(2, '0'), city: `${m.name}, ${m.country}`, category: m.category || 'Alert', aqi: m.value, color: m.color, lat: m.lat, lon: m.lon, name: m.name, country: m.country
      }));
    }
    return [{ rank: '01', city: 'Loading...', category: 'Fetching data', aqi: 0, color: '#13ec92' }];
  }, [mapMarkers, mapLayer]);

  // Layer config
  const LAYER_CONFIG = {
    air: { icon: '🌬️', label: 'Air Quality', title: 'Global Index Map', subtitle: `Real-time AQI from ${GLOBAL_CITIES.length} cities worldwide` },
    waves: { icon: '🌊', label: 'Wave Height', title: 'Ocean Wave Monitor', subtitle: `Live wave heights at ${OCEAN_GRID.length} stations` },
    storms: { icon: '⛈️', label: 'Storms & Wind', title: 'Storm & Wind Tracker', subtitle: 'Wind gusts and weather conditions globally' },
    hotspots: { icon: '🔥', label: 'Hotspots', title: 'Global Risk Hotspots', subtitle: 'Combined air quality + weather risk index' },
  };

  const currentLayerConfig = LAYER_CONFIG[mapLayer];

  // Notifications based on live data
  const notifications = useMemo(() => {
    const notifs = [];
    const stName = selectedStation?.name || 'Station';
    if (currentAQI > 80) notifs.push({ type: 'alert', msg: `⚠️ ${stName} AQI is ${currentAQI} — Poor air quality`, time: 'Now' });
    if (currentAQI > 40) notifs.push({ type: 'warning', msg: `Air quality moderate at ${stName}`, time: '1m ago' });
    const highHotspots = mapMarkers.filter(m => m.value > 80);
    if (highHotspots.length > 0) notifs.push({ type: 'alert', msg: `${highHotspots.length} cities with high pollution detected`, time: '5m ago' });
    notifs.push({ type: 'info', msg: `${mapMarkers.length} stations actively monitored`, time: '10m ago' });
    notifs.push({ type: 'info', msg: 'Data refreshed from Open-Meteo API', time: '15m ago' });
    return notifs;
  }, [currentAQI, selectedStation, mapMarkers]);

  if (!selectedStation) {
    return (
      <div className="bg-[#051c14] min-h-screen font-['Space_Grotesk'] text-slate-100 flex items-center justify-center" style={{ background: '#051c14' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#13ec92]/30 border-t-[#13ec92] rounded-full animate-spin"></div>
          <p className="text-[#13ec92] font-bold animate-pulse">Detecting nearest station...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020808] text-slate-100 font-body relative overflow-hidden selection:bg-[#13ec92]/30 selection:text-[#13ec92]">
      {/* Background Orbs / Gradients */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#13ec92]/5 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#13ec92]/5 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Navigation Header */}
        <header className="sticky top-0 z-50 px-6 py-4 backdrop-blur-xl border-b border-white/5 bg-[#020808]/60">
          <div className="max-w-[1600px] mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-[#13ec92] blur-md opacity-20 animate-pulse"></div>
                <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[#13ec92] to-[#0ea5e9] flex items-center justify-center border border-white/20 shadow-lg shadow-[#13ec92]/20">
                  <Globe className="w-5 h-5 text-[#020808]" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-headline font-bold text-white tracking-tight flex items-center gap-2">
                  CAMS <span className="text-[#13ec92] font-medium text-sm tracking-widest px-2 py-0.5 bg-[#13ec92]/10 rounded border border-[#13ec92]/20">OBSERVATORY</span>
                </h1>
                <p className="text-slate-500 text-[10px] uppercase tracking-[0.2em] font-bold">Atmospheric Monitoring • Real-time HUD</p>
              </div>
            </div>

            <nav className="hidden lg:flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
              {['Overview', 'Analysis', 'Reports'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-2 rounded-lg text-sm font-label font-bold transition-all duration-300 ${activeTab === tab ? 'bg-[#13ec92] text-[#020808] shadow-[0_4px_20px_rgba(19,236,146,0.3)]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                >
                  {tab}
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-4">
              <Link to="/copernicus" className="text-slate-400 hover:text-[#13ec92] transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-wider group">
                <ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
                Hub
              </Link>
              <div className="w-px h-6 bg-white/10"></div>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg bg-white/5 border border-white/10 hover:border-[#13ec92]/50 text-slate-300 transition-all group"
              >
                <Bell className="w-5 h-5 group-hover:scale-110 transition-transform" />
                {notifications.some(n => n.type === 'alert') && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#ef4444] rounded-full ring-4 ring-[#020808] animate-pulse"></span>
                )}
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-8 max-w-[1600px] mx-auto w-full space-y-8 pb-20">
          {activeTab === 'Overview' && (
            <div className="grid grid-cols-12 gap-8 animate-fade-in">

              {/* LEFT HUD: Station & Metrics */}
              <div className="col-span-12 lg:col-span-3 space-y-6">
                {/* Station Picker Glass Card */}
                <div className="glass-panel p-5 beveled-edge relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#13ec92]/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-[#13ec92]/10 transition-colors"></div>

                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <span className="text-[10px] font-bold text-[#13ec92] uppercase tracking-[0.2em]">Active Station</span>
                    <MapPin className="w-4 h-4 text-[#13ec92]" />
                  </div>

                  <button
                    onClick={() => setShowStationPicker(!showStationPicker)}
                    className="w-full bg-[#020808]/40 rounded-xl border border-white/10 p-4 flex items-center justify-between hover:border-[#13ec92]/50 transition-all relative z-10 group"
                  >
                    <div className="text-left">
                      <h3 className="text-white font-headline font-bold text-lg leading-tight group-hover:text-[#13ec92] transition-colors">{selectedStation.name}</h3>
                      <p className="text-slate-500 text-xs font-medium">{selectedStation.country}</p>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${showStationPicker ? 'rotate-180 text-[#13ec92]' : ''}`} />
                  </button>

                  {showStationPicker && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-[#020808]/95 backdrop-blur-2xl border border-[#13ec92]/20 rounded-xl shadow-2xl z-[100] overflow-hidden animate-in slide-in-from-top-2 duration-300 mx-5">
                      <div className="p-3 border-b border-white/5">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                          <input
                            type="text"
                            value={stationSearch}
                            onChange={(e) => setStationSearch(e.target.value)}
                            placeholder="Find sensor node..."
                            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-[#13ec92]/50 transition-all"
                            autoFocus
                          />
                        </div>
                      </div>
                      <div className="max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
                        {GLOBAL_CITIES.filter(c => c.name.toLowerCase().includes(stationSearch.toLowerCase())).map((c, i) => (
                          <button
                            key={i}
                            onClick={() => { setSelectedStation(c); setShowStationPicker(false); setStationSearch(''); }}
                            className={`w-full px-4 py-3 text-left hover:bg-white/5 transition-all group flex items-center justify-between ${selectedStation.name === c.name ? 'bg-[#13ec92]/5 border-l-2 border-[#13ec92]' : ''}`}
                          >
                            <div>
                              <div className={`text-sm font-bold ${selectedStation.name === c.name ? 'text-[#13ec92]' : 'text-slate-200'}`}>{c.name}</div>
                              <div className="text-[10px] text-slate-500 uppercase tracking-wider">{c.country}</div>
                            </div>
                            {selectedStation.name === c.name && <div className="w-1.5 h-1.5 rounded-full bg-[#13ec92] shadow-[0_0_8px_#13ec92]"></div>}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Main AQI HUD Card */}
                <div className="glass-panel p-6 beveled-edge relative overflow-hidden group shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#13ec92]/5 to-transparent opacity-50"></div>

                  <div className="relative z-10 flex flex-col items-center">
                    <div className="flex items-center gap-2 mb-6 w-full">
                      <div className="w-8 h-8 rounded-lg bg-[#13ec92]/10 flex items-center justify-center border border-[#13ec92]/20">
                        <Wind className="w-4 h-4 text-[#13ec92]" />
                      </div>
                      <span className="text-xs font-label font-bold text-[#13ec92] uppercase tracking-widest">Global AQI Standard</span>
                    </div>

                    <div className="relative mb-6">
                      <div className="absolute inset-0 blur-[40px] opacity-20 bg-[#13ec92]" style={{ color: aqiColor }}></div>
                      <div className="relative flex flex-col items-center">
                        <span className="text-[120px] font-headline font-black leading-none tracking-tighter text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.15)]">{currentAQI}</span>
                        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md -mt-4">
                          <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: aqiColor }}></div>
                          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: aqiColor }}>{aqiStatus}</span>
                        </div>
                      </div>
                    </div>

                    <div className="w-full space-y-4">
                      <div className="flex justify-between items-center px-4 py-3 bg-white/5 rounded-xl border border-white/10 transition-all hover:bg-white/10">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Atmosphere Density</span>
                        <span className="text-sm font-label font-black text-white">{currentAQI > 80 ? 'CRITICAL' : currentAQI > 40 ? 'ELEVATED' : 'NOMINAL'}</span>
                      </div>
                      <div className="flex justify-between items-center px-4 py-3 bg-white/5 rounded-xl border border-white/10 transition-all hover:bg-white/10">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">System Trend</span>
                        <span className="text-sm font-label font-black text-[#ef4444] flex items-center gap-1">
                          <TrendingUp className="w-4 h-4" /> +2.4%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pollutant Sensor Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'PM 2.5', value: currentPm25, icon: <CloudRain className="w-4 h-4" /> },
                    { label: 'PM 10', value: currentPm10, icon: <CloudRain className="w-4 h-4" /> },
                    { label: 'O3', value: currentO3, icon: <Wind className="w-4 h-4" /> },
                    { label: 'NO2', value: currentNo2, icon: <Thermometer className="w-4 h-4" /> },
                  ].map((p, i) => (
                    <div key={i} className="glass-panel p-4 beveled-edge bg-[#020808]/40 hover:bg-[#13ec92]/5 hover:border-[#13ec92]/30 transition-all group cursor-default">
                      <div className="flex justify-between items-start mb-3">
                        <div className="text-[10px] font-bold text-[#13ec92] uppercase tracking-[0.15em]">{p.label}</div>
                        <div className="text-slate-500 group-hover:text-[#13ec92] transition-colors">{p.icon}</div>
                      </div>
                      <div className="text-2xl font-headline font-black text-white group-hover:scale-110 transition-transform origin-left">{p.value.toFixed(1)}</div>
                      <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">µg per m³</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CENTER HUD: World View Map */}
              <div className="col-span-12 lg:col-span-6 space-y-6">
                <div className="glass-panel beveled-edge h-[720px] relative overflow-hidden group">
                  {/* Map Header Overlay */}
                  <div className="absolute top-6 left-6 right-6 z-[1100] flex flex-wrap justify-between items-center gap-4">
                    <div className="px-5 py-3 rounded-2xl bg-[#020808]/60 backdrop-blur-xl border border-white/10 shadow-2xl flex items-center gap-4">
                      <div className="w-2 h-2 rounded-full bg-[#13ec92] animate-ping"></div>
                      <div>
                        <h2 className="text-sm font-headline font-bold text-white uppercase tracking-wider">{currentLayerConfig.title}</h2>
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em]">{currentLayerConfig.subtitle}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-1 bg-[#020808]/60 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl">
                      {Object.entries(LAYER_CONFIG).map(([key, cfg]) => (
                        <button
                          key={key}
                          onClick={() => setMapLayer(key)}
                          className={`px-4 py-2 rounded-xl text-[10px] font-label font-black uppercase tracking-widest transition-all ${mapLayer === key ? 'bg-[#13ec92] text-[#020808] shadow-[0_0_20px_rgba(19,236,146,0.4)]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                        >
                          <span className="mr-2">{cfg.icon}</span> {cfg.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* World Map Component */}
                  <div className="absolute inset-0 map-hud-container">
                    {layerLoading && (
                      <div className="absolute inset-0 bg-[#020808]/60 backdrop-blur-md z-[1000] flex items-center justify-center">
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-12 h-12 border-4 border-[#13ec92]/20 border-t-[#13ec92] rounded-full animate-spin"></div>
                          <span className="text-[#13ec92] text-xs font-black uppercase tracking-[0.3em] animate-pulse">Syncing Satellite Data...</span>
                        </div>
                      </div>
                    )}
                    <MapContainer center={[20, 0]} zoom={2} minZoom={2} maxZoom={8} className="w-full h-full" zoomControl={false} attributionControl={false}>
                      <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                      {OWM_API_KEY && weatherTileLayer !== 'none' && (
                        <TileLayer url={`https://tile.openweathermap.org/map/${weatherTileLayer}/{z}/{x}/{y}.png?appid=${OWM_API_KEY}`} opacity={0.6} />
                      )}

                      {mapMarkers.map((m, i) => (
                        (mapLayer === 'waves' || mapLayer === 'storms') ? (
                          <Circle
                            key={`${mapLayer}-circle-${i}`}
                            center={[m.lat, m.lon]}
                            radius={m.radius || 200000}
                            pathOptions={{ fillColor: m.color, fillOpacity: 0.4, color: m.color, weight: 1.5, opacity: 0.6 }}
                          >
                            <Popup>
                              <div className="glass-panel p-4 beveled-edge bg-[#020808] min-w-[200px] border-[#13ec92]/30 shadow-2xl">
                                <div className="text-[#13ec92] text-[9px] font-black uppercase tracking-widest mb-1">{currentLayerConfig.label} Component</div>
                                <div className="text-white text-base font-headline font-bold mb-2">{m.name}{m.country ? `, ${m.country}` : ''}</div>
                                <div className="text-3xl font-black mb-1" style={{ color: m.color }}>{m.label}</div>
                                <div className="text-slate-400 text-[10px] font-medium leading-relaxed">{m.detail}</div>
                              </div>
                            </Popup>
                          </Circle>
                        ) : (
                          <Marker
                            key={`${mapLayer}-${i}`}
                            position={[m.lat, m.lon]}
                            icon={L.divIcon({
                              className: 'custom-marker',
                              html: `
                                <div class="relative flex items-center justify-center">
                                  <div class="absolute inset-0 scale-[2.5] bg-[${m.color}] rounded-full blur-md opacity-20 animate-pulse"></div>
                                  <div style="width:${selectedStation.name === m.name ? '16' : '10'}px;height:${selectedStation.name === m.name ? '16' : '10'}px;border-radius:50%;background:${m.color};border:2px solid #fff;box-shadow:0 0 15px ${m.color}"></div>
                                  ${selectedStation.name === m.name ? '<div class="absolute -inset-2 border border-[#13ec92] rounded-full animate-ping"></div>' : ''}
                                </div>
                              `,
                              iconSize: [24, 24],
                              iconAnchor: [12, 12]
                            })}
                            eventHandlers={{ click: () => setSelectedStation({ name: m.name, country: m.country, lat: m.lat, lon: m.lon }) }}
                          >
                            <Popup>
                              <div className="glass-panel p-4 beveled-edge bg-[#020808] min-w-[200px] border-[#13ec92]/30 shadow-2xl">
                                <div className="text-[#13ec92] text-[9px] font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-[#13ec92] animate-pulse"></div>
                                  Operational Status: Nominal
                                </div>
                                <div className="text-white text-base font-headline font-bold mb-1">{m.name}, {m.country}</div>
                                <div className="text-3xl font-black mb-1" style={{ color: m.color }}>{m.label}</div>
                                <div className="text-slate-400 text-[10px] font-medium mb-3">{m.detail}</div>
                                <button className="w-full py-2 bg-[#13ec92]/10 hover:bg-[#13ec92]/20 border border-[#13ec92]/20 rounded-lg text-[10px] font-bold text-[#13ec92] transition-colors uppercase tracking-widest">Select Node</button>
                              </div>
                            </Popup>
                          </Marker>
                        )
                      ))}
                    </MapContainer>
                  </div>

                  {/* Map Bottom HUD Overlay */}
                  <div className="absolute bottom-6 left-6 right-6 z-[1100] flex justify-between items-end gap-6 pointer-events-none">
                    {/* Legend */}
                    <div className="glass-panel p-4 beveled-edge bg-[#020808]/70 backdrop-blur-xl border-white/10 w-48 pointer-events-auto">
                      <span className="text-[9px] font-black text-white uppercase tracking-[0.2em] mb-3 block">{currentLayerConfig.label} INTENSITY</span>
                      <div className="h-1.5 w-full bg-gradient-to-r from-[#13ec92] via-[#facc15] to-[#ef4444] rounded-full mb-2"></div>
                      <div className="flex justify-between text-[8px] text-slate-500 font-black uppercase tracking-widest">
                        <span>Low Risk</span>
                        <span>High Risk</span>
                      </div>
                    </div>

                    {/* Overlay Controller */}
                    <div className="glass-panel p-2 beveled-edge bg-[#020808]/70 backdrop-blur-xl border-white/10 flex items-center gap-1 pointer-events-auto">
                      {[{ k: 'none', l: 'None' }, { k: 'temp_new', l: 'Temp' }, { k: 'wind_new', l: 'Wind' }, { k: 'precipitation_new', l: 'Rain' }, { k: 'clouds_new', l: 'Clouds' }].map(o => (
                        <button
                          key={o.k}
                          onClick={() => setWeatherTileLayer(o.k)}
                          className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${weatherTileLayer === o.k ? 'bg-[#13ec92]/10 text-[#13ec92] border border-[#13ec92]/30 shadow-[0_0_15px_rgba(19,236,146,0.1)]' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                          {o.l}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* SMOG TRACKING CHART CARD */}
                <div className="glass-panel p-6 beveled-edge relative overflow-hidden group">
                  <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
                    <div>
                      <h2 className="text-white font-headline font-bold text-lg tracking-tight">Temporal Flux (24h)</h2>
                      <p className="text-[#13ec92] text-[10px] font-bold uppercase tracking-[0.2em]">Live Telemetry Monitor • {smogTab}</p>
                    </div>
                    <div className="flex bg-[#020808]/60 p-1 rounded-xl border border-white/10 items-center">
                      <div className="px-3 text-[9px] font-black text-slate-500 uppercase tracking-widest border-r border-white/10 mr-1">Sensor Map:</div>
                      {['PM2.5', 'PM10', 'NO2'].map(t => (
                        <button
                          key={t}
                          onClick={() => setSmogTab(t)}
                          className={`px-4 py-1.5 text-[10px] font-label font-black uppercase tracking-widest rounded-lg transition-all ${smogTab === t ? 'bg-[#13ec92] text-[#020808] shadow-[0_0_15px_rgba(19,236,146,0.3)]' : 'text-slate-400 hover:text-white'}`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="h-[240px] w-full">
                    {loading ? (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-[#13ec92]/50">
                        <div className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-[10px] font-black tracking-widest uppercase">Deciphering Packets...</span>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorCamsSmog" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#13ec92" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#13ec92" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" vertical={false} />
                          <XAxis
                            dataKey="time"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                            dy={10}
                          />
                          <YAxis axisLine={false} tickLine={false} tick={false} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#020808d0', backdropFilter: 'blur(12px)', border: '1px solid rgba(19,236,146,0.2)', borderRadius: '12px', padding: '12px' }}
                            itemStyle={{ color: '#13ec92', fontWeight: 900, textTransform: 'uppercase', fontSize: '12px' }}
                            labelStyle={{ color: '#fff', fontWeight: 900, marginBottom: '4px', fontSize: '10px' }}
                          />
                          <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#13ec92"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorCamsSmog)"
                            animationDuration={2000}
                          />
                          {(() => {
                            const nowHr = new Date().getHours().toString().padStart(2, '0') + ':00';
                            const nowVal = chartData.find(d => d.time === nowHr)?.value;
                            return nowVal != null ? (
                              <ReferenceDot x={nowHr} y={nowVal} r={6} fill="#020808" stroke="#13ec92" strokeWidth={2} isFront />
                            ) : null;
                          })()}
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </div>

              {/* RIGHT HUD: Hotspots & Alerts */}
              <div className="col-span-12 lg:col-span-3 space-y-6">
                <div className="glass-panel beveled-edge p-6 flex flex-col h-full bg-[#020808]/40 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#13ec92]/20 to-transparent"></div>

                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-white font-headline font-bold text-sm uppercase tracking-wider">Critical Nodes</h2>
                      <p className="text-[#13ec92] text-[9px] font-black uppercase tracking-widest mt-1">Satellite Hotspots</p>
                    </div>
                    <button
                      onClick={() => setShowAllHotspots(v => !v)}
                      className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[#13ec92] text-[9px] font-black uppercase tracking-widest hover:bg-[#13ec92]/10 transition-colors"
                    >
                      {showAllHotspots ? 'Compact' : 'Expand'}
                    </button>
                  </div>

                  <div className="flex flex-col gap-3 overflow-y-auto max-h-[1000px] scrollbar-hide">
                    {(showAllHotspots ? displayHotspots : displayHotspots.slice(0, 8)).map((spot, i) => (
                      <div
                        key={i}
                        onClick={() => spot.lat && setSelectedStation({ name: spot.name || spot.city.split(',')[0], country: spot.country || spot.city.split(',')[1]?.trim(), lat: spot.lat, lon: spot.lon })}
                        className="glass-panel p-4 beveled-edge bg-[#020808] border-white/5 hover:border-[#13ec92]/30 transition-all cursor-pointer group relative overflow-hidden"
                      >
                        <div className="absolute inset-y-0 left-0 w-1 transition-all group-hover:w-2" style={{ backgroundColor: spot.color }}></div>
                        <div className="flex items-center justify-between relative z-10">
                          <div className="flex items-center gap-4">
                            <span className="text-[10px] font-headline font-black text-slate-600 tracking-tighter w-4">{spot.rank}</span>
                            <div>
                              <div className="text-xs font-headline font-black text-white group-hover:text-[#13ec92] transition-colors">{spot.city}</div>
                              <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{spot.category}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-headline font-black tracking-tighter" style={{ color: spot.color }}>
                              {mapLayer === 'waves' ? `${spot.aqi.toFixed(1)}m` : mapLayer === 'storms' ? `${Math.round(spot.aqi)}km` : spot.aqi}
                            </div>
                            <div className="text-[8px] font-black text-slate-600 uppercase tracking-widest">
                              {mapLayer === 'waves' ? 'Height' : mapLayer === 'storms' ? 'Gusts' : 'AQI'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 pt-8 border-t border-white/5 flex flex-col items-center">
                    <div className="w-full flex justify-between items-center px-4 py-8 rounded-2xl bg-gradient-to-br from-[#13ec92]/10 to-[#0ea5e9]/10 border border-[#13ec92]/20 relative group overflow-hidden">
                      <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="relative z-10">
                        <div className="text-[10px] font-black text-[#13ec92] uppercase tracking-[.3em] mb-1">Global Health Index</div>
                        <div className="text-2xl font-headline font-black text-white tracking-tighter">84.2% NOMINAL</div>
                      </div>
                      <div className="relative z-10 w-12 h-12 rounded-full border border-[#13ec92]/40 flex items-center justify-center">
                        <Activity className="w-6 h-6 text-[#13ec92] animate-pulse" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}


          {/* ANALYSIS TAB */}
          {activeTab === 'Analysis' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
              <div className="bg-[#0a2319] rounded-2xl border border-[#13ec92]/10 p-6">
                <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-[#13ec92]" /> Pollutant Comparison</h2>
                <p className="text-slate-400 text-sm mb-6">Current levels vs WHO guidelines for {selectedStation.name} station</p>
                <div className="space-y-4">
                  {[
                    { label: 'PM2.5', current: currentPm25, limit: 15, unit: 'µg/m³' },
                    { label: 'PM10', current: currentPm10, limit: 45, unit: 'µg/m³' },
                    { label: 'O3', current: currentO3, limit: 100, unit: 'µg/m³' },
                    { label: 'NO2', current: currentNo2, limit: 25, unit: 'µg/m³' }
                  ].map((p) => {
                    const pct = Math.min((p.current / p.limit) * 100, 100);
                    const barColor = pct > 80 ? '#ef4444' : pct > 50 ? '#facc15' : '#13ec92';
                    return (
                      <div key={p.label}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-white font-bold">{p.label}</span>
                          <span className="text-slate-400">{p.current.toFixed(1)} / {p.limit} {p.unit}</span>
                        </div>
                        <div className="h-3 bg-[#051c14] rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: barColor }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-[#0a2319] rounded-2xl border border-[#13ec92]/10 p-6">
                <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-[#13ec92]" /> Insights</h2>
                <div className="space-y-4">
                  <div className="bg-[#051c14] rounded-xl p-4 border border-[#13ec92]/10">
                    <div className="text-[#13ec92] text-xs font-bold uppercase mb-2">Air Quality Rating</div>
                    <div className="text-3xl font-black text-white mb-1">{aqiStatus}</div>
                    <p className="text-slate-400 text-sm">European AQI index value: {currentAQI}</p>
                  </div>
                  <div className="bg-[#051c14] rounded-xl p-4 border border-[#13ec92]/10">
                    <div className="text-[#13ec92] text-xs font-bold uppercase mb-2">Key Pollutant</div>
                    <div className="text-lg font-bold text-white mb-1">{currentPm25 > currentNo2 ? 'PM2.5' : 'NO2'} is dominant</div>
                    <p className="text-slate-400 text-sm">Value: {Math.max(currentPm25, currentNo2).toFixed(1)} µg/m³</p>
                  </div>
                  <div className="bg-[#051c14] rounded-xl p-4 border border-[#13ec92]/10">
                    <div className="text-[#13ec92] text-xs font-bold uppercase mb-2">Hotspot Alert</div>
                    <div className="text-lg font-bold text-white mb-1">{displayHotspots[0]?.city || 'N/A'}</div>
                    <p className="text-slate-400 text-sm">Highest AQI: {displayHotspots[0]?.aqi || 0}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* REPORTS TAB */}
          {activeTab === 'Reports' && (
            <div className="animate-fade-in">
              <div className="bg-[#0a2319] rounded-2xl border border-[#13ec92]/10 p-6 mb-6">
                <h2 className="text-white font-bold text-lg mb-2 flex items-center gap-2"><FileText className="w-5 h-5 text-[#13ec92]" /> Latest Reports</h2>
                <p className="text-slate-400 text-sm mb-6">Generated from live API data</p>
                <div className="space-y-3">
                  {[
                    { title: 'European Air Quality Summary', date: new Date().toLocaleDateString(), type: 'PDF' },
                    { title: `Paris Station Report – AQI ${currentAQI}`, date: new Date().toLocaleDateString(), type: 'CSV' },
                    { title: 'Hotspot Analysis – Top 5 Cities', date: new Date().toLocaleDateString(), type: 'PDF' },
                    { title: 'PM2.5 / PM10 Trend Report (24h)', date: new Date().toLocaleDateString(), type: 'CSV' }
                  ].map((r, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-[#051c14] rounded-xl border border-[#13ec92]/10 hover:border-[#13ec92]/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#13ec92]/10 rounded-lg"><FileText className="w-4 h-4 text-[#13ec92]" /></div>
                        <div>
                          <div className="text-sm font-bold text-white">{r.title}</div>
                          <div className="text-[10px] text-slate-400">{r.date} • {r.type}</div>
                        </div>
                      </div>
                      <button className="text-[#13ec92] hover:text-white text-xs font-bold flex items-center gap-1 transition-colors">
                        <Download className="w-3 h-3" /> Download
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* FOOTER */}
          <CopernicusFooter />
        </main>
      </div>
    </div>
  );
}

// Merged into OceanSpatialDashboard


function CopernicusFooter() {
  const [time, setTime] = useState(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok' }));

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok' }));
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <footer className="mt-8 pt-8 pb-8 border-t border-[#13ec92]/10 flex flex-col md:flex-row justify-between items-center gap-8 text-xs font-medium">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 text-left">
          <div className="size-8 rounded-lg bg-[#13ec92]/10 flex items-center justify-center border border-[#13ec92]/20 shadow-[0_0_15px_rgba(19,236,146,0.1)]">
            <span className="material-symbols-outlined text-[#13ec92] text-lg">waves</span>
          </div>
          <div>
            <div className="text-white font-black tracking-tighter">COPERNICUS MODULE</div>
            <div className="text-[#13ec92]/50 text-[10px] uppercase tracking-widest font-black">Open Research Hub</div>
          </div>
        </div>
        <p className="text-slate-500 max-w-xs leading-relaxed text-left">
          The Copernicus module provides global-scale environmental data analysis for climate monitoring and scientific research.
        </p>
      </div>

      <div className="flex flex-col items-center md:items-end gap-6 md:text-right">
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-[#13ec92]/40 uppercase tracking-[0.2em] text-[10px] font-black mb-1">Node Status</span>
            <div className="flex items-center gap-2 text-[#13ec92] font-black uppercase text-[11px]">
              <span className="size-1.5 rounded-full bg-[#13ec92] animate-pulse"></span>
              Secure System
            </div>
          </div>
          <div className="w-px h-8 bg-[#13ec92]/10"></div>
          <div className="flex flex-col items-end">
            <span className="text-[#13ec92]/40 uppercase tracking-[0.2em] text-[10px] font-black mb-1">Local Time</span>
            <div className="text-white font-black text-xs">{time} <span className="text-[#13ec92]/50 ml-1">GMT+7</span></div>
          </div>
        </div>

        <div className="flex items-center gap-8 text-slate-500 uppercase tracking-widest font-black text-[9px]">
          <span className="hover:text-[#13ec92] cursor-default transition-colors">v4.2.0-STABLE</span>
          <div className="flex items-center gap-2">
            <span className="text-[#13ec92] font-black uppercase">By</span>
            <span className="text-white font-bold">Tichakorn R.</span>
          </div>
          <span className="hover:text-[#13ec92] cursor-default transition-colors">© {new Date().getFullYear()} TMD</span>
        </div>
      </div>
    </footer>
  );
}

export default App
