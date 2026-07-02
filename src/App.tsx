import { useRef, useState } from "react";
import { Card, Segmented } from "./shyft";
import { SwiftLookup } from "./features/SwiftLookup";
import { IbanChecker } from "./features/IbanChecker";
import { RoutingLookup, SortCodeLookup } from "./features/DomesticLookup";
import { InfoSections } from "./features/InfoSections";
import { EASE, gsap, reducedMotion, SplitText, useGSAP } from "./lib/motion";

type Tool = "swift" | "iban" | "sortcode" | "routing";

const TOOL_PANELS: Record<Tool, () => React.JSX.Element> = {
  swift: SwiftLookup,
  iban: IbanChecker,
  sortcode: SortCodeLookup,
  routing: RoutingLookup,
};

export default function App() {
  const [tool, setTool] = useState<Tool>("swift");
  const rootRef = useRef<HTMLDivElement>(null);

  // Opening sequence: brand, copy and tool card rise in; the arch motifs
  // settle and then drift very slowly (the "movement" in the Shyft motif).
  useGSAP(
    () => {
      if (reducedMotion()) return;
      // Per-word rise on the headline (SplitText keeps the <em> styling
      // and adds an aria-label so screen readers get the full sentence).
      const split = new SplitText(".hero__title", { type: "words" });
      gsap
        .timeline({
          defaults: { ease: EASE },
          onComplete: () => split.revert(),
        })
        .from(".hero__brand", { y: -12, autoAlpha: 0, duration: 0.45, clearProps: "all" })
        .from(".hero__eyebrow", { y: 14, autoAlpha: 0, duration: 0.4, clearProps: "all" }, "-=0.2")
        .from(
          split.words,
          { y: 34, autoAlpha: 0, duration: 0.55, stagger: 0.06, clearProps: "all" },
          "-=0.25",
        )
        .from(".hero__subtitle", { y: 18, autoAlpha: 0, duration: 0.5, clearProps: "all" }, "-=0.35")
        .from(".tool-card", { y: 44, autoAlpha: 0, duration: 0.6, clearProps: "all" }, "-=0.3")
        .from(
          ".hero__chevrons span",
          { x: -14, autoAlpha: 0, stagger: 0.08, duration: 0.4, clearProps: "all" },
          "-=0.5",
        );
      gsap.from(".hero__arch--left", {
        scale: 0.85,
        autoAlpha: 0,
        duration: 0.9,
        transformOrigin: "bottom left",
        ease: EASE,
      });
      gsap.from(".hero__arch--right", {
        scale: 0.85,
        autoAlpha: 0,
        duration: 0.9,
        delay: 0.15,
        transformOrigin: "top right",
        ease: EASE,
      });
      gsap.to(".hero__arch--left", { y: -14, duration: 7, yoyo: true, repeat: -1, ease: "sine.inOut", delay: 1 });
      gsap.to(".hero__arch--right", { y: 12, duration: 8, yoyo: true, repeat: -1, ease: "sine.inOut", delay: 1 });
    },
    { scope: rootRef },
  );

  return (
    <div ref={rootRef}>
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
          <ToolPanel key={tool} tool={tool} />
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
    </div>
  );
}

/** Remounts per tool (via key), giving each tab switch a soft slide-in. */
function ToolPanel({ tool }: { tool: Tool }) {
  const ref = useRef<HTMLDivElement>(null);
  const Panel = TOOL_PANELS[tool];

  useGSAP(
    () => {
      if (reducedMotion() || !ref.current) return;
      gsap.from(ref.current, { y: 10, autoAlpha: 0, duration: 0.3, ease: EASE, clearProps: "all" });
    },
    { scope: ref },
  );

  return (
    <div ref={ref}>
      <Panel />
    </div>
  );
}
