import { readFile, writeFile, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalogPath = path.join(root, "src/data/sellPhoneCatalog.generated.json");
const pricingPath = path.join(root, "src/data/dofyPriceCatalog.generated.json");
const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
const pricing = JSON.parse(await readFile(pricingPath, "utf8"));
const brands = catalog.brands;
const models = brands.flatMap((brand) => brand.models.map((model) => ({ brand, model })));
const modelKey = (brand, model) => `${brand.trim().toLowerCase()}|${model.trim().toLowerCase()}`;
const modelKeys = new Set();
const duplicateModels = [];
for (const { brand, model } of models) {
  const key = modelKey(brand.name, model.name);
  if (modelKeys.has(key)) duplicateModels.push(key);
  modelKeys.add(key);
}

const exactVariantKeys = new Set();
const derivedVariantIds = new Set();
const duplicateVariants = [];
const duplicateVariantIds = [];
const orphanPriceRows = [];
const invalidPriceRows = [];
const pricedModels = new Set();
let pricedVariantRows = 0;
for (const row of pricing.records) {
  const key = modelKey(row.brand, row.full_model_name);
  if (!modelKeys.has(key)) orphanPriceRows.push(key);

  const exactVariantKey = [key, row.storage ?? "", row.ram ?? ""]
    .map((value) => String(value).trim().toLowerCase())
    .join("|");
  if (exactVariantKeys.has(exactVariantKey)) duplicateVariants.push(exactVariantKey);
  exactVariantKeys.add(exactVariantKey);

  if (typeof row.upto_price === "number" && Number.isFinite(row.upto_price) && row.upto_price > 0) {
    pricedVariantRows++;
    pricedModels.add(key);
    const storage = String(row.storage ?? "").trim();
    const ram = String(row.ram ?? "").trim();
    const variantId = (ram ? `${storage}-${ram}-ram` : storage)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const idKey = `${key}|${variantId}`;
    if (derivedVariantIds.has(idKey)) duplicateVariantIds.push(idKey);
    derivedVariantIds.add(idKey);
  } else if (row.upto_price !== null && row.upto_price !== undefined) {
    invalidPriceRows.push(exactVariantKey);
  }
}

const missingImages = [];
for (const { model } of models) {
  for (const image of model.images ?? []) {
    const localPath = path.join(root, "public", image.replace(/^\//, ""));
    try {
      await access(localPath);
    } catch {
      missingImages.push(image);
    }
  }
}

const expectedSummary = {
  active_catalog: {
    brands: brands.length,
    models: models.length,
    priced_models: pricedModels.size,
    unpriced_models: models.length - pricedModels.size,
    variant_records: pricing.records.length,
    priced_variant_records: pricedVariantRows,
    unpriced_variant_records: pricing.records.length - pricedVariantRows,
  },
  price_snapshot: {
    source: pricing.summary?.price_snapshot?.source ?? pricing.summary?.source ?? "",
    date: pricing.summary?.price_snapshot?.date ?? pricing.summary?.timestamp ?? "",
  },
};

const failures = [
  duplicateModels.length && `${duplicateModels.length} duplicate model identities`,
  duplicateVariants.length && `${duplicateVariants.length} duplicate exact variant records`,
  duplicateVariantIds.length && `${duplicateVariantIds.length} duplicate derived variant IDs`,
  orphanPriceRows.length && `${orphanPriceRows.length} price rows without an exact catalog model`,
  invalidPriceRows.length && `${invalidPriceRows.length} invalid non-null prices`,
  missingImages.length && `${missingImages.length} missing model image assets`,
].filter(Boolean);
if (failures.length) throw new Error(failures.join("; "));

if (process.argv.includes("--write-summary")) {
  pricing.summary = expectedSummary;
  const source = await readFile(pricingPath, "utf8");
  const keyStart = source.indexOf('"summary"');
  const valueStart = source.indexOf("{", keyStart);
  if (keyStart < 0 || valueStart < 0) throw new Error("Could not find catalog summary");

  let depth = 0;
  let inString = false;
  let escaped = false;
  let valueEnd = -1;
  for (let index = valueStart; index < source.length; index++) {
    const character = source[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === '"') inString = false;
      continue;
    }
    if (character === '"') inString = true;
    else if (character === "{") depth++;
    else if (character === "}" && --depth === 0) {
      valueEnd = index;
      break;
    }
  }
  if (valueEnd < 0) throw new Error("Could not parse catalog summary boundaries");

  const lineStart = source.lastIndexOf("\n", keyStart) + 1;
  const propertyIndent = source.slice(lineStart, keyStart);
  const innerIndent = source.slice(valueStart + 1).match(/\n([ \t]*)\S/)?.[1] ?? "  ";
  const indentStep = " ".repeat(Math.max(1, innerIndent.length - propertyIndent.length));
  const summary = JSON.stringify(expectedSummary, null, indentStep).replaceAll(
    "\n",
    `\n${propertyIndent}`,
  );
  await writeFile(
    pricingPath,
    `${source.slice(0, valueStart)}${summary}${source.slice(valueEnd + 1)}`,
    "utf8",
  );
} else if (JSON.stringify(pricing.summary) !== JSON.stringify(expectedSummary)) {
  throw new Error(
    "Catalog summary is stale. Run npm run catalog:summary and review the summary-only diff.",
  );
}

console.log(JSON.stringify(expectedSummary, null, 2));
console.log("Catalog identity, variants, prices, and model image checks passed.");
