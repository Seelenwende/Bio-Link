import type { Config, Context } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import { json } from "../lib/common.mts";
import { ANTWORT_STORE, addUsage, checkLimit, getUsage, isAntwortHelferConfigured, isValidCode, parseEingabe } from "../lib/antwort-helfer.mts";

// Nimmt seine Nachricht an, zählt die Prüfung und startet die Einordnung im Hintergrund.
export default async (req: Request, _context: Context) => {
  if (req.method !== "POST") return json({ error: "Nur POST erlaubt." }, 405);
  if (!isAntwortHelferConfigured()) return json({ error: "Der Antwort-Helfer ist noch nicht eingerichtet." }, 503);

  const body = await req.json().catch(() => null);
  if (!(await isValidCode(body?.code))) return json({ error: "Dieser Zugangscode ist ungültig.", reason: "zugang" }, 401);

  const eingabe = parseEingabe(body);
  if (!eingabe) return json({ error: "Bitte füge seine Nachricht ein (höchstens 4000 Zeichen)." }, 400);

  const limit = checkLimit();
  const used = await getUsage(body.code);
  if (used >= limit) return json({ error: "Die Prüfungen dieses Zugangs sind aufgebraucht.", reason: "zugang" }, 403);

  const id = crypto.randomUUID();
  await getStore(ANTWORT_STORE).setJSON(`job/${id}`, { status: "pending", createdAt: Date.now() });

  const res = await fetch(new URL("/.netlify/functions/antwort-helfer-background", req.url), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ id, code: body.code, ...eingabe }),
  });
  if (res.status !== 202) return json({ error: "Das hat nicht geklappt. Versuch es gleich noch einmal." }, 502);

  await addUsage(body.code, used + 1);
  return json({ id, used: used + 1, limit }, 202);
};

export const config: Config = {
  path: "/api/antwort-helfer/send",
};
