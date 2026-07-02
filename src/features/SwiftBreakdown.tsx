import { splitSwift } from "../lib/validation";

const SEGMENTS = [
  { key: "bank", label: "Bank code", varName: "--seg-1" },
  { key: "country", label: "Country", varName: "--seg-2" },
  { key: "location", label: "Location", varName: "--seg-3" },
  { key: "branch", label: "Branch", varName: "--seg-4" },
] as const;

/** Wise-style visual anatomy of a SWIFT/BIC code with color-coded segments. */
export function SwiftBreakdown({ swift }: { swift: string }) {
  const parts = splitSwift(swift);

  return (
    <div className="swift-breakdown">
      <div className="swift-breakdown__code" aria-label={`SWIFT code ${swift}`}>
        {SEGMENTS.map(({ key, varName }) => {
          const value = parts[key];
          if (!value) return null;
          return (
            <span
              key={key}
              className="swift-breakdown__segment"
              style={{ borderBottomColor: `var(${varName})` }}
            >
              {value}
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
