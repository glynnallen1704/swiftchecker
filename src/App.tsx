import { useState } from "react";
import { Card, Segmented } from "./shyft";
import { SwiftLookup } from "./features/SwiftLookup";
import { IbanChecker } from "./features/IbanChecker";
import { RoutingLookup, SortCodeLookup } from "./features/DomesticLookup";
import { InfoSections } from "./features/InfoSections";

type Tool = "swift" | "iban" | "sortcode" | "routing";

const TOOL_PANELS: Record<Tool, () => React.JSX.Element> = {
  swift: SwiftLookup,
  iban: IbanChecker,
  sortcode: SortCodeLookup,
  routing: RoutingLookup,
};

export default function App() {
  const [tool, setTool] = useState<Tool>("swift");
  const Panel = TOOL_PANELS[tool];

  return (
    <>
      <header className="hero">
        <div className="hero__arch hero__arch--left" aria-hidden="true" />
        <div className="hero__arch hero__arch--right" aria-hidden="true" />
        <div className="hero__chevrons" aria-hidden="true">
          <span /><span /><span />
        </div>
        <div className="hero__inner">
          <div className="hero__brand">
            <img src="/brand/shyft-logo-white.svg" alt="Shyft" />
            <span className="hero__brand-divider" aria-hidden="true" />
            <span className="hero__brand-product">SwiftChecker</span>
          </div>
          <p className="sh-overline hero__eyebrow">Swift · IBAN · Sort code · Routing</p>
          <h1 className="hero__title">
            Check bank codes <em>before</em> the money moves
          </h1>
          <p className="hero__subtitle">
            Look up SWIFT/BIC codes, UK sort codes and US routing numbers, or validate an IBAN —
            free, accurate and built for international payments.
          </p>
        </div>
      </header>

      <main className="main">
        <Card tone="raised" className="tool-card">
          <div className="tool-card__tabs">
            <Segmented<Tool>
              ariaLabel="Choose a tool"
              value={tool}
              onChange={setTool}
              options={[
                { value: "swift", label: "SWIFT / BIC" },
                { value: "iban", label: "IBAN" },
                { value: "sortcode", label: "UK sort code" },
                { value: "routing", label: "US routing" },
              ]}
            />
          </div>
          <Panel />
        </Card>

        <InfoSections />
      </main>

      <footer className="footer">
        <div className="footer__inner">
          <div className="footer__brand">
            <img src="/brand/shyft-logo-white.svg" alt="Shyft" />
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
