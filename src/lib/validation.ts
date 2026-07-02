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

/* ---------- IBAN ---------- */

export const IBAN_RE = /^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/;

export function normalizeIban(raw: string): string {
  return raw.replace(/\s+/g, "").toUpperCase();
}

export function isValidIbanFormat(iban: string): boolean {
  return IBAN_RE.test(iban);
}

/** ISO 13616 mod-97 checksum — instant client-side validity check. */
export function ibanChecksumValid(iban: string): boolean {
  if (!isValidIbanFormat(iban)) return false;
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  let remainder = 0;
  for (const char of rearranged) {
    const value = /[A-Z]/.test(char) ? String(char.charCodeAt(0) - 55) : char;
    for (const digit of value) {
      remainder = (remainder * 10 + Number(digit)) % 97;
    }
  }
  return remainder === 1;
}

export interface IbanParts {
  country: string;
  checkDigits: string;
  bban: string;
}

export function splitIban(iban: string): IbanParts {
  return {
    country: iban.slice(0, 2),
    checkDigits: iban.slice(2, 4),
    bban: iban.slice(4),
  };
}

/** Group an IBAN into blocks of 4 for display: GB29 NWBK 6016 ... */
export function prettyIban(iban: string): string {
  return iban.replace(/(.{4})/g, "$1 ").trim();
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

export function countryFlag(code: string): string {
  if (!/^[A-Z]{2}$/i.test(code)) return "";
  const upper = code.toUpperCase();
  return String.fromCodePoint(
    0x1f1e6 + upper.charCodeAt(0) - 65,
    0x1f1e6 + upper.charCodeAt(1) - 65,
  );
}
