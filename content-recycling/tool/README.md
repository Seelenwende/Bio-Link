# Das Tool

Transkript rein, Freigabedokument raus. Führt den Ablauf aus
`../lieferung/checkliste.md` mit den Prompts aus `../lieferung/prompts.md` aus und
füllt am Ende die Vorlage `../lieferung/freigabe.html`.

Was es **nicht** tut: den Redaktionsdurchgang. Es liefert dir Entwürfe plus eine
Prüfliste — die Entscheidung, was rausfliegt, bleibt bei dir. Genau die verkaufst du.

## Einrichten

```bash
cd tool
npm install
export ANTHROPIC_API_KEY=sk-ant-...      # Schlüssel: console.anthropic.com
```

Node 20 oder neuer. Sonst keine Voraussetzungen.

## Einmal pro Kunde: Stimmprofil

```bash
node recycle.mjs profil --kunde meiereiag folge12.vtt folge13.vtt folge14.vtt \
  --posts-datei bisherige-posts.txt
```

Schreibt `kunden/meiereiag/stimmprofil.md`. Danach der wichtigste Schritt des ganzen
Geschäftsmodells: **schick das Profil dem Kunden** mit der Frage „Steht hier etwas,
das du so nie sagen würdest?" Eine Korrektur hier spart zehn später.

Dann `kunden/meiereiag/profil.json` anlegen — `kunden/beispiel/profil.json` als
Muster nehmen. Die Felder:

| Feld | Bedeutung |
|---|---|
| `kunde` | Name, wie er im Freigabedokument steht |
| `absender`, `mailAn` | dein Name und deine Mailadresse für die Rückmeldung |
| `postsProFolge` | wie viele Aussagen zu Posts werden (Standard 4) |
| `kanaele[]` | je Kanal `name`, `woerter`, `hinweis` — der Hinweis steuert den Ton |
| `tabu[]` | Themen, die nie in einem Post erscheinen dürfen. Wird bei jedem Aufruf mitgegeben. |

Die `tabu`-Liste ist keine Formalität. Sie ist der Grund, warum du bei einer Kanzlei
oder Praxis überhaupt arbeiten darfst.

## Pro Folge

```bash
node recycle.mjs folge --kunde meiereiag --nummer 47 \
  --titel "Warum Rückstellungen keine Rücklagen sind" \
  --datum 18.02.2026 --monat "März 2026" --frist "Freitag, 27.02.2026" \
  folge47.vtt
```

Akzeptiert `.txt`, `.vtt` und `.srt`. Bei `.vtt`/`.srt` bleiben die Zeitmarken
erhalten — ohne sie kann das Modell keine Timecodes und keine Quellenangaben
liefern. Die Auto-Untertitel von YouTube funktionieren direkt.

Fünf Schritte, in etwa zwei bis vier Minuten:

1. Kernaussagen suchen und nach Eignung sortieren
2. Posts je Aussage und Kanal
3. Newsletter und Clip-Timecodes (parallel)
4. Redaktionsprüfung jedes Posts gegen Transkript und Stimmprofil
5. Dateien schreiben

Ergebnis in `ausgabe/meiereiag-47/`:

| Datei | Wofür |
|---|---|
| `paket.md` | dein Redaktionsdurchgang: alle Texte, die Prüfliste, die Versandcheckliste |
| `freigabe.html` | für den Kunden — erst nach der Redaktion verschicken |
| `rohdaten.json` | zum Neubauen ohne weitere API-Aufrufe |

Nach einer Korrektur in `rohdaten.json` das HTML neu bauen, ohne zu bezahlen:

```bash
node recycle.mjs freigabe --daten ausgabe/meiereiag-47/rohdaten.json
```

Zwei Dinge bleiben danach von Hand: die Veröffentlichungsdaten im Feld `datum` und
der Platzhalter `[LINK ZUR FOLGE]` im Newsletter.

## Was es kostet

Modell ist `claude-opus-5`. Bei einer Folge von 45 Minuten liegt ein Durchlauf
erfahrungsgemäss bei **etwa USD 1 bis 2**. Vier Folgen im Monat, also ein
Standard-Kunde: rund USD 5 bis 8 gegen 950 CHF Umsatz. Das Tool zeigt nach jedem
Durchlauf die tatsächlichen Zahlen an — verlass dich darauf und nicht auf diese
Schätzung.

Das Transkript wird als Prompt-Cache gehalten (`ttl: "1h"`), weil es in einem
Durchlauf fünfzehnmal gebraucht wird. Ohne Cache wäre derselbe Durchlauf etwa
dreimal so teuer. Wenn `Cache: … gelesen` bei null steht, greift der Cache nicht
mehr — dann hat sich etwas im stabilen Teil des Prompts geändert.

Refusal-Fallback ist eingeschaltet: lehnt das Modell eine Anfrage aus
Sicherheitsgründen ab, läuft sie im selben Aufruf auf `claude-opus-4-8` weiter. Bei
Transkripten aus dem Wirtschaftsbereich passiert das praktisch nie, kostet aber
nichts, solange es nicht greift.

## Grenzen

- **Die Faktenliste in `paket.md` ist ein Hinweis, kein Beweis.** Auch das prüfende
  Modell irrt. Jede Zahl gehört von dir gegen das Transkript geprüft.
- **Zwei Kanäle sind getestet**, LinkedIn und Instagram. Weitere gehen über
  `kanaele[]`, aber prüfe die erste Lieferung besonders genau.
- **Kein Videoschnitt.** Das Tool liefert Timecodes und Untertiteltexte; geschnitten
  wird woanders.
- **Die Live-API ist von hier aus nicht getestet.** Aufbau, Transkript-Einlesen,
  Dateiausgabe und das erzeugte Freigabedokument sind im Browser geprüft; die
  Modellaufrufe selbst brauchen einen Schlüssel, der in der Entwicklungsumgebung
  nicht vorlag. Rechne beim ersten echten Durchlauf mit einer Nachjustierung.
