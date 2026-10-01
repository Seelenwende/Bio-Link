import type { Config, Context } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import { json } from "../lib/common.mts";
import { BEGLEITERIN_STORE, addUsage, getUsage, isBegleiterinConfigured, isValidCode, messageLimit, parseTurns } from "../lib/begleiterin.mts";

// Nimmt eine Nachricht an, zählt sie und startet die Antwort im Hintergrund.
export default async (req: Request, _context: Context) => {
  if (req.method !== "POST") return json({ error: "Nur POST erlaubt." }, 405);
  if (!isBegleiterinConfigured()) return json({ error: "Die Begleiterin ist noch nicht eingerichtet." }, 503);

  const body = await req.json().catch(() => null);
  if (!isValidCode(body?.code)) return json({ error: "Dieser Zugangscode ist ungültig.", reason: "zugang" }, 401);

  const turns = parseTurns(body.turns);
  if (!turns) return json({ error: "Das Gespräch ist zu lang geworden. Tippe oben auf „Neu beginnen“." }, 400);

  const limit = messageLimit();
  const used = await getUsage(body.code);
  if (used >= limit) return json({ error: "Die Nachrichten dieses Zugangs sind aufgebraucht.", reason: "zugang" }, 403);

  const id = crypto.randomUUID();
  await getStore(BEGLEITERIN_STORE).setJSON(`job/${id}`, { status: "pending", createdAt: Date.now() });

  const res = await fetch(new URL("/.netlify/functions/begleiterin-background", req.url), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ id, code: body.code, turns }),
  });
  if (res.status !== 202) return json({ error: "Die Nachricht konnte nicht gesendet werden. Versuch es gleich noch einmal." }, 502);

  await addUsage(body.code, used + 1);
  return json({ id, used: used + 1, limit }, 202);
};

export const config: Config = {
  path: "/api/begleiterin/send",
};
