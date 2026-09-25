# 🦋 Social-Agent · Seelenwende

Dein virtueller Social-Media-Agent für **Instagram und Facebook** – **alles in einem Werkzeug**. Du sagst ihm im Chat in deinen eigenen Worten, was du willst, und er erledigt den Rest:

- **Ideen & Hooks** – „Gib mir 10 Ideen zum Thema Selbstliebe“, „Schlag mir 3 Hooks vor“
- **Drei Formate** – 🎬 **Reel** (Video mit eigens komponierter, lizenzfreier Musik), 🖼 **Bildbeitrag** und 🗂 **Karussell** (2–10 Folien) – alles im Seelenwende-Design, optional mit deinen Fotos
- **Hook, Inhalt & CTA** – der Call-to-Action richtet sich nach deinem Ziel: Follower, Speichern, Kommentare oder Link
- **Texte pro Kanal** – Instagram-Caption mit Hashtags und ein eigener, persönlicherer Facebook-Text
- **Posten oder einplanen** – auf Instagram, Facebook oder beiden, immer erst nach deiner Bestätigung
- **Zwei Wege, ein Agent** – direkt in der Claude-App als MCP-Server (ohne API-Key) oder als eigene Web-App mit Chat

---

## Variante A: Direkt in Claude (MCP-Server) – empfohlen

Der Agent kann als **MCP-Server** in der Claude-Desktop-App laufen. Dann ist **Claude selbst dein Social-Media-Agent**: Du chattest ganz normal mit Claude, Claude schreibt Hook, Inhalt, CTA und die Texte für Instagram und Facebook – und nutzt die Werkzeuge des Agenten, um Reels, Bildbeiträge und Karussells zu gestalten, zu posten oder einzuplanen. **Kein eigener Claude-API-Key nötig** – es läuft über dein Claude-Abo.

