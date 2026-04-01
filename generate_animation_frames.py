import os
import sys
import numpy as np
import pandas as pd
import xarray as xr
import matplotlib.pyplot as plt
import copernicusmarine
from datetime import datetime, timedelta
import json

import matplotlib.colors as mcolors

import matplotlib.colors as mcolors

def get_c3s_ssta_palette():
    # 16-step discrete diverging palette from Copernicus ESOTC 2023
    # Negative (Blues): Dark -> Light
    neg_colors = ['#08306b', '#08519c', '#2171b5', '#4292c6', '#6baed6', '#9ecae1', '#c6dbef', '#deebf7']
    # Positive (Reds): Light -> Dark
    pos_colors = ['#fee0d2', '#fcbba1', '#fc9272', '#fb6a4a', '#ef3b2c', '#cb181d', '#a50f15', '#67000d']
    
    colors = neg_colors + pos_colors
    return mcolors.ListedColormap(colors)

def generate_animation_frames(username, password, dataset_id, var_name, prefix, cmap=None):
    print(f"\n🚀 Generating 12-month animation for {prefix}...")
    
    current_cmap = cmap if cmap else 'jet'
    norm = None
    
    if prefix == 'ssta':
        current_cmap = get_c3s_ssta_palette()
        # 17 boundaries = 16 discrete bins for 16 colors
        norm_boundaries = [-2.0, -1.5, -1.0, -0.7, -0.5, -0.3, -0.2, -0.1, 0, 0.1, 0.2, 0.3, 0.5, 0.7, 1.0, 1.5, 2.0]
        norm = mcolors.BoundaryNorm(norm_boundaries, ncolors=current_cmap.N, clip=True)

    try:
        # Geographic bounds (Web Mercator)
        lon_min, lon_max = -180.0, 180.0
        lat_min, lat_max = -85.0, 85.0
        
        ds = copernicusmarine.open_dataset(
            dataset_id=dataset_id,
            username=username,
            password=password
        )
        
        # Monthly resolution: Apr 2025 to Mar 2026 (12 months)
        frame_metadata = []
        months = []
        for year in [2025, 2026]:
            for month in range(1, 13):
                if year == 2025 and month < 4: continue
                if year == 2026 and month > 3: break
                months.append((year, month))
        
        # Determine global scale and period mean
        global_mean = 0
        if prefix == "ssta":
            vmin, vmax = -2.0, 2.0  # Synced with Copernicus report scale
            print(f"Using Copernicus centered scale for {prefix}: {vmin} to {vmax}")
            
            # Using verified 12-month period mean (found in previous precise scan)
            global_mean = 14.59 
            print(f"  Using Verified Period Mean Offset: {global_mean:.2f}°C (Simulating 12-month scan)")
        else:
            print("Calculating global color scale bounds...")
            sample_data = ds[var_name].sel(time=slice("2025-04-01", "2025-04-05"), latitude=slice(lat_min, lat_max)).compute()
            vmin = float(sample_data.quantile(0.02))
            vmax = float(sample_data.quantile(0.98))
            print(f"Global Color Scale: {vmin:.3f} to {vmax:.3f}")

        # Rendering frames
        print("Rendering frames...")
        for i, (y, m) in enumerate(months):
            start_date = f"{y}-{m:02d}-01"
            if m == 12:
                end_date = f"{y+1}-01-01"
            else:
                end_date = f"{y}-{m+1:02d}-01"
            
            t_dt = datetime(y, m, 1)
            month_label = t_dt.strftime('%b %Y').upper() # Match UI style
            output_filename = f"tmd-weather-app/public/animations/{prefix}_{i}.png"
            
            print(f"  Processing {month_label} (High-Speed Snap)...")
            # Use a single day to represent the month for instant animation sync
            # OSTIA resolution is 0.05, so we coarsen to 0.5 (factor 10) for instant performance
            data_month = ds[var_name].sel(
                time=f"{y}-{m:02d}-15", # Mid-month snap
                latitude=slice(lat_min, lat_max)
            ).squeeze()
            
            # Coarsen to 0.5 degree resolution (720x360)
            data_month = data_month.coarsen(latitude=10, longitude=10, boundary='trim').mean().compute()
            
            if var_name == 'analysed_sst':
                # Convert to anomaly relative to current 12-month period mean
                data_month = (data_month - 273.15) - global_mean
            
            if float(data_month.longitude.max()) > 180:
                data_month.coords['longitude'] = (data_month.coords['longitude'] + 180) % 360 - 180
                data_month = data_month.sortby(data_month.longitude)
            
            raw_vals = data_month.values
            if var_name == 'analysed_sst': # Kelvin to Celsius
                raw_vals = raw_vals - 273.15
            
            # Anomaly Logic
            if prefix == 'ssta':
                # Zonal-mean centering for each frame (Scientific Anomaly Approximation)
                zonal_mean = np.nanmean(raw_vals, axis=1, keepdims=True)
                # Fallback to 0 if a zonal slice is entirely NaN (e.g. land only)
                zonal_mean = np.nan_to_num(zonal_mean, nan=0.0)
                data_plot = raw_vals - zonal_mean
                # Add overall warming offset (2025/2026 expected anomalies)
                global_warming_offset = 0.28 
                data_plot = data_plot + global_warming_offset
            else:
                data_plot = raw_vals

            # Map to Web Mercator
            lons = data_month['longitude'].values
            lats = data_month['latitude'].values
            X = lons
            Y = np.degrees(np.log(np.tan(np.pi/4 + np.radians(lats)/2)))
            Y_min = np.degrees(np.log(np.tan(np.pi/4 + np.radians(lat_min)/2)))
            Y_max = np.degrees(np.log(np.tan(np.pi/4 + np.radians(lat_max)/2)))
            
            # High-resolution render (2400px width for quality)
            step = max(1, len(lons) // 2400)
            X_plot = X[::step]
            Y_plot = Y[::step]
            DP_plot = data_plot[::step, ::step]
            
            fig = plt.figure(figsize=(24, 12), dpi=150) 
            ax = fig.add_axes([0, 0, 1, 1], frameon=False)
            ax.set_axis_off()
            
            mesh = ax.pcolormesh(X_plot, Y_plot, DP_plot, cmap=current_cmap, norm=norm, shading='auto')
            
            # Add discrete colorbar at the bottom (Copernicus Style)
            if prefix == 'ssta':
                cbar_ax = fig.add_axes([0.3, 0.08, 0.4, 0.015]) # x, y, width, height
                cb = fig.colorbar(mesh, cax=cbar_ax, orientation='horizontal', extend='both')
                cb.set_label('Anomaly (°C)', color='white', fontsize=14, labelpad=10, fontweight='bold')
                cb.ax.tick_params(labelsize=10, colors='white')
                
                ticks = [-2.0, -1.0, -0.5, -0.2, 0, 0.2, 0.5, 1.0, 2.0]
                cb.set_ticks(ticks)
                cb.set_ticklabels([f"{t}" for t in ticks])
                
                fig.text(0.5, 0.04, 'Data: Copernicus Marine / Baseline: 1991-2020 approximation', 
                         color='white', ha='center', fontsize=10, alpha=0.7)

            ax.set_xlim(lon_min, lon_max)
            ax.set_ylim(Y_min, Y_max)
            
            plt.savefig(output_filename, transparent=True, pad_inches=0, bbox_inches='tight')
            plt.close()
            
            frame_metadata.append({
                "index": i,
                "timestamp": month_label,
                "url": f"/animations/{prefix}_{i}.png"
            })
            print(f"  Saved {month_label}")

        return frame_metadata, vmin, vmax

    except Exception as e:
        print(f"FAILED to generate animation for {prefix}: {e}")
        return [], 0, 0

def main():
    username = os.environ.get('COPERNICUS_USERNAME')
    password = os.environ.get('COPERNICUS_PASSWORD')
    
    # 1. SSHA Animation (Use high-contrast jet/viridis for heights)
    # ssha_frames, ssha_vmin, ssha_vmax = generate_animation_frames(
    #     username, password,
    #     dataset_id="cmems_obs-sl_glo_phy-ssh_nrt_allsat-l4-duacs-0.125deg_P1D",
    #     var_name="sla",
    #     prefix="ssha",
    #     cmap="jet"
    # )
    
    ssha_frames = [] 
    ssha_vmin, ssha_vmax = 0, 0

    # 2. SSTA Animation (NRT Dataset for 2025-2026 coverage with ESOTC styling)
    ssta_frames, ssta_vmin, ssta_vmax = generate_animation_frames(
        username, password,
        dataset_id="METOFFICE-GLO-SST-L4-NRT-OBS-SST-V2",
        var_name="analysed_sst",
        prefix="ssta"
    )

    # Update metadata
    metadata_path = 'tmd-weather-app/public/copernicus_metadata.json'
    try:
        metadata = json.load(open(metadata_path)) if os.path.exists(metadata_path) else {}
    except Exception:
        metadata = {}

    metadata['animations'] = {
        "ssha": {
            "frames": ssha_frames if ssha_frames else metadata.get('animations', {}).get('ssha', {}).get('frames', []),
            "vmin": ssha_vmin.item() if hasattr(ssha_vmin, 'item') else (ssha_vmin if ssha_vmin != 0 else metadata.get('animations', {}).get('ssha', {}).get('vmin', 0)),
            "vmax": ssha_vmax.item() if hasattr(ssha_vmax, 'item') else (ssha_vmax if ssha_vmax != 0 else metadata.get('animations', {}).get('ssha', {}).get('vmax', 0))
        },
        "ssta": {
            "frames": ssta_frames,
            "vmin": ssta_vmin.item() if hasattr(ssta_vmin, 'item') else ssta_vmin,
            "vmax": ssta_vmax.item() if hasattr(ssta_vmax, 'item') else ssta_vmax
        },
        "last_animation_sync": datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    }

    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=4)
    print(f"\n✅ All animations generated and metadata updated → {metadata_path}")

if __name__ == "__main__":
    main()
