import os
import numpy as np
import pandas as pd
import xarray as xr
import copernicusmarine
from datetime import datetime
import json
import gspread
from oauth2client.service_account import ServiceAccountCredentials

# ── Coordinates ──────────────────────────────────────────────────────────────
# Area A: South China Sea  115°–120.25°E | 15°–20°N
AREA_A = {'lon_min': 115.0, 'lon_max': 120.25, 'lat_min': 15.0, 'lat_max': 20.0}

# Area B: Indian Ocean     49°–105°E | 5°–14°N
AREA_B = {'lon_min': 49.0,  'lon_max': 105.0,  'lat_min': 5.0,  'lat_max': 14.0}

# ── Google Sheets Config ──────────────────────────────────────────────────────
CREDENTIALS_FILE = "credentials/credentials.json"
SCSI_SHEET_ID    = "1q6gtAcB10WJ26zfr_6R7MKfCcwx-p8HesliGMOw7UQA"
SUMMARY_TAB_NAME = "SCSI_SUMMARY"
# ─────────────────────────────────────────────────────────────────────────────


def compute_spatial_stats(ds, var_name, area):
    """
    Slice the dataset to the bounding box and compute, per time step:
      - spatial mean  (Xa / Xb)
      - spatial S.D.  (Sa / Sb)   — std dev of all grid cells within the area
      - count of valid grid cells (nA / nB)
    Returns a DataFrame with columns [mean, std, count].
    """
    subset = ds.sel(
        longitude=slice(area['lon_min'], area['lon_max']),
        latitude=slice(area['lat_min'],  area['lat_max'])
    )[var_name]

    # Compute over spatial dims, keeping the time dimension
    spatial_mean  = subset.mean(dim=['latitude', 'longitude'])
    spatial_std   = subset.std( dim=['latitude', 'longitude'], ddof=1)
    spatial_count = subset.count(dim=['latitude', 'longitude'])   # valid (non-NaN) cells

    df_mean  = spatial_mean.compute().to_dataframe(name='mean')
    df_std   = spatial_std.compute().to_dataframe(name='std')
    df_count = spatial_count.compute().to_dataframe(name='count')

    df = pd.concat([df_mean, df_std, df_count], axis=1)
    return df


def authenticate_google_sheets():
    """Authenticate with Google Sheets API and return a gspread client."""
    if not os.path.exists(CREDENTIALS_FILE):
        print(f"Warning: credentials file not found at {CREDENTIALS_FILE}. Skipping Google Sheets.")
        return None

    scopes = [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive"
    ]
    creds  = ServiceAccountCredentials.from_json_keyfile_name(CREDENTIALS_FILE, scopes)
    client = gspread.authorize(creds)
    return client


