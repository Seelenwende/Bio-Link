import { z } from "zod";
import { kennzahlen, type GesendeterPost, type Kennzahl } from "./buffer.mts";
import { frage } from "./ki.mts";
import { KANAL_NAME, ladeDaten, speichereDaten, type Kanal, type Kunde, type Marke } from "./kunden.mts";

/* Monatliches Reporting: Kennzahlen aus Buffer, eingeordnet von der KI. */

const AuswertungSchema = z.object({
  zusammenfassung: z.string().describe("3–4 Sätze für den Kunden, Anrede „Sie“"),
  highlights: z.array(z.string()).describe("2–4 Dinge, die gut liefen, mit Zahlen"),
  erkenntnisse: z.array(z.string()).describe("Was die Zahlen über die Zielgruppe zeigen"),
  naechsterMonat: z.array(z.string()).describe("3 konkrete Anpassungen für den nächsten Monat"),
});

export interface Bericht {
  monat: string; // YYYY-MM
  erstellt: number;
  kanaele: { kanal: Kanal; kennzahlen: Kennzahl[] }[];
  posts: (GesendeterPost & { kanalName: string })[];
  auswertung: z.infer<typeof AuswertungSchema> | null;
}

export function vormonat(jetzt = new Date()): string {
  const d = new Date(Date.UTC(jetzt.getUTCFullYear(), jetzt.getUTCMonth() - 1, 1));
  return d.toISOString().slice(0, 7);
}

export async function erstelleBericht(kunde: Kunde, monat: string): Promise<{ bericht: Bericht; kostenUsd: number }> {
  const zuordnung = (Object.entries(kunde.buffer) as [Kanal, string][]).filter(([, id]) => id);
  if (!zuordnung.length) throw new Error("Diesem Kunden sind keine Buffer-Kanäle zugeordnet.");
  const [jahr, mon] = monat.split("-").map(Number);
  const start = new Date(Date.UTC(jahr, mon - 1, 1)).toISOString();
  const ende = new Date(Date.UTC(jahr, mon, 1) - 1).toISOString();

  const { summen, posts } = await kennzahlen(zuordnung.map(([, id]) => id), start, ende);
  const kanalVon = (id: string) => zuordnung.find(([, c]) => c === id)?.[0];
  const bericht: Bericht = {
    monat,
    erstellt: Date.now(),
    kanaele: zuordnung.map(([kanal, id]) => ({ kanal, kennzahlen: summen[id] ?? [] })),
    posts: posts.map((p) => ({ ...p, kanalName: KANAL_NAME[kanalVon(p.kanal) ?? "instagram"] })),
    auswertung: null,
  };

  let kostenUsd = 0;
  if (posts.length) {
    const marke = await ladeDaten<Marke>(kunde.id, "marke");
    const daten = `${bericht.kanaele.map((k) => `${KANAL_NAME[k.kanal]}: ${k.kennzahlen.map((m) => `${m.name} ${m.wert}${m.einheit === "percentage" ? " %" : ""}`).join(", ") || "keine Daten"}`).join("\n")}

Einzelne Beiträge:
${bericht.posts.map((p) => `- ${p.kanalName}, ${p.gesendet?.slice(0, 10)}: ${p.kennzahlen.map((m) => `${m.name} ${m.wert}`).join(", ")} – „${p.text.slice(0, 120)}“`).join("\n")}`;
    const r = await frage({
      schema: AuswertungSchema,
      effort: "low",
      maxTokens: 8000,
      system: `Du bist Social-Media-Analystin bei DigitalSeed. Du schreibst den Monatsbericht für einen Kunden: verständlich, ehrlich, ohne Fachjargon, Schweizer Rechtschreibung (ss statt ß). Nur Aussagen, die die Zahlen hergeben.`,
      inhalt: [{ type: "text", text: `Monatsbericht ${monat} für „${marke?.name ?? kunde.name}“.\n\n${daten}` }],
    });
    bericht.auswertung = r.daten;
    kostenUsd = r.kostenUsd;
  }

  await speichereDaten(kunde.id, `bericht-${monat}`, bericht);
  return { bericht, kostenUsd };
}
