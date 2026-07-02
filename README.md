# SwiftChecker

A beautiful, simple **SWIFT/BIC code lookup** and **IBAN validator** — built with Vite + React,
hosted on **Cloudflare Workers**, powered by the
[API Ninjas SWIFT Code](https://api-ninjas.com/api/swiftcode) and
[IBAN](https://api-ninjas.com/api/iban) APIs, and styled with the in-repo **Shyft design system**.

Inspired by the way [Wise presents SWIFT codes](https://wise.com/gb/swift-codes/CITIUS33XXX):
a big friendly search, a color-coded anatomy of the code, clean detail rows, and plain-language
explainers.

## Architecture

```
Browser ──> Cloudflare Worker (same origin)
              ├── /api/swift?swift=...   ─┐ attaches X-Api-Key server-side,
              ├── /api/iban?iban=...     ─┘ validates input, caches 24h at the edge
              └── everything else ──> static Vite build (SPA)
```

- **The API Ninjas key never reaches the browser.** The React app only calls `/api/*` on its own
  origin; the Worker (`worker/index.ts`) adds the key and proxies to `api.api-ninjas.com`.
- Responses are cached at the Cloudflare edge for 24 hours (bank data is nearly static), which
  keeps API quota usage low.
- IBAN checksums (ISO 13616 mod-97) are verified client-side first, so obviously mistyped IBANs
  get instant feedback without an API call.

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

A small token-driven system in [`src/shyft/`](src/shyft):

- [`tokens.css`](src/shyft/tokens.css) — colors (deep forest ink `#0c231e`, lime accent
  `#b0f26d`, warm surfaces), type (Inter + Fraunces italic for emphasis, mono for codes), radii
  (pill geometry), elevation, motion.
- [`shyft.css`](src/shyft/shyft.css) — component classes.
- [`index.tsx`](src/shyft/index.tsx) — React components: `Button`, `Input`, `Card`, `Badge`,
  `Segmented`, `Chip`, `Callout`, `Skeleton`, `Accordion`, `CopyButton`.

Re-theming the whole site is a matter of editing the tokens file.

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
