import type { Config, Context } from "@netlify/functions";
import { adminFromRequest, siteUrl } from "../lib/common.mts";
import { kundeZuToken, ladeDaten, type Inhalte, type Marke } from "../lib/kunden.mts";
import { newsletterHtml, type NewsletterKonzept } from "../lib/newsletter.mts";

/* Newsletter als fertiges E-Mail-HTML: /newsletter/<token>/vorlage oder /newsletter/<token>/nl-1
   Mit ?download=1 als Datei zum Import in das Newsletter-Tool. */
export default async (req: Request, context: Context) => {
  const kunde = await kundeZuToken(context.params.token ?? "");
  if (!kunde) return new Response("Nicht gefunden", { status: 404 });
  const id = context.params.id ?? "vorlage";
  const [marke, konzept, inhalte] = await Promise.all([
    ladeDaten<Marke>(kunde.id, "marke"),
    ladeDaten<NewsletterKonzept>(kunde.id, "newsletter"),
    ladeDaten<Inhalte>(kunde.id, "inhalte"),
  ]);
  if (!marke || !konzept) return new Response("Die Newsletter-Vorlage ist noch nicht erstellt.", { status: 404 });
  let ausgabe = null;
  if (id !== "vorlage") {
    // Ausgaben sieht die Kundin erst ab der Freigabe, du im Dashboard immer
    if (kunde.phase !== "freigabe" && kunde.phase !== "live" && !adminFromRequest(req)) return new Response("Nicht gefunden", { status: 404 });
    ausgabe = inhalte?.newsletter.find((n) => n.id === id) ?? null;
    if (!ausgabe) return new Response("Nicht gefunden", { status: 404 });
  }
  const html = newsletterHtml(marke, konzept, ausgabe, siteUrl() || new URL(req.url).origin, kunde.website);
  const download = new URL(req.url).searchParams.has("download");
  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-robots-tag": "noindex",
      ...(download ? { "content-disposition": `attachment; filename="newsletter-${id}.html"` } : {}),
    },
  });
};

export const config: Config = {
  path: ["/newsletter/:token/:id"],
};
