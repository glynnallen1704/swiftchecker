/**
 * Cloudflare Worker: bank-code API.
 *
 * /api/iban is served entirely in-house from the SWIFT IBAN Registry
 * (src/lib/iban.ts) — no external API, no key, no quota.
 *
 * /api/swift, /api/sortcode and /api/routing proxy to API Ninjas (bank-name
 * directories are licensed data). The browser never sees the API key — this
 * worker attaches it server-side, and responses are cached at the edge
 * (bank data changes rarely) to conserve API quota.
 */
import { validateIban } from "../src/lib/iban";

interface Env {
  API_NINJAS_KEY: string;
  /** Test seam: override the API Ninjas base URL (e.g. a local mock in dev). */
  API_NINJAS_BASE?: string;
  /** Test seam: override the postcodes.io base URL. */
  POSTCODES_BASE?: string;
  /** Test seam: override the GLEIF API base URL. */
  GLEIF_API_BASE?: string;
  ASSETS: Fetcher;
}

const API_BASE = "https://api.api-ninjas.com/v1";
const CACHE_TTL_SECONDS = 60 * 60 * 24; // 24h — SWIFT/IBAN bank data is static
// Bump to invalidate all edge-cached lookups (e.g. after changing response shaping).
const CACHE_VERSION = "7";

const SWIFT_RE = /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
const SORT_CODE_RE = /^\d{6}$/;
const ROUTING_RE = /^\d{9}$/;

/** ABA checksum: 3·(d1+d4+d7) + 7·(d2+d5+d8) + (d3+d6+d9) ≡ 0 (mod 10). */
function abaChecksumValid(routing: string): boolean {
  const d = [...routing].map(Number);
  return (3 * (d[0] + d[3] + d[6]) + 7 * (d[1] + d[4] + d[7]) + (d[2] + d[5] + d[8])) % 10 === 0;
}

function json(body: unknown, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": status === 200 ? `public, max-age=${CACHE_TTL_SECONDS}` : "no-store",
      ...extraHeaders,
    },
  });
}

interface LeiInfo {
  lei: string;
  /** Registered legal name from GLEIF Level-1 data, when extracted. */
  name: string | null;
}

/**
 * BIC -> LEI lookup from GLEIF's open mapping file, sharded into static
 * assets by the first two BIC characters (see scripts/generate-lei-map.mjs).
 * Shard values are either "LEI" or ["LEI", "LEGAL NAME"].
 */
async function lookupLei(bic: string, origin: string, env: Env): Promise<LeiInfo | null> {
  const full = bic.length === 8 ? `${bic}XXX` : bic;
  try {
    const shard = await env.ASSETS.fetch(new Request(`${origin}/lei-map/${full.slice(0, 2)}.json`));
    if (!shard.ok) return null;
    const map = (await shard.json()) as Record<string, string | [string, string]>;
    const entry = map[full];
    if (!entry) return null;
    return Array.isArray(entry) ? { lei: entry[0], name: entry[1] } : { lei: entry, name: null };
  } catch {
    return null;
  }
}

interface FallbackBank {
  n: string;
  c?: string;
  b?: string;
}

/**
 * BIC -> bank details from the MIT-licensed community dataset
 * (github.com/br99bry/swift-bank-codes), sharded into static assets by
 * scripts/generate-swift-fallback.mjs. Used only when the primary lookup
 * has no result.
 */
async function lookupFallbackBank(
  bic: string,
  origin: string,
  env: Env,
): Promise<{ bic: string; bank: FallbackBank } | null> {
  try {
    const shard = await env.ASSETS.fetch(
      new Request(`${origin}/swift-fallback/${bic.slice(0, 2)}.json`),
    );
    if (!shard.ok) return null;
    const map = (await shard.json()) as Record<string, FallbackBank>;
    // Try the exact code, then head-office variants (8 <-> 11 chars).
    const candidates =
      bic.length === 11
        ? [bic, ...(bic.endsWith("XXX") ? [bic.slice(0, 8)] : [])]
        : [bic, `${bic}XXX`];
    for (const candidate of candidates) {
      if (map[candidate]) return { bic: candidate, bank: map[candidate] };
    }
    return null;
  } catch {
    return null;
  }
}

interface GleifAddress {
  addressLines?: string[];
  city?: string;
  region?: string;
  country?: string;
  postalCode?: string;
}

