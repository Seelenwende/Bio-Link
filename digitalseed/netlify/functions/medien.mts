import type { Config, Context } from "@netlify/functions";
import { ID_PATTERN } from "../lib/common.mts";
import { ladeMedium } from "../lib/medien.mts";

/* Öffentliche Auslieferung von Logos, Bildern, Post-Grafiken und Reels (u. a. für Buffer) */
export default async (_req: Request, context: Context) => {
  const { kunde, name } = context.params;
  if (!kunde || !ID_PATTERN.test(kunde) || !name) return new Response("Nicht gefunden", { status: 404 });
  const medium = await ladeMedium(kunde, name);
  if (!medium) return new Response("Nicht gefunden", { status: 404 });
  return new Response(medium.data as Uint8Array<ArrayBuffer>, {
    headers: {
      "content-type": medium.contentType,
      // Dateinamen ändern sich bei jeder neuen Fassung, darum lange cachebar
      "cache-control": "public, max-age=31536000, immutable",
      "x-content-type-options": "nosniff",
      ...(medium.contentType === "image/svg+xml" ? { "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'" } : {}),
    },
  });
};

export const config: Config = {
  path: "/medien/:kunde/:name",
};
