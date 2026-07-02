import { useRef, useState, type FormEvent } from "react";
import { useResultCardIntro } from "../lib/motion";
import { Button, Callout, Card, CopyButton, Flag, Input, StatusPill, Tag } from "../shyft";
import { validateIban, type IbanResult } from "../lib/iban";
import { prettyIban } from "../lib/validation";

const EXAMPLES = [
  { code: "GB29NWBK60161331926819", name: "UK" },
  { code: "DE89370400440532013000", name: "Germany" },
  { code: "FR1420041010050500013M02606", name: "France" },
];

export function IbanChecker() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<IbanResult | null>(null);

  // Validation is fully in-house (SWIFT IBAN Registry data + mod-97),
  // so checking is synchronous — no API call, no loading state.
  function check(rawIban: string) {
    setResult(validateIban(rawIban));
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    check(query);
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
            error={result !== null && result.failure?.code === "format"}
            onChange={(e) => {
              setQuery(e.target.value);
              setResult(null);
            }}
            placeholder="e.g. GB29 NWBK 6016 1331 9268 19"
            autoComplete="off"
            spellCheck={false}
            maxLength={42}
          />
          <Button type="submit" size="lg">
            Validate
          </Button>
        </div>
      </form>

      <div className="example-chips">
        <span className="sh-overline example-chips__label">Try</span>
        {EXAMPLES.map((example) => (
          <Tag
            key={example.code}
            mono
            onClick={() => {
              setQuery(example.code);
              check(example.code);
            }}
          >
            {example.code.slice(0, 12)}…
          </Tag>
        ))}
      </div>

      {result !== null && <IbanResultCard result={result} />}
    </div>
  );
}

function IbanResultCard({ result }: { result: IbanResult }) {
  const cardRef = useRef<HTMLDivElement>(null);
  useResultCardIntro(cardRef);
  const detailRows: { label: string; value: string; mono?: boolean }[] = [];
  if (result.valid) {
    detailRows.push(
      { label: "IBAN", value: prettyIban(result.iban), mono: true },
      { label: "Country", value: result.countryName ?? result.countryCode ?? "", mono: false },
      { label: "SEPA member", value: result.sepa ? "Yes" : "No" },
      { label: "Check digits", value: result.checkDigits ?? "", mono: true },
    );
    if (result.bankCode) {
      detailRows.push({ label: "Bank code", value: result.bankCode, mono: true });
    }
    if (result.branchCode) {
      detailRows.push({ label: "Branch code", value: result.branchCode, mono: true });
    }
    detailRows.push({ label: "BBAN", value: result.bban ?? "", mono: true });
  }

  return (
    <div ref={cardRef}>
    <Card className="result-card">
      <div className="result-card__header">
        <div>
          <h3 className="result-card__title mono">{prettyIban(result.iban)}</h3>
          <div className="result-card__badges">
            {result.valid ? (
              <StatusPill tone="positive">IBAN · valid</StatusPill>
            ) : (
              <StatusPill tone="negative">IBAN · invalid</StatusPill>
            )}
            {result.countryCode && result.countryName && (
              <StatusPill tone="neutral">
                <Flag code={result.countryCode} /> {result.countryName}
              </StatusPill>
            )}
            {result.sepa && <StatusPill tone="system">SEPA</StatusPill>}
          </div>
        </div>
        <CopyButton text={result.iban} label="Copy IBAN" />
      </div>

      {result.valid ? (
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
            Checked against the SWIFT IBAN Registry: country format, length and checksum all pass.
            A valid IBAN doesn't guarantee the account exists — always confirm details with the
            recipient before sending money.
          </Callout>
        </>
      ) : (
        <Callout tone="danger">{result.failure?.message}</Callout>
      )}
    </Card>
    </div>
  );
}