function formatGleifAddress(address: GleifAddress | undefined): string | null {
  if (!address) return null;
  const parts = [
    ...(address.addressLines ?? []),
    address.city,
    address.region,
    address.postalCode,
    address.country,
  ].filter((part): part is string => typeof part === "string" && part.length > 0);
  return parts.length > 0 ? parts.join(", ") : null;
}

/**
 * Live LEI record details from GLEIF's free public API, reduced to the
 * fields worth showing and edge-cached for a day.
 */
async function handleLeiRecord(lei: string, url: URL, env: Env, ctx: ExecutionContext): Promise<Response> {
  const cache = caches.default;
  const cacheKey = new Request(`${url.origin}/api/lei-record?lei=${lei}&cv=${CACHE_VERSION}`);
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  let upstream: Response;
  try {
    const base = env.GLEIF_API_BASE ?? "https://api.gleif.org";
    upstream = await fetch(`${base}/api/v1/lei-records/${encodeURIComponent(lei)}`, {
      headers: { Accept: "application/vnd.api+json" },
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    return json({ error: "The GLEIF registry is unreachable right now. Please try again." }, 502);
  }
  if (upstream.status === 404) {
    return json({ error: "No GLEIF record found for this LEI." }, 404);
  }
  if (!upstream.ok) {
    return json({ error: "The GLEIF registry returned an error. Please try again." }, 502);
  }

  const record = (await upstream.json()) as {
    data?: {
      attributes?: {
        entity?: {
          legalName?: { name?: string };
          status?: string;
          jurisdiction?: string;
          legalForm?: { id?: string };
          legalAddress?: GleifAddress;
          headquartersAddress?: GleifAddress;
        };
        registration?: {
          initialRegistrationDate?: string;
          lastUpdateDate?: string;
          nextRenewalDate?: string;
          status?: string;
        };
      };
    };
  };
  const entity = record.data?.attributes?.entity;
  const registration = record.data?.attributes?.registration;
  const date = (value: string | undefined) => (value ? value.slice(0, 10) : null);

  const response = json({
    lei,
    legal_name: entity?.legalName?.name ?? null,
    entity_status: entity?.status ?? null,
    jurisdiction: entity?.jurisdiction ?? null,
    legal_address: formatGleifAddress(entity?.legalAddress),
    hq_address: formatGleifAddress(entity?.headquartersAddress),
    registration_status: registration?.status ?? null,
    registered_at: date(registration?.initialRegistrationDate),
    last_updated: date(registration?.lastUpdateDate),
    next_renewal: date(registration?.nextRenewalDate),
    gleif_url: `https://search.gleif.org/#/record/${lei}`,
  });
  ctx.waitUntil(cache.put(cacheKey, response.clone()));
  return response;
}

/**
 * UK postcode -> coordinates via postcodes.io (free, open, no key).
 * Failures degrade to "no map" — never block the lookup itself.
 */
async function geocodeUkPostcode(
  postcode: string,
  env: Env,
): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const base = env.POSTCODES_BASE ?? "https://api.postcodes.io";
    const response = await fetch(`${base}/postcodes/${encodeURIComponent(postcode)}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return null;
    const body = (await response.json()) as {
      result?: { latitude?: number; longitude?: number };
    };
    const { latitude, longitude } = body.result ?? {};
    return typeof latitude === "number" && typeof longitude === "number"
      ? { latitude, longitude }
      : null;
  } catch {
    return null;
  }
}

/** Attach coordinates to sort-code records that have a postcode but no lat/lon. */
async function enrichWithUkGeo(data: unknown, env: Env): Promise<unknown> {
  const records = Array.isArray(data) ? data : data && typeof data === "object" ? [data] : [];
  if (records.length === 0) return data;
  const first = records[0] as Record<string, unknown>;
  if (first.latitude != null || typeof first.postcode !== "string" || !first.postcode) {
    return data;
  }
  const geo = await geocodeUkPostcode(first.postcode, env);
  if (!geo) return data;
  return records.map((record) => ({
    ...(record as Record<string, unknown>),
    latitude: geo.latitude,
    longitude: geo.longitude,
    geo_source: "postcode",
  }));
}

async function handleSwift(
  swift: string,
  url: URL,
  env: Env,
  ctx: ExecutionContext,
): Promise<Response> {
  const cache = caches.default;
  const cacheKey = new Request(`${url.origin}/api/swift?swift=${swift}&cv=${CACHE_VERSION}`);
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  let upstreamOk = false;
  let records: Record<string, unknown>[] = [];
  try {
    const base = env.API_NINJAS_BASE ?? API_BASE;
    const upstream = await fetch(`${base}/swiftcode?swift=${encodeURIComponent(swift)}`, {
      headers: { "X-Api-Key": env.API_NINJAS_KEY },
    });
    if (upstream.ok) {
      upstreamOk = true;
      const data = stripPremiumPlaceholders(JSON.parse((await upstream.text()) || "null"));
      records = Array.isArray(data)
        ? (data as Record<string, unknown>[])
        : data && typeof data === "object"
          ? [data as Record<string, unknown>]
          : [];
    }
  } catch {
    /* treated as upstream failure below */
  }

  // Primary returned records, but possibly with gaps (e.g. premium-gated
  // bank name stripped) — fill missing fields from the community directory.
  if (records.length > 0 && records.some((r) => !r.bank_name || !r.city || !r.branch)) {
    const fallback = await lookupFallbackBank(swift, url.origin, env);
    if (fallback) {
      records = records.map((record) => {
        const filled = { ...record };
        let usedCommunity = false;
        if (!filled.bank_name && fallback.bank.n) {
          filled.bank_name = fallback.bank.n;
          usedCommunity = true;
        }
        if (!filled.city && fallback.bank.c) {
          filled.city = fallback.bank.c;
          usedCommunity = true;
        }
        if (!filled.branch && fallback.bank.b) {
          filled.branch = fallback.bank.b;
          usedCommunity = true;
        }
        if (usedCommunity) filled.source = "mixed";
        return filled;
      });
    }
  }

  // Fill gaps (or ride out an outage) from the community directory.
  if (records.length === 0) {
    const fallback = await lookupFallbackBank(swift, url.origin, env);
    if (fallback) {
      records = [
        {
          swift_code: fallback.bic,
          bank_name: fallback.bank.n,
          ...(fallback.bank.c && { city: fallback.bank.c }),
          ...(fallback.bank.b && { branch: fallback.bank.b }),
          country_code: fallback.bic.slice(4, 6),
          source: "community",
        },
      ];
    } else if (!upstreamOk) {
      return json({ error: "Lookup service returned an error. Please try again." }, 502);
    }
  }

  const leiInfo = await lookupLei(swift, url.origin, env);
  const body = leiInfo
    ? records.map((record) => ({
        ...record,
        lei: leiInfo.lei,
        ...(leiInfo.name && { lei_name: leiInfo.name }),
      }))
    : records;

  // Don't cache fallback results served during an upstream outage — the
  // primary source should win again as soon as it recovers.
  const response = json(body, 200, upstreamOk ? {} : { "Cache-Control": "no-store" });
  if (upstreamOk) ctx.waitUntil(cache.put(cacheKey, response.clone()));
  return response;
}

async function proxyToApiNinjas(
  upstreamPath: string,
  cacheKeyUrl: string,
  env: Env,
  ctx: ExecutionContext,
  transform?: (data: unknown) => Promise<unknown>,
): Promise<Response> {
  const cache = caches.default;
  const cacheKey = new Request(`${cacheKeyUrl}&cv=${CACHE_VERSION}`);

  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  let upstream: Response;
  try {
    const base = env.API_NINJAS_BASE ?? API_BASE;
    upstream = await fetch(`${base}${upstreamPath}`, {
      headers: { "X-Api-Key": env.API_NINJAS_KEY },
    });
  } catch {
    return json({ error: "Upstream lookup service is unreachable. Please try again." }, 502);
  }

  if (!upstream.ok) {
    // Don't leak upstream error bodies (they may reference the provider/key).
    const status = upstream.status === 429 ? 429 : 502;
    const message =
      upstream.status === 429
        ? "Rate limit reached. Please try again in a moment."
        : "Lookup service returned an error. Please try again.";
    return json({ error: message }, status);
  }

  const body = await upstream.text();
  let data = stripPremiumPlaceholders(JSON.parse(body || "null"));
  if (transform) data = await transform(data);
  const response = json(data);
  ctx.waitUntil(cache.put(cacheKey, response.clone()));
  return response;
}

/**
 * On free API Ninjas plans, premium-gated fields come back with their value
 * replaced by a "This field is for premium subscribers only." string. Drop
 * those fields entirely so they never reach (or get cached for) clients.
 */
const PREMIUM_PLACEHOLDER_RE = /premium subscribers only/i;

function stripPremiumPlaceholders(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stripPremiumPlaceholders);
  }
  if (value && typeof value === "object") {
    const cleaned: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value)) {
      if (typeof entry === "string" && PREMIUM_PLACEHOLDER_RE.test(entry)) continue;
      cleaned[key] = stripPremiumPlaceholders(entry);
    }
    return cleaned;
  }
  return value;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (!url.pathname.startsWith("/api/")) {
      return env.ASSETS.fetch(request);
    }

    if (request.method !== "GET") {
      return json({ error: "Method not allowed" }, 405);
    }

    // Served in-house from the SWIFT IBAN Registry — no key or upstream call.
    if (url.pathname === "/api/iban") {
      const raw = url.searchParams.get("iban") ?? "";
      if (!/^[\sA-Za-z0-9]{1,50}$/.test(raw)) {
        return json({ error: "Invalid IBAN format, e.g. GB29NWBK60161331926819." }, 400);
      }
      const result = validateIban(raw);
      return json({
        iban: result.iban,
        valid: result.valid,
        ...(result.failure && { error_code: result.failure.code, reason: result.failure.message }),
        country_code: result.countryCode,
        country_name: result.countryName,
        sepa: result.sepa,
        check_digits: result.checkDigits,
        bban: result.bban,
        bank_code: result.bankCode,
        branch_code: result.branchCode,
      });
    }

    // Served in-house from GLEIF's open BIC->LEI mapping — no key needed.
    if (url.pathname === "/api/lei") {
      const bic = (url.searchParams.get("bic") ?? "").trim().toUpperCase();
      if (!SWIFT_RE.test(bic)) {
        return json({ error: "Invalid BIC format. Expected 8 or 11 characters, e.g. CITIUS33XXX." }, 400);
      }
      const info = await lookupLei(bic, url.origin, env);
      return json({
        bic,
        lei: info?.lei ?? null,
        ...(info?.name && { name: info.name }),
        ...(info && { gleif_url: `https://search.gleif.org/#/record/${info.lei}` }),
      });
    }

    // Live LEI record details via GLEIF's free API — no key needed.
    if (url.pathname === "/api/lei-record") {
      const lei = (url.searchParams.get("lei") ?? "").trim().toUpperCase();
      if (!/^[A-Z0-9]{20}$/.test(lei)) {
        return json({ error: "Invalid LEI format. Expected 20 characters." }, 400);
      }
      return handleLeiRecord(lei, url, env, ctx);
    }

    if (!env.API_NINJAS_KEY) {
      return json({ error: "Server is not configured with an API key." }, 500);
    }

    if (url.pathname === "/api/swift") {
      const swift = (url.searchParams.get("swift") ?? "").trim().toUpperCase();
      if (!SWIFT_RE.test(swift)) {
        return json({ error: "Invalid SWIFT/BIC format. Expected 8 or 11 characters, e.g. CITIUS33XXX." }, 400);
      }
      return handleSwift(swift, url, env, ctx);
    }

    if (url.pathname === "/api/sortcode") {
      const code = (url.searchParams.get("code") ?? "").replace(/[\s-]+/g, "");
      if (!SORT_CODE_RE.test(code)) {
        return json({ error: "Invalid sort code format. Expected 6 digits, e.g. 20-00-00." }, 400);
      }
      return proxyToApiNinjas(
        `/sortcode?sort_code=${encodeURIComponent(code)}`,
        `${url.origin}/api/sortcode?code=${code}`,
        env,
        ctx,
        (data) => enrichWithUkGeo(data, env),
      );
    }

    if (url.pathname === "/api/routing") {
      const number = (url.searchParams.get("number") ?? "").replace(/\s+/g, "");
      if (!ROUTING_RE.test(number)) {
        return json({ error: "Invalid routing number format. Expected 9 digits, e.g. 021000021." }, 400);
      }
      if (!abaChecksumValid(number)) {
        return json(
          { error: "This routing number fails the ABA checksum — one or more digits are wrong." },
          400,
        );
      }
      return proxyToApiNinjas(
        `/routingnumber?routing_number=${encodeURIComponent(number)}`,
        `${url.origin}/api/routing?number=${number}`,
        env,
        ctx,
      );
    }

    return json({ error: "Not found" }, 404);
  },
} satisfies ExportedHandler<Env>;
