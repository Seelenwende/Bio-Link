import daten from "../../glaubenssaetze.json" with { type: "json" };

/* Wertet das Ergebnis des Glaubenssätze-Tests auf dem Server aus. Der Browser schickt nur die Punkte
   pro Satz (0–12); alle Texte für die Mail kommen aus glaubenssaetze.json, nie vom Browser. */

export interface Glaubenssatz {
  id: string;
  area: string;
  satz: string;
  zeigt: string;
  herkunft: string;
  neu: string;
  frage: string;
}

export const SAETZE: Glaubenssatz[] = daten.saetze;

export type Punkte = Record<string, number>;

export function parsePunkte(raw: unknown): Punkte | null {
  if (!raw || typeof raw !== "object") return null;
  const punkte: Punkte = {};
  for (const s of SAETZE) {
    const n = (raw as Record<string, unknown>)[s.id];
    if (typeof n !== "number" || !Number.isInteger(n) || n < 0 || n > 12) return null;
    punkte[s.id] = n;
  }
  return punkte;
}

export function stufe(n: number): string {
  if (n >= 8) return "stark präsent";
  if (n >= 5) return "spürbar";
  return "eher leise";
}

/** Gleiche Rangfolge wie auf der Ergebnisseite. */
export function rangfolge(punkte: Punkte): Glaubenssatz[] {
  return SAETZE.slice().sort((a, b) => punkte[b.id] - punkte[a.id]);
}

/** Felder für MailerLite. Die Namen müssen dort als eigene Felder angelegt sein (siehe mails/glaubenssaetze-ergebnis.md). */
export function mailFelder(punkte: Punkte): Record<string, string> {
  const r = rangfolge(punkte);
  const haupt = r[0];
  return {
    gs_bereich: haupt.area,
    gs_satz: haupt.satz,
    gs_zeigt: haupt.zeigt,
    gs_herkunft: haupt.herkunft,
    gs_neu: haupt.neu,
    gs_frage: haupt.frage,
    gs_uebersicht: r.map((s) => `„${s.satz}“ – ${stufe(punkte[s.id])}`).join("\n"),
  };
}
