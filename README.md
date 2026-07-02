# SwiftChecker

A beautiful, simple **bank code checker** — SWIFT/BIC lookup, IBAN validation, UK sort codes and
US ABA routing numbers. Built with Vite + React, hosted on **Cloudflare Workers**, powered by the
[SWIFT Code](https://api-ninjas.com/api/swiftcode), [IBAN](https://api-ninjas.com/api/iban),
[Sort Code](https://api-ninjas.com/api/sortcode) and
[Routing Number](https://api-ninjas.com/api/routingnumber) APIs from API Ninjas, and styled with
the **Shyft design system**.

Inspired by the way [Wise presents SWIFT codes](https://wise.com/gb/swift-codes/CITIUS33XXX):
a big friendly search, a color-coded anatomy of the code, clean detail rows, and plain-language
explainers.

## Architecture

```
Browser ──> Cloudflare Worker (same origin)
              ├── /api/iban?iban=...        ── fully in-house (SWIFT IBAN Registry), no API key
              ├── /api/swift?swift=...      ─┐
              ├── /api/sortcode?code=...     │ attaches X-Api-Key server-side,
              ├── /api/routing?number=...   ─┘ validates input, caches 24h at the edge
              └── everything else ──> static Vite build (SPA)
```

- **IBAN validation is 100% in-house** — no paid API involved. `data/iban-registry.tsv` (the
  SWIFT IBAN Registry) is compiled by `scripts/generate-iban-registry.mjs` into
  `src/lib/iban-registry.ts`: per-country IBAN length, BBAN structure, bank/branch identifier
  positions and SEPA membership for 89 countries. The engine (`src/lib/iban.ts`) runs
  country-specific length + structure checks, the ISO 13616 mod-97 checksum, and extracts the
  bank and branch codes. The generator verifies every country against the registry's own example
  IBANs, so a bad transcription fails the build, not the user. The browser validates locally
  (instant, offline-capable); `/api/iban` exposes the same engine for API consumers.
- **The API Ninjas key never reaches the browser.** Bank-*name* directories (SWIFT BIC directory,
  UK EISCD, US Fed routing directory) are licensed data, so SWIFT/sort-code/routing lookups proxy
  to `api.api-ninjas.com` with the key attached server-side, 24h edge caching, and US
  routing-number ABA checksums verified client- and worker-side before spending quota.

## Local development

```bash
npm install
cp .dev.vars.example .dev.vars   # then paste your API Ninjas key into .dev.vars
npm run dev                      # Vite dev server + Workers runtime, http://localhost:5173
```

## Deploy to Cloudflare

```bash
npx wrangler login
npx wrangler secret put API_NINJAS_KEY   # paste your key when prompted
npm run deploy
```

Or connect the repo to [Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/)
in the Cloudflare dashboard (build command `npm run build`, deploy command `npx wrangler deploy`)
and add `API_NINJAS_KEY` as a secret in the Worker's settings.

## The Shyft design system

The site is styled with the **Shyft Design System v1.0** (synced from the owner's Claude Design
project). Key brand rules applied here: Azure `#156dff` primary with Gable Green `#1b2b3a` ink and
Bright Blue `#00b5ef` accent; Inter throughout (Black 900 display, tight tracking) with JetBrains
Mono for codes and figures; 14–20px card radii with full-pill CTAs; soft gable-green-tinted
shadows; the deconstructed-arrow arch motif on Azure covers; sentence case; status pills in
uppercase; real country flags (via the `flag-icons` package), never emoji.

Layout in [`src/shyft/`](src/shyft):

- [`tokens/`](src/shyft/tokens) — color, typography, spacing and radius tokens **vendored
  verbatim** from the DS bundle (including the `[data-theme="dark"]` palette). Don't hand-edit;
  re-sync from the source design project.
- [`components.css`](src/shyft/components.css) + [`index.tsx`](src/shyft/index.tsx) — React
  components matching the DS component specs: `Button`, `Input`, `Card`, `StatusPill`, `Tag`,
  `Segmented`, `Callout`, `Skeleton`, `Accordion`, `Flag`, `CopyButton`.
- Official logo SVGs live in [`public/brand/`](public/brand).

## Project layout

```
worker/index.ts          Cloudflare Worker — API proxy, validation, edge caching
src/shyft/               Shyft design system (tokens, CSS, components)
src/lib/validation.ts    SWIFT/IBAN parsing, mod-97 checksum, country helpers
src/lib/api.ts           typed client for /api/*
src/features/            SwiftLookup, IbanChecker, SwiftBreakdown, InfoSections
src/App.tsx              page shell (hero, tool card, footer)
wrangler.jsonc           Worker + static assets config (SPA fallback, /api/* routing)
```

> **Disclaimer:** data is for reference only — always confirm payment details with your bank or
> the recipient before transferring money.
