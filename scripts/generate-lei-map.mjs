/**
 * Generates sharded BIC -> LEI lookup JSON from data/lei-bic.csv
 * (GLEIF's open BIC-to-LEI relationship file, CC0).
 *
 * Output: public/lei-map/<first two BIC chars>.json
 *         { "CITIUS33XXX": "6SHGI4ZSSLCXXQSBB395", ... }
 *
 * Shards are served as static assets; the worker fetches only the shard
 * for the queried BIC (edge-cached). Largest shard is ~3k entries.
 *
 * Usage: node scripts/generate-lei-map.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";

const SOURCE = new URL("../data/lei-bic.csv", import.meta.url);
const TARGET_DIR = new URL("../public/lei-map/", import.meta.url);

const LEI_RE = /^[A-Z0-9]{20}$/;
const BIC_RE = /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}[A-Z0-9]{3}$/;

const lines = readFileSync(SOURCE, "utf8").trim().split("\n");
const header = lines.shift();
if (header.trim() !== "LEI,BIC") {
  throw new Error(`Unexpected CSV header: "${header}" (expected "LEI,BIC")`);
}

const shards = new Map();
let total = 0;
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
  if (shard[bic] && shard[bic] !== lei) {
    // A handful of BICs map to more than one LEI; keep the first and count.
    ambiguous++;
    continue;
  }
  shard[bic] = lei;
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
    `(largest ${largest} entries, ${skipped} malformed skipped, ${ambiguous} ambiguous duplicates dropped).`,
);
