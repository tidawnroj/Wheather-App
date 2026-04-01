import copernicusmarine

catalog = copernicusmarine.read_catalogue()
print(f"Total products: {len(catalog.products)}")

search_terms = ["ESA", "SST", "CCI"]
results = []

for p in catalog.products:
    title = getattr(p, 'title', '')
    product_id = p.product_id
    if all(term.lower() in title.lower() for term in search_terms):
        for ds in p.datasets:
            results.append((product_id, ds.dataset_id, title))

for r in results:
    print(r)
