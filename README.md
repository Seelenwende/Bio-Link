# Bio-Link

Link-in-Bio-Seite von Seelenwende (`index.html`) plus zwei Werkzeuge für das eigene Instagram-Profil:

- `profil-check.html` – Selbst-Check mit 26 Punkten und To-do-Liste (läuft komplett im Browser).
- `hook-check.html` – Bio- & Hook-Check. Schnell-Check nach festen Regeln im Browser **oder** KI-Analyse über die Claude-API.

## KI-Analyse einrichten (Netlify)

Die KI-Analyse läuft über Netlify Functions (`netlify/functions/`), damit der API-Schlüssel nie im Browser landet:

1. `hook-check-start` prüft Zugangscode und Eingaben und startet die Analyse.
2. `hook-check-background` (Hintergrund-Funktion, bis 15 Min.) fragt Claude und speichert das Ergebnis in Netlify Blobs.
3. `hook-check-status` liefert das Ergebnis; die Seite fragt alle paar Sekunden nach.

In Netlify unter *Project configuration → Environment variables* anlegen:

| Variable | Inhalt |
|---|---|
| `ANTHROPIC_API_KEY` | API-Schlüssel von https://platform.claude.com (Guthaben nötig) |
| `HOOKCHECK_ACCESS_CODE` | Frei gewählter Zugangscode – ohne ihn startet keine Analyse |

Das Netlify-Projekt muss mit diesem Repository verbunden sein (Build: keiner, Publish-Verzeichnis `.`; steht in `netlify.toml`).
Kosten: je nach Anzahl der Posts grob 0,10–0,30 $ pro Analyse (Modell `claude-opus-5`).
