import json
import sys
sys.stdout.reconfigure(encoding='utf-8')

data = json.load(open('src/data/dofyPriceCatalog.generated.json', encoding='utf-8'))
records = data['records']

brand_stats = {}
for r in records:
    b = r['brand']
    m = r['full_model_name']
    if b not in brand_stats:
        brand_stats[b] = {'models': set(), 'variants': 0, 'min_price': float('inf'), 'max_price': 0}
    brand_stats[b]['models'].add(m)
    brand_stats[b]['variants'] += 1
    p = r['upto_price']
    if p:
        brand_stats[b]['min_price'] = min(brand_stats[b]['min_price'], p)
        brand_stats[b]['max_price'] = max(brand_stats[b]['max_price'], p)

print("| Brand | Models | Total Variants | Multiple Configs | Single Config | Price Range (Upto) |")
print("| :--- | :---: | :---: | :---: | :---: | :--- |")
for b in sorted(brand_stats.keys()):
    st = brand_stats[b]
    n_models = len(st['models'])
    m_var_count = {}
    for r in records:
        if r['brand'] == b:
            m_var_count[r['full_model_name']] = m_var_count.get(r['full_model_name'], 0) + 1
    multi = sum(1 for c in m_var_count.values() if c > 1)
    single = sum(1 for c in m_var_count.values() if c == 1)
    p_range = f"₹{st['min_price']:,} – ₹{st['max_price']:,}"
    print(f"| **{b}** | {n_models} | {st['variants']} | {multi} | {single} | {p_range} |")
