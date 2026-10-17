import glob
import json
import re
import sys
sys.stdout.reconfigure(encoding='utf-8')

variant_names = set()
for f in glob.glob('reference/source-catalog/dofy_cache/models/*/*.json'):
    data = json.load(open(f, encoding='utf-8'))
    vars = data.get('pageProps', {}).get('selectVariant', [])
    for v in vars:
        name = v.get('Name')
        if name:
            variant_names.add(name.strip())

print(f"Total unique variant raw strings: {len(variant_names)}")
print("Sample unique variant strings:")
for vn in sorted(variant_names):
    print(" ", repr(vn))
