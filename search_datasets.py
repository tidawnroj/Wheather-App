import copernicusmarine

catalog = copernicusmarine.read_catalogue()
print(f"Total products: {len(catalog.products)}")

datasets = []
for p in catalog.products:
    title = getattr(p, 'title', '').lower()
    product_id = getattr(p, 'product_id', '')
    for ds in p.datasets:
        ds_id = getattr(ds, 'dataset_id', '').lower()
        if ('sea level anomaly' in title or 'sea surface height' in title or 'ssh' in ds_id or 'sla' in ds_id) and 'my' in ds_id:
            if 'month' in ds_id or 'p1m' in ds_id:
                datasets.append((product_id, ds.dataset_id, title[:50]))

        if ('sea surface temperature' in title or 'sst' in ds_id) and 'anomaly' in title:
            if 'month' in ds_id or 'p1m' in ds_id:
                datasets.append((product_id, ds.dataset_id, title[:50]))

for d in list(set(datasets))[:20]:
    print(d)
