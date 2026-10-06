import type { Context } from "@netlify/functions";
import {
  ID_PATTERN, addVideo, createTalk, didDelete, errorText, getProfil, getUsage, setUsage, speak, store, uploadAudio, waitForTalk, type VideoJob,
} from "../lib/avatar.mts";

const MAX_WAIT_MS = 12 * 60 * 1000; // Hintergrund-Funktionen dürfen 15 Minuten laufen

// Hintergrund-Funktion: Text mit ihrer Stimme sprechen (ElevenLabs), daraus mit ihrem Foto
// ein Video machen (D-ID), das Video hier ablegen und bei D-ID wieder löschen.
export default async (req: Request, _context: Context) => {
  const body = await req.json().catch(() => null);
  if (typeof body?.id !== "string" || !ID_PATTERN.test(body.id)) return;
  const id: string = body.id;

  const s = store();
  const job = (await s.get(`job/${id}`, { type: "json" })) as VideoJob | null;
  if (job?.status !== "pending") return; // nur Aufträge aus avatar-video-start
  await s.setJSON(`job/${id}`, { ...job, status: "running" });

  let talkId: string | null = null;
  let audioId: string | null = null;
  try {
    const profil = await getProfil(job.owner);
    if (profil?.status !== "bereit" || !profil.voiceId || !profil.didImageUrl) throw new Error("Dein Avatar ist nicht mehr da.");

    const ton = await speak(profil.voiceId, job.text);
    const audio = await uploadAudio(ton);
    audioId = audio.id;
    talkId = await createTalk(profil.didImageUrl, audio.url);
    const resultUrl = await waitForTalk(talkId, MAX_WAIT_MS);

    const res = await fetch(resultUrl);
    if (!res.ok) throw new Error("Das fertige Video ließ sich nicht abholen. Bitte noch einmal versuchen.");
    await s.set(`video/${id}`, await res.arrayBuffer(), { metadata: { owner: job.owner, createdAt: Date.now() } });

    const eintrag = { id, createdAt: Date.now(), text: job.text };
    await addVideo(job.owner, eintrag);
    await s.setJSON(`job/${id}`, { ...job, status: "done" });
  } catch (err) {
    console.error("avatar-video failed", err);
    // Fehlgeschlagene Videos zählen nicht
    await setUsage(job.owner, (await getUsage(job.owner)) - 1);
    await s.setJSON(`job/${id}`, { ...job, status: "error", error: errorText(err) });
  } finally {
    // Bei D-ID nichts liegen lassen
    if (talkId) await didDelete(`/talks/${talkId}`).catch((err) => console.error("D-ID talk nicht gelöscht", err));
    if (audioId) await didDelete(`/audios/${audioId}`).catch((err) => console.error("D-ID audio nicht gelöscht", err));
  }
};
