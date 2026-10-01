import type { Config, Context } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import { ID_PATTERN, json } from "../lib/common.mts";
import { BEGLEITERIN_STORE } from "../lib/begleiterin.mts";

const STALE_MS = 5 * 60 * 1000;

// Liefert die Antwort und löscht sie danach sofort wieder.
export default async (req: Request, _context: Context) => {
  const id = new URL(req.url).searchParams.get("id") ?? "";
  if (!ID_PATTERN.test(id)) return json({ error: "Ungültige Anfrage." }, 400);

  const store = getStore(BEGLEITERIN_STORE);
  const job = (await store.get(`job/${id}`, { type: "json" })) as
    | { status: "pending" | "running"; createdAt: number }
    | { status: "done"; reply: string; crisis: boolean }
    | { status: "error"; error: string }
    | null;
  if (!job) return json({ status: "error", error: "Diese Antwort ist nicht mehr da. Schick die Nachricht bitte noch einmal." }, 404);

  if (job.status === "pending" || job.status === "running") {
    if (Date.now() - job.createdAt > STALE_MS) {
      await store.delete(`job/${id}`);
      return json({ status: "error", error: "Die Antwort hat zu lange gedauert. Schick die Nachricht bitte noch einmal." });
    }
    return json({ status: "pending" });
  }

  await store.delete(`job/${id}`);
  return json(job);
};

export const config: Config = {
  path: "/api/begleiterin/status",
};
