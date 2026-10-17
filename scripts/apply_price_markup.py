import json
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

target_file = 'src/data/dofyPriceCatalog.generated.json'

with open(target_file, 'r', encoding='utf-8') as f:
    data = json.load(f)

records = data['records']
total_records = len(records)
print(f"Total records loaded: {total_records}")

stats = {
    'tier1_within_10k': 0,      # <= 10000: +500
    'tier2_between_10k_30k': 0, # > 10000 and <= 30000: +1000
    'tier3_above_30k': 0,       # > 30000: +2000
}

sample_changes = []

for idx, r in enumerate(records):
    old_price = r['upto_price']
    
    if old_price is None:
        continue
        
    if old_price <= 10000:
        increase = 500
        stats['tier1_within_10k'] += 1
    elif old_price <= 30000:
        increase = 1000
        stats['tier2_between_10k_30k'] += 1
    else:
        increase = 2000
        stats['tier3_above_30k'] += 1
        
    new_price = old_price + increase
    r['upto_price'] = new_price
    r['upto_price_formatted'] = f"₹{new_price:,}"
    
    if idx < 10 or idx in [500, 1000, 1500, 2000, 2500]:
        sample_changes.append({
            'model': r['full_model_name'],
            'variant': r['variant'],
            'old_price': old_price,
            'increase': increase,
            'new_price': new_price,
            'formatted': r['upto_price_formatted']
        })

# Write back with nice formatting
with open(target_file, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=1, ensure_ascii=False)

print(f"Successfully updated {target_file}")
print("Adjustment Statistics:")
print(f"  Tier 1 (Within ₹10,000 -> +₹500): {stats['tier1_within_10k']}")
print(f"  Tier 2 (Between ₹10,000 & ₹30,000 -> +₹1,000): {stats['tier2_between_10k_30k']}")
print(f"  Tier 3 (Above ₹30,000 -> +₹2,000): {stats['tier3_above_30k']}")
print(f"  Total Adjusted Records: {sum(stats.values())}")

print("\nSample Changes:")
for sc in sample_changes:
    print(f"  {sc['model']} ({sc['variant']}): ₹{sc['old_price']:,} + ₹{sc['increase']} -> {sc['formatted']}")
