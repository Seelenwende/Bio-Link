// Einfache In-Memory-Auftragsverwaltung für lange Vorgänge (Rendern, Veröffentlichen, Agent).

import { randomUUID } from "node:crypto";

const jobs = new Map();

/** Startet fn(job) im Hintergrund; job.step kann laufend aktualisiert werden. */
export function startJob(type, fn) {
  const job = { id: randomUUID(), type, status: "running", step: "Startet …", result: null, error: null, createdAt: Date.now() };
  jobs.set(job.id, job);
  Promise.resolve()
    .then(() => fn(job))
    .then((result) => Object.assign(job, { status: "done", result }))
    .catch((err) => {
      console.error(`[${type}]`, err);
      Object.assign(job, { status: "error", error: err.message });
    });
  // Alte Aufträge nach einer Stunde vergessen
  for (const [id, j] of jobs) if (Date.now() - j.createdAt > 3600_000) jobs.delete(id);
  return job;
}

export const getJob = (id) => jobs.get(id);
