import copernicusmarine

print("Connecting to SST...")
try:
    ds_sst = copernicusmarine.open_dataset(
        dataset_id="cmems_obs-sst_glo_phy_my_l4_P1M-m"
    )
    print("SST Variables:", list(ds_sst.variables.keys()))
except Exception as e:
    print(e)
    
print("Connecting to SSH...")
try:
    ds_ssh = copernicusmarine.open_dataset(
        dataset_id="cmems_obs-sl_glo_phy-ssh_my_allsat-l4-duacs-0.25deg_P1M-m"
    )
    print("SSH Variables:", list(ds_ssh.variables.keys()))
except Exception as e:
    print(e)
