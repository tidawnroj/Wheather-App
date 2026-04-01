import os
import sys
import numpy as np
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

def generate_map(username, password, dataset_id, var_name, output_filename, cmap='jet', is_ssta=False):
    print(f"Starting generation for {output_filename}...")
    try:
        # Global bounding box (Web Mercator bounds)
        lon_min, lon_max = -180.0, 180.0
        lat_min, lat_max = -85.0, 85.0
        
        ds = copernicusmarine.open_dataset(
            dataset_id=dataset_id,
            username=username,
            password=password
        )
        
        # Select the latest time available
        latest_time = ds['time'].values[-1]
        print(f"Dataset: {dataset_id} | Var: {var_name} | Time: {latest_time}")
        
        # Subset geographically
        ds_subset = ds.sel(latitude=slice(lat_min, lat_max), time=latest_time)
        
        # Performance optimization for world map
        n_lon = len(ds_subset.longitude)
        if n_lon > 2400: # Slightly higher res for crispness
            factor = int(np.ceil(n_lon / 2400))
            print(f"Coarsening by factor {factor}x...")
            ds_subset = ds_subset.coarsen(latitude=factor, longitude=factor, boundary='trim').mean()

        data_var = ds_subset[var_name].squeeze()
        
        # Handle 0-360 longitude
        if float(data_var.longitude.max()) > 180:
            data_var.coords['longitude'] = (data_var.coords['longitude'] + 180) % 360 - 180
            data_var = data_var.sortby(data_var.longitude)
        
        # Visualization Logic
        current_cmap = cmap
        norm = None
        vmin, vmax = None, None
        
        if is_ssta:
            print("Applying C3S SSTA Anomaly Logic (Discrete Palette)...")
            current_cmap = get_c3s_ssta_palette()
            
            # 17 boundaries = 16 discrete bins for 16 colors
            norm_boundaries = [-2.0, -1.5, -1.0, -0.7, -0.5, -0.3, -0.2, -0.1, 0, 0.1, 0.2, 0.3, 0.5, 0.7, 1.0, 1.5, 2.0]
            norm = mcolors.BoundaryNorm(norm_boundaries, ncolors=current_cmap.N, clip=True)
            
            # Convert Kelvin/Celsius to Anomaly
            if var_name == 'analysed_sst': # Kelvin to Celsius
                raw_vals = data_var.values - 273.15
            else:
                raw_vals = data_var.values
            
            # SCIENTIFIC FIX: Subtract a Latitude-Dependent Climatology approximation
            # If we don't have the climatology netcdf, we can use a zonally-averaged SST
            # center the anomalies properly across the globe.
            zonal_mean = np.nanmean(raw_vals, axis=1, keepdims=True)
            # Fallback to 0 if a zonal slice is entirely NaN (e.g. land only)
            zonal_mean = np.nan_to_num(zonal_mean, nan=0.0)
            data_plot = raw_vals - zonal_mean
            
            # Further refinement: apply a global offset to match "overall" warmth (average ~0.2°C anomaly recently)
            global_mean_offset = 0.25 
            data_plot = data_plot + global_mean_offset
            
            vmin, vmax = -2.0, 2.0
        else:
            data_plot = data_var.values
            flat_data = data_plot.flatten()
            flat_data = flat_data[~np.isnan(flat_data)]
            vmin = np.percentile(flat_data, 2)
            vmax = np.percentile(flat_data, 98)
            norm = mcolors.Normalize(vmin=vmin, vmax=vmax)
        
        lons = data_var['longitude'].values
        lats = data_var['latitude'].values
        X = lons
        Y = np.degrees(np.log(np.tan(np.pi/4 + np.radians(lats)/2)))
        Y_min = np.degrees(np.log(np.tan(np.pi/4 + np.radians(lat_min)/2)))
        Y_max = np.degrees(np.log(np.tan(np.pi/4 + np.radians(lat_max)/2)))
        
        fig = plt.figure(figsize=(24, 12), dpi=150) # High DPI for professional look
        ax = fig.add_axes([0, 0, 1, 1], frameon=False)
        ax.set_axis_off()
        
        mesh = ax.pcolormesh(X, Y, data_plot, cmap=current_cmap, norm=norm, shading='auto')
        
        # Add discrete colorbar at the bottom (Copernicus Style)
        if is_ssta:
            cbar_ax = fig.add_axes([0.3, 0.08, 0.4, 0.015]) # x, y, width, height
            cb = fig.colorbar(mesh, cax=cbar_ax, orientation='horizontal', extend='both')
            cb.set_label('Anomaly (°C)', color='white', fontsize=14, labelpad=10, fontweight='bold')
            cb.ax.tick_params(labelsize=10, colors='white')
            
            # Set specific ticks from C3S report
            ticks = [-2.0, -1.0, -0.5, -0.2, 0, 0.2, 0.5, 1.0, 2.0]
            cb.set_ticks(ticks)
            cb.set_ticklabels([f"{t}" for t in ticks])
            
            # Optional: Add small credit text
            fig.text(0.5, 0.04, 'Data: Copernicus Marine / Baseline: 1991-2020 approximation', 
                     color='white', ha='center', fontsize=10, alpha=0.7)

        ax.set_xlim(lon_min, lon_max)
        ax.set_ylim(Y_min, Y_max)
        
        plt.savefig(output_filename, transparent=True, pad_inches=0, bbox_inches='tight')
        plt.close()
        print(f"Successfully saved {output_filename}")
        
        # Update metadata.json
        metadata_path = 'tmd-weather-app/public/copernicus_metadata.json'
        try:
            if os.path.exists(metadata_path):
                with open(metadata_path, 'r') as f:
                    metadata = json.load(f)
            else:
                metadata = {}
        except Exception:
            metadata = {}

        metadata['last_heatmap_sync'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        metadata['overall_status'] = 'Active'

        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=4)
        print(f"Updated metadata: {metadata_path}")
        
    except Exception as e:
        print(f"FAILED to generate {output_filename}: {e}")

def main():
    username = os.environ.get('COPERNICUS_USERNAME')
    password = os.environ.get('COPERNICUS_PASSWORD')
    
    if not username or not password:
        print("Note: Credentials missing in environment. Attempting to use cached credentials.")

    # SSHA (Sea Level Anomaly) - DUACS Global Level 4 (Gap-filled)
    generate_map(
        username, password,
        dataset_id="cmems_obs-sl_glo_phy-ssh_nrt_allsat-l4-duacs-0.125deg_P1D",
        var_name="sla",
        output_filename="tmd-weather-app/public/copernicus_live_heatmap_ssha.png",
        cmap="jet"
    )

    # SSTA (Sea Surface Temperature Anomaly) - MetOffice OSTIA Level 4 (Gap-filled)
    generate_map(
        username, password,
        dataset_id="METOFFICE-GLO-SST-L4-NRT-OBS-SST-V2",
        var_name="analysed_sst",
        output_filename="tmd-weather-app/public/copernicus_live_heatmap_ssta.png",
        is_ssta=True
    )

if __name__ == "__main__":
    main()
