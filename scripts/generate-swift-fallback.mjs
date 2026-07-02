/**
 * Generates sharded BIC -> bank details fallback JSON from the MIT-licensed
 * community dataset github.com/br99bry/swift-bank-codes (per-country .js
 * data modules under swiftCodes/).
 *
 * Output: public/swift-fallback/<first two BIC chars>.json
 *         { "RSTAALTT": { "n": "ALBANIAN SECURITIES...", "c": "TIRANA", "b": "" }, ... }
 *
 * Used by the worker only when the primary (API Ninjas) lookup has no result
 * for a BIC. Raw source files are cached in .cache/swift-bank-codes/
 * (gitignored) and downloaded on first run.
 *
 * Usage: node scripts/generate-swift-fallback.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";

const RAW_BASE = "https://raw.githubusercontent.com/br99bry/swift-bank-codes/main";
const CACHE_DIR = new URL("../.cache/swift-bank-codes/", import.meta.url);
const TARGET_DIR = new URL("../public/swift-fallback/", import.meta.url);

const BIC_RE = /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/;

async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status} fetching ${url}`);
  return response.text();
}

async function ensureSources() {
  mkdirSync(CACHE_DIR, { recursive: true });
  const indexPath = new URL("index.js", CACHE_DIR);
  if (!existsSync(indexPath)) {
    writeFileSync(indexPath, await fetchText(`${RAW_BASE}/index.js`));
  }
  const indexSource = readFileSync(indexPath, "utf8");
  const listMatch = indexSource.match(/const countries = \[([\s\S]*?)\]/);
  if (!listMatch) throw new Error("Could not find countries list in index.js");
  const countries = [...listMatch[1].matchAll(/'([a-zA-Z]+)'/g)].map((m) => m[1]);

  const missing = countries.filter((c) => !existsSync(new URL(`${c}.js`, CACHE_DIR)));
  if (missing.length > 0) {
    console.log(`Downloading ${missing.length} country files...`);
    let done = 0;
    const queue = [...missing];
    await Promise.all(
      Array.from({ length: 8 }, async () => {
        for (let country = queue.shift(); country; country = queue.shift()) {
          const body = await fetchText(`${RAW_BASE}/swiftCodes/${country}.js`);
          writeFileSync(new URL(`${country}.js`, CACHE_DIR), body);
          done++;
          if (done % 50 === 0) console.log(`  ${done}/${missing.length}`);
        }
      }),
    );
  }
  return countries;
}

/** The files are CommonJS data modules; extract the JSON array literal
    instead of require()-ing them, so no third-party code executes. */
function parseCountryFile(country) {
  const source = readFileSync(new URL(`${country}.js`, CACHE_DIR), "utf8");
  const start = source.indexOf("[");
  const end = source.lastIndexOf("]");
  if (start === -1 || end === -1) throw new Error(`${country}: no array literal found`);
  return JSON.parse(source.slice(start, end + 1));
}

const countries = await ensureSources();

const shards = new Map();
let total = 0;
let skipped = 0;

for (const country of countries) {
  for (const record of parseCountryFile(country)) {
    const bic = String(record["SWIFT Code"] ?? "").toUpperCase().trim();
    const name = String(record["Bank Name"] ?? "").trim();
    if (!BIC_RE.test(bic) || !name) {
      skipped++;
      continue;
    }
    const prefix = bic.slice(0, 2);
    let shard = shards.get(prefix);
    if (!shard) {
      shard = {};
      shards.set(prefix, shard);
    }
    if (shard[bic]) continue; // first record wins on duplicates
    const entry = { n: name };
    const city = String(record["City"] ?? "").trim();
    const branch = String(record["Branch"] ?? "").trim();
    if (city) entry.c = city;
    if (branch) entry.b = branch;
    shard[bic] = entry;
    total++;
  }
}

rmSync(TARGET_DIR, { recursive: true, force: true });
mkdirSync(TARGET_DIR, { recursive: true });
let bytes = 0;
for (const [prefix, shard] of shards) {
  const body = JSON.stringify(shard);
  bytes += body.length;
  writeFileSync(new URL(`${prefix}.json`, TARGET_DIR), body);
}

console.log(
  `OK: ${total} BICs from ${countries.length} countries in ${shards.size} shards ` +
    `(${(bytes / 1024 / 1024).toFixed(1)} MB total, ${skipped} records skipped).`,
);
