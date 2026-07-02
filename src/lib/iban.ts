/**
 * In-house IBAN validation engine, driven by the SWIFT IBAN Registry
 * (see iban-registry.ts). No external API involved: country-specific
 * length + structure checks, ISO 13616 mod-97 checksum, and extraction
 * of the bank / branch identifiers the registry defines.
 *
 * Kept free of DOM/Intl dependencies so the Cloudflare Worker and the
 * browser share the exact same logic.
 */
import { IBAN_REGISTRY, type IbanSpec, type IbanFieldRange } from "./iban-registry";

export type IbanFailure =
  | { code: "format"; message: string }
  | { code: "unknown_country"; message: string }
  | { code: "length"; message: string }
  | { code: "structure"; message: string }
  | { code: "checksum"; message: string };

export interface IbanResult {
  iban: string;
  valid: boolean;
  failure: IbanFailure | null;
  /** Present when the country is in the registry (even for invalid IBANs). */
  countryCode: string | null;
  countryName: string | null;
  sepa: boolean | null;
  /** Present only for valid IBANs. */
  checkDigits: string | null;
  bban: string | null;
  bankCode: string | null;
  branchCode: string | null;
}

const GENERAL_IBAN_RE = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$/;

export function normalizeIban(raw: string): string {
  return raw.replace(/\s+/g, "").toUpperCase();
}

/** ISO 13616 mod-97. */
export function ibanChecksumValid(iban: string): boolean {
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

function slice(bban: string, range: IbanFieldRange | null): string | null {
  return range ? bban.slice(range.start - 1, range.end) : null;
}

function invalid(
  iban: string,
  failure: IbanFailure,
  countryCode: string | null = null,
  spec: IbanSpec | null = null,
): IbanResult {
  return {
    iban,
    valid: false,
    failure,
    countryCode,
    countryName: spec?.name ?? null,
    sepa: spec?.sepa ?? null,
    checkDigits: null,
    bban: null,
    bankCode: null,
    branchCode: null,
  };
}

export function validateIban(rawIban: string): IbanResult {
  const iban = normalizeIban(rawIban);

  if (!GENERAL_IBAN_RE.test(iban)) {
    return invalid(iban, {
      code: "format",
      message:
        "An IBAN starts with a 2-letter country code and 2 check digits, followed by up to 30 letters or digits.",
    });
  }

  const countryCode = iban.slice(0, 2);
  const spec: IbanSpec | undefined = IBAN_REGISTRY[countryCode];
  if (!spec) {
    return invalid(
      iban,
      {
        code: "unknown_country",
        message: `"${countryCode}" is not an IBAN-issuing country in the SWIFT IBAN Registry. Some countries (like the US) don't use IBANs at all.`,
      },
      countryCode,
    );
  }

  if (iban.length !== spec.ibanLength) {
    return invalid(
      iban,
      {
        code: "length",
        message: `A ${spec.name} IBAN is exactly ${spec.ibanLength} characters — this one is ${iban.length}.`,
      },
      countryCode,
      spec,
    );
  }

  const bban = iban.slice(4);
  if (!new RegExp(`^${spec.bbanRegex}$`).test(bban)) {
    return invalid(
      iban,
      {
        code: "structure",
        message: `This doesn't match the national format for ${spec.name} — a letter or digit is in the wrong place.`,
      },
      countryCode,
      spec,
    );
  }

  if (!ibanChecksumValid(iban)) {
    return invalid(
      iban,
      {
        code: "checksum",
        message:
          "The structure is right for this country, but the checksum fails — one or more characters are wrong or out of order.",
      },
      countryCode,
      spec,
    );
  }

  return {
    iban,
    valid: true,
    failure: null,
    countryCode,
    countryName: spec.name,
    sepa: spec.sepa,
    checkDigits: iban.slice(2, 4),
    bban,
    bankCode: slice(bban, spec.bank),
    branchCode: slice(bban, spec.branch),
  };
}
