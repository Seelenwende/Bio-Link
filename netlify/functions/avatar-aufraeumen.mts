import type { Config } from "@netlify/functions";
import { TAG_MS, deleteAvatar, getProfil, profilTage, setProfil, store, videoTage } from "../lib/avatar.mts";

// Läuft jede Nacht: löscht alte Videos, ungenutzte Avatare und liegen gebliebene Aufträge.
export default async () => {
  const s = store();
  const now = Date.now();

  const { blobs: profile } = await s.list({ prefix: "profil/" });
  for (const { key } of profile) {
    const owner = key.slice("profil/".length);
    const profil = await getProfil(owner);
    if (!profil) continue;

    const haengt = (profil.status === "pending" || profil.status === "running") && now - profil.createdAt > TAG_MS;
    if (haengt || now - profil.lastUsedAt > profilTage() * TAG_MS) {
      await deleteAvatar(owner);
      continue;
    }

    const alt = profil.videos.filter((v) => now - v.createdAt > videoTage() * TAG_MS);
    if (alt.length) {
      for (const v of alt) await s.delete(`video/${v.id}`);
      await setProfil(owner, { ...profil, videos: profil.videos.filter((v) => !alt.includes(v)) });
    }
  }

  // Videos ohne Eintrag (z. B. Liste übergelaufen) und alte Aufträge
  const { blobs: videos } = await s.list({ prefix: "video/" });
  for (const { key } of videos) {
    const meta = await s.getMetadata(key);
    const createdAt = Number(meta?.metadata?.createdAt ?? 0);
    if (now - createdAt > videoTage() * TAG_MS) await s.delete(key);
  }
  const { blobs: jobs } = await s.list({ prefix: "job/" });
  for (const { key } of jobs) {
    const job = (await s.get(key, { type: "json" })) as { createdAt?: number } | null;
    if (!job || now - (job.createdAt ?? 0) > TAG_MS) await s.delete(key);
  }
  const { blobs: roh } = await s.list({ prefix: "roh/" });
  for (const { key } of roh) {
    const owner = key.split("/").pop() ?? "";
    const profil = await getProfil(owner);
    if (profil?.status !== "pending" && profil?.status !== "running") await s.delete(key);
  }
};

export const config: Config = {
  schedule: "@daily",
};