def push_scsi_summary_to_sheets(client, summary_df):
    """
    Pushes the SCSI summary data (monthly stats) to a dedicated tab 'SCSI_SUMMARY'.
    This tab contains: Date, Xa, Sa, nA, Xb, Sb, nB, Sp, DAB, SCSI
    """
    if client is None or summary_df.empty:
        return

    try:
        spreadsheet = client.open_by_key(SCSI_SHEET_ID)
        print(f"  [GS] Connected to Sheet for SCSI Summary")
        
        # Get or create the Summary tab
        try:
            ws = spreadsheet.worksheet(SUMMARY_TAB_NAME)
        except gspread.exceptions.WorksheetNotFound:
            print(f"  [GS] Creating new tab '{SUMMARY_TAB_NAME}'...")
            ws = spreadsheet.add_worksheet(title=SUMMARY_TAB_NAME, rows="1000", cols="12")
            
        # Prepare data: Header + Rows
        # The summary_df index is 'date' (%Y-%m)
        header = ["Date", "Xa", "Sa", "nA", "Xb", "Sb", "nB", "Sp", "DAB", "SCSI"]
        rows = [header]
        
        # summary_df columns might vary, let's ensure we pull what we need
        for date, row in summary_df.iterrows():
            scsi_val = row.get('SCSI')
            if pd.isna(scsi_val):
                continue
                
            rows.append([
                date,
                round(float(row.get('Xa', 0)), 5),
                round(float(row.get('Sa', 0)), 5),
                int(row.get('nA', 0)) if not pd.isna(row.get('nA')) else 0,
                round(float(row.get('Xb', 0)), 5),
                round(float(row.get('Sb', 0)), 5),
                int(row.get('nB', 0)) if not pd.isna(row.get('nB')) else 0,
                round(float(row.get('Sp', 0)), 0) if not pd.isna(row.get('Sp')) else 0, # Sp is often very large count? No, Sp is pooled sigma.
                round(float(row.get('DAB', 0)), 5),
                round(float(scsi_val), 5)
            ])
            
        # Overwrite the entire tab to keep it clean and sorted
        ws.clear()
        ws.update(values=rows, value_input_option="USER_ENTERED")
        print(f"  [GS] Successfully updated '{SUMMARY_TAB_NAME}' with {len(rows)-1} months.")
        
    except Exception as e:
        print(f"  [GS] SCSI Summary upload failed: {e}")


def push_spatial_grids_to_sheets(client, ds_ssh, area_name, area_bounds):
    """
    Extracts the full spatial grid from the dataset for the given area.
    OPTIMIZATION: Only uploads the LATEST month to save space.
    Removes old monthly grid tabs if they exist.
    """
    if client is None:
        return

    try:
        spreadsheet = client.open_by_key(SCSI_SHEET_ID)
        print(f"  [GS] Managing Grid Tabs for Area {area_name}")
        
        # 1. Get existing worksheets
        worksheets = spreadsheet.worksheets()
        existing_wss_titles = [ws.title for ws in worksheets]

        # 2. Identify the latest time step from dataset
        subset = ds_ssh.sel(
            longitude=slice(area_bounds['lon_min'], area_bounds['lon_max']),
            latitude=slice(area_bounds['lat_min'],  area_bounds['lat_max'])
        )['sla']
        
        times = pd.to_datetime(subset.time.values)
        latest_time_idx = len(times) - 1
        latest_time_val = times[latest_time_idx]
        latest_month_str = latest_time_val.strftime('%Y-%m')
        latest_ws_title = f"{latest_month_str}_Area_{area_name}"
        
        print(f"  [GS] Target latest tab: {latest_ws_title}")

        # 3. Cleanup: Remove OLD monthly grid tabs for this area
        # Keep tabs from 2026 (BE 2569) onwards, and always keep the latest month.
        for ws in worksheets:
            title = ws.title
            if f"_Area_{area_name}" in title and title != latest_ws_title:
                # Extract year from YYYY-MM_Area_X
                try:
                    ws_year = int(title.split('-')[0])
                    if ws_year < 2026:
                        print(f"  [GS] Purging old grid tab: {title} (pre-2026) ...")
                        spreadsheet.del_worksheet(ws)
                        import time
                        time.sleep(1.0) # avoid rate limit
                    else:
                        print(f"  [GS] Preserving historical grid tab (2026+): {title}")
                except (ValueError, IndexError):
                    print(f"  [GS] Skipping unrecognized tab format: {title}")

        # 4. Upload LATEST month grid
        if latest_ws_title in [ws.title for ws in spreadsheet.worksheets()]:
            print(f"  [GS] Tab '{latest_ws_title}' already exists/updated.")
            return

        print(f"  [GS] Uploading fresh grid for {latest_ws_title} (Resolution: 0.25 deg) ...")
        # DOWNSAMPLE: Every 2nd point (0.125 * 2 = 0.25 deg resolution)
        grid_2d = subset.isel(time=latest_time_idx).isel(latitude=slice(None, None, 2), longitude=slice(None, None, 2)).compute()
        lats = grid_2d.latitude.values
        lons = grid_2d.longitude.values
        vals = grid_2d.values
        
        header = [r"Lat \ Lon"] + [f"{lon:.3f}" for lon in lons]
        rows = [header]
        for lat_idx, lat in enumerate(lats):
            row = [f"{lat:.3f}"]
            for lon_idx in range(len(lons)):
                v = vals[lat_idx, lon_idx]
                row.append("" if np.isnan(v) else round(float(v), 5))
            rows.append(row)
            
        ws = spreadsheet.add_worksheet(title=latest_ws_title, rows=len(rows)+10, cols=len(header)+10)
        ws.update(values=rows, value_input_option="USER_ENTERED")
        
    except Exception as e:
        print(f"  [GS] Spatial grid management failed for Area {area_name}: {e}")


