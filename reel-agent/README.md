# 🎬 Reel-Agent · Seelenwende

Dein virtueller Instagram-Reel-Agent – **alles in einem Werkzeug**. Du sagst ihm im Chat in deinen eigenen Worten, was du willst, und er erledigt den Rest:

- **Drehbuch schreiben** – Hook, Szenen-Texte, Caption und Hashtags in deiner Markenstimme
- **Überarbeiten** – „Mach den Hook neugieriger“, „kürzer“, „energischere Musik“ – oder selbst im Editor ändern
- **Video mit Musik erstellen** – 1080×1920, sanfte Übergänge, **eigens komponierte, lizenzfreie Musik**; optional deine Fotos und eigene Musik
- **Posten oder einplanen** – „Poste es jetzt“ oder „Plane es für Freitag 18 Uhr ein“ – immer erst nach deinem Klick auf *Bestätigen*
- **Einrichten** – Claude-Key, Marke und Instagram-Verbindung direkt in der App unter ⚙️ Einstellungen

---

## Starten – per Doppelklick

Einmalig [Node.js](https://nodejs.org) (LTS-Version) installieren. Danach im Ordner `reel-agent`:

- **Windows:** `Reel-Agent starten.bat` doppelklicken
- **Mac:** `Reel-Agent starten.command` doppelklicken (beim ersten Mal: Rechtsklick → *Öffnen*)

Beim ersten Start werden die Bausteine automatisch installiert, dann öffnet sich der Agent im Browser (http://localhost:3000). Das schwarze Fenster offen lassen – solange es läuft, werden auch geplante Posts veröffentlicht.

<details><summary>Alternativ im Terminal</summary>

```bash
cd reel-agent
npm install
npm start
```
</details>

## Einrichten – in der App unter ⚙️ Einstellungen

Beim ersten Start öffnen sich die Einstellungen automatisch. Alles wird nur lokal auf deinem Rechner gespeichert (`data/settings.json`).

**1 · Claude** (schreibt die Drehbücher und führt den Chat): API-Key auf [console.anthropic.com](https://console.anthropic.com/settings/keys) erstellen und einfügen.

**2 · Marke:** Name, Instagram-Handle und Markenstimme – der Agent schreibt dann in deinem Ton.

**3 · Instagram verbinden** (zum Posten). Instagram erlaubt das nur für **Business- oder Creator-Konten**. Einmalig ca. 10 Minuten:

1. In der Instagram-App: Einstellungen → *Kontoart und Tools* → *Professionelles Konto* (Creator oder Business).
2. Auf [developers.facebook.com/apps](https://developers.facebook.com/apps) → *App erstellen* → Anwendungsfall **„Nachrichten und Inhalte auf Instagram verwalten“**.
3. Unter *API-Einrichtung mit Instagram-Login* die Berechtigung `instagram_business_content_publish` hinzufügen, dein Konto verknüpfen und **Token generieren**.
4. Token in der App einfügen → **Verbinden**. Konto-ID und Name ermittelt der Agent selbst, und er **verlängert das Token automatisch**, damit die Verbindung nicht nach 60 Tagen abreißt.

> Da du die Meta-App nur für dein eigenes Konto nutzt, reicht der **Entwicklungsmodus** – ein App-Review ist nicht nötig, solange dein Konto in der App eingetragen ist.

Ohne Claude-Key kannst du im Bereich „Drehbuch & Material“ trotzdem Reels erstellen (der Text wird dann nur in Szenen aufgeteilt); ohne Instagram-Verbindung kannst du Reels herunterladen.

## Beispiele für den Chat

- „Mach mir ein 20-Sekunden-Reel über 3 sanfte Morgenrituale für Frauen, die sich im Alltag verlieren.“
- „Der Hook soll eine Frage sein. Und nimm verträumte Musik.“
- „Erstelle das Video mit meinen hochgeladenen Fotos.“
- „Poste es morgen um 18 Uhr.“ → Bestätigen-Karte erscheint → Klick → eingeplant
- „Was ist gerade geplant?“ / „Storniere den Post am Freitag.“

## So entsteht ein Reel

| Schritt | Was passiert |
|---|---|
| Inhalt eingeben | z. B. *„3 sanfte Rituale für einen ruhigen Morgen – Botschaft: Du darfst langsam anfangen.“* |
| Drehbuch | 3–10 Szenen: Hook → Inhalt → Call-to-Action, Dauer nach Lesezeit |
| Musik | 5 Stimmungen (ruhig, verträumt, aufbauend, energiegeladen, melancholisch) – jede Musik wird neu komponiert, passend zur Reel-Länge, mit Ein- und Ausblendung |
| Design | Markenfarben & Schriften der Seelenwende-Seite (Playfair Display, Jost), Schmetterlings-Signet, Handle-Einblendung; optional eigene Fotos als Hintergrund |
| Veröffentlichen | sofort oder geplant: Upload → Instagram verarbeitet → Reel ist online, Link wird angezeigt |

Alle Reels werden unter `output/` gespeichert und erscheinen in „Meine Reels“. Geplante Posts stehen rechts unter „Geplante Posts“ und werden veröffentlicht, solange der Agent läuft (ist er zum geplanten Zeitpunkt aus, wird der Post beim nächsten Start nachgeholt).

## Musik – wichtig zu wissen

- Die **generierte Musik** ist komplett neu synthetisiert und damit frei von Rechten Dritter.
- Über die API lassen sich **keine Titel aus der Instagram-Musikbibliothek** anhängen – das geht nur in der App. Wenn du einen Trend-Sound willst: Reel hier erstellen, herunterladen und in der Instagram-App mit Musik versehen.
- Bei **eigenen Musikdateien** nur Titel verwenden, für die du die Rechte hast (z. B. lizenzfreie Musik), sonst kann Instagram den Ton stummschalten.

## Erweiterte Einstellungen (`.env`, optional)

Für die normale Nutzung nicht nötig – alles Wichtige geht über ⚙️ in der App. Für Sonderfälle kannst du `.env.example` nach `.env` kopieren:

| Variable | Bedeutung |
|---|---|
| `ANTHROPIC_MODEL` | optional, Standard `claude-opus-5` |
| `TZ_NAME` | Zeitzone für geplante Posts, Standard `Europe/Berlin` |
| `IG_UPLOAD_MODE` | `resumable` (Datei direkt hochladen, Standard) oder `url` (Instagram lädt über `PUBLIC_BASE_URL`) |
| `PORT`, `HOST` | Server-Adresse. Standard nur lokal (`127.0.0.1`) |
| `APP_PASSWORD` | Passwortschutz (Benutzer `reel`), **Pflicht**, wenn der Agent im Netzwerk/Internet erreichbar ist |

## Entwicklung

```bash
npm test        # Tests (Musik, Drehbuch, Zeitplanung, Instagram-Ablauf mit simulierter API)
npm run dev     # Server mit Auto-Neustart
```

Aufbau:

```
src/server.js     Web-Server & API
src/agent.js      Chat-Agent (Claude mit Werkzeugen: Drehbuch, Rendern, Posten, Planen)
src/reels.js      Reels speichern, veröffentlichen, Zeitplanung, Token-Verlängerung
src/settings.js   Einstellungen aus der App (data/settings.json)
src/jobs.js       Hintergrund-Aufträge mit Fortschritt
src/planner.js    Drehbuch mit Claude (strukturierte JSON-Ausgabe) + Offline-Modus
src/music.js      Musik-Synthesizer (Akkorde, Pad, Arpeggio, Bass, Beat, Hall)
src/render.js     Szenenbilder (SVG → PNG) + Videoschnitt mit ffmpeg
src/instagram.js  Instagram Graph API: Container, Upload, Status, Veröffentlichung
public/           Oberfläche
assets/fonts/     Playfair Display & Jost (SIL Open Font License)
```
