import { useRef, useState, type FormEvent } from "react";
import { useResultCardIntro } from "../lib/motion";
import { Button, Callout, Card, CopyButton, Flag, Input, Skeleton, StatusPill, Tag } from "../shyft";
import { OsmMapCard } from "./OsmMapCard";
import { ApiError, lookupRouting, lookupSortCode } from "../lib/api";
import {
  abaChecksumValid,
  countryName,
  isValidRoutingFormat,
  isValidSortCodeFormat,
  normalizeRouting,
  normalizeSortCode,
  prettySortCode,
} from "../lib/validation";

/**
 * Shared UI for the two domestic bank-code tools: UK sort codes and
 * US ABA routing numbers. Both are digit codes that resolve to a
 * single bank/branch, so they share one lookup panel.
 */
interface LookupConfig {
  inputId: string;
  label: string;
  placeholder: string;
  maxLength: number;
  examples: string[];
  country: string;
  codeLabel: string;
  normalize: (raw: string) => string;
  validate: (code: string) => string | null;
  pretty: (code: string) => string;
  fetchRecords: (code: string) => Promise<Record<string, unknown>[]>;
}

const SORT_CODE_CONFIG: LookupConfig = {
  inputId: "sortcode-input",
  label: "Enter a UK sort code",
  placeholder: "e.g. 20-00-00",
  maxLength: 8,
  examples: ["20-00-00", "04-00-04", "60-16-13"],
  country: "GB",
  codeLabel: "Sort code",
  normalize: normalizeSortCode,
  validate: (code) =>
    isValidSortCodeFormat(code)
      ? null
      : "A sort code is 6 digits, usually written as three pairs, e.g. 20-00-00.",
  pretty: prettySortCode,
  fetchRecords: lookupSortCode,
};

const ROUTING_CONFIG: LookupConfig = {
  inputId: "routing-input",
  label: "Enter a US routing number",
  placeholder: "e.g. 021000021",
  maxLength: 11,
  examples: ["021000021", "026009593", "121000248"],
  country: "US",
  codeLabel: "Routing number",
  normalize: normalizeRouting,
  validate: (number) => {
    if (!isValidRoutingFormat(number)) {
      return "An ABA routing number is exactly 9 digits, e.g. 021000021.";
    }
    if (!abaChecksumValid(number)) {
      return "This routing number fails the ABA checksum — one or more digits are wrong or out of order.";
    }
    return null;
  },
  pretty: (number) => number,
  fetchRecords: lookupRouting,
};

export function SortCodeLookup() {
  return <DomesticLookup config={SORT_CODE_CONFIG} />;
}

export function RoutingLookup() {
  return <DomesticLookup config={ROUTING_CONFIG} />;
}

type Status =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "results"; code: string; records: Record<string, unknown>[] };

