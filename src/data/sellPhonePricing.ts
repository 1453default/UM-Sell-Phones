// Price lookup for the Sell Phone flow. Single source of truth:
// dofyPriceCatalog.generated.json. Exact match on brand + full model name + storage/RAM.
import raw from "./dofyPriceCatalog.generated.json";

type PriceRecord = {
  brand: string;
  full_model_name: string;
  storage: string;
  ram: string;
  upto_price: number | null;
};

export type SellVariant = {
  id: string; // stable: storage + ram
  storage: string;
  ram: string | null;
  label: string;
  uptoPrice: number;
};

const EMPTY = new Set(["", "—", "-", "null", "undefined", "n/a"]);
const clean = (v: string | null | undefined) => (v && !EMPTY.has(v.trim().toLowerCase()) ? v.trim() : null);
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const key = (brand: string, model: string) => `${brand.trim().toLowerCase()}|${model.trim().toLowerCase()}`;

const sizeGb = (s: string) => {
  const m = s.match(/([\d.]+)\s*(TB|GB|MB)/i);
  if (!m) return 0;
  const n = parseFloat(m[1]);
  return m[2].toUpperCase() === "TB" ? n * 1024 : m[2].toUpperCase() === "MB" ? n / 1024 : n;
};

// Built once at module load.
const INDEX = new Map<string, SellVariant[]>();
for (const r of (raw as { records: PriceRecord[] }).records) {
  const storage = clean(r.storage);
  if (!storage || typeof r.upto_price !== "number") continue;
  const ram = clean(r.ram);
  const k = key(r.brand, r.full_model_name);
  const list = INDEX.get(k) ?? [];
  list.push({
    id: slug(ram ? `${storage}-${ram}-ram` : storage),
    storage,
    ram,
    label: ram ? `${storage} / ${ram} RAM` : storage,
    uptoPrice: r.upto_price,
  });
  INDEX.set(k, list);
}
for (const list of INDEX.values())
  list.sort((a, b) => sizeGb(a.storage) - sizeGb(b.storage) || sizeGb(a.ram ?? "") - sizeGb(b.ram ?? ""));

export const getModelVariants = (brandName: string, modelName: string): SellVariant[] =>
  INDEX.get(key(brandName, modelName)) ?? [];

export const getVariant = (brandName: string, modelName: string, variantId: string) =>
  getModelVariants(brandName, modelName).find((v) => v.id === variantId);

export const formatINR = (n: number) => `₹ ${n.toLocaleString("en-IN")}`;
