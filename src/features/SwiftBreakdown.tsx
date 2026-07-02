import { useRef } from "react";
import { splitSwift } from "../lib/validation";
import { EASE, gsap, reducedMotion, useGSAP } from "../lib/motion";

const SEGMENTS = [
  { key: "bank", label: "Bank code", varName: "--seg-1" },
  { key: "country", label: "Country", varName: "--seg-2" },
  { key: "location", label: "Location", varName: "--seg-3" },
  { key: "branch", label: "Branch", varName: "--seg-4" },
] as const;

/** Wise-style visual anatomy of a SWIFT/BIC code with color-coded segments. */
export function SwiftBreakdown({ swift }: { swift: string }) {
  const parts = splitSwift(swift);
  const ref = useRef<HTMLDivElement>(null);

  // Segments rise in, then their colored underlines draw left-to-right —
  // triggered on scroll so it also plays in the explainer section.
  useGSAP(
    () => {
      if (reducedMotion() || !ref.current) return;
      gsap
        .timeline({
          defaults: { ease: EASE },
          scrollTrigger: { trigger: ref.current, start: "top 90%", once: true },
        })
        .from(".swift-breakdown__segment", {
          y: 10,
          autoAlpha: 0,
          duration: 0.4,
          stagger: 0.07,
          clearProps: "all",
        })
        .from(
          ".swift-breakdown__underline",
          { scaleX: 0, transformOrigin: "left center", duration: 0.45, stagger: 0.07, clearProps: "all" },
          "-=0.35",
        )
        .from(
          ".swift-breakdown__legend-item",
          { autoAlpha: 0, duration: 0.3, stagger: 0.05, clearProps: "all" },
          "-=0.25",
        );
    },
    { scope: ref },
  );

  return (
    <div className="swift-breakdown" ref={ref}>
      <div className="swift-breakdown__code" aria-label={`SWIFT code ${swift}`}>
        {SEGMENTS.map(({ key, varName }) => {
          const value = parts[key];
          if (!value) return null;
          return (
            <span key={key} className="swift-breakdown__segment">
              {value}
              <span
                className="swift-breakdown__underline"
                style={{ background: `var(${varName})` }}
                aria-hidden="true"
              />
            </span>
          );
        })}
      </div>
      <div className="swift-breakdown__legend">
        {SEGMENTS.map(({ key, label, varName }) => {
          if (!parts[key]) return null;
          return (
            <span key={key} className="swift-breakdown__legend-item">
              <span
                className="swift-breakdown__dot"
                style={{ background: `var(${varName})` }}
              />
              {label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