function DomesticLookup({ config }: { config: LookupConfig }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [formatError, setFormatError] = useState<string | null>(null);

  async function search(raw: string) {
    const code = config.normalize(raw);
    const validationError = config.validate(code);
    if (validationError) {
      setFormatError(validationError);
      return;
    }
    setFormatError(null);
    setStatus({ kind: "loading" });
    try {
      const records = await config.fetchRecords(code);
      setStatus({ kind: "results", code, records });
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
        <label className="search-form__label" htmlFor={config.inputId}>
          {config.label}
        </label>
        <div className="search-form__row">
          <Input
            id={config.inputId}
            value={query}
            error={formatError !== null}
            onChange={(e) => {
              setQuery(e.target.value);
              setFormatError(null);
            }}
            placeholder={config.placeholder}
            autoComplete="off"
            spellCheck={false}
            inputMode="numeric"
            maxLength={config.maxLength}
          />
          <Button type="submit" size="lg" loading={status.kind === "loading"}>
            Look up
          </Button>
        </div>
        {formatError && <p className="search-form__error">{formatError}</p>}
      </form>

      <div className="example-chips">
        <span className="sh-overline example-chips__label">Try</span>
        {config.examples.map((example) => (
          <Tag
            key={example}
            mono
            onClick={() => {
              setQuery(example);
              void search(example);
            }}
          >
            {example}
          </Tag>
        ))}
      </div>

      {status.kind === "loading" && <ResultSkeleton />}
      {status.kind === "error" && <Callout tone="danger">{status.message}</Callout>}
      {status.kind === "results" && (
        <DomesticResults config={config} code={status.code} records={status.records} />
      )}
    </div>
  );
}

function DomesticResults({
  config,
  code,
  records,
}: {
  config: LookupConfig;
  code: string;
  records: Record<string, unknown>[];
}) {
  if (records.length === 0) {
    return (
      <Callout tone="neutral">
        No bank found for <strong>{config.pretty(code)}</strong>. The format is correct, but it
        isn't in the directory — double-check it with your bank or the recipient.
      </Callout>
    );
  }
  return (
    <div className="results-list">
      {records.map((record, index) => (
        <DomesticResultCard key={index} config={config} code={code} record={record} />
      ))}
    </div>
  );
}

/** Friendly labels for fields we expect; anything else falls back to prettified keys. */
const KNOWN_LABELS: Record<string, string> = {
  bank_name: "Bank",
  bank: "Bank",
  branch: "Branch",
  city: "City",
  state: "State",
  address: "Address",
  zip: "ZIP code",
  phone: "Phone",
  bic: "BIC",
  swift_code: "SWIFT / BIC code",
};

const HIDDEN_FIELDS = new Set([
  "sort_code",
  "routing_number",
  "country",
  "country_code",
  // shown as the map card instead of rows
  "latitude",
  "longitude",
  "geo_source",
]);
const MONO_FIELDS = new Set(["bic", "swift_code", "zip", "phone"]);

function prettifyKey(key: string): string {
  const label = key.replace(/_/g, " ");
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function asCoordinate(value: unknown): number | null {
  const num = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(num) ? num : null;
}

function DomesticResultCard({
  config,
  code,
  record,
}: {
  config: LookupConfig;
  code: string;
  record: Record<string, unknown>;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  useResultCardIntro(cardRef);
  const bankName = record.bank_name ?? record.bank;
  const latitude = asCoordinate(record.latitude);
  const longitude = asCoordinate(record.longitude);
  const placeLabel = [record.postcode ?? record.zip_code, record.city, record.state]
    .filter((part) => typeof part === "string" && part)
    .join(", ");

  const detailRows: { label: string; value: string; mono?: boolean }[] = [
    { label: config.codeLabel, value: config.pretty(code), mono: true },
  ];
  const seenLabels = new Set([KNOWN_LABELS.bank_name]);
  for (const [key, value] of Object.entries(record)) {
    if (HIDDEN_FIELDS.has(key)) continue;
    if (typeof value !== "string" && typeof value !== "number") continue;
    if (value === "") continue;
    const label = KNOWN_LABELS[key] ?? prettifyKey(key);
    if (seenLabels.has(label)) continue;
    seenLabels.add(label);
    detailRows.push({ label, value: String(value), mono: MONO_FIELDS.has(key) });
  }

  return (
    <div ref={cardRef}>
    <Card className="result-card">
      <div className="result-card__header">
        <div>
          <h3 className={`result-card__title ${bankName == null ? "mono" : ""}`}>
            {bankName != null ? String(bankName) : config.pretty(code)}
          </h3>
          <div className="result-card__badges">
            <StatusPill tone="system">{config.codeLabel}</StatusPill>
            <StatusPill tone="neutral">
              <Flag code={config.country} /> {countryName(config.country)}
            </StatusPill>
          </div>
        </div>
        <CopyButton text={config.pretty(code)} label="Copy" />
      </div>

      <dl className="shyft-rows">
        {detailRows.map((row) => (
          <div className="shyft-row" key={row.label}>
            <dt>{row.label}</dt>
            <dd className={row.mono ? "mono" : undefined}>{row.value}</dd>
          </div>
        ))}
      </dl>

      {latitude !== null && longitude !== null && (
        <OsmMapCard
          latitude={latitude}
          longitude={longitude}
          label={placeLabel || config.pretty(code)}
        />
      )}
    </Card>
    </div>
  );
}

function ResultSkeleton() {
  return (
    <Card className="result-card">
      <Skeleton width="45%" height={26} />
      <Skeleton width="100%" height={16} />
      <Skeleton width="100%" height={16} />
      <Skeleton width="60%" height={16} />
    </Card>
  );
}
