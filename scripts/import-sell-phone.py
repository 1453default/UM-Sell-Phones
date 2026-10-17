#!/usr/bin/env python3
"""One-time importer: UM_2 reference dataset -> static Sell Phone catalog.

Reads (never modifies) UM_2/. Writes:
  public/sell-phone/logos/<brand>.webp
  public/sell-phone/phones/<brand>/<model-slug>.webp
  src/data/sellPhoneCatalog.generated.json
  SELL_PHONE_IMPORT_REPORT.md
Run:  python3 scripts/import-sell-phone.py
"""
import glob, json, os, re, shutil
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "reference", "source-catalog", "UM_2")
PUB = os.path.join(ROOT, "public", "sell-phone")
OUT_JSON = os.path.join(ROOT, "src", "data", "sellPhoneCatalog.generated.json")
REPORT = os.path.join(ROOT, "docs", "SELL_PHONE_IMPORT_REPORT.md")
MAX_PHONE = 640
MAX_LOGO = 400

# folder, slug, display name, logo file  (display order follows reference brand page)
BRANDS = [
    ("Apple", "apple", "Apple", "Apple.png"),
    ("Samsung", "samsung", "Samsung", "Samsung.png"),
    ("OnePlus", "oneplus", "OnePlus", "OnePlus.png"),
    ("google-pixel", "google-pixel", "Google Pixel", "Google_Pixel.png"),
    ("oppo", "oppo", "Oppo", "Oppo.png"),
    ("vivo", "vivo", "Vivo", "Vivo.png"),
    ("Xiaomi", "xiaomi", "Xiaomi", "MI.png"),
    ("motorola", "motorola", "Motorola", "motorola.png"),
    ("Realme", "realme", "Realme", "Realme.png"),
    ("POCO", "poco", "POCO", "Poco.png"),
    ("IQOO", "iqoo", "iQOO", "IQOO.png"),
    ("Nothing", "nothing", "Nothing", "nothing.png"),
    ("Infinix", "infinix", "Infinix", "Infinix.png"),
    ("Tecno", "tecno", "Tecno", "Tecno.png"),
    ("Nokia", "nokia", "Nokia", "Nokia.png"),
    ("Lava", "lava", "Lava", "Lava.png"),
    ("HONOR", "honor", "Honor", "HONOR.png"),
    ("Huawei", "huawei", "Huawei", "Huawei.png"),
    ("LG", "lg", "LG", "LG.png"),
    ("Nubia", "nubia", "Nubia", "Nubia.png"),
    ("Asus", "asus", "Asus", "Asus.png"),
    ("CMF", "cmf", "CMF", "CMF.png"),
]
IGNORED_DIRS = {"brand models", "home_later"}

norm = lambda s: re.sub(r"[^a-z0-9]", "", s.lower())
slugify = lambda s: re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-", s.lower())).strip("-")
tokens = lambda s: re.findall(r"[a-z0-9]+", s.lower())


def save_webp(src, dst, max_side):
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    im = Image.open(src)
    im.load()
    if im.mode not in ("RGBA", "RGB"):
        im = im.convert("RGBA")
    im.thumbnail((max_side, max_side), Image.LANCZOS)
    im.save(dst, "WEBP", quality=90, method=3)
    return im.size


def series_key_match(key_toks, model_toks):
    """Return start index where series key matches the model tokens, or None."""
    n = len(key_toks)
    for i in range(len(model_toks) - n + 1):
        ok = True
        for j, k in enumerate(key_toks):
            t = model_toks[i + j]
            last = j == n - 1
            if t == k:
                continue
            # last key token may prefix a model token: "17"->"17e", "x"->"x9", "a"->"a55"
            if last and t.startswith(k):
                rest = t[len(k):]
                if k.isdigit() and rest.isalpha() and len(rest) <= 2:
                    continue
                if not k.isdigit() and (rest[:1].isdigit() or (len(k) == 1 and len(rest) <= 2 and rest.isalpha())):
                    continue
            ok = False
            break
        if ok:
            return i
    return None


