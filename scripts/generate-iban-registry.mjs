/**
 * Generates src/lib/iban-registry.ts from data/iban-registry.tsv — the
 * SWIFT IBAN Registry table (rows = data elements, columns = countries).
 *
 * Every country's generated spec is verified against the registry's own
 * "IBAN electronic format example": length, structure regex and ISO 13616
 * mod-97 checksum must all pass, or generation aborts.
 *
 * Usage: node scripts/generate-iban-registry.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";

const SOURCE = new URL("../data/iban-registry.tsv", import.meta.url);
const TARGET = new URL("../src/lib/iban-registry.ts", import.meta.url);

const text = readFileSync(SOURCE, "utf8");

// Only the rows above "Contact details" matter; later rows contain quoted
// multi-line address cells that a line-based parser must not touch.
const lines = text.split("\n");
const rows = new Map();
for (const line of lines) {
  const cells = line.split("\t").map((cell) => cell.trim());
  const label = cells[0];
  if (label === "Contact details") break;
  if (label) rows.set(label, cells.slice(1));
}

function need(label) {
  const row = rows.get(label);
  if (!row) throw new Error(`Registry row not found: "${label}"`);
  return row;
}

const names = need("Name of country");
const codes = need("IBAN prefix country code (ISO 3166)");
const sepa = need("SEPA country");
const bbanStructures = need("BBAN structure");
const bankPositions = need("Bank identifier position within the BBAN");
const branchPositions = need("Branch identifier position within the BBAN");
const ibanLengths = need("IBAN length");
const examples = need("IBAN electronic format example");

/** Excel-style TSV quoting: strip wrapping quotes, unescape "" -> ". */
function unquote(cell) {
  if (cell.startsWith('"') && cell.endsWith('"')) {
    return cell.slice(1, -1).replace(/""/g, '"');
  }
  return cell;
}

/** "4!n4!n12!c" -> regex source. n=digits, a=letters, c=alphanumeric. */
function structureToRegexSource(structure) {
  const CLASSES = { n: "[0-9]", a: "[A-Z]", c: "[A-Z0-9]" };
  let out = "";
  let rest = structure;
  while (rest.length > 0) {
    const match = /^(\d+)!([nac])/.exec(rest);
    if (!match) throw new Error(`Unparseable structure token in "${structure}" at "${rest}"`);
    out += `${CLASSES[match[2]]}{${match[1]}}`;
    rest = rest.slice(match[0].length);
  }
  return out;
}

/** "1-4" -> {start, end} (1-indexed, inclusive); ""/"N/A" -> null. */
function parseRange(cell, code) {
  if (!cell || cell === "N/A") return null;
  const match = /^(\d+)\s*-\s*(\d+)$/.exec(cell);
  if (!match) throw new Error(`${code}: unparseable position range "${cell}"`);
  return { start: Number(match[1]), end: Number(match[2]) };
}

/** ISO 13616 mod-97 — same algorithm the site uses. */
function mod97Valid(iban) {
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  let remainder = 0;
  for (const char of rearranged) {
    const value = /[A-Z]/.test(char) ? String(char.charCodeAt(0) - 55) : char;
    for (const digit of value) remainder = (remainder * 10 + Number(digit)) % 97;
  }
  return remainder === 1;
}

const specs = [];
const failures = [];

for (let i = 0; i < codes.length; i++) {
  const code = codes[i];
  if (!/^[A-Z]{2}$/.test(code)) continue;

  const spec = {
    code,
    name: unquote(names[i]),
    ibanLength: Number(ibanLengths[i]),
    bbanRegex: structureToRegexSource(bbanStructures[i]),
    sepa: sepa[i] === "Yes",
    bank: parseRange(bankPositions[i], code),
    branch: parseRange(branchPositions[i], code),
    example: examples[i],
  };

  // ---- verify the spec against the registry's own example IBAN ----
  const example = spec.example;
  const problems = [];
  if (!example) problems.push("no example IBAN");
  if (example && example.length !== spec.ibanLength) {
    problems.push(`example length ${example.length} != declared ${spec.ibanLength}`);
  }
  if (example && example.slice(0, 2) !== code) problems.push("example prefix mismatch");
  if (example && !new RegExp(`^${spec.bbanRegex}$`).test(example.slice(4))) {
    problems.push(`example BBAN does not match structure ${bbanStructures[i]}`);
  }
  if (example && !mod97Valid(example)) problems.push("example fails mod-97 checksum");
  if (spec.bank && spec.bank.end > spec.ibanLength - 4) problems.push("bank range out of bounds");
  if (spec.branch && spec.branch.end > spec.ibanLength - 4) {
    problems.push("branch range out of bounds");
  }

  if (problems.length > 0) {
    failures.push(`${code} (${spec.name}): ${problems.join("; ")}`);
  }
  specs.push(spec);
}

if (failures.length > 0) {
  console.error(`Verification FAILED for ${failures.length} countries:`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

const entries = specs
  .map((spec) => {
    const bank = spec.bank ? `{ start: ${spec.bank.start}, end: ${spec.bank.end} }` : "null";
    const branch = spec.branch
      ? `{ start: ${spec.branch.start}, end: ${spec.branch.end} }`
      : "null";
    return `  ${spec.code}: { name: ${JSON.stringify(spec.name)}, ibanLength: ${spec.ibanLength}, bbanRegex: ${JSON.stringify(spec.bbanRegex)}, sepa: ${spec.sepa}, bank: ${bank}, branch: ${branch}, example: ${JSON.stringify(spec.example)} },`;
  })
  .join("\n");

const output = `/**
 * IBAN country specifications from the SWIFT IBAN Registry.
 *
 * GENERATED FILE — do not edit by hand.
 * Source: data/iban-registry.tsv
 * Regenerate: node scripts/generate-iban-registry.mjs
 * (The generator verifies every entry against the registry's own
 * example IBANs — length, structure and mod-97 checksum.)
 */

export interface IbanFieldRange {
  /** 1-indexed inclusive positions within the BBAN. */
  start: number;
  end: number;
}

export interface IbanSpec {
  name: string;
  /** Full IBAN length, including country code and check digits. */
  ibanLength: number;
  /** Regex source matching the entire BBAN (anchor it when using). */
  bbanRegex: string;
  sepa: boolean;
  bank: IbanFieldRange | null;
  branch: IbanFieldRange | null;
  example: string;
}

export const IBAN_REGISTRY: Record<string, IbanSpec> = {
${entries}
};
`;

writeFileSync(TARGET, output);
console.log(`OK: ${specs.length} countries generated, all examples verified.`);