**Einrichten (einmalig):**
1. [Claude Desktop](https://claude.ai/download) und [Node.js](https://nodejs.org) (LTS) installieren.
2. Im Ordner `reel-agent` doppelklicken: **Windows** `Mit Claude verbinden.bat` · **Mac** `Mit Claude verbinden.command` (erstes Mal: Rechtsklick → *Öffnen*).
3. Claude Desktop komplett beenden und neu starten.

**Loslegen** – in einem neuen Chat, z. B.:
- „Gib mir 10 Beitragsideen zum Thema innere Ruhe.“
- „Mach ein Karussell mit 5 Tipps für ruhige Abende – Ziel: Speichern. Schlag mir vorher 3 Hooks vor.“
- „Mach daraus zusätzlich ein Reel mit verträumter Musik.“
- „Nimm diese Fotos als Hintergrund: C:\Users\…\Bilder\morgen1.jpg, …“
- „Verbinde Instagram mit diesem Token: IGAA…“ / „Verbinde meine Facebook-Seite: EAA…“ (einmalig, Anleitung siehe unten)
- „Poste es jetzt auf Instagram und Facebook“ / „Plane es für Sonntag 18 Uhr ein“ / „Was ist geplant?“

Claude fragt vor jedem Werkzeug-Aufruf um Erlaubnis, und gepostet wird nur nach deiner ausdrücklichen Zustimmung. Über das ➕-Menü gibt es außerdem die Vorlagen **„Neuer Beitrag“** und **„Content-Ideen“**.

| Werkzeug | Was es tut |
|---|---|
| `content_guide` | Markenstimme, Regeln für Formate, Hook und CTA, Musikstimmungen, verbundene Kanäle |
| `create_post` | Reel, Bildbeitrag oder Karussell gestalten (optional eigene Fotos/Musik) – mit Vorschaubildern |
| `list_posts` · `show_post` | Gespeicherte Beiträge ansehen |
| `publish_post` · `schedule_post` | Sofort veröffentlichen oder einplanen – Instagram, Facebook oder beide |
| `list_scheduled` · `cancel_scheduled` | Geplante Beiträge verwalten |
| `connect_instagram` · `connect_facebook` · `set_brand` | Kanäle verbinden, Marke einstellen |

> Geplante Beiträge werden veröffentlicht, solange Claude Desktop **oder** die Web-App (Variante B) läuft; verpasste Termine werden beim nächsten Start nachgeholt. Web-App und Claude teilen sich Beiträge, Einstellungen und Zeitplan.

**Claude Code:** `claude mcp add seelenwende-agent -- node /pfad/zu/reel-agent/src/mcp.js`

## Variante B: Eigene Web-App mit Chat

### Starten – per Doppelklick

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

### Einrichten – in der App unter ⚙️ Einstellungen

Beim ersten Start öffnen sich die Einstellungen automatisch. Alles wird nur lokal auf deinem Rechner gespeichert (`data/settings.json`).

**1 · Claude** (schreibt die Drehbücher und führt den Chat): API-Key auf [console.anthropic.com](https://console.anthropic.com/settings/keys) erstellen und einfügen.

**2 · Marke:** Name, Instagram-Handle und Markenstimme – der Agent schreibt dann in deinem Ton.

**3 · Instagram verbinden** (zum Posten). Instagram erlaubt das nur für **Business- oder Creator-Konten**. Einmalig ca. 10 Minuten:

1. In der Instagram-App: Einstellungen → *Kontoart und Tools* → *Professionelles Konto* (Creator oder Business).
2. Auf [developers.facebook.com/apps](https://developers.facebook.com/apps) → *App erstellen* → Anwendungsfall **„Nachrichten und Inhalte auf Instagram verwalten“**.
3. Unter *API-Einrichtung mit Instagram-Login* die Berechtigung `instagram_business_content_publish` hinzufügen, dein Konto verknüpfen und **Token generieren**.
4. Token in der App einfügen → **Verbinden**. Konto-ID und Name ermittelt der Agent selbst, und er **verlängert das Token automatisch**, damit die Verbindung nicht nach 60 Tagen abreißt.

**4 · Facebook-Seite verbinden** (für Facebook-Beiträge – und für Bild-/Karussellbeiträge auf Instagram, siehe unten):

1. In derselben Meta-App unter *Anwendungsfälle* **„Seite verwalten“** hinzufügen.
2. Im [Graph API Explorer](https://developers.facebook.com/tools/explorer/) deine App wählen, die Berechtigungen `pages_show_list`, `pages_read_engagement` und `pages_manage_posts` anhaken und **Token generieren**.
3. Token in der App (bzw. im Claude-Chat) einfügen → die Seite findet der Agent selbst. Verwaltest du mehrere Seiten, gibst du den Namen der Seite mit an.
4. Optional unter „Erweitert“: **App-ID und App-Geheimnis** (App-Einstellungen → Allgemein) – dann erzeugt der Agent ein Seiten-Token, das **nicht abläuft**. Ohne diese Angaben gilt ein Token aus dem Graph API Explorer nur kurz (etwa 1–2 Stunden) – für dauerhaftes Posten also unbedingt ausfüllen.

> Da du die Meta-App nur für deine eigenen Konten nutzt, reicht der **Entwicklungsmodus** – ein App-Review ist nicht nötig, solange du in der App als Administrator/Tester eingetragen bist.

> **Warum Facebook für Instagram-Bilder?** Instagram holt Bilder (anders als Videos) nur von einer öffentlichen Internetadresse ab. Läuft der Agent nur auf deinem Rechner, legt er die Bilder dafür kurz unveröffentlicht auf deiner Facebook-Seite ab. Läuft er später online (eigener Server mit `PUBLIC_BASE_URL`), ist das nicht mehr nötig.

Ohne Claude-Key kannst du im Bereich „Drehbuch & Material“ trotzdem Beiträge erstellen (der Text wird dann nur aufgeteilt); ohne verbundene Kanäle kannst du alles herunterladen.

### Beispiele für den Chat

- „Gib mir 10 Ideen zum Thema Selbstliebe.“
- „Mach ein Karussell mit 5 Tipps für mehr innere Ruhe – Ziel: Speichern.“
- „Mach mir ein 20-Sekunden-Reel über 3 sanfte Morgenrituale. Der Hook soll eine Frage sein, verträumte Musik.“
- „Mach aus dem Zitat ‚Du darfst langsam anfangen‘ einen Bildbeitrag.“
- „Poste es morgen um 18 Uhr auf Instagram und Facebook.“ → Bestätigen-Karte erscheint → Klick → eingeplant
- „Was ist gerade geplant?“ / „Storniere den Post am Freitag.“

## Formate & Kanäle

| Format | Ergebnis | Instagram | Facebook |
|---|---|---|---|
| 🎬 Reel | MP4 1080×1920 mit Musik, 3–10 Szenen | Reel | Facebook-Reel |
| 🖼 Bildbeitrag | JPEG 1080×1350 (4:5), eine starke Aussage | Bildbeitrag | Foto-Beitrag |
| 🗂 Karussell | 2–10 JPEG-Folien 4:5: Hook-Folie („Wischen →“), Inhaltsfolien mit Nummer, CTA-Folie | Karussell | Mehrbild-Beitrag |

| Schritt | Was passiert |
|---|---|
| Inhalt eingeben | z. B. *„3 sanfte Rituale für einen ruhigen Morgen – Botschaft: Du darfst langsam anfangen.“* – dazu Format und Ziel |
| Drehbuch | Hook → Inhalt → Call-to-Action (nach Ziel), Instagram-Caption + Hashtags, eigener Facebook-Text |
| Musik (Reel) | 5 Stimmungen (ruhig, verträumt, aufbauend, energiegeladen, melancholisch) – jede Musik wird neu komponiert, passend zur Reel-Länge, mit Ein- und Ausblendung |
| Design | Markenfarben & Schriften der Seelenwende-Seite (Playfair Display, Jost), Schmetterlings-Signet, Handle-Einblendung; optional eigene Fotos als Hintergrund |
| Veröffentlichen | sofort oder geplant auf Instagram, Facebook oder beiden – schlägt ein Kanal fehl, wird der andere trotzdem veröffentlicht; Links werden angezeigt |

Alle Beiträge werden unter `output/` gespeichert und erscheinen in „Meine Beiträge“. Geplante Beiträge stehen rechts unter „Geplante Beiträge“ und werden veröffentlicht, solange der Agent läuft (ist er zum geplanten Zeitpunkt aus, wird der Post beim nächsten Start nachgeholt).

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
npm test        # Tests (Musik, Drehbuch/Formate, Zeitplanung, Instagram/Facebook mit simulierter API, MCP-Server)
npm run mcp     # MCP-Server direkt starten (stdio)
npm run dev     # Server mit Auto-Neustart
```

Aufbau:

```
src/server.js     Web-Server & API
src/mcp.js        MCP-Server für Claude Desktop / Claude Code
src/install-claude.js  Trägt den MCP-Server in Claude Desktop ein
src/agent.js      Chat-Agent (Claude mit Werkzeugen: Drehbuch, Erstellen, Posten, Planen)
src/reels.js      Beiträge erstellen/speichern, auf Kanälen veröffentlichen, Zeitplanung, Token-Verlängerung
src/settings.js   Einstellungen aus der App (data/settings.json)
src/jobs.js       Hintergrund-Aufträge mit Fortschritt
src/planner.js    Drehbuch für alle Formate mit Claude (strukturierte JSON-Ausgabe) + Offline-Modus
src/music.js      Musik-Synthesizer (Akkorde, Pad, Arpeggio, Bass, Beat, Hall)
src/render.js     Szenen & Folien (SVG → PNG/JPEG) + Videoschnitt mit ffmpeg
src/instagram.js  Instagram: Reel, Bild, Karussell veröffentlichen
src/facebook.js   Facebook-Seite: verbinden, Foto-/Mehrbild-Beitrag, Reel
public/           Oberfläche
assets/fonts/     Playfair Display & Jost (SIL Open Font License)
```
