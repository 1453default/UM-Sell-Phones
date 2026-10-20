import os
import sys
import json
import re

sys.stdout.reconfigure(encoding='utf-8')

CACHE_DIR = 'reference/source-catalog/dofy_cache/models'
INPUT_FILE = 'reference/source-catalog/UM_2/all_mobile_phones_by_brand.txt'

brand_slug_map = {
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

# 1. Parse input file preserving exact brand sections and model names in exact order
with open(INPUT_FILE, encoding='utf-8') as f:
    raw_lines = [l.strip() for l in f if l.strip()]

input_brands = [] # list of (brand_header, brand_key, [models])
cur_brand_header = None
cur_brand_key = None
cur_models = []

for l in raw_lines:
    m = re.match(r'=== (.+) \(\d+ Models\) ===', l)
    if m:
        if cur_brand_header:
            input_brands.append((cur_brand_header, cur_brand_key, cur_models))
        cur_brand_header = l
        cur_brand_key = m.group(1).strip()
        cur_models = []
    else:
        cur_models.append(l)

if cur_brand_header:
    input_brands.append((cur_brand_header, cur_brand_key, cur_models))

total_input_models = sum(len(m) for _, _, m in input_brands)
print(f"Loaded {len(input_brands)} brand sections, total {total_input_models} models.")

# 2. Load Dofy brand caches for model metadata
brand_cache_models = {}
for b_key, b_slug in brand_slug_map.items():
    b_file = f'reference/source-catalog/dofy_cache/brands/{b_slug}.json'
    d_list = json.load(open(b_file, encoding='utf-8'))
    m_dict = {}
    for dm in d_list:
        norm_k = ' '.join(dm['Name'].split()).lower()
        m_dict[norm_k] = dm
    brand_cache_models[b_key] = m_dict

# 3. Helper to parse variant string into (display_str, storage, ram)
def parse_variant(raw_name, brand_key):
    raw = raw_name.strip()
    
    # Check for RAM / Storage pattern
    if '/' in raw:
        parts = [p.strip() for p in raw.split('/')]
        if len(parts) == 2:
            p1, p2 = parts[0], parts[1]
            m1 = re.search(r'(\d+)\s*(GB|TB|MB)', p1, re.I)
            m2 = re.search(r'(\d+)\s*(GB|TB|MB)', p2, re.I)
            if m1 and m2:
                v1, u1 = int(m1.group(1)), m1.group(2).upper()
                v2, u2 = int(m2.group(1)), m2.group(2).upper()
                
                # Check which is RAM and which is Storage
                # On Dofy, the pattern is usually RAM/Storage (e.g. 8 GB/128 GB)
                # But if p1 is TB or p1 > p2 with same units, p1 is Storage
                if u1 == 'TB' and u2 == 'GB':
                    storage = f"{v1} {u1}"
                    ram = f"{v2} {u2}"
                elif v1 > v2 and u1 == u2:
                    storage = f"{v1} {u1}"
                    ram = f"{v2} {u2}"
                else:
                    ram = f"{v1} {u1}"
                    storage = f"{v2} {u2}"
                
                display = f"{storage} / {ram} RAM"
                return display, storage, ram
                
    # Single value (Storage only, typical for Apple or older phones)
    m = re.search(r'(\d+)\s*(GB|TB|MB)', raw, re.I)
    if m:
        storage = f"{m.group(1)} {m.group(2).upper()}"
        return storage, storage, "—"
        
    return raw, raw, "—"

# 4. Process all models
output_a_lines = []
output_b_rows = []
dataset_records = []

stat_total_researched = 0
stat_found = 0
stat_not_found = 0
stat_total_variants = 0
stat_multi_variants = 0
stat_single_variant = 0

for b_header, b_key, models in input_brands:
    b_slug = brand_slug_map[b_key]
    brand_display_name = b_key.title()
    if b_key == 'APPLE':
        brand_display_name = 'Apple'
    elif b_key == 'GOOGLE PIXEL':
        brand_display_name = 'Google Pixel'
    elif b_key == 'IQOO':
        brand_display_name = 'iQOO'
    elif b_key == 'POCO':
        brand_display_name = 'POCO'
    elif b_key == 'CMF':
        brand_display_name = 'CMF'
    elif b_key == 'HONOR':
        brand_display_name = 'Honor'
    elif b_key == 'LG':
        brand_display_name = 'LG'

    for model_name in models:
        stat_total_researched += 1
        norm_k = ' '.join(model_name.split()).lower()
        bm = brand_cache_models[b_key].get(norm_k)
        
        # Check if found on Dofy
        is_found = False
        parsed_variants = []
        dofy_url = ""
        
        if bm:
            enum_name = bm['EnumName']
            model_slug = enum_name.replace('_', '-').replace(' ', '-').lower()
            model_file = os.path.join(CACHE_DIR, b_slug, f"{model_slug}.json")
            dofy_url = f"https://www.dofy.in/in-en/india/sell-old-phone/{b_slug}/{model_slug}"
            
            if os.path.exists(model_file):
                data = json.load(open(model_file, encoding='utf-8'))
                if not data.get('not_found'):
                    raw_variants = data.get('pageProps', {}).get('selectVariant', [])
                    for v in raw_variants:
                        v_name = v.get('Name')
                        v_max = v.get('MaximumValue')
                        if v_name and v_name.lower() != 'no variant' and v_max is not None:
                            disp, st, ram = parse_variant(v_name, b_key)
                            parsed_variants.append({
                                'raw_name': v_name,
                                'display': disp,
                                'storage': st,
                                'ram': ram,
                                'price_num': v_max,
                                'price_formatted': f"₹ {v_max:,}"
                            })
                            
                    if len(parsed_variants) > 0:
                        is_found = True
        
        # Build Output A (Human-readable)
        # Structure:
        # [BRAND] [MODEL EXACT NAME]
        # [VARIANT]
        # [PRICE]
        # ...
        # Source:
        # DOFY.IN
        # [URL]
        # Notes:
        # [Optional note]
        # --------------------------------------------------
        if is_found:
            stat_found += 1
            num_v = len(parsed_variants)
            stat_total_variants += num_v
            if num_v > 1:
                stat_multi_variants += 1
            else:
                stat_single_variant += 1
                
            output_a_lines.append(model_name)
            output_a_lines.append("")
            
            for pv in parsed_variants:
                output_a_lines.append(f"{pv['display']} - Upto")
                output_a_lines.append(pv['price_formatted'])
                output_a_lines.append("")
                
            output_a_lines.append("Source:")
            output_a_lines.append("DOFY.IN")
            output_a_lines.append(dofy_url)
            
            if num_v == 1:
                output_a_lines.append("")
                output_a_lines.append("Notes:")
                output_a_lines.append("Single configuration listed on Dofy.in.")
                
            output_a_lines.append("")
            output_a_lines.append("--------------------------------------------------")
            output_a_lines.append("")
            
            # Build Output B (Structured dataset rows)
            # Brand | Model | Variant | Storage | RAM | Upto Price | Market | Source | Source URL | Notes
            # In the prompt: Brand | Model
            # e.g., Apple | iPhone 17 Pro | 256 GB | 256 GB | — | ₹102,500 | India | Dofy.in | URL | Verified
            for pv in parsed_variants:
                # Strip brand prefix for Model column if present, or keep model name
                # Prompt example: Apple | iPhone 17 Pro
                clean_model = model_name
                if clean_model.lower().startswith(brand_display_name.lower()):
                    clean_model = clean_model[len(brand_display_name):].strip()
                    
                note_str = "Single configuration listed" if num_v == 1 else "Verified"
                
                output_b_rows.append({
                    'Brand': brand_display_name,
                    'Model': clean_model,
                    'FullModelName': model_name,
                    'Variant': pv['display'],
                    'Storage': pv['storage'],
                    'RAM': pv['ram'],
                    'UptoPrice': f"₹{pv['price_num']:,}",
                    'PriceNumeric': pv['price_num'],
                    'Market': 'India',
                    'Source': 'Dofy.in',
                    'SourceURL': dofy_url,
                    'Notes': note_str
                })
                
                dataset_records.append({
                    'brand': brand_display_name,
                    'model': clean_model,
                    'full_model_name': model_name,
                    'variant': pv['display'],
                    'storage': pv['storage'],
                    'ram': pv['ram'],
                    'upto_price': pv['price_num'],
                    'upto_price_formatted': f"₹{pv['price_num']:,}",
                    'market': 'India',
                    'source': 'Dofy.in',
                    'source_url': dofy_url,
                    'notes': note_str
                })
        else:
            stat_not_found += 1
            output_a_lines.append(model_name)
            output_a_lines.append("")
            output_a_lines.append("NOT FOUND ON DOFY.IN")
            output_a_lines.append("")
            output_a_lines.append("Source:")
            output_a_lines.append("No exact Dofy.in listing found.")
            output_a_lines.append("")
            output_a_lines.append("Notes:")
            output_a_lines.append("Exact model could not be verified on Dofy.in.")
            output_a_lines.append("")
            output_a_lines.append("--------------------------------------------------")
            output_a_lines.append("")
            
            clean_model = model_name
            if clean_model.lower().startswith(brand_display_name.lower()):
                clean_model = clean_model[len(brand_display_name):].strip()
                
            output_b_rows.append({
                'Brand': brand_display_name,
                'Model': clean_model,
                'FullModelName': model_name,
                'Variant': 'NOT FOUND',
                'Storage': '—',
                'RAM': '—',
                'UptoPrice': '—',
                'PriceNumeric': None,
                'Market': 'India',
                'Source': 'Dofy.in',
                'SourceURL': '—',
                'Notes': 'No exact listing found'
            })

print(f"Generation Complete!")
print(f"TOTAL MODELS IN INPUT: {total_input_models}")
print(f"TOTAL MODELS RESEARCHED: {stat_total_researched}")
print(f"TOTAL FOUND ON DOFY.IN: {stat_found}")
print(f"TOTAL NOT FOUND: {stat_not_found}")
print(f"TOTAL VARIANT ENTRIES: {stat_total_variants}")
print(f"TOTAL MODELS WITH MULTIPLE VARIANTS: {stat_multi_variants}")
print(f"TOTAL MODELS WITH SINGLE CONFIGURATION: {stat_single_variant}")

# Save Output A
out_a_path = 'reference/source-catalog/DOFY_PRICE_RESEARCH_MASTER.txt'
with open(out_a_path, 'w', encoding='utf-8') as f:
    f.write('\n'.join(output_a_lines))
print(f"Saved Output A to {out_a_path} ({len(output_a_lines)} lines)")

# Save Output B (CSV)
out_b_csv = 'reference/source-catalog/DOFY_PRICE_RESEARCH_DATASET.csv'
import csv
with open(out_b_csv, 'w', encoding='utf-8', newline='') as f:
    writer = csv.writer(f, delimiter='|')
    writer.writerow(['Brand', 'Model', 'Variant', 'Storage', 'RAM', 'Upto Price', 'Market', 'Source', 'Source URL', 'Notes'])
    for r in output_b_rows:
        writer.writerow([r['Brand'], r['Model'], r['Variant'], r['Storage'], r['RAM'], r['UptoPrice'], r['Market'], r['Source'], r['SourceURL'], r['Notes']])
print(f"Saved Output B CSV to {out_b_csv} ({len(output_b_rows)} rows)")

# Keep this older Dofy research export separate from the active Cashify price snapshot.
out_b_json = 'reference/source-catalog/dofy_price_research.generated.json'
os.makedirs(os.path.dirname(out_b_json), exist_ok=True)
with open(out_b_json, 'w', encoding='utf-8') as f:
    json.dump({
        'summary': {
            'total_models_in_input': total_input_models,
            'total_models_researched': stat_total_researched,
            'total_found_on_dofy': stat_found,
            'total_not_found': stat_not_found,
            'total_variant_entries': stat_total_variants,
            'total_models_with_multiple_variants': stat_multi_variants,
            'total_models_with_single_configuration': stat_single_variant,
            'source': 'https://www.dofy.in/',
            'timestamp': '2026-10-04'
        },
        'records': dataset_records
    }, f, indent=1, ensure_ascii=False)
print(f"Saved research JSON to {out_b_json}; the active sell-phone price catalog was not changed.")
