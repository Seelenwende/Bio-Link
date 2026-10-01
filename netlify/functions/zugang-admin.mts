import type { Config, Context } from "@netlify/functions";
import { json } from "../lib/common.mts";
import { PLANS, checkAdminKey, createCode, describe, setActive, type Plan } from "../lib/zugang.mts";

/* Codes anlegen, sperren und nachschlagen. Für Make (nach Kauf oder Kündigung) und die Seite zugang-admin.html.
   Header: Authorization: Bearer <SEELENWENDE_ADMIN_KEY>
   Body:   { "aktion": "erstellen", "plan": "kreis" | "mira", "ref": "Bestellnummer (optional)" }
           { "aktion": "sperren" | "entsperren" | "info", "code": "WENDE-…" }  oder  { …, "ref": "…" } */
export default async (req: Request, _context: Context) => {
  if (req.method !== "POST") return json({ error: "Nur POST erlaubt." }, 405);
  if (!checkAdminKey(req.headers.get("authorization"))) return json({ error: "Admin-Schlüssel fehlt oder ist falsch." }, 401);

  const body = await req.json().catch(() => null);
  const ref = typeof body?.ref === "string" && body.ref.trim() ? body.ref.trim().slice(0, 200) : undefined;
  const code = typeof body?.code === "string" && body.code.trim() ? body.code.trim().slice(0, 64) : undefined;

  try {
    switch (body?.aktion) {
      case "erstellen": {
        if (!PLANS.includes(body.plan)) return json({ error: "plan muss „kreis“ oder „mira“ sein." }, 400);
        return json({ code: await createCode(body.plan as Plan, ref), plan: body.plan, ref: ref ?? null }, 201);
      }
      case "sperren":
      case "entsperren": {
        if (!code && !ref) return json({ error: "code oder ref angeben." }, 400);
        const record = await setActive({ code, ref }, body.aktion === "entsperren");
        if (!record) return json({ error: "Kein Code im Register gefunden. Codes aus KREIS_CODES/BEGLEITERIN_CODES bitte dort entfernen." }, 404);
        return json({ ok: true, plan: record.plan, active: record.active });
      }
      case "info": {
        if (!code && !ref) return json({ error: "code oder ref angeben." }, 400);
        const info = await describe({ code, ref });
        if (!info) return json({ error: "Kein Code im Register gefunden." }, 404);
        return json(info);
      }
      default:
        return json({ error: "aktion muss „erstellen“, „sperren“, „entsperren“ oder „info“ sein." }, 400);
    }
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Unbekannter Fehler." }, 409);
  }
};

export const config: Config = {
  path: "/api/zugang/admin",
};
