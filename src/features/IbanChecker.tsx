import { useState, type FormEvent } from "react";
import { Badge, Button, Callout, Card, Chip, CopyButton, Input, Skeleton } from "../shyft";
import { validateIban, ApiError, type IbanRecord } from "../lib/api";
import {
  countryFlag,
  countryName,
  ibanChecksumValid,
  isValidIbanFormat,
  normalizeIban,
  prettyIban,
  splitIban,
} from "../lib/validation";

const EXAMPLES = [
  { code: "GB29NWBK60161331926819", name: "UK" },
  { code: "DE89370400440532013000", name: "Germany" },
  { code: "FR1420041010050500013M02606", name: "France" },
];

type Status =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "result"; iban: string; record: IbanRecord };

export function IbanChecker() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [formatError, setFormatError] = useState<string | null>(null);

  async function check(rawIban: string) {
    const iban = normalizeIban(rawIban);
    if (!isValidIbanFormat(iban)) {
      setFormatError(
        "An IBAN starts with a 2-letter country code and 2 check digits, followed by up to 30 characters, e.g. GB29 NWBK 6016 1331 9268 19.",
      );
      return;
    }
    setFormatError(null);

    // Instant local mod-97 check — no need to hit the API for a bad checksum.
    if (!ibanChecksumValid(iban)) {
      setStatus({ kind: "result", iban, record: { iban, valid: false } });
      return;
    }

    setStatus({ kind: "loading" });
    try {
      const record = await validateIban(iban);
      setStatus({ kind: "result", iban, record });
    } catch (err) {
      setStatus({
        kind: "error",
        message: err instanceof ApiError ? err.message : "Something went wrong. Please try again.",
      });
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void check(query);
  }

  return (
    <div>
      <form className="search-form" onSubmit={onSubmit}>
        <label className="search-form__label" htmlFor="iban-input">
          Enter an IBAN
        </label>
        <div className="search-form__row">
          <Input
            id="iban-input"
            value={query}
            error={formatError !== null}
            onChange={(e) => {
              setQuery(e.target.value);
              setFormatError(null);
            }}
            placeholder="e.g. GB29 NWBK 6016 1331 9268 19"
            autoComplete="off"
            spellCheck={false}
            maxLength={42}
          />
          <Button type="submit" size="lg" loading={status.kind === "loading"}>
            Validate
          </Button>
        </div>
        {formatError && <p className="search-form__error">{formatError}</p>}
      </form>

      <div className="example-chips">
        <span className="example-chips__label">Try:</span>
        {EXAMPLES.map((example) => (
          <Chip
            key={example.code}
            onClick={() => {
              setQuery(example.code);
              void check(example.code);
            }}
          >
            {example.code.slice(0, 12)}…
          </Chip>
        ))}
      </div>

      {status.kind === "loading" && <ResultSkeleton />}
      {status.kind === "error" && <Callout tone="danger">{status.message}</Callout>}
      {status.kind === "result" && <IbanResultCard iban={status.iban} record={status.record} />}
    </div>
  );
}

const FIELD_LABELS: Record<string, string> = {
  bank_name: "Bank",
  bank_code: "Bank code",
  branch_code: "Branch code",
  account_number: "Account number",
  currency: "Currency",
  city: "City",
};

function IbanResultCard({ iban, record }: { iban: string; record: IbanRecord }) {
  const parts = splitIban(iban);
  const rawCountry = record.country_code ?? record.country ?? parts.country;
  const country = typeof rawCountry === "string" && /^[A-Z]{2}$/i.test(rawCountry)
    ? rawCountry
    : parts.country;
  // The API omitting `valid` shouldn't flag a checksum-valid IBAN as invalid.
  const valid = record.valid !== false;

  const detailRows: { label: string; value: string; mono?: boolean }[] = [
    { label: "IBAN", value: prettyIban(iban), mono: true },
    { label: "Country", value: `${countryFlag(country)} ${countryName(country)}`.trim() },
    { label: "Check digits", value: parts.checkDigits, mono: true },
    { label: "BBAN", value: typeof record.bban === "string" && record.bban ? record.bban : parts.bban, mono: true },
  ];
  for (const [key, label] of Object.entries(FIELD_LABELS)) {
    const value = record[key];
    if (typeof value === "string" && value) {
      detailRows.push({ label, value, mono: key.endsWith("_code") || key === "account_number" });
    }
  }

  return (
    <Card className="result-card">
      <div className="result-card__header">
        <div>
          <h3 className="result-card__title">{prettyIban(iban)}</h3>
          <div className="result-card__badges">
            {valid ? (
              <Badge tone="success">✓ Valid IBAN</Badge>
            ) : (
              <Badge tone="danger">✕ Invalid IBAN</Badge>
            )}
            <Badge>{countryFlag(country)} {countryName(country)}</Badge>
          </div>
        </div>
        <CopyButton text={iban} label="Copy IBAN" />
      </div>

      {valid ? (
        <>
          <dl className="shyft-rows">
            {detailRows.map((row) => (
              <div className="shyft-row" key={row.label}>
                <dt>{row.label}</dt>
                <dd className={row.mono ? "mono" : undefined}>{row.value}</dd>
              </div>
            ))}
          </dl>
          <Callout tone="neutral">
            A valid IBAN means the structure and checksum are correct — it doesn't guarantee the
            account exists. Always confirm details with the recipient before sending money.
          </Callout>
        </>
      ) : (
        <Callout tone="danger">
          This IBAN fails the checksum test — one or more characters are wrong or out of order.
          Re-check it with the account holder before making a transfer.
        </Callout>
      )}
    </Card>
  );
}

function ResultSkeleton() {
  return (
    <Card className="result-card">
      <Skeleton width="55%" height={26} />
      <Skeleton width="100%" height={16} />
      <Skeleton width="100%" height={16} />
      <Skeleton width="60%" height={16} />
    </Card>
  );
}
