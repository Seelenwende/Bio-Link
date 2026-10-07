import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";

export const MODEL = () => Netlify.env.get("DIGITALSEED_MODEL") || "claude-opus-5-5";

// USD pro Million Token (Claude Opus 5.5). Nur für die Kostenanzeige im Dashboard.
const PREIS_INPUT = 4;
const PREIS_OUTPUT = 20;

export type Inhalt = Anthropic.Beta.BetaContentBlockParam[];

export interface KiErgebnis<T> {
  daten: T;
  kostenUsd: number;
}

function client(): Anthropic {
  const apiKey = Netlify.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY fehlt in Netlify.");
  return new Anthropic({ apiKey });
}

function kosten(usage: Anthropic.Beta.BetaUsage): number {
  const input = usage.input_tokens + (usage.cache_creation_input_tokens ?? 0) * 1.25 + (usage.cache_read_input_tokens ?? 0) * 0.1;
  return (input * PREIS_INPUT + usage.output_tokens * PREIS_OUTPUT) / 1_000_000;
}

function pruefeStop(response: Anthropic.Beta.BetaMessage): void {
  if (response.stop_reason === "refusal") throw new Error("Die KI hat diese Anfrage abgelehnt.");
  if (response.stop_reason === "max_tokens") throw new Error("Die KI-Antwort war zu lang und wurde abgeschnitten. Bitte den Schritt neu starten.");
}

/* Strukturierte Antwort nach Zod-Schema. Streaming, weil die Antworten lang werden. */
export async function frage<S extends z.ZodType>(opts: {
  schema: S;
  system: string;
  inhalt: Inhalt;
  effort?: "low" | "medium" | "high";
  maxTokens?: number;
}): Promise<KiErgebnis<z.infer<S>>> {
  const stream = client().beta.messages.stream({
    model: MODEL(),
    max_tokens: opts.maxTokens ?? 32000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    thinking: { type: "adaptive" },
    output_config: { effort: opts.effort ?? "medium", format: betaZodOutputFormat(opts.schema) },
    system: opts.system,
    messages: [{ role: "user", content: opts.inhalt }],
  });
  const response = await stream.finalMessage();
  pruefeStop(response);
  if (!response.parsed_output) throw new Error("Die KI-Antwort konnte nicht gelesen werden. Bitte den Schritt neu starten.");
  return { daten: response.parsed_output as z.infer<S>, kostenUsd: kosten(response.usage) };
}

/* Freier Text (z. B. eine komplette HTML-Seite). */
export async function schreibe(opts: { system: string; inhalt: Inhalt; effort?: "low" | "medium" | "high"; maxTokens?: number }): Promise<KiErgebnis<string>> {
  const stream = client().beta.messages.stream({
    model: MODEL(),
    max_tokens: opts.maxTokens ?? 64000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    thinking: { type: "adaptive" },
    output_config: { effort: opts.effort ?? "medium" },
    system: opts.system,
    messages: [{ role: "user", content: opts.inhalt }],
  });
  const response = await stream.finalMessage();
  pruefeStop(response);
  const text = response.content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
  return { daten: text, kostenUsd: kosten(response.usage) };
}

/* Bild aus dem Medienspeicher als Inhaltsblock für Claude (nur Rastergrafiken). */
export function bildBlock(data: Uint8Array, contentType: string): Anthropic.Beta.BetaImageBlockParam | null {
  const typ = contentType.split(";")[0].trim();
  if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(typ)) return null;
  if (data.length > 4_500_000) return null;
  return {
    type: "image",
    source: { type: "base64", media_type: typ as "image/jpeg" | "image/png" | "image/webp" | "image/gif", data: Buffer.from(data).toString("base64") },
  };
}
