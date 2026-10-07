import type { Config, Context } from "@netlify/functions";
import { kundeZuToken, ladeText } from "../lib/kunden.mts";

/* Die Website-Demo eines Kunden: /demo/<token> */
export default async (_req: Request, context: Context) => {
  const kunde = await kundeZuToken(context.params.token ?? "");
  const html = kunde ? await ladeText(kunde.id, "website") : null;
  if (!html) return new Response("Diese Demo gibt es nicht (mehr).", { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } });
  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-robots-tag": "noindex, nofollow",
      // Die Demo ist KI-generiertes HTML: keine Formular-Absendungen, keine fremden Skripte
      "content-security-policy": "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com data:; script-src 'unsafe-inline'; form-action 'none'; frame-ancestors 'self'",
    },
  });
};

export const config: Config = {
  path: "/demo/:token",
};
