# Bio-Link

- `index.html` – Link-in-Bio-Seite von Seelenwende.
- `werte-finder.html` – Werte-Finder: in vier Schritten (5–15 Werte wählen, auf 5 eingrenzen, in eigenen Worten beschreiben, was jeder Wert bedeutet, einschätzen wie sehr man sie lebt) zu den eigenen fünf Kernwerten – mit eigenen Bedeutungssätzen und Impulsfragen zum Nachspüren. Läuft komplett im Browser, ohne KI, API-Schlüssel oder Kosten; Antworten bleiben auf dem Gerät.
- `begleiterin.html` – **Mira**, die Seelenwende-Begleiterin: KI-Gesprächsbegleitung mit Zugangscode. Ein offenes Gespräch ohne Kategorien – die Begleiterin erkennt selbst, was gerade gebraucht wird. Krisenerkennung mit Notrufnummern (CH/DE/AT), „Schnell weg“-Knopf, Gespräche werden nicht gespeichert.
- `antwort-helfer.html` – **Antwort-Helfer** mit Zugangscode: Sie fügt seine Nachricht ein und bekommt eine ruhige Einordnung – ob sie überhaupt antworten sollte, was wirklich eine Antwort braucht, welche Sätze nur Köder sind, und bei Bedarf ein bis zwei kurze, sachliche Antworten (BIFF/Grey Rock) zum Kopieren. Besonders für Co-Parenting. Erkennt Drohungen und zeigt dann Notrufnummern statt Antwortvorschlägen, „Schnell weg“-Knopf, Nachrichten werden nicht gespeichert.
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

## So funktioniert Mira, die Begleiterin (Netlify)

1. `begleiterin-zugang` prüft den Zugangscode und das Nachrichten-Kontingent.
2. `begleiterin-send` zählt die Nachricht und startet `begleiterin-background` (fragt Claude, Hintergrund-Funktion).
3. `begleiterin-status` liefert die Antwort und löscht sie sofort danach. Gespräche selbst werden nirgends gespeichert, nur der Zähler pro Code (als Hash).

Die Anweisungen der Begleiterin stehen in `netlify/lib/begleiterin.mts`.

| Variable | Inhalt |
|---|---|
| `ANTHROPIC_API_KEY` | derselbe Schlüssel wie beim Profil-Check |
| `BEGLEITERIN_CODES` | gültige Zugangscodes, kommagetrennt, Groß-/Kleinschreibung egal, z. B. `Wendepunkt, WENDE-AB12-CD34` |
| `BEGLEITERIN_LIMIT` | optional, Nachrichten pro Code (Standard 300) |
| `BEGLEITERIN_MODEL` | optional, Standard `claude-opus-5-5` |

Neuer Code für eine Käuferin: an `BEGLEITERIN_CODES` anhängen, danach neu deployen. Kosten: grob 0,01–0,04 $ pro Nachricht.

## So funktioniert der Antwort-Helfer (Netlify)

Gleicher Aufbau wie bei Mira, nur ohne Gesprächsverlauf – eine Nachricht rein, eine Einordnung raus:

1. `antwort-helfer-zugang` prüft den Zugangscode und das Kontingent.
2. `antwort-helfer-send` zählt die Prüfung und startet `antwort-helfer-background` (fragt Claude, Hintergrund-Funktion).
3. `antwort-helfer-status` liefert das Ergebnis und löscht es sofort danach. Gespeichert wird nur der Zähler pro Code (als Hash).

Die Anweisungen stehen in `netlify/lib/antwort-helfer.mts`, die gemeinsame Code-Prüfung für alle Werkzeuge in `netlify/lib/zugang.mts`.

| Variable | Inhalt |
|---|---|
| `ANTWORT_HELFER_CODES` | eigene Zugangscodes, kommagetrennt (z. B. für Käuferinnen des Erste-Hilfe-Sets) |
| `ANTWORT_HELFER_LIMIT` | optional, Prüfungen pro Code (Standard 100) |
| `ANTWORT_HELFER_MODEL` | optional, Standard `claude-opus-5-5` |

Alle Codes aus `BEGLEITERIN_CODES` gelten auch hier (mit eigenem Zähler), damit Mira-Käuferinnen, das 6-Wochen-Programm und der Kreis den Antwort-Helfer automatisch mitnutzen. Kosten: grob 0,02–0,06 $ pro Prüfung.
