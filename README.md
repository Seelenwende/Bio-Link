# Bio-Link

Link-in-Bio-Seite von Seelenwende (`index.html`) plus zwei Werkzeuge für das eigene Instagram-Profil:

- `profil-check.html` – KI-Profil-Check: Instagram-Namen eingeben, die KI liest Profil, Bio, Link-Seite und die letzten Posts (offizielle Instagram Graph API) und bewertet alle Punkte des Checks mit Verbesserungsvorschlag. Darunter die manuelle Checkliste.
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
| `IG_USER_ID` | ID deines Instagram-Business-/Creator-Kontos (für den Profil-Check) |
| `IG_ACCESS_TOKEN` | Langlebiger Token mit `instagram_basic` und `pages_read_engagement` |
| `IG_GRAPH_VERSION` | optional, Standard `v23.0` |

Der Profil-Check nutzt „Business Discovery“ der Instagram Graph API: Damit lassen sich öffentliche Creator-/Business-Profile per Namen lesen (Name, Bio, Link, Kennzahlen, letzte 12 Posts). Story-Highlights und angepinnte Beiträge liefert die API nicht – diese Punkte markiert die KI als „nicht prüfbar“.

Das Netlify-Projekt muss mit diesem Repository verbunden sein (Build: keiner, Publish-Verzeichnis `.`; steht in `netlify.toml`).
Kosten: je nach Anzahl der Posts grob 0,10–0,30 $ pro Analyse (Modell `claude-opus-5`).
