import type { Context } from "@netlify/functions";
import { cloneVoice, deleteVoice, errorText, getProfil, setProfil, store, uploadImage } from "../lib/avatar.mts";

// Hintergrund-Funktion: klont die Stimme bei ElevenLabs, lädt das Foto zu D-ID hoch
// und löscht die Stimmprobe danach sofort.
export default async (req: Request, _context: Context) => {
  const body = await req.json().catch(() => null);
  const owner = typeof body?.owner === "string" && /^[0-9a-f]{64}$/.test(body.owner) ? body.owner : null;
  if (!owner) return;

  const profil = await getProfil(owner);
  if (profil?.status !== "pending") return; // nur Aufträge aus avatar-einrichten
  await setProfil(owner, { ...profil, status: "running" });

  const s = store();
  let voiceId: string | undefined;
  try {
    const stimme = await s.get(`roh/stimme/${owner}`, { type: "arrayBuffer" });
    const foto = await s.get(`foto/${owner}`, { type: "arrayBuffer" });
    if (!stimme || !foto) throw new Error("Foto oder Aufnahme sind nicht angekommen. Bitte noch einmal versuchen.");

    voiceId = await cloneVoice(`Avatar ${owner.slice(0, 10)}`, new Blob([stimme], { type: "audio/wav" }), "stimmprobe.wav");
    const bild = await uploadImage(new Blob([foto], { type: "image/jpeg" }));

    await setProfil(owner, { ...profil, status: "bereit", voiceId, didImageId: bild.id, didImageUrl: bild.url, lastUsedAt: Date.now() });
  } catch (err) {
    console.error("avatar-einrichten failed", err);
    if (voiceId) await deleteVoice(voiceId).catch(() => {});
    await s.delete(`foto/${owner}`);
    await setProfil(owner, { ...profil, status: "fehler", error: errorText(err) });
  } finally {
    await s.delete(`roh/stimme/${owner}`);
  }
};
