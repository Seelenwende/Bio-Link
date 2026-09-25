import type { Context } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import { STORE_NAME, ID_PATTERN, checkAccessCode, errorMessage } from "../lib/common.mts";
import { runProfileAnalysis } from "../lib/profile-check.mts";
import type { IgProfile } from "../lib/instagram.mts";

export default async (req: Request, _context: Context) => {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.id !== "string" || !ID_PATTERN.test(body.id)) return;
  if (!checkAccessCode(body.accessCode)) return;

  const store = getStore(STORE_NAME);
  try {
    const profile = body.profile as IgProfile;
    if (!profile?.username || !Array.isArray(profile.posts)) throw new Error("Ungültige Profildaten.");
    const result = await runProfileAnalysis(profile);
    await store.setJSON(body.id, { status: "done", result, finishedAt: Date.now() });
  } catch (err) {
    console.error("analysis failed", err);
    await store.setJSON(body.id, { status: "error", error: errorMessage(err) });
  }
};
