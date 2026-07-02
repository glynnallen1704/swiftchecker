/**
 * Generates sharded BIC -> LEI lookup JSON from data/lei-bic.csv
 * (GLEIF's open BIC-to-LEI relationship file, CC0).
 *
 * If data/lei-names.csv exists (see scripts/extract-lei-names.mjs), each
 * entry also carries the entity's registered legal name.
 *
 * Output: public/lei-map/<first two BIC chars>.json
 *         { "CITIUS33XXX": "6SHGI4ZSSLCXXQSBB395", ... }            (no name)
 *         { "CITIUS33XXX": ["6SHGI...", "CITIBANK, N.A."], ... }    (with name)
 *
 * Shards are served as static assets; the worker fetches only the shard
 * for the queried BIC (edge-cached). Largest shard is ~3k entries.
 *
 * Usage: node scripts/generate-lei-map.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";

const SOURCE = new URL("../data/lei-bic.csv", import.meta.url);
const NAMES_SOURCE = new URL("../data/lei-names.csv", import.meta.url);
const TARGET_DIR = new URL("../public/lei-map/", import.meta.url);

/** LEI -> legal name, when the extract has been generated. */
function loadNames() {
  if (!existsSync(NAMES_SOURCE)) return new Map();
  const names = new Map();
  const lines = readFileSync(NAMES_SOURCE, "utf8").trim().split("\n").slice(1);
  for (const line of lines) {
    const lei = line.slice(0, 20);
    if (!LEI_RE.test(lei) || line[20] !== ",") continue;
    let name = line.slice(21);
    if (name.startsWith('"') && name.endsWith('"')) {
      name = name.slice(1, -1).replace(/""/g, '"');
    }
    if (name) names.set(lei, name);
  }
  return names;
}

const LEI_RE = /^[A-Z0-9]{20}$/;
const BIC_RE = /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}[A-Z0-9]{3}$/;

const lines = readFileSync(SOURCE, "utf8").trim().split("\n");
const header = lines.shift();
if (header.trim() !== "LEI,BIC") {
  throw new Error(`Unexpected CSV header: "${header}" (expected "LEI,BIC")`);
}

const names = loadNames();
const shards = new Map();
let total = 0;
let named = 0;
let skipped = 0;
let ambiguous = 0;

for (const line of lines) {
  const [lei, bic] = line.trim().split(",");
  if (!LEI_RE.test(lei) || !BIC_RE.test(bic)) {
    skipped++;
    continue;
  }
  const prefix = bic.slice(0, 2);
  let shard = shards.get(prefix);
  if (!shard) {
    shard = {};
    shards.set(prefix, shard);
  }
  const existing = shard[bic];
  if (existing && (Array.isArray(existing) ? existing[0] : existing) !== lei) {
    // A handful of BICs map to more than one LEI; keep the first and count.
    ambiguous++;
    continue;
  }
  const name = names.get(lei);
  shard[bic] = name ? [lei, name] : lei;
  if (name) named++;
  total++;
}

rmSync(TARGET_DIR, { recursive: true, force: true });
mkdirSync(TARGET_DIR, { recursive: true });
let largest = 0;
for (const [prefix, shard] of shards) {
  const size = Object.keys(shard).length;
  largest = Math.max(largest, size);
  writeFileSync(new URL(`${prefix}.json`, TARGET_DIR), JSON.stringify(shard));
}

console.log(
  `OK: ${total} BIC->LEI mappings in ${shards.size} shards ` +
    `(${named} with legal names, largest shard ${largest} entries, ` +
    `${skipped} malformed skipped, ${ambiguous} ambiguous duplicates dropped).`,
);
if (named === 0) {
  console.log("Tip: run scripts/extract-lei-names.mjs to add registered legal names.");
}
