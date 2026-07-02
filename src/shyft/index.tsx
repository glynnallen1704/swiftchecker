/**
 * Shyft Design System — React components.
 * Mirrors the DS bundle's component set (Button, Input, Card, Tag,
 * StatusPill, …) as thin wrappers over the components.css classes.
 */
import { useState, type ReactNode, type ButtonHTMLAttributes, type InputHTMLAttributes } from "react";

/* ---------- Button ---------- */

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
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
  tone = "default",
  className = "",
  children,
}: {
  tone?: "default" | "raised" | "brand";
  className?: string;
  children: ReactNode;
}) {
  const toneClass = tone === "default" ? "" : `shyft-card--${tone}`;
  return <div className={`shyft-card ${toneClass} ${className}`}>{children}</div>;
}

/* ---------- StatusPill ---------- */

export function StatusPill({
  tone = "system",
  children,
}: {
  tone?: "system" | "neutral" | "positive" | "negative";
  children: ReactNode;
}) {
  return <span className={`shyft-pill shyft-pill--${tone}`}>{children}</span>;
}

/* ---------- Tag ---------- */

export function Tag({
  children,
  selected = false,
  mono = false,
  onClick,
}: {
  children: ReactNode;
  selected?: boolean;
  mono?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      className={`shyft-tag ${selected ? "shyft-tag--selected" : ""} ${mono ? "shyft-tag--mono" : ""}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

/* ---------- Segmented (Tag group) ---------- */

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
          className={`shyft-tag ${option.value === value ? "shyft-tag--selected" : ""}`}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
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

/* ---------- Flag — real country flags (flag-icons), never emoji ---------- */

export function Flag({ code }: { code: string }) {
  if (!/^[A-Z]{2}$/i.test(code)) return null;
  return (
    <span
      className={`fi fi-${code.toLowerCase()} shyft-flag`}
      role="img"
      aria-label={`${code.toUpperCase()} flag`}
    />
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
    <Button variant="secondary" size="sm" onClick={copy} aria-live="polite">
      {copied ? "Copied" : label}
    </Button>
  );
}
