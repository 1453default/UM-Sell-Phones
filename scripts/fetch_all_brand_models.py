import urllib.request
import json
import os
import sys
sys.stdout.reconfigure(encoding='utf-8')

build_id = 'uQvNXRaRclkFWZB1XAQdK'
brands = [
    ("Apple", "apple"),
    ("Samsung", "samsung"),
    ("OnePlus", "oneplus"),
    ("google-pixel", "google-pixel"),
    ("oppo", "oppo"),
    ("vivo", "vivo"),
    ("Xiaomi", "xiaomi"),
    ("motorola", "motorola"),
    ("Realme", "realme"),
    ("POCO", "poco"),
    ("IQOO", "iqoo"),
    ("Nothing", "nothing"),
    ("Infinix", "infinix"),
    ("Tecno", "tecno"),
    ("Nokia", "nokia"),
    ("Lava", "lava"),
    ("HONOR", "honor"),
    ("Huawei", "huawei"),
    ("LG", "lg"),
    ("Nubia", "nubia"),
    ("Asus", "asus"),
    ("CMF", "cmf"),
]

os.makedirs('reference/source-catalog/dofy_cache/brands', exist_ok=True)

for folder, bslug in brands:
    url = f'https://www.dofy.in/_next/data/{build_id}/in-en/india/sell-old-phone/{bslug}.json'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            models = data.get('pageProps', {}).get('selectModel', [])
            print(f'SUCCESS {bslug:15}: {len(models)} models')
            with open(f'reference/source-catalog/dofy_cache/brands/{bslug}.json', 'w', encoding='utf-8') as f:
                json.dump(models, f, indent=2)
    except Exception as e:
        print(f'FAILED  {bslug:15}: {e}')
