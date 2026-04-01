import copernicusmarine

df = copernicusmarine.read_dataframe()
# Filter for Global ('glo'), Multi-Year ('my'), Monthly ('P1M')
my_glo = df[(df['dataset_id'].str.contains('glo')) & 
            (df['dataset_id'].str.contains('my')) & 
            (df['dataset_id'].str.contains('P1M', case=False))]

print("SSH Datasets:")
print(my_glo[my_glo['dataset_id'].str.contains('ssh|sl')]['dataset_id'].tolist())

print("\nSST Datasets:")
print(my_glo[my_glo['dataset_id'].str.contains('sst|temp')]['dataset_id'].tolist())
