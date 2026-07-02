/**
 * Client for our own Cloudflare Worker (/api/*), which proxies API Ninjas
 * server-side. Response shapes are treated defensively — fields may vary.
 */

export interface SwiftRecord {
  swift_code?: string;
  bank_name?: string;
  bank?: string;
  city?: string;
  branch?: string;
  country?: string;
  country_code?: string;
  [key: string]: unknown;
}

export interface IbanRecord {
  iban?: string;
  valid?: boolean;
  country?: string;
  country_code?: string;
  checksum?: string;
  check_digits?: string;
  bban?: string;
  bank_code?: string;
  branch_code?: string;
  account_number?: string;
  bank_name?: string;
  currency?: string;
  [key: string]: unknown;
}

export interface SortCodeRecord {
  sort_code?: string;
  bank_name?: string;
  bank?: string;
  branch?: string;
  city?: string;
  bic?: string;
  [key: string]: unknown;
}

export interface RoutingRecord {
  routing_number?: string;
  bank_name?: string;
  bank?: string;
  city?: string;
  state?: string;
  [key: string]: unknown;
}

export class ApiError extends Error {}

async function request<T>(path: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path);
  } catch {
    throw new ApiError("Network error — please check your connection and try again.");
  }

  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    /* non-JSON body handled below */
  }

  if (!response.ok) {
    const message =
      body && typeof body === "object" && "error" in body && typeof body.error === "string"
        ? body.error
        : "Something went wrong. Please try again.";
    throw new ApiError(message);
  }

  return body as T;
}

export async function lookupSwift(swift: string): Promise<SwiftRecord[]> {
  const body = await request<SwiftRecord[] | SwiftRecord>(
    `/api/swift?swift=${encodeURIComponent(swift)}`,
  );
  return toRecordList(body);
}

function toRecordList<T>(body: T[] | T | null): T[] {
  if (Array.isArray(body)) return body;
  if (body && typeof body === "object") return [body];
  return [];
}

export async function lookupSortCode(code: string): Promise<SortCodeRecord[]> {
  const body = await request<SortCodeRecord[] | SortCodeRecord>(
    `/api/sortcode?code=${encodeURIComponent(code)}`,
  );
  return toRecordList(body);
}

export async function lookupRouting(number: string): Promise<RoutingRecord[]> {
  const body = await request<RoutingRecord[] | RoutingRecord>(
    `/api/routing?number=${encodeURIComponent(number)}`,
  );
  return toRecordList(body);
}

export async function validateIban(iban: string): Promise<IbanRecord> {
  const body = await request<IbanRecord>(`/api/iban?iban=${encodeURIComponent(iban)}`);
  if (!body || typeof body !== "object") {
    throw new ApiError("Unexpected response from the lookup service.");
  }
  return body;
}
