import { useState, type FormEvent } from "react";
import { Button, Callout, Card, CopyButton, Flag, Input, Skeleton, StatusPill, Tag } from "../shyft";
import { lookupSwift, ApiError, type SwiftRecord } from "../lib/api";
import {
  countryName,
  isValidSwiftFormat,
  normalizeSwift,
  splitSwift,
} from "../lib/validation";
import { SwiftBreakdown } from "./SwiftBreakdown";

const EXAMPLES = [
  { code: "CITIUS33XXX", name: "Citibank, US" },
  { code: "DEUTDEFF", name: "Deutsche Bank, DE" },
  { code: "BARCGB22", name: "Barclays, UK" },
  { code: "BOFAUS3N", name: "Bank of America, US" },
];

type Status =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "results"; query: string; records: SwiftRecord[] };

export function SwiftLookup() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [formatError, setFormatError] = useState<string | null>(null);

  async function search(rawCode: string) {
    const code = normalizeSwift(rawCode);
    if (!isValidSwiftFormat(code)) {
      setFormatError(
        "A SWIFT/BIC code is 8 or 11 characters: 4-letter bank, 2-letter country, 2-character location, optional 3-character branch.",
      );
      return;
    }
    setFormatError(null);
    setStatus({ kind: "loading" });
    try {
      const records = await lookupSwift(code);
      setStatus({ kind: "results", query: code, records });
    } catch (err) {
      setStatus({
        kind: "error",
        message: err instanceof ApiError ? err.message : "Something went wrong. Please try again.",
      });
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void search(query);
  }

  return (
    <div>
      <form className="search-form" onSubmit={onSubmit}>
        <label className="search-form__label" htmlFor="swift-input">
          Enter a SWIFT / BIC code
        </label>
        <div className="search-form__row">
          <Input
            id="swift-input"
            value={query}
            error={formatError !== null}
            onChange={(e) => {
              setQuery(e.target.value);
              setFormatError(null);
            }}
            placeholder="e.g. CITIUS33XXX"
            autoComplete="off"
            spellCheck={false}
            maxLength={14}
          />
          <Button type="submit" size="lg" loading={status.kind === "loading"}>
            Look up
          </Button>
        </div>
        {formatError && <p className="search-form__error">{formatError}</p>}
      </form>

      <div className="example-chips">
        <span className="sh-overline example-chips__label">Try</span>
        {EXAMPLES.map((example) => (
          <Tag
            key={example.code}
            mono
            onClick={() => {
              setQuery(example.code);
              void search(example.code);
            }}
          >
            {example.code}
          </Tag>
        ))}
      </div>

      {status.kind === "loading" && <ResultSkeleton />}
      {status.kind === "error" && <Callout tone="danger">{status.message}</Callout>}
      {status.kind === "results" && <SwiftResults query={status.query} records={status.records} />}
    </div>
  );
}

function SwiftResults({ query, records }: { query: string; records: SwiftRecord[] }) {
  if (records.length === 0) {
    return (
      <Callout tone="neutral">
        No bank found for <strong>{query}</strong>. The code is correctly formatted, but it isn't in
        the directory — double-check it with your bank or the recipient.
      </Callout>
    );
  }
  return (
    <div className="results-list">
      {records.map((record, index) => (
        <SwiftResultCard key={index} query={query} record={record} />
      ))}
    </div>
  );
}

function SwiftResultCard({ query, record }: { query: string; record: SwiftRecord }) {
  const code = normalizeSwift(String(record.swift_code ?? query));
  const parts = splitSwift(code);
  const bankName = record.bank_name ?? record.bank;
  const rawCountry = record.country_code ?? record.country ?? parts.country;
  const country = typeof rawCountry === "string" ? rawCountry : parts.country;
  const isHeadOffice = parts.branch === null || parts.branch === "XXX";

  const detailRows: { label: string; value: string; mono?: boolean }[] = [
    { label: "SWIFT / BIC code", value: code, mono: true },
    { label: "Bank code", value: parts.bank, mono: true },
    { label: "Country", value: countryName(country) },
    { label: "Location code", value: parts.location, mono: true },
    {
      label: "Branch code",
      value: parts.branch ? parts.branch : "— (8-character code, head office)",
      mono: Boolean(parts.branch),
    },
  ];
  if (typeof record.city === "string" && record.city) {
    detailRows.splice(3, 0, { label: "City", value: record.city });
  }
  if (typeof record.branch === "string" && record.branch) {
    detailRows.push({ label: "Branch name", value: record.branch });
  }

  return (
    <Card className="result-card">
      <div className="result-card__header">
        <div>
          {bankName != null && <h3 className="result-card__title">{String(bankName)}</h3>}
          <div className="result-card__badges">
            {isHeadOffice && <StatusPill tone="system">Head office</StatusPill>}
            <StatusPill tone="neutral">
              <Flag code={country} /> {countryName(country)}
            </StatusPill>
          </div>
        </div>
        <CopyButton text={code} label="Copy code" />
      </div>

      <SwiftBreakdown swift={code} />

      <dl className="shyft-rows">
        {detailRows.map((row) => (
          <div className="shyft-row" key={row.label}>
            <dt>{row.label}</dt>
            <dd className={row.mono ? "mono" : undefined}>{row.value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

function ResultSkeleton() {
  return (
    <Card className="result-card">
      <Skeleton width="45%" height={26} />
      <Skeleton width="70%" height={48} />
      <Skeleton width="100%" height={16} />
      <Skeleton width="100%" height={16} />
      <Skeleton width="60%" height={16} />
    </Card>
  );
}
