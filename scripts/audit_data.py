import glob
import json
import os
import re
import sys
sys.stdout.reconfigure(encoding='utf-8')

CACHE_DIR = 'reference/source-catalog/dofy_cache/models'

# Load input file to verify exact mapping and order
with open('reference/source-catalog/UM_2/all_mobile_phones_by_brand.txt', encoding='utf-8') as f:
    input_lines = [l.strip() for l in f if l.strip()]

brand_map = {
    'APPLE': 'apple', 'ASUS': 'asus', 'CMF': 'cmf', 'GOOGLE PIXEL': 'google-pixel',
    'HONOR': 'honor', 'HUAWEI': 'huawei', 'INFINIX': 'infinix', 'IQOO': 'iqoo',
    'LAVA': 'lava', 'LG': 'lg', 'MOTOROLA': 'motorola', 'NOKIA': 'nokia',
    'NOTHING': 'nothing', 'NUBIA': 'nubia', 'ONEPLUS': 'oneplus', 'OPPO': 'oppo',
    'POCO': 'poco', 'REALME': 'realme', 'SAMSUNG': 'samsung', 'TECNO': 'tecno',
    'VIVO': 'vivo', 'XIAOMI': 'xiaomi',
}

cur_brand = None
models_ordered = []
for l in input_lines:
    m = re.match(r'=== (.+) \(\d+ Models\) ===', l)
    if m:
        cur_brand = m.group(1).strip()
    else:
        models_ordered.append((cur_brand, l))

print(f"Total models in input file: {len(models_ordered)}")

# Build lookup from dofy_cache/brands
brand_cache_models = {}
for b_disp, b_slug in brand_map.items():
    b_models = json.load(open(f'reference/source-catalog/dofy_cache/brands/{b_slug}.json', encoding='utf-8'))
    # Key by normalized model name
    m_dict = {}
    for bm in b_models:
        norm_k = ' '.join(bm['Name'].split()).lower()
        m_dict[norm_k] = bm
    brand_cache_models[b_disp] = m_dict

total_researched = 0
found_on_dofy = 0
not_found_on_dofy = 0
total_variant_entries = 0
models_with_multiple_variants = 0
models_with_single_variant = 0
models_with_zero_variants = 0

sample_zero_variants = []
sample_multi_variants = []

for b_disp, model_name in models_ordered:
    total_researched += 1
    norm_k = ' '.join(model_name.split()).lower()
    b_slug = brand_map[b_disp]
    
    bm = brand_cache_models[b_disp].get(norm_k)
    if not bm:
        not_found_on_dofy += 1
        continue
    
    enum_name = bm['EnumName']
    model_slug = enum_name.replace('_', '-').replace(' ', '-').lower()
    model_file = os.path.join(CACHE_DIR, b_slug, f"{model_slug}.json")
    
    if not os.path.exists(model_file):
        not_found_on_dofy += 1
        continue
        
    data = json.load(open(model_file, encoding='utf-8'))
    if data.get('not_found'):
        not_found_on_dofy += 1
        continue
        
    variants = data.get('pageProps', {}).get('selectVariant', [])
    
    # Filter valid variants: ignore "No Variant" or empty maximumValue if any
    real_variants = [v for v in variants if v.get('Name') and v.get('Name').lower() != 'no variant' and v.get('MaximumValue') is not None]
    
    if len(real_variants) == 0:
        models_with_zero_variants += 1
        # If Dofy has no variants / price, mark as not found or zero variant
        sample_zero_variants.append((b_disp, model_name, model_slug))
    elif len(real_variants) == 1:
        found_on_dofy += 1
        models_with_single_variant += 1
        total_variant_entries += 1
    else:
        found_on_dofy += 1
        models_with_multiple_variants += 1
        total_variant_entries += len(real_variants)
        if len(sample_multi_variants) < 5:
            sample_multi_variants.append((b_disp, model_name, [v['Name'] for v in real_variants]))

print(f"Audit Summary:")
print(f"Total Models in Input: {len(models_ordered)}")
print(f"Total Researched: {total_researched}")
print(f"Models with Active Priced Variants: {found_on_dofy}")
print(f"Models with 0 Variants (No pricing on Dofy): {models_with_zero_variants}")
print(f"Total Found on Dofy (has listing): {found_on_dofy + models_with_zero_variants}")
print(f"Total Not Found on Dofy (no listing): {not_found_on_dofy}")
print(f"Total Variant Entries: {total_variant_entries}")
print(f"Models with Multiple Variants: {models_with_multiple_variants}")
print(f"Models with Single Configuration: {models_with_single_variant}")
print(f"\nSample models with 0 variants (count {len(sample_zero_variants)}):")
for s in sample_zero_variants[:10]:
    print("  ", s)
print(f"\nSample models with multiple variants:")
for s in sample_multi_variants:
    print("  ", s)
