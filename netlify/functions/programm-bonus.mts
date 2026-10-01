import type { Config, Context } from "@netlify/functions";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { json } from "../lib/common.mts";
import { findBonus, isProgrammConfigured, isValidProgrammCode } from "../lib/programm.mts";

// Liefert ein Bonus-PDF aus, aber nur mit gültigem Programm-Code.
// Die Dateien werden über netlify.toml (included_files) mit dieser Funktion ausgeliefert.
async function readBonus(datei: string): Promise<Buffer | null> {
  const bases = [process.cwd(), process.env.LAMBDA_TASK_ROOT ?? "", path.resolve(import.meta.dirname ?? ".", "../..")];
  for (const base of bases) {
    if (!base) continue;
    try {
      return await readFile(path.join(base, "netlify", "bonus", datei));
    } catch {
      // nächsten Ort versuchen
    }
  }
  return null;
}

export default async (req: Request, _context: Context) => {
  if (req.method !== "POST") return json({ error: "Nur POST erlaubt." }, 405);
  if (!isProgrammConfigured()) return json({ error: "Das Programm ist noch nicht eingerichtet." }, 503);

  const body = await req.json().catch(() => null);
  if (!isValidProgrammCode(body?.code)) return json({ error: "Dieser Zugangscode ist ungültig." }, 401);

  const bonus = findBonus(body?.id);
  if (!bonus) return json({ error: "Diesen Bonus gibt es nicht." }, 404);

  const pdf = await readBonus(bonus.datei);
  if (!pdf) return json({ error: "Dieser Bonus wird gerade vorbereitet. Schau bald wieder vorbei." }, 404);

  return new Response(new Uint8Array(pdf), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="${bonus.datei}"`,
      "cache-control": "no-store",
    },
  });
};

export const config: Config = {
  path: "/api/programm/bonus",
};
