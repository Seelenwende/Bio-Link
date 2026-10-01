import type { Context } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import { ID_PATTERN, errorMessage } from "../lib/common.mts";
import { ANTWORT_STORE, isValidCode, parseEingabe, runAntwortHelfer } from "../lib/antwort-helfer.mts";

// Hintergrund-Funktion: fragt Claude und legt das Ergebnis kurz ab, bis die Seite es abholt.
export default async (req: Request, _context: Context) => {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.id !== "string" || !ID_PATTERN.test(body.id)) return;
  if (!isValidCode(body.code)) return;
  const eingabe = parseEingabe(body);
  if (!eingabe) return;

  // Nur Aufträge bearbeiten, die über antwort-helfer-send angelegt (und gezählt) wurden.
  const store = getStore(ANTWORT_STORE);
  const job = (await store.get(`job/${body.id}`, { type: "json" })) as { status?: string; createdAt?: number } | null;
  if (job?.status !== "pending") return;
  await store.setJSON(`job/${body.id}`, { status: "running", createdAt: job.createdAt });
  try {
    const result = await runAntwortHelfer(eingabe);
    await store.setJSON(`job/${body.id}`, { status: "done", result });
  } catch (err) {
    console.error("antwort-helfer failed", err);
    await store.setJSON(`job/${body.id}`, { status: "error", error: errorMessage(err) });
  }
};
