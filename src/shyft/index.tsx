/**
 * Shyft Design System — React components.
 * Thin wrappers over the shyft.css component classes.
 */
import { useState, type ReactNode, type ButtonHTMLAttributes, type InputHTMLAttributes } from "react";

/* ---------- Button ---------- */

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "md" | "lg";
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  children,
  className = "",
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`shyft-btn shyft-btn--${variant} shyft-btn--${size} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <span className="shyft-spinner" aria-hidden="true" />}
      {children}
    </button>
  );
}

/* ---------- Input ---------- */

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export function Input({ error = false, className = "", ...rest }: InputProps) {
  return (
    <input
      className={`shyft-input ${error ? "shyft-input--error" : ""} ${className}`}
      {...rest}
    />
  );
}

/* ---------- Card ---------- */

export function Card({
  raised = false,
  className = "",
  children,
}: {
  raised?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`shyft-card ${raised ? "shyft-card--raised" : ""} ${className}`}>
      {children}
    </div>
  );
}

/* ---------- Badge ---------- */

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "accent" | "success" | "danger";
  children: ReactNode;
}) {
  const toneClass = tone === "neutral" ? "" : `shyft-badge--${tone}`;
  return <span className={`shyft-badge ${toneClass}`}>{children}</span>;
}

/* ---------- Segmented control ---------- */

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
}) {
  return (
    <div className="shyft-segmented" role="tablist" aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          key={option.value}
          role="tab"
          aria-selected={option.value === value}
          className="shyft-segmented__option"
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/* ---------- Chip ---------- */

export function Chip({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button type="button" className="shyft-chip" onClick={onClick}>
      {children}
    </button>
  );
}

/* ---------- Callout ---------- */

export function Callout({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "success" | "danger";
  children: ReactNode;
}) {
  return (
    <div className={`shyft-callout shyft-callout--${tone}`} role={tone === "danger" ? "alert" : "status"}>
      {children}
    </div>
  );
}

/* ---------- Skeleton ---------- */

export function Skeleton({ width, height = 16 }: { width: string; height?: number }) {
  return <div className="shyft-skeleton" style={{ width, height }} aria-hidden="true" />;
}

/* ---------- Accordion ---------- */

export function Accordion({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="shyft-accordion">
      <summary>{title}</summary>
      <div className="shyft-accordion__body">{children}</div>
    </details>
  );
}

/* ---------- Copy button ---------- */

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable — ignore */
    }
  }

  return (
    <Button variant="ghost" size="md" onClick={copy} aria-live="polite">
      {copied ? "Copied ✓" : label}
    </Button>
  );
}