def main():
    if os.path.isdir(PUB):
        shutil.rmtree(PUB)
    brands_out, report = [], []
    totals = dict(images=0, imported=0, models=0, missing=0, html=0)
    present = sorted(d for d in os.listdir(SRC) if os.path.isdir(os.path.join(SRC, d)) and d not in IGNORED_DIRS)
    known = {b[0] for b in BRANDS}
    unknown_dirs = [d for d in present if d not in known]
    logo_dir = os.path.join(SRC, "brand models", "brand logos")

    for folder, bslug, bname, logo_file in BRANDS:
        bdir = os.path.join(SRC, folder)
        if not os.path.isdir(bdir):
            report.append(f"## {bname}\nSource folder missing - skipped.\n")
            continue
        htmls = [p for p in glob.glob(os.path.join(bdir, "**", "*.htm*"), recursive=True)]
        totals["html"] += len(htmls)
        html = open(htmls[0], encoding="utf8", errors="ignore").read() if htmls else ""
        names = re.findall(r'<span class="?text-center"?>([^<]+)</span></main>', html)
        series_labels = [s.strip() for s in re.findall(r"snap-start shrink-0[^>]*>([^<]+)<", html) if s.strip() != "All"]
        # images
        imgs = [p for p in glob.glob(os.path.join(bdir, "**", "*"), recursive=True)
                if os.path.isfile(p) and "PRODUCT_DATA" not in p and p.lower().endswith((".png", ".jpg", ".jpeg", ".webp"))]
        totals["images"] += len(imgs)
        idx = {}
        for p in imgs:
            stem = os.path.splitext(os.path.basename(p))[0]
            t = tokens(stem.replace("_", " "))
            for k in {norm(stem), "".join(t[1:])}:
                idx.setdefault(k, p)
        # PRODUCT_DATA model -> image hints
        hints = {}
        for jf in glob.glob(os.path.join(bdir, "PRODUCT_DATA", "*.json")):
            try:
                d = json.load(open(jf))
            except Exception:
                continue
            if isinstance(d, dict) and d.get("model") and d.get("images"):
                p = os.path.join(SRC, d["images"][0])
                if os.path.isfile(p):
                    hints[norm(d["model"])] = p

        def find_image(name):
            t = tokens(name)
            cands = [name, " ".join(t[1:])]
            drop = {"5g", "4g", "galaxy"}
            cands += [" ".join(x for x in t if x not in drop), " ".join(x for x in t[1:] if x not in drop)]
            for c in cands:
                k = norm(c)
                if k in idx:
                    return idx[k], "filename"
                if k in hints:
                    return hints[k], "product-data"
            return None, None

        logo_src = os.path.join(logo_dir, logo_file)
        logo = None
        if os.path.isfile(logo_src):
            save_webp(logo_src, os.path.join(PUB, "logos", f"{bslug}.webp"), MAX_LOGO)
            logo = f"/sell-phone/logos/{bslug}.webp"

        skeys = [(lbl, tokens(re.sub(r"\s*series$", "", lbl, flags=re.I))) for lbl in series_labels]
        models, used_slugs, used_imgs, missing, ambiguous, fallback_series = [], set(), {}, [], [], []
        for order, name in enumerate(n.strip() for n in names):
            mt = tokens(name)[1:]  # drop brand word
            best = None
            for si, (lbl, kt) in enumerate(skeys):
                pos = series_key_match(kt, mt)
                if pos is not None:
                    score = (pos, -len(kt), si)
                    if best is None or score < best[0]:
                        best = (score, lbl)
            series = best[1] if best else "Other"
            if not best and skeys:
                fallback_series.append(name)
            base = slugify(name)
            if base.startswith(bslug + "-"):
                base = base[len(bslug) + 1:]
            slug, i = base or "model", 2
            while slug in used_slugs:
                slug, i = f"{base}-{i}", i + 1
            used_slugs.add(slug)
            src, how = find_image(name)
            images = []
            if src:
                dst_rel = f"/sell-phone/phones/{bslug}/{slug}.webp"
                save_webp(src, os.path.join(ROOT, "public") + dst_rel, MAX_PHONE)
                images.append(dst_rel)
                totals["imported"] += 1
                if src in used_imgs:
                    ambiguous.append(f"{name} shares image with {used_imgs[src]} ({os.path.basename(src)})")
                used_imgs.setdefault(src, name)
            else:
                missing.append(name)
            models.append({"name": name, "slug": slug, "series": series, "images": images, "order": order,
                           "source": os.path.relpath(src, SRC) if src else None})
        totals["models"] += len(models)
        totals["missing"] += len(missing)
        used_series = [l for l, _ in skeys if any(m["series"] == l for m in models)]
        if any(m["series"] == "Other" for m in models):
            used_series.append("Other")
        orphans = sorted(os.path.basename(p) for p in imgs if p not in used_imgs)
        brands_out.append({"name": bname, "slug": bslug, "logo": logo, "series": used_series, "models": models})
        report.append(
            f"## {bname}\n- Source HTML: {len(htmls)} file(s)\n- Models: {len(models)}\n- Series: {len(used_series)} ({', '.join(used_series) or '-'})\n"
            f"- Images discovered: {len(imgs)} / imported: {len(models) - len(missing)}\n- Logo: {'local' if logo else 'MISSING (text fallback)'}\n"
            f"- Missing images ({len(missing)}): {', '.join(missing) or 'none'}\n"
            f"- Ambiguous / shared images ({len(ambiguous)}): {'; '.join(ambiguous) or 'none'}\n"
            f"- Series fallback to 'Other' ({len(fallback_series)}): {', '.join(fallback_series) or 'none'}\n"
            f"- Unused source images ({len(orphans)}): {', '.join(orphans[:40])}{' ...' if len(orphans) > 40 else ''}\n")

    os.makedirs(os.path.dirname(OUT_JSON), exist_ok=True)
    json.dump({"brands": brands_out}, open(OUT_JSON, "w"), indent=1, ensure_ascii=False)
    head = (f"# Sell Phone Import Report\n\nGenerated by `scripts/import-sell-phone.py`. UM_2 source files were read only, never modified.\n\n"
            f"- Brands imported: {len(brands_out)}\n- Unrecognised folders: {', '.join(unknown_dirs) or 'none'}\n- Ignored folders: {', '.join(sorted(IGNORED_DIRS))}\n"
            f"- HTML files inspected: {totals['html']}\n- Phone images discovered: {totals['images']}\n- Phone images imported (webp, max {MAX_PHONE}px): {totals['imported']}\n"
            f"- Models detected: {totals['models']}\n- Models without image (shown with placeholder): {totals['missing']}\n"
            f"- Series are inferred by matching series labels from the reference page against model names; unmatched models go to 'Other'.\n\n")
    open(REPORT, "w").write(head + "\n".join(report))
    print(head)


if __name__ == "__main__":
    main()
