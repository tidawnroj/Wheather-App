import re

with open('/Users/tommy/Dawn\'s/Wheather App/tmd-weather-app/src/App.jsx', 'r') as f:
    content = f.read()

# Find the start of MarineDashboard return
start_idx = content.find('  return (\n    <div className="min-h-screen hero-gradient font-body text-on-background selection:bg-primary/30 antialiased overflow-x-hidden pb-24">')

if start_idx == -1:
    print("Could not find start index")
    exit(1)

# Find the end of MarineDashboard return
# We know CreditsView starts right after MarineDashboard
end_idx = content.find('function CreditsView() {', start_idx)

if end_idx == -1:
    print("Could not find end index")
    exit(1)

# The end of the return is just before CreditsView, specifically the `  );\n}\n\n`
target_end_str = '  );\n}\n\n'
actual_end_idx = content.rfind(target_end_str, start_idx, end_idx) + len(target_end_str)

new_return = """  return (
    <div className="min-h-screen bg-[#020808] text-slate-100 font-body relative overflow-x-hidden selection:bg-[#13ec92]/30 selection:text-[#13ec92]">
      
      {/* Animated Background Blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-[#13ec92]/5 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-[-5%] left-[5%] w-[400px] h-[400px] bg-[#0ea5e9]/5 rounded-full blur-[100px] pointer-events-none animate-pulse" style={{ animationDelay: '2s' }}></div>

      {/* CAMS Style Observatory Header */}
      <header className="sticky top-0 z-[100] bg-[#020808]/80 backdrop-blur-2xl border-b border-white/5 px-4 md:px-8 py-4 md:py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xl">
        <div className="flex items-center gap-6">
          <Link to="/copernicus" className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="h-6 w-px bg-white/10 hidden md:block"></div>
          <div>
            <h1 className="text-xl font-headline font-black tracking-tight flex items-center gap-3">
              MARINE
              <span className="px-2 py-0.5 rounded-md bg-[#13ec92]/10 border border-[#13ec92]/20 text-[#13ec92] text-[10px] uppercase tracking-widest">OBSERVATORY</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="glass-panel px-4 py-2 rounded-xl beveled-edge flex items-center gap-3 bg-white/5 border-white/5">
            <div className="flex flex-col text-right">
              <span className="text-[8px] font-black text-[#13ec92] uppercase tracking-[0.2em] leading-none mb-1">Global Sync</span>
              <span className="text-xs font-headline font-bold text-white uppercase tracking-wider leading-none">
                {lastSync ? `NODAL_${lastSync.split(' ')[0].replace(/-/g, '_')}` : 'ESTABLISHING...'}
              </span>
            </div>
            <div className="size-8 rounded-lg bg-[#13ec92]/10 flex items-center justify-center border border-[#13ec92]/20">
              <Activity className="w-4 h-4 text-[#13ec92] animate-pulse" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1920px] mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-6 relative z-10 pt-6 min-h-[calc(100vh-80px)]">
        
        {/* Main 3-Column Grid matching CAMS */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
          
          {/* LEFT HUD: Controls and Data Ingestion */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            
            {/* Control Panel */}
            <div className="glass-panel p-6 beveled-edge flex-1 flex flex-col relative overflow-hidden group">
              <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="size-8 rounded-lg bg-[#13ec92]/10 flex items-center justify-center border border-[#13ec92]/20">
                  <ShieldAlert className="w-4 h-4 text-[#13ec92]" />
                </div>
                <div>
                  <h3 className="font-headline font-black text-sm tracking-widest uppercase text-white">Algorithmic Engine</h3>
                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em]">SCSI Protocol V4.2</p>
                </div>
              </div>

              <div className="space-y-4 relative z-10 flex-1">
                <div className="space-y-2">
                  <span className="text-[9px] font-black text-[#13ec92]/60 uppercase tracking-widest">Ingestion Year</span>
                  <select value={scsiYear} onChange={e => setScsiYear(e.target.value)} className="w-full bg-white/5 text-white border border-white/10 rounded-xl px-4 py-3 font-headline font-bold text-sm hover:border-[#13ec92]/40 focus:border-[#13ec92] transition-all outline-none appearance-none cursor-pointer">
                    {years.map(y => <option key={y} value={y} className="bg-[#020808]">{y}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <span className="text-[9px] font-black text-[#13ec92]/60 uppercase tracking-widest">Ingestion Month</span>
                  <select value={scsiMonth} onChange={e => setScsiMonth(e.target.value)} className="w-full bg-white/5 text-white border border-white/10 rounded-xl px-4 py-3 font-headline font-bold text-sm hover:border-[#13ec92]/40 focus:border-[#13ec92] transition-all outline-none appearance-none cursor-pointer">
                    {months.map(m => <option key={m} value={m} className="bg-[#020808]">{m}</option>)}
                  </select>
                </div>
                
                <button onClick={handleCalculateSCSI} disabled={scsiLoading} className="w-full mt-4 h-14 bg-[#13ec92] text-black font-black rounded-xl uppercase tracking-[0.2em] text-[10px] hover:shadow-[0_0_30px_rgba(19,236,146,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                  {scsiLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldAlert className="w-5 h-5" />}
                  {scsiLoading ? 'COMPUTING...' : 'INITIATE ANALYSIS'}
                </button>
              </div>
            </div>

            {/* Data Downloader */}
            <div className="glass-panel p-6 beveled-edge flex flex-col relative overflow-hidden group">
              <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="size-8 rounded-lg bg-cyan-400/10 flex items-center justify-center border border-cyan-400/20">
                  <Database className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-headline font-black text-sm tracking-widest uppercase text-white">Grid Downloader</h3>
                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em]">Raw CSV Extraction</p>
                </div>
              </div>

              <div className="space-y-4 relative z-10">
                <div className="grid grid-cols-2 gap-2">
                  <select value={dlYear} onChange={e => setDlYear(e.target.value)} className="w-full bg-white/5 text-white border border-white/10 rounded-xl px-3 py-2 font-headline font-bold text-xs hover:border-cyan-400/40 outline-none appearance-none cursor-pointer">
                    {years.map(y => <option key={y} value={y} className="bg-[#020808]">{y}</option>)}
                  </select>
                  <select value={dlMonth} onChange={e => setDlMonth(e.target.value)} className="w-full bg-white/5 text-white border border-white/10 rounded-xl px-3 py-2 font-headline font-bold text-xs hover:border-cyan-400/40 outline-none appearance-none cursor-pointer">
                    {months.map(m => <option key={m} value={m} className="bg-[#020808]">{m}</option>)}
                  </select>
                </div>
                <select value={dlArea} onChange={e => setDlArea(e.target.value)} className="w-full bg-white/5 text-white border border-white/10 rounded-xl px-4 py-3 font-headline font-bold text-xs hover:border-cyan-400/40 outline-none appearance-none cursor-pointer">
                  <option value="A" className="bg-[#020808]">Area A — SCS</option>
                  <option value="B" className="bg-[#020808]">Area B — Indian Ocean</option>
                </select>
                
                <button onClick={handleDownloadGrid} disabled={dlLoading} className="w-full h-12 bg-cyan-400 text-black font-black rounded-xl uppercase tracking-widest text-[10px] hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                  {dlLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                  {dlLoading ? 'PROCESSING' : 'QUERY'}
                </button>

                {dlError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-[10px] font-bold mt-2">
                    {dlError}
                  </div>
                )}
                {dlData && !dlLoading && (
                  <button onClick={handleDownloadCSVFile} className="w-full mt-2 py-2 bg-white/5 text-white border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white/10 transition-colors">
                    Export Grid to CSV
                  </button>
                )}
              </div>
            </div>

          </div>

          {/* CENTER MAP HUD: Spatial Distribution */}
          <div className="lg:col-span-6 glass-panel beveled-edge relative rounded-[2rem] overflow-hidden group flex flex-col h-[60vh] lg:h-auto border border-white/10">
            {/* Scanner Line Effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#13ec92]/5 to-transparent h-[10%] opacity-50 animate-scan pointer-events-none z-10"></div>
            
            <div className="absolute top-6 left-6 z-[1100] flex flex-col gap-2">
              <button 
                onClick={() => setOverlayType('SSHA')}
                className={`px-4 py-2 rounded-lg font-black text-xs uppercase tracking-widest transition-all backdrop-blur-md border ${
                  overlayType === 'SSHA' 
                    ? 'bg-[#13ec92] text-[#020808] border-[#13ec92] shadow-[0_0_20px_rgba(19,236,146,0.4)]' 
                    : 'bg-[#020808]/60 text-white/70 border-white/10 hover:border-white/30 hover:bg-[#020808]/80'
                }`}
              >
                SSHA
              </button>
              <button 
                onClick={() => setOverlayType('SSTA')}
                className={`px-4 py-2 rounded-lg font-black text-xs uppercase tracking-widest transition-all backdrop-blur-md border ${
                  overlayType === 'SSTA' 
                    ? 'bg-[#13ec92] text-[#020808] border-[#13ec92] shadow-[0_0_20px_rgba(19,236,146,0.4)]' 
                    : 'bg-[#020808]/60 text-white/70 border-white/10 hover:border-white/30 hover:bg-[#020808]/80'
                }`}
              >
                SSTA
              </button>
            </div>

            <EarthHeatmapView
              overlayType={overlayType}
              setOverlayType={setOverlayType}
              activeArea={activeArea}
              setActiveArea={setActiveArea}
              isNested={true}
            />
          </div>

          {/* RIGHT HUD: Analytics & Telemetry */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            
            {/* Temporal Analytics Chart */}
            <div className="glass-panel p-6 beveled-edge flex flex-col relative overflow-hidden group border border-white/10 h-[400px]">
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

            {/* SCSI Telemetry Results */}
            <div className="glass-panel p-6 beveled-edge flex-1 flex flex-col relative overflow-hidden group bg-black/40 border border-[#13ec92]/10 min-h-[300px]">
              <div className="flex items-center gap-3 mb-4 relative z-10">
                <div className="size-8 rounded-lg bg-[#13ec92]/10 flex items-center justify-center border border-[#13ec92]/20">
                  <Activity className="w-4 h-4 text-[#13ec92]" />
                </div>
                <div>
                  <h3 className="font-headline font-black text-sm tracking-widest uppercase text-white">Telemetry Output</h3>
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-center relative z-10">
                {!scsiStats && !scsiLoading ? (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                    <Terminal className="w-8 h-8 text-[#13ec92] mb-3 opacity-50" />
                    <p className="text-[10px] text-white font-black uppercase tracking-widest">Awaiting Command</p>
                  </div>
                ) : scsiLoading ? (
                  <div className="h-full flex flex-col items-center justify-center">
                    <Loader2 className="w-8 h-8 text-[#13ec92] animate-spin mb-3" />
                    <p className="text-[9px] text-[#13ec92] font-black uppercase tracking-[0.3em] animate-pulse">Computing Matrix...</p>
                  </div>
                ) : scsiStats ? (
                  <div className="animate-fade-in flex flex-col justify-center h-full space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                       <div className="bg-white/5 border border-white/5 rounded-xl p-3">
                         <span className="text-[8px] font-black text-[#13ec92]/50 uppercase tracking-widest block font-mono">μ_ALPHA</span>
                         <span className="text-white font-headline font-black">{scsiStats.XA.toFixed(4)}</span>
                       </div>
                       <div className="bg-white/5 border border-white/5 rounded-xl p-3">
                         <span className="text-[8px] font-black text-[#13ec92]/50 uppercase tracking-widest block font-mono">μ_BETA</span>
                         <span className="text-white font-headline font-black">{scsiStats.XB.toFixed(4)}</span>
                       </div>
                    </div>
                    
                    <div className="p-4 glass-panel beveled-edge border-[#13ec92]/30 bg-[#13ec92]/5 flex flex-col items-center justify-center relative overflow-hidden group">
                       <div className="absolute inset-0 bg-[#13ec92]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                       <span className="text-[9px] font-black text-[#13ec92] uppercase tracking-[0.4em] mb-2 relative z-10">SCSI OUTPUT</span>
                       <div className={`text-4xl font-headline font-black relative z-10 ${scsiStats.SCSI > 0.5 ? 'text-[#13ec92]' : scsiStats.SCSI < -0.5 ? 'text-red-400' : 'text-cyan-400'} drop-shadow-[0_0_15px_currentColor]`}>
                         {scsiStats.SCSI.toFixed(4)}
                       </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}
"""

with open('/Users/tommy/Dawn\'s/Wheather App/tmd-weather-app/src/App.jsx', 'w') as f:
    f.write(content[:start_idx] + new_return + content[actual_end_idx:])

print("Successfully updated App.jsx")
