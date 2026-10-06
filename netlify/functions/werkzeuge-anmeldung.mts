import type { Config, Context } from "@netlify/functions";
import { json } from "../lib/common.mts";

const EMAIL_PATTERN = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;
const API = "https://connect.mailerlite.com/api";
const GRUPPEN_NAME = "Bio-Link Werkzeuge";

let gruppeCache: string | null = null;

// Sucht die Gruppe „Bio-Link Werkzeuge“ per Name und legt sie an, wenn es sie noch nicht gibt.
// So muss niemand die Gruppen-ID aus MailerLite heraussuchen.
async function gruppeFinden(headers: Record<string, string>): Promise<string | null> {
  if (gruppeCache) return gruppeCache;
  const suche = await fetch(`${API}/groups?limit=100&filter[name]=${encodeURIComponent(GRUPPEN_NAME)}`, { headers });
  // Klappt die Suche nicht, lieber ohne Gruppe eintragen als eine doppelte Gruppe anlegen.
  if (!suche.ok) {
    console.error("mailerlite gruppensuche", suche.status, await suche.text().catch(() => ""));
    return null;
  }
  const gefunden = (await suche.json().catch(() => null)) as { data?: { id: string; name: string }[] } | null;
  const treffer = gefunden?.data?.find((g) => g.name.trim().toLowerCase() === GRUPPEN_NAME.toLowerCase());
  if (treffer) return (gruppeCache = String(treffer.id));
  const neu = await fetch(`${API}/groups`, { method: "POST", headers, body: JSON.stringify({ name: GRUPPEN_NAME }) });
  if (!neu.ok) {
    console.error("mailerlite gruppe", neu.status, await neu.text().catch(() => ""));
    return null;
  }
  const daten = (await neu.json().catch(() => null)) as { data?: { id: string } } | null;
  return daten?.data?.id ? (gruppeCache = String(daten.data.id)) : null;
}

// Bio-Link: Bevor eine Frau die kostenlosen Werkzeuge öffnet, trägt sie ihre Mail-Adresse ein.
// Sie landet in MailerLite in der Gruppe „Bio-Link Werkzeuge“ (oder der Gruppe aus MAILERLITE_GROUP_WERKZEUGE).
export default async (req: Request, _context: Context) => {
  if (req.method !== "POST") return json({ error: "Nur POST erlaubt." }, 405);
  const apiKey = Netlify.env.get("MAILERLITE_API_KEY");
  if (!apiKey) return json({ error: "Die Anmeldung ist noch nicht eingerichtet." }, 503);

  const body = await req.json().catch(() => null);
  // Unsichtbares Feld: Wird es ausgefüllt, war es ein Bot. Antwort wie bei Erfolg, damit er nichts lernt.
  if (body?.website) return json({ ok: true });

  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!EMAIL_PATTERN.test(email)) return json({ error: "Bitte prüf deine Mail-Adresse." }, 400);
  if (body?.einwilligung !== true) return json({ error: "Bitte bestätige, dass du Mails von Seelenwende bekommen möchtest." }, 400);

  const headers = { "content-type": "application/json", accept: "application/json", authorization: `Bearer ${apiKey}` };
  const gruppe = Netlify.env.get("MAILERLITE_GROUP_WERKZEUGE") || (await gruppeFinden(headers));
  const res = await fetch(`${API}/subscribers`, {
    method: "POST",
    headers,
    body: JSON.stringify(gruppe ? { email, groups: [gruppe] } : { email }),
  });
  if (!res.ok) {
    console.error("mailerlite", res.status, await res.text().catch(() => ""));
    return json({ error: "Das hat gerade nicht geklappt. Versuch es bitte später noch einmal." }, 502);
  }
  return json({ ok: true });
};

export const config: Config = {
  path: "/api/werkzeuge/anmelden",
};
