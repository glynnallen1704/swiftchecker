/**
 * Produces data/lei-names.csv (LEI,Name) for exactly the LEIs referenced by
 * data/lei-bic.csv — the only slice of GLEIF Level-1 data this site needs
 * (~34k of GLEIF's ~2.5M entities).
 *
 * Two modes:
 *
 * 1) From a downloaded GLEIF Level-1 "golden copy" CSV (no need to commit or
 *    upload the big file — this streams it and keeps only matching rows):
 *      node scripts/extract-lei-names.mjs --from-file /path/to/lei2.csv
 *    Works on the unzipped CSV; for the zip, unzip on the fly:
 *      unzip -p golden-copy.csv.zip | node scripts/extract-lei-names.mjs --from-file -
 *
 * 2) From GLEIF's free public API (no 4GB download at all; ~3-10 minutes,
 *    rate-limited to be polite):
 *      node scripts/extract-lei-names.mjs --from-api
 *
 * Afterwards run: npm run gen:lei-map  (picks up the names automatically)
 */
import { createReadStream, readFileSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline";

const BIC_SOURCE = new URL("../data/lei-bic.csv", import.meta.url);
const TARGET = new URL("../data/lei-names.csv", import.meta.url);

const neededLeis = new Set(
  readFileSync(BIC_SOURCE, "utf8")
    .trim()
    .split("\n")
    .slice(1)
    .map((line) => line.split(",")[0].trim())
    .filter((lei) => /^[A-Z0-9]{20}$/.test(lei)),
);
console.log(`Looking for ${neededLeis.size} LEIs referenced by data/lei-bic.csv`);

/** Escape a CSV field. */
function csv(field) {
  return /[",\n\r]/.test(field) ? `"${field.replace(/"/g, '""')}"` : field;
}

function writeOutput(names) {
  const rows = [...names.entries()].sort(([a], [b]) => (a < b ? -1 : 1));
  writeFileSync(TARGET, `LEI,Name\n${rows.map(([lei, name]) => `${lei},${csv(name)}`).join("\n")}\n`);
  console.log(
    `OK: wrote ${rows.length} names to data/lei-names.csv ` +
      `(${neededLeis.size - rows.length} LEIs not found). Now run: npm run gen:lei-map`,
  );
}

/** Minimal streaming CSV field splitter (handles quoted commas/quotes;
    assumes no embedded newlines, which holds for GLEIF name fields). */
function splitCsvLine(line) {
  const fields = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      fields.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields;
}

async function fromFile(path) {
  const input = path === "-" ? process.stdin : createReadStream(path);
  const lines = createInterface({ input, crlfDelay: Infinity });
  const names = new Map();
  let leiIndex = -1;
  let nameIndex = -1;
  let lineNumber = 0;

  for await (const line of lines) {
    lineNumber++;
    if (lineNumber === 1) {
      const header = splitCsvLine(line);
      leiIndex = header.indexOf("LEI");
      nameIndex = header.indexOf("Entity.LegalName");
      if (leiIndex === -1 || nameIndex === -1) {
        throw new Error(
          `Header must contain "LEI" and "Entity.LegalName" columns (got: ${header.slice(0, 5).join(", ")}...)`,
        );
      }
      continue;
    }
    // Fast pre-filter: the LEI is always the first 20 chars of its field;
    // only fully parse lines whose start could match a needed LEI.
    const probe = line.startsWith('"') ? line.slice(1, 21) : line.slice(0, 20);
    if (!neededLeis.has(probe)) continue;
    const fields = splitCsvLine(line);
    const lei = fields[leiIndex];
    const name = fields[nameIndex]?.trim();
    if (neededLeis.has(lei) && name) names.set(lei, name);
    if (names.size % 5000 === 0) console.log(`  matched ${names.size}...`);
  }
  writeOutput(names);
}

async function fromApi() {
  const names = new Map();
  const leis = [...neededLeis];
  const BATCH = 100; // keeps URLs comfortably short
  const DELAY_MS = 1100; // stay under GLEIF's anonymous rate guidance

  for (let offset = 0; offset < leis.length; offset += BATCH) {
    const batch = leis.slice(offset, offset + BATCH);
    const url =
      `https://api.gleif.org/api/v1/lei-records?page[size]=${BATCH}` +
      `&filter[lei]=${batch.join(",")}`;
    let attempt = 0;
    for (;;) {
      try {
        const response = await fetch(url, { headers: { Accept: "application/vnd.api+json" } });
        if (response.status === 429) throw new Error("rate limited");
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const body = await response.json();
        for (const record of body.data ?? []) {
          const lei = record?.attributes?.lei;
          const name = record?.attributes?.entity?.legalName?.name;
          if (lei && name) names.set(lei, String(name).trim());
        }
        break;
      } catch (err) {
        attempt++;
        if (attempt > 5) throw err;
        const backoff = 2000 * 2 ** attempt;
        console.log(`  batch at ${offset} failed (${err.message}), retrying in ${backoff / 1000}s`);
        await new Promise((resolve) => setTimeout(resolve, backoff));
      }
    }
    if ((offset / BATCH) % 20 === 0) {
      console.log(`  ${Math.min(offset + BATCH, leis.length)}/${leis.length} queried, ${names.size} named`);
    }
    await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
  }
  writeOutput(names);
}

const mode = process.argv[2];
if (mode === "--from-file" && process.argv[3]) {
  await fromFile(process.argv[3]);
} else if (mode === "--from-api") {
  await fromApi();
} else {
  console.error("Usage: node scripts/extract-lei-names.mjs --from-file <path|->  |  --from-api");
  process.exit(1);
}
