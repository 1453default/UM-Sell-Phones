import json
import glob
import os
import re
import sys
sys.stdout.reconfigure(encoding='utf-8')

# Read input file
with open('reference/source-catalog/UM_2/all_mobile_phones_by_brand.txt', encoding='utf-8') as f:
    lines = [l.strip() for l in f]

brand_models_input = {}
cur_brand = None
for l in lines:
    if not l:
        continue
    m = re.match(r'=== (.+) \(\d+ Models\) ===', l)
    if m:
        cur_brand = m.group(1).strip()
        brand_models_input[cur_brand] = []
    else:
        brand_models_input[cur_brand].append(l)

print(f"Loaded {len(brand_models_input)} brands from input file.")

# Check against dofy_cache/brands
# Map input brand display name to file slug
brand_map = {
    'APPLE': 'apple',
    'ASUS': 'asus',
    'CMF': 'cmf',
    'GOOGLE PIXEL': 'google-pixel',
    'HONOR': 'honor',
    'HUAWEI': 'huawei',
    'INFINIX': 'infinix',
    'IQOO': 'iqoo',
    'LAVA': 'lava',
    'LG': 'lg',
    'MOTOROLA': 'motorola',
    'NOKIA': 'nokia',
    'NOTHING': 'nothing',
    'NUBIA': 'nubia',
    'ONEPLUS': 'oneplus',
    'OPPO': 'oppo',
    'POCO': 'poco',
    'REALME': 'realme',
    'SAMSUNG': 'samsung',
    'TECNO': 'tecno',
    'VIVO': 'vivo',
    'XIAOMI': 'xiaomi',
}

exact_matches = 0
case_matches = 0
unmatched = []

for b_disp, in_models in brand_models_input.items():
    slug = brand_map[b_disp]
    dofy_file = f'reference/source-catalog/dofy_cache/brands/{slug}.json'
    dofy_list = json.load(open(dofy_file, encoding='utf-8'))
    dofy_names = {m['Name']: m for m in dofy_list}
    dofy_names_lower = {m['Name'].lower(): m for m in dofy_list}
    dofy_disp_lower = {m['DisplayName'].lower(): m for m in dofy_list}
    
    for im in in_models:
        if im in dofy_names:
            exact_matches += 1
        elif im.lower() in dofy_names_lower:
            case_matches += 1
        elif im.lower() in dofy_disp_lower:
            case_matches += 1
        else:
            unmatched.append((b_disp, im))

print(f"Exact name matches: {exact_matches}")
print(f"Case-insensitive matches: {case_matches}")
print(f"Unmatched count: {len(unmatched)}")
if unmatched:
    print("Sample unmatched:", unmatched[:10])
