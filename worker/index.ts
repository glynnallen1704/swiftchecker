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
  ASSETS: Fetcher;
}

const API_BASE = "https://api.api-ninjas.com/v1";
const CACHE_TTL_SECONDS = 60 * 60 * 24; // 24h — SWIFT/IBAN bank data is static
// Bump to invalidate all edge-cached lookups (e.g. after changing response shaping).
const CACHE_VERSION = "2";

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

async function proxyToApiNinjas(
  upstreamPath: string,
  cacheKeyUrl: string,
  env: Env,
  ctx: ExecutionContext,
): Promise<Response> {
  const cache = caches.default;
  const cacheKey = new Request(`${cacheKeyUrl}&cv=${CACHE_VERSION}`);

  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  let upstream: Response;
  try {
    upstream = await fetch(`${API_BASE}${upstreamPath}`, {
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
  const response = json(stripPremiumPlaceholders(JSON.parse(body || "null")));
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

    if (!env.API_NINJAS_KEY) {
      return json({ error: "Server is not configured with an API key." }, 500);
    }

    if (url.pathname === "/api/swift") {
      const swift = (url.searchParams.get("swift") ?? "").trim().toUpperCase();
      if (!SWIFT_RE.test(swift)) {
        return json({ error: "Invalid SWIFT/BIC format. Expected 8 or 11 characters, e.g. CITIUS33XXX." }, 400);
      }
      return proxyToApiNinjas(
        `/swiftcode?swift=${encodeURIComponent(swift)}`,
        `${url.origin}/api/swift?swift=${swift}`,
        env,
        ctx,
      );
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
