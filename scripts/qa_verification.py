import re
import sys
sys.stdout.reconfigure(encoding='utf-8')

INPUT_FILE = 'reference/source-catalog/UM_2/all_mobile_phones_by_brand.txt'
MASTER_FILE = 'reference/source-catalog/DOFY_PRICE_RESEARCH_MASTER.txt'
CSV_FILE = 'reference/source-catalog/DOFY_PRICE_RESEARCH_DATASET.csv'

# 1. Read input models
input_models = []
with open(INPUT_FILE, encoding='utf-8') as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith('==='):
            input_models.append(line)

print(f"Total input models: {len(input_models)}")
assert len(input_models) == 1330, f"Expected 1330 input models, got {len(input_models)}"

# 2. Verify Output A (Master text file)
with open(MASTER_FILE, encoding='utf-8') as f:
    master_content = f.read()

# Models are separated by '--------------------------------------------------'
blocks = [b.strip() for b in master_content.split('--------------------------------------------------') if b.strip()]
print(f"Total blocks in Master file: {len(blocks)}")
assert len(blocks) == 1330, f"Expected 1330 blocks in Master file, got {len(blocks)}"

# Verify exact order and model names
for idx, (expected_model, block) in enumerate(zip(input_models, blocks)):
    first_line = block.splitlines()[0].strip()
    if first_line != expected_model:
        print(f"Mismatch at index {idx}: expected '{expected_model}', got '{first_line}'")
        sys.exit(1)

print("Output A: 100% exact order and model name match across all 1,330 models!")

# 3. Verify Output B (CSV file)
with open(CSV_FILE, encoding='utf-8') as f:
    csv_lines = [l.strip() for l in f if l.strip()]

header = csv_lines[0]
rows = csv_lines[1:]
print(f"Total rows in CSV file: {len(rows)}")

assert header == "Brand|Model|Variant|Storage|RAM|Upto Price|Market|Source|Source URL|Notes", f"Header mismatch: {header}"

# Check that every row has 10 pipe-separated columns
for idx, r in enumerate(rows):
    cols = r.split('|')
    if len(cols) != 10:
        print(f"Row {idx} does not have 10 columns: {r}")
        sys.exit(1)

print("Output B CSV: 100% valid columns across all rows!")
print("ALL QUALITY CONTROL CHECKS PASSED PERFECTLY!")
