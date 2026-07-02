/** SWIFT/BIC and IBAN parsing + validation helpers. */

/* ---------- SWIFT / BIC ---------- */

export const SWIFT_RE = /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/;

export function normalizeSwift(raw: string): string {
  return raw.replace(/\s+/g, "").toUpperCase();
}

export function isValidSwiftFormat(swift: string): boolean {
  return SWIFT_RE.test(swift);
}

export interface SwiftParts {
  bank: string;
  country: string;
  location: string;
  branch: string | null;
}

export function splitSwift(swift: string): SwiftParts {
  return {
    bank: swift.slice(0, 4),
    country: swift.slice(4, 6),
    location: swift.slice(6, 8),
    branch: swift.length === 11 ? swift.slice(8, 11) : null,
  };
}

/* ---------- IBAN display ----------
   (Validation lives in iban.ts, driven by the SWIFT IBAN Registry.) */

/** Group an IBAN into blocks of 4 for display: GB29 NWBK 6016 ... */
export function prettyIban(iban: string): string {
  return iban.replace(/(.{4})/g, "$1 ").trim();
}

/* ---------- UK sort code ---------- */

export const SORT_CODE_RE = /^\d{6}$/;

export function normalizeSortCode(raw: string): string {
  return raw.replace(/[\s-]+/g, "");
}

export function isValidSortCodeFormat(code: string): boolean {
  return SORT_CODE_RE.test(code);
}

/** 200000 -> 20-00-00 */
export function prettySortCode(code: string): string {
  return `${code.slice(0, 2)}-${code.slice(2, 4)}-${code.slice(4, 6)}`;
}

/* ---------- US ABA routing number ---------- */

export const ROUTING_RE = /^\d{9}$/;

export function normalizeRouting(raw: string): string {
  return raw.replace(/\s+/g, "");
}

export function isValidRoutingFormat(number: string): boolean {
  return ROUTING_RE.test(number);
}

/** ABA checksum: 3·(d1+d4+d7) + 7·(d2+d5+d8) + (d3+d6+d9) ≡ 0 (mod 10). */
export function abaChecksumValid(routing: string): boolean {
  if (!isValidRoutingFormat(routing)) return false;
  const d = [...routing].map(Number);
  return (3 * (d[0] + d[3] + d[6]) + 7 * (d[1] + d[4] + d[7]) + (d[2] + d[5] + d[8])) % 10 === 0;
}

/* ---------- Country helpers ---------- */

const regionNames =
  typeof Intl !== "undefined" && "DisplayNames" in Intl
    ? new Intl.DisplayNames(["en"], { type: "region" })
    : null;

export function countryName(code: string): string {
  if (!/^[A-Z]{2}$/i.test(code)) return code;
  try {
    return regionNames?.of(code.toUpperCase()) ?? code.toUpperCase();
  } catch {
    return code.toUpperCase();
  }
}
