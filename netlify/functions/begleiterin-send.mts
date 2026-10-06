import type { Config, Context } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import { json } from "../lib/common.mts";
import { BEGLEITERIN_STORE, parseTurns } from "../lib/begleiterin.mts";
import { accessInfo, exhaustedMessage, getUsage, isMiraConfigured, resolveAccess, setUsage } from "../lib/zugang.mts";

// Nimmt eine Nachricht an, zählt sie und startet die Antwort im Hintergrund.
export default async (req: Request, _context: Context) => {
  if (req.method !== "POST") return json({ error: "Nur POST erlaubt." }, 405);
  if (!isMiraConfigured()) return json({ error: "Die Begleiterin ist noch nicht eingerichtet." }, 503);

  const body = await req.json().catch(() => null);
  const access = await resolveAccess(body?.code);
  if (!access) return json({ error: "Dieser Zugangscode ist ungültig.", reason: "zugang" }, 401);

  const turns = parseTurns(body.turns);
  if (!turns) return json({ error: "Das Gespräch ist zu lang geworden. Tippe oben auf „Neu beginnen“." }, 400);

  const used = await getUsage(access);
  if (used >= access.limit) return json({ error: exhaustedMessage(access), reason: "zugang" }, 403);

  const id = crypto.randomUUID();
  await getStore(BEGLEITERIN_STORE).setJSON(`job/${id}`, { status: "pending", createdAt: Date.now() });

  const res = await fetch(new URL("/.netlify/functions/begleiterin-background", req.url), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ id, code: body.code, turns }),
  });
  if (res.status !== 202) return json({ error: "Die Nachricht konnte nicht gesendet werden. Versuch es gleich noch einmal." }, 502);

  await setUsage(access, used + 1);
  return json({ id, ...accessInfo(access, used + 1) }, 202);
};

export const config: Config = {
  path: "/api/begleiterin/send",
};
