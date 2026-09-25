import type { Context } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import { STORE_NAME, ID_PATTERN, InputSchema, checkAccessCode, errorMessage, runAnalysis } from "../lib/hook-check.mts";

export default async (req: Request, _context: Context) => {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.id !== "string" || !ID_PATTERN.test(body.id)) return;
  if (!checkAccessCode(body.accessCode)) return;

  const store = getStore(STORE_NAME);
  const parsed = InputSchema.safeParse(body.input);
  if (!parsed.success) {
    await store.setJSON(body.id, { status: "error", error: "Ungültige Eingaben." });
    return;
  }

  try {
    const result = await runAnalysis(parsed.data);
    await store.setJSON(body.id, { status: "done", result, finishedAt: Date.now() });
  } catch (err) {
    console.error("hook-check failed", err);
    await store.setJSON(body.id, { status: "error", error: errorMessage(err) });
  }
};
