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
