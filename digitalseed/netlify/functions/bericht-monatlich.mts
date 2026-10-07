import type { Config } from "@netlify/functions";
import { siteUrl, startAufgabe } from "../lib/common.mts";
import { alleKunden } from "../lib/kunden.mts";
import { isBufferConfigured } from "../lib/buffer.mts";

/* Am 1. jedes Monats: Bericht über den Vormonat für alle Kunden, die live sind. */
export default async () => {
  if (!isBufferConfigured()) return;
  const origin = siteUrl();
  if (!origin) {
    console.error("bericht-monatlich: URL unbekannt (DIGITALSEED_URL setzen)");
    return;
  }
  for (const kunde of await alleKunden()) {
    if ((kunde.phase === "live" || kunde.phase === "freigabe") && Object.values(kunde.buffer).some(Boolean)) {
      await startAufgabe(origin, { aufgabe: "bericht", kundeId: kunde.id });
    }
  }
};

export const config: Config = {
  schedule: "0 6 1 * *",
};
