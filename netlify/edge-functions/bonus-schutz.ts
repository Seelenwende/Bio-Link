import { linkIstGueltig } from "../lib/bonus-link.mts";

// Schützt /bonus/: Dateien gibt es nur mit einem gültigen, signierten Link aus programm-bonus.
export default async (req: Request, context: { next: () => Promise<Response> }) => {
  if (await linkIstGueltig(new URL(req.url))) return context.next();
  return new Response("Nicht gefunden.", { status: 404, headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } });
};

export const config = { path: "/bonus/*" };
