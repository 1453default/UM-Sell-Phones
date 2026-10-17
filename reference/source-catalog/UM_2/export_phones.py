import os
import json

root = '.'
brands = [
    'Apple', 'Asus', 'CMF', 'google-pixel', 'HONOR', 'Huawei', 'Infinix', 'IQOO',
    'Lava', 'LG', 'motorola', 'Nokia', 'Nothing', 'Nubia', 'OnePlus', 'oppo',
    'POCO', 'Realme', 'Samsung', 'Tecno', 'vivo', 'Xiaomi'
]

brand_data = {}
total_models = 0

for b in sorted(brands, key=lambda s: s.lower()):
    b_path = os.path.join(root, b)
    idx_path = os.path.join(b_path, 'PRODUCT_DATA', 'brand-index.json')
    if not os.path.exists(idx_path):
        continue
    with open(idx_path, 'r', encoding='utf-8') as f:
        idx = json.load(f)
    
    records = []
    for m in idx['models']:
        model_name = m['model'].strip()
        m_file = os.path.join(b_path, 'PRODUCT_DATA', m['file'])
        img_name = ''
        if os.path.exists(m_file):
            with open(m_file, 'r', encoding='utf-8') as mf:
                m_data = json.load(mf)
            imgs = m_data.get('images', [])
            if imgs:
                img_name = os.path.basename(imgs[0])
        records.append({
            'model': model_name,
            'image_file': img_name,
            'image_stem': os.path.splitext(img_name)[0] if img_name else ''
        })
    records.sort(key=lambda r: r['model'].lower())
    brand_data[b] = records
    total_models += len(records)

# 1. Clean Phone Model Names by Brand
with open('all_mobile_phones_by_brand.txt', 'w', encoding='utf-8') as f:
    for b, recs in brand_data.items():
        display_brand = 'Google Pixel' if b == 'google-pixel' else b
        f.write(f'=== {display_brand.upper()} ({len(recs)} Models) ===\n')
        for r in recs:
            f.write(f"{r['model']}\n")
        f.write('\n')

# 2. Image File Names by Brand
with open('all_phone_image_names_by_brand.txt', 'w', encoding='utf-8') as f:
    for b, recs in brand_data.items():
        display_brand = 'Google Pixel' if b == 'google-pixel' else b
        f.write(f'=== {display_brand.upper()} ({len(recs)} Images) ===\n')
        for r in recs:
            f.write(f"{r['image_file']}\n")
        f.write('\n')

# 3. Formatted Mapping Table (Brand | Phone Model Name | Image File)
with open('all_phones_with_image_mapping.txt', 'w', encoding='utf-8') as f:
    f.write(f"{'Brand':<15} | {'Phone Model Name':<38} | {'Image Filename':<40}\n")
    f.write('-'*97 + '\n')
    for b, recs in brand_data.items():
        display_brand = 'Google Pixel' if b == 'google-pixel' else b
        for r in recs:
            f.write(f"{display_brand:<15} | {r['model']:<38} | {r['image_file']:<40}\n")

print(f'Successfully generated all files! Total brands: {len(brand_data)}, Total models: {total_models}')
