# Bio-Link

- `index.html` – Link-in-Bio-Seite von Seelenwende.
- `werte-finder.html` – Werte-Finder: in vier Schritten (Werte wählen, auf 5 eingrenzen, im Paarvergleich ordnen, einschätzen wie sehr man sie lebt) zu den eigenen fünf Kernwerten – mit Impulsfragen zum Nachspüren. Läuft komplett im Browser, ohne KI, API-Schlüssel oder Kosten; Antworten bleiben auf dem Gerät.
- `profil-check.html` – KI-Profil-Check: Instagram-Namen eingeben, die KI liest Profil, Bio, Link-Seite und die letzten Posts (offizielle Instagram Graph API) und bewertet jeden Punkt des Profil-Checks mit konkretem Verbesserungsvorschlag.

## So funktioniert der Profil-Check (Netlify)

Die Analyse läuft über Netlify Functions (`netlify/functions/`), damit API-Schlüssel nie im Browser landen:

1. `profil-check-start` prüft den Zugangscode, liest das Instagram-Profil und startet die Analyse.
2. `profil-check-background` (Hintergrund-Funktion, bis 15 Min.) fragt Claude und speichert das Ergebnis in Netlify Blobs.
3. `profil-check-status` liefert das Ergebnis; die Seite fragt alle paar Sekunden nach.

In Netlify unter *Project configuration → Environment variables* anlegen und danach neu deployen:

| Variable | Inhalt |
|---|---|
| `ANTHROPIC_API_KEY` | API-Schlüssel von https://platform.claude.com (Guthaben nötig) |
| `HOOKCHECK_ACCESS_CODE` | Frei gewählter Zugangscode – ohne ihn startet keine Analyse |
| `IG_USER_ID` | ID deines Instagram-Business-/Creator-Kontos |
| `IG_ACCESS_TOKEN` | Langlebiger Token mit `instagram_basic` und `pages_read_engagement` |
| `IG_GRAPH_VERSION` | optional, Standard `v23.0` |

Der Profil-Check nutzt „Business Discovery“ der Instagram Graph API: Damit lassen sich öffentliche Creator-/Business-Profile per Namen lesen (Name, Bio, Link, Kennzahlen, letzte 12 Posts). Story-Highlights und angepinnte Beiträge liefert die API nicht – diese Punkte markiert die KI als „nicht prüfbar“.

Kosten: grob 0,10–0,40 $ pro Analyse (Modell `claude-opus-5`, inkl. Bildern).
