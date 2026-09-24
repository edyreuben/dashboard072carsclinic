import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const payloadSchema = z.object({
  url: z.string().url(),
  payload: z.record(z.any()),
});

export const sendWebhook = createServerFn({ method: "POST" })
  .inputValidator((data) => payloadSchema.parse(data))
  .handler(async ({ data }) => {
    try {
      const res = await fetch(data.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data.payload),
      });
      const text = await res.text();
      return { ok: res.ok, status: res.status, body: text.slice(0, 500) };
    } catch (e) {
      return { ok: false, status: 0, body: (e as Error).message };
    }
  });

const fetchSchema = z.object({
  url: z.string().url(),
  offset: z.number().int().min(0),
  limit: z.number().int().min(1).max(100),
});

/** Fetches a page of records from an n8n "Get" webhook (server-side to avoid CORS). */
export const fetchRecords = createServerFn({ method: "POST" })
  .inputValidator((data) => fetchSchema.parse(data))
  .handler(async ({ data }) => {
    try {
      const res = await fetch(data.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offset: data.offset, limit: data.limit }),
      });
      const text = await res.text();
      if (!res.ok) return { ok: false, status: res.status, records: [] as unknown[] };
      let parsed: unknown = [];
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = [];
      }
      const records = Array.isArray(parsed)
        ? parsed
        : Array.isArray((parsed as { records?: unknown[] })?.records)
          ? (parsed as { records: unknown[] }).records
          : Array.isArray((parsed as { data?: unknown[] })?.data)
            ? (parsed as { data: unknown[] }).data
            : [];
      return { ok: true, status: res.status, records };
    } catch {
      return { ok: false, status: 0, records: [] as unknown[] };
    }
  });
