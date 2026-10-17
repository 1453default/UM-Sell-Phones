import os
import sys
import glob
import json
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed

sys.stdout.reconfigure(encoding='utf-8')

build_id = 'uQvNXRaRclkFWZB1XAQdK'
CACHE_DIR = 'reference/source-catalog/dofy_cache/models'
os.makedirs(CACHE_DIR, exist_ok=True)

# Brand mappings
brand_files = sorted(glob.glob('reference/source-catalog/dofy_cache/brands/*.json'))

all_tasks = []
for bf in brand_files:
    bslug = os.path.splitext(os.path.basename(bf))[0]
    os.makedirs(os.path.join(CACHE_DIR, bslug), exist_ok=True)
    models = json.load(open(bf, encoding='utf-8'))
    for m in models:
        enum_name = m['EnumName']
        model_slug = enum_name.replace('_', '-').replace(' ', '-').lower()
        all_tasks.append({
            'brand_slug': bslug,
            'model_name': m['Name'],
            'display_name': m.get('DisplayName', m['Name']),
            'enum_name': enum_name,
            'model_slug': model_slug,
            'series_id': m.get('BrandSeriesId'),
            'out_path': os.path.join(CACHE_DIR, bslug, f"{model_slug}.json")
        })

print(f"Total models to verify/fetch: {len(all_tasks)}")

def fetch_single(task):
    out_path = task['out_path']
    if os.path.exists(out_path):
        try:
            with open(out_path, 'r', encoding='utf-8') as f:
                d = json.load(f)
                if 'pageProps' in d or 'not_found' in d:
                    return task, True, "CACHED"
        except Exception:
            pass

    bslug = task['brand_slug']
    mslug = task['model_slug']
    url = f'https://www.dofy.in/_next/data/{build_id}/in-en/india/sell-old-phone/{bslug}/{mslug}.json'
    
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
    req = urllib.request.Request(url, headers=headers)
    
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=12) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                with open(out_path, 'w', encoding='utf-8') as f:
                    json.dump(data, f, indent=1)
                return task, True, "FETCHED"
        except urllib.error.HTTPError as e:
            if e.code == 404:
                # Record 404
                with open(out_path, 'w', encoding='utf-8') as f:
                    json.dump({'not_found': True, 'status': 404, 'url': url}, f, indent=1)
                return task, True, "404_NOT_FOUND"
            time.sleep(1)
        except Exception as e:
            time.sleep(1)
            
    return task, False, "FAILED_AFTER_RETRIES"

success = 0
failed = 0
not_found = 0
cached = 0

start_time = time.time()
with ThreadPoolExecutor(max_workers=12) as executor:
    futures = {executor.submit(fetch_single, t): t for t in all_tasks}
    completed_count = 0
    for fut in as_completed(futures):
        t, ok, status = fut.result()
        completed_count += 1
        if status == "CACHED":
            cached += 1
            success += 1
        elif status == "FETCHED":
            success += 1
        elif status == "404_NOT_FOUND":
            not_found += 1
            success += 1
        else:
            failed += 1
            
        if completed_count % 100 == 0 or completed_count == len(all_tasks):
            elapsed = time.time() - start_time
            print(f"[{completed_count}/{len(all_tasks)}] in {elapsed:.1f}s | Success: {success}, 404s: {not_found}, Failed: {failed}, Cached: {cached}", flush=True)

print("Fetch complete!", flush=True)
