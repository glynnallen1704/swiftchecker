/**
 * Cloudflare Worker: API proxy for API Ninjas.
 *
 * The browser never sees the API Ninjas key — it calls /api/* on our own
 * origin and this worker attaches the key server-side. Responses are cached
 * at the edge (bank/SWIFT data changes rarely) to conserve API quota.
 */

interface Env {
  API_NINJAS_KEY: string;
  ASSETS: Fetcher;
}

const API_BASE = "https://api.api-ninjas.com/v1";
const CACHE_TTL_SECONDS = 60 * 60 * 24; // 24h — SWIFT/IBAN bank data is static

const SWIFT_RE = /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
const IBAN_RE = /^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$/;

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
  const cacheKey = new Request(cacheKeyUrl);

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
  const response = json(JSON.parse(body || "null"));
  ctx.waitUntil(cache.put(cacheKey, response.clone()));
  return response;
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

    if (url.pathname === "/api/iban") {
      const iban = (url.searchParams.get("iban") ?? "").replace(/\s+/g, "").toUpperCase();
      if (!IBAN_RE.test(iban)) {
        return json({ error: "Invalid IBAN format, e.g. GB29NWBK60161331926819." }, 400);
      }
      return proxyToApiNinjas(
        `/iban?iban=${encodeURIComponent(iban)}`,
        `${url.origin}/api/iban?iban=${iban}`,
        env,
        ctx,
      );
    }

    return json({ error: "Not found" }, 404);
  },
} satisfies ExportedHandler<Env>;