def main():
    username = os.environ.get('COPERNICUS_USERNAME')
    password = os.environ.get('COPERNICUS_PASSWORD')

    if not username or not password:
        print("Warning: COPERNICUS_USERNAME / COPERNICUS_PASSWORD not set.")
        print("Relying on ~/.copernicusmarine/.copernicusmarine-credentials if they exist.")

    print("Opening CMEMS OPeNDAP streams (this may take a minute)...")

    # ── 1. SSHA (Sea Surface Height Anomaly) ─────────────────────────────────
    ds_ssh_id_my  = "cmems_obs-sl_glo_phy-ssh_my_allsat-l4-duacs-0.125deg_P1M-m"
    ds_ssh_id_nrt = "cmems_obs-sl_glo_phy-ssh_nrt_allsat-l4-duacs-0.125deg_P1D"
    
    ssha_stats = {}   # will hold {'A': combined_df, 'B': combined_df}
    ds_ssh_combined = None # Reference for latest spatial grid
    
    try:
        print(f"Loading SSH Multi-Year (MY) dataset...")
        ds_my = copernicusmarine.open_dataset(dataset_id=ds_ssh_id_my, username=username, password=password)
        
        print(f"Loading SSH Near Real-Time (NRT) dataset (to bridge gap)...")
        ds_nrt = copernicusmarine.open_dataset(dataset_id=ds_ssh_id_nrt, username=username, password=password)

        for area_name, area_bounds in [('A', AREA_A), ('B', AREA_B)]:
            print(f"\nProcessing Area {area_name} SSH Fusion...")
            # A. Stats from MY (Monthly)
            df_my = compute_spatial_stats(ds_my, 'sla', area_bounds)
            df_my.index = pd.to_datetime(df_my.index)
            
            # B. Stats from NRT (Daily -> Resample to Monthly)
            df_nrt_daily = compute_spatial_stats(ds_nrt, 'sla', area_bounds)
            df_nrt_daily.index = pd.to_datetime(df_nrt_daily.index)
            
            # Resample NRT daily to Monthly Mean
            df_nrt = df_nrt_daily.resample('1MS').agg({
                'mean': 'mean',
                'std': 'mean',
                'count': 'mean' # average valid cells per month
            })
            
            # C. Combine: Use MY for everything it has, fill gap with NRT
            # Prioritize MY for overlap months
            combined = df_my.combine_first(df_nrt)
            ssha_stats[area_name] = combined
            
            print(f"  Area {area_name} Fusion Complete instance count: {len(combined)} months")
            print(f"  Range: {combined.index.min().strftime('%Y-%m')} to {combined.index.max().strftime('%Y-%m')}")

        # For the latest spatial grid tab, we'll need to know which dataset is newer
        latest_my_time = pd.to_datetime(ds_my.time.values[-1])
        latest_nrt_time = pd.to_datetime(ds_nrt.time.values[-1])
        
        if latest_nrt_time > latest_my_time:
            print(f"\nUsing NRT dataset for latest spatial grid extraction ({latest_nrt_time.strftime('%Y-%m-%d')})")
            ds_ssh_combined = ds_nrt
        else:
            print(f"\nUsing MY dataset for latest spatial grid extraction ({latest_my_time.strftime('%Y-%m-%d')})")
            ds_ssh_combined = ds_my

    except Exception as e:
        print(f"Error during SSH fusion: {e}")

    # ── 2. SSTA (Sea Surface Temperature Anomaly) ─────────────────────────────
    ds_sst_id = "cmems_obs-sst_glo_phy_my_l3s_P1D-m"
    ssta_a, ssta_b = pd.DataFrame(), pd.DataFrame()
    try:
        ds_sst = copernicusmarine.open_dataset(
            dataset_id=ds_sst_id,
            username=username,
            password=password
        )
        print(f"  Loaded SST dataset: {ds_sst_id}")
        var_name = 'sea_surface_temperature'
        sst_stats_a = compute_spatial_stats(ds_sst, var_name, AREA_A)
        sst_stats_b = compute_spatial_stats(ds_sst, var_name, AREA_B)

        # For SST in the main CSV we only need the spatial mean for now
        ssta_a = sst_stats_a[['mean']].rename(columns={'mean': 'Area_A_SSTA'})
        ssta_b = sst_stats_b[['mean']].rename(columns={'mean': 'Area_B_SSTA'})
    except Exception as e:
        print(f"Error loading SST dataset: {e}")

    # ── 3. Build the main monthly CSV (spatial means only) ───────────────────
    print("\nMerging into monthly CSV...")

    def monthly_mean_df(stats_df, col_name):
        """Convert the raw time-indexed stats df → monthly-mean indexed df."""
        if stats_df.empty:
            return pd.DataFrame()
        df = stats_df.reset_index()
        df['date'] = pd.to_datetime(df['time']).dt.strftime('%Y-%m')
        df = df.groupby('date').mean(numeric_only=True).reset_index()
        return df.rename(columns={'mean': col_name})[['date', col_name]].set_index('date')

    dfs = []
    # SST means
    for df in [ssta_a, ssta_b]:
        if not df.empty:
            tmp = df.reset_index()
            tmp['date'] = pd.to_datetime(tmp['time']).dt.strftime('%Y-%m')
            tmp = tmp.groupby('date').mean(numeric_only=True).reset_index()
            col = [c for c in tmp.columns if 'SSTA' in c][0]
            dfs.append(tmp[['date', col]].set_index('date'))

    # SSHA means (from spatial stats)
    if 'A' in ssha_stats:
        dfs.append(monthly_mean_df(ssha_stats['A'], 'Area_A_SSHA'))
    if 'B' in ssha_stats:
        dfs.append(monthly_mean_df(ssha_stats['B'], 'Area_B_SSHA'))

    if not dfs:
        print("No data retrieved — aborting.")
        return

    final_df = pd.concat(dfs, axis=1).sort_index()
    final_df = final_df[final_df.index >= '1993-01']

    # ── 4. Build the SCSI stats table (spatially correct) ────────────────────
    scsi_df = pd.DataFrame(index=final_df.index)

    if 'A' in ssha_stats and 'B' in ssha_stats:
        # Aggregate spatial stats to monthly level
        def monthly_stats(raw_df):
            df = raw_df.reset_index()
            df['date'] = pd.to_datetime(df['time']).dt.strftime('%Y-%m')
            # For std: pool spatially within each month (use the per-time-step spatial std directly)
            # For count: sum the valid cells per month
            agg = df.groupby('date').agg(
                mean=('mean', 'mean'),      # avg of monthly spatial means
                std=('std', 'mean'),        # avg of monthly spatial S.D.s
                count=('count', 'mean')     # avg valid cells per month
            )
            return agg

        stats_a = monthly_stats(ssha_stats['A'])
        stats_b = monthly_stats(ssha_stats['B'])

        # Align both on the same date index
        stats_a = stats_a[stats_a.index >= '1993-01']
        stats_b = stats_b[stats_b.index >= '1993-01']

        scsi_df['Xa'] = stats_a['mean']
        scsi_df['Sa'] = stats_a['std']
        scsi_df['nA'] = stats_a['count'].round(0).astype(int)
        scsi_df['Xb'] = stats_b['mean']
        scsi_df['Sb'] = stats_b['std']
        scsi_df['nB'] = stats_b['count'].round(0).astype(int)

        # SCSI formula (per month, using spatial S.D.)
        nA = scsi_df['nA']
        nB = scsi_df['nB']
        Sa = scsi_df['Sa']
        Sb = scsi_df['Sb']

        # Pooled S.D. per month: Sp = sqrt(((nA-1)*SA² + (nB-1)*SB²) / (nA+nB-2))
        Sp2 = ((nA - 1) * Sa**2 + (nB - 1) * Sb**2) / (nA + nB - 2)
        scsi_df['Sp'] = np.sqrt(Sp2)

        # Monthly difference
        scsi_df['DAB'] = scsi_df['Xa'] - scsi_df['Xb']

        # SCSI = (DAB - mean(DAB)) / Sp
        DAB_mean = scsi_df['DAB'].mean()
        scsi_df['SCSI'] = (scsi_df['DAB'] - DAB_mean) / scsi_df['Sp']

        # Merge SCSI column back into main CSV
        final_df['SCSI'] = scsi_df['SCSI']

        print(f"\n  SCSI Stats (spatially correct):")
        print(f"  nA (avg grid cells/month): {scsi_df['nA'].mean():.0f}")
        print(f"  nB (avg grid cells/month): {scsi_df['nB'].mean():.0f}")
        print(f"  Sa (avg spatial S.D. Area A): {scsi_df['Sa'].mean():.5f} m")
        print(f"  Sb (avg spatial S.D. Area B): {scsi_df['Sb'].mean():.5f} m")
        print(f"  Sp (avg pooled S.D.): {scsi_df['Sp'].mean():.5f} m")
        print(f"  DAB_mean: {DAB_mean:.5f} m")
        print(f"  SCSI range: [{final_df['SCSI'].min():.3f}, {final_df['SCSI'].max():.3f}]")

    # ── 5. Save main CSV ──────────────────────────────────────────────────────
    csv_path = 'tmd-weather-app/public/ocean_anomalies_history.csv'
    final_df.to_csv(csv_path)
    print(f"\n  Saved main CSV → {csv_path}")

    # ── 6. Push SCSI Summary and Latest Spatial Grids to Google Sheets ───
    print("\nAuthenticating with Google Sheets...")
    gs_client = authenticate_google_sheets()
    
    if gs_client:
        # A. Upload the full monthly summary table (from 1993 to present)
        if not scsi_df.empty:
            print("\nPushing SCSI Summary table (monthly stats from 1993 onwards)...")
            print(scsi_df.head()) # Diagnostic
            push_scsi_summary_to_sheets(gs_client, scsi_df)

        # B. Upload/Manage Spatial Grids (Latest month only)
        if ds_ssh_combined is not None:
            print("\nManaging Spatial Grids (Keeping latest month, purging old ones)...")
            push_spatial_grids_to_sheets(gs_client, ds_ssh_combined, "A", AREA_A)
            push_spatial_grids_to_sheets(gs_client, ds_ssh_combined, "B", AREA_B)
        
    # ── 7. Update metadata ────────────────────────────────────────────────────
    metadata_path = 'tmd-weather-app/public/copernicus_metadata.json'
    try:
        metadata = json.load(open(metadata_path)) if os.path.exists(metadata_path) else {}
    except Exception:
        metadata = {}

    metadata['last_ocean_sync'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    metadata['overall_status']  = 'Active'
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=4)
    print(f"  Updated metadata → {metadata_path}")
    print(final_df.tail())


if __name__ == "__main__":
    main()
