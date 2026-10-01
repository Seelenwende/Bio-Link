import type { Context } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import { ID_PATTERN, errorMessage } from "../lib/common.mts";
import { BEGLEITERIN_STORE, isValidCode, parseTurns, runBegleiterin } from "../lib/begleiterin.mts";

// Hintergrund-Funktion: fragt Claude und legt die Antwort kurz ab, bis die Seite sie abholt.
export default async (req: Request, _context: Context) => {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.id !== "string" || !ID_PATTERN.test(body.id)) return;
  if (!isValidCode(body.code)) return;
  const turns = parseTurns(body.turns);
  if (!turns) return;

  // Nur Aufträge bearbeiten, die über begleiterin-send angelegt (und gezählt) wurden.
  const store = getStore(BEGLEITERIN_STORE);
  const job = (await store.get(`job/${body.id}`, { type: "json" })) as { status?: string; createdAt?: number } | null;
  if (job?.status !== "pending") return;
  await store.setJSON(`job/${body.id}`, { status: "running", createdAt: job.createdAt });
  try {
    const { reply, crisis } = await runBegleiterin(turns);
    await store.setJSON(`job/${body.id}`, { status: "done", reply, crisis });
  } catch (err) {
    console.error("begleiterin failed", err);
    await store.setJSON(`job/${body.id}`, { status: "error", error: errorMessage(err) });
  }
};
