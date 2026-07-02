import { useState } from "react";
import { Card, Segmented } from "./shyft";
import { SwiftLookup } from "./features/SwiftLookup";
import { IbanChecker } from "./features/IbanChecker";
import { InfoSections } from "./features/InfoSections";

type Tool = "swift" | "iban";

export default function App() {
  const [tool, setTool] = useState<Tool>("swift");

  return (
    <>
      <header className="hero">
        <div className="hero__inner">
          <div className="hero__brand">
            <BrandMark />
            <span className="hero__brand-name">SwiftChecker</span>
          </div>
          <h1 className="hero__title">
            Check bank codes <em>before</em> the money moves
          </h1>
          <p className="hero__subtitle">
            Look up any SWIFT/BIC code or validate an IBAN in seconds — free, accurate and built
            for international payments.
          </p>
        </div>
      </header>

      <main className="main">
        <Card raised className="tool-card">
          <div className="tool-card__tabs">
            <Segmented<Tool>
              ariaLabel="Choose a tool"
              value={tool}
              onChange={setTool}
              options={[
                { value: "swift", label: "SWIFT / BIC lookup" },
                { value: "iban", label: "IBAN validator" },
              ]}
            />
          </div>
          {tool === "swift" ? <SwiftLookup /> : <IbanChecker />}
        </Card>

        <InfoSections />
      </main>

      <footer className="footer">
        <div className="footer__inner">
          <div className="footer__brand">
            <BrandMark />
            <span>SwiftChecker</span>
          </div>
          <p className="footer__disclaimer">
            Bank data provided by{" "}
            <a href="https://api-ninjas.com" rel="noopener noreferrer" target="_blank">
              API Ninjas
            </a>
            . This tool is for reference only — always confirm payment details with your bank or
            the recipient before transferring money.
          </p>
        </div>
      </footer>
    </>
  );
}

function BrandMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="var(--shyft-accent)" />
      <path
        d="M9 20.5c1.4 1.6 3.6 2.5 6 2.5 3.6 0 6-1.7 6-4.4 0-2.4-1.6-3.6-4.9-4.3l-2-.4c-1.7-.4-2.5-.9-2.5-1.9 0-1.2 1.3-2 3.2-2 1.9 0 3.5.7 4.6 1.9l1.9-2.2C19.8 8.1 17.6 7.2 15 7.2c-3.4 0-5.9 1.8-5.9 4.4 0 2.4 1.7 3.6 4.7 4.2l2.1.5c1.9.4 2.6 1 2.6 2 0 1.3-1.4 2.1-3.4 2.1-2.1 0-4-.9-5.2-2.3L9 20.5z"
        fill="var(--shyft-ink-deep)"
      />
    </svg>
  );
}
