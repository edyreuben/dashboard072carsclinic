import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const payloadSchema = z.object({
  url: z.string().url(),
  payload: z.record(z.unknown()),
});

export type WebhookResult = {
  ok: boolean;
  status: number;
  error: string;
  body: string;
};

export type FetchResult = {
  ok: boolean;
  status: number;
  error: string;
  records: Record<string, unknown>[];
};

const TIMEOUT_MS = 12_000;

function responseError(status: number, statusText: string, body: string) {
  const message = body.trim().replace(/\s+/g, " ").slice(0, 300);
  return `HTTP ${status}: ${message || statusText || "Request failed"}`;
}

function networkError(error: unknown) {
  if (error instanceof Error && error.name === "AbortError") {
    return `Failed to fetch: Network timeout after ${TIMEOUT_MS / 1000} seconds`;
  }
  const message = error instanceof Error ? error.message : "Unknown network failure";
  return `Failed to fetch: ${message}`;
}

async function fetchWithTimeout(input: string | URL, init: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function recordsFromResponse(parsed: unknown): Record<string, unknown>[] | null {
  const isRecordArray = (value: unknown): value is Record<string, unknown>[] =>
    Array.isArray(value) && value.every((item) => item !== null && typeof item === "object");
  if (isRecordArray(parsed)) return parsed;
  if (parsed && typeof parsed === "object") {
    if (isRecordArray((parsed as { records?: unknown[] }).records)) {
      return (parsed as { records: Record<string, unknown>[] }).records;
    }
    if (isRecordArray((parsed as { data?: unknown[] }).data)) {
      return (parsed as { data: Record<string, unknown>[] }).data;
    }
  }
  return null;
}

export const sendWebhook = createServerFn({ method: "POST" })
  .inputValidator((data) => payloadSchema.parse(data))
  .handler(async ({ data }): Promise<WebhookResult> => {
    try {
      const res = await fetchWithTimeout(data.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data.payload),
      });
      const text = await res.text();
      const body = text.slice(0, 500);
      return {
        ok: res.ok,
        status: res.status,
        body,
        error: res.ok ? "" : responseError(res.status, res.statusText, text),
      };
    } catch (error) {
      return { ok: false, status: 0, body: "", error: networkError(error) };
    }
  });

const fetchSchema = z.object({
  url: z.string().url(),
  offset: z.number().int().min(0),
  limit: z.number().int().min(1).max(100),
});

export const fetchRecords = createServerFn({ method: "POST" })
  .inputValidator((data) => fetchSchema.parse(data))
  .handler(async ({ data }): Promise<FetchResult> => {
    try {
      const res = await fetchWithTimeout(data.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offset: data.offset, limit: data.limit }),
      });
      const text = await res.text();
      if (!res.ok) {
        return {
          ok: false,
          status: res.status,
          records: [],
          error: responseError(res.status, res.statusText, text),
        };
      }
      let parsed: unknown = [];
      try {
        parsed = text.trim() ? JSON.parse(text) : [];
      } catch {
        return {
          ok: false,
          status: res.status,
          records: [],
          error: `HTTP ${res.status}: Invalid JSON response`,
        };
      }
      const records = recordsFromResponse(parsed);
      if (!records) {
        return {
          ok: false,
          status: res.status,
          records: [],
          error: `HTTP ${res.status}: Invalid response shape; expected an array, records, or data`,
        };
      }
      return { ok: true, status: res.status, records, error: "" };
    } catch (error) {
      return { ok: false, status: 0, records: [], error: networkError(error) };
    }
  });

const fetchAllSchema = z.object({ url: z.string().url() });

export const fetchAllRecords = createServerFn({ method: "POST" })
  .inputValidator((data) => fetchAllSchema.parse(data))
  .handler(async ({ data }): Promise<FetchResult> => {
    const records: Record<string, unknown>[] = [];
    const seenPages = new Set<string>();
    try {
      for (let offset = 0; offset < 2000; offset += 100) {
        const url = new URL(data.url);
        url.searchParams.set("offset", String(offset));
        url.searchParams.set("limit", "100");
        const res = await fetchWithTimeout(url, {
          method: "GET",
          headers: { Accept: "application/json" },
        });
        const text = await res.text();
        if (!res.ok) {
          return {
            ok: false,
            status: res.status,
            records,
            error: responseError(res.status, res.statusText, text),
          };
        }
        let parsed: unknown;
        try {
          // A successful n8n webhook with an empty Google Sheet may return a
          // blank body. Treat that as an empty dataset, not a webhook error.
          parsed = text.trim() ? JSON.parse(text) : [];
        } catch {
          return {
            ok: false,
            status: res.status,
            records,
            error: `HTTP ${res.status}: Invalid JSON response`,
          };
        }
        const page = recordsFromResponse(parsed);
        if (!page) {
          return {
            ok: false,
            status: res.status,
            records,
            error: `HTTP ${res.status}: Invalid response shape; expected an array, records, or data`,
          };
        }
        if (!page.length) break;
        const fingerprint = JSON.stringify(page);
        if (seenPages.has(fingerprint)) break;
        seenPages.add(fingerprint);
        records.push(...page);
        if (page.length < 100) break;
      }
      return {
        ok: true,
        status: 200,
        records,
        error: "",
      };
    } catch (error) {
      return { ok: false, status: 0, records, error: networkError(error) };
    }
  });
