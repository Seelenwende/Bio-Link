import type { Config, Context } from "@netlify/functions";
import { json } from "../lib/common.mts";
import { signierterLink } from "../lib/bonus-link.mts";
import { findBonus, isProgrammConfigured, isValidProgrammCode } from "../lib/programm.mts";

// Gibt für einen Bonus (PDF oder eine Audio-Spur) einen zeitlich begrenzten Link heraus, aber nur mit gültigem Programm-Code.
// Die Datei selbst liefert Netlify direkt aus; die Edge-Funktion bonus-schutz prüft den Link.
export default async (req: Request, _context: Context) => {
  if (req.method !== "POST") return json({ error: "Nur POST erlaubt." }, 405);
  if (!isProgrammConfigured()) return json({ error: "Das Programm ist noch nicht eingerichtet." }, 503);

  const body = await req.json().catch(() => null);
  if (!isValidProgrammCode(body?.code)) return json({ error: "Dieser Zugangscode ist ungültig." }, 401);

  const bonus = findBonus(body?.id);
  if (!bonus) return json({ error: "Diesen Bonus gibt es nicht." }, 404);

  let datei: string | undefined;
  if (bonus.art === "pdf") datei = bonus.datei;
  else datei = bonus.spuren.find((s) => s.id === body?.spur)?.datei;
  if (!datei) return json({ error: "Diese Datei gibt es nicht." }, 404);

  return json({ url: await signierterLink(datei) });
};

export const config: Config = {
  path: "/api/programm/bonus",
};
