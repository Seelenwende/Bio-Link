# 🎬 Reel-Agent · Seelenwende

Dein virtueller Instagram-Reel-Agent. Du beschreibst, **worum es im Reel gehen soll** – der Agent erledigt den Rest:

1. **Drehbuch** – Claude schreibt Hook, Szenen-Texte, Caption und Hashtags in deiner Markenstimme und wählt Musikstimmung und Farben.
2. **Bearbeiten** – du kannst alles anpassen: Texte, Szenenlänge, Reihenfolge, Farben, Musik, eigene Fotos.
3. **Rendern** – der Agent erstellt ein fertiges Reel (1080×1920, MP4/H.264, 30 fps) mit sanften Übergängen, Ken-Burns-Zoom und **eigens generierter, lizenzfreier Musik**. Alternativ lädst du einen eigenen Musiktitel hoch.
4. **Veröffentlichen** – ein Klick, eine Bestätigung, dann ist das Reel auf deinem Kanal (offizielle Instagram Graph API).

---

## Schnellstart

Voraussetzung: [Node.js](https://nodejs.org) ab Version 20. ffmpeg und die Schriften sind bereits enthalten.

```bash
cd reel-agent
npm install
cp .env.example .env      # dann .env ausfüllen (siehe unten)
npm start
```

Dann im Browser **http://localhost:3000** öffnen.

> Ohne Claude-API-Key läuft der Agent im **Offline-Modus**: Dein Text wird dann nur in Sätze/Szenen aufgeteilt. Ohne Instagram-Zugang kannst du Reels erstellen und herunterladen, aber nicht direkt posten.

## 1. Claude verbinden (Drehbücher)

1. Auf [console.anthropic.com](https://console.anthropic.com/) einen API-Key erstellen.
2. In `.env` eintragen: `ANTHROPIC_API_KEY=sk-ant-...`

Optional passt du in `.env` deine Marke an: `BRAND_NAME`, `BRAND_HANDLE`, `BRAND_VOICE`.

## 2. Instagram verbinden (Veröffentlichen)

Instagram erlaubt das Posten per API nur für **Business- oder Creator-Konten**. Einmalige Einrichtung (ca. 15 Minuten):

1. **Konto umstellen:** In der Instagram-App → Einstellungen → *Kontoart und Tools* → auf *Professionelles Konto* (Creator oder Business) wechseln.
2. **Meta-App anlegen:** Auf [developers.facebook.com/apps](https://developers.facebook.com/apps) → *App erstellen* → Anwendungsfall **„Nachrichten und Inhalte auf Instagram verwalten“** (Instagram API) wählen.
3. **Berechtigungen:** Im Bereich *Instagram → API-Einrichtung mit Instagram-Login* die Berechtigungen `instagram_business_basic` und `instagram_business_content_publish` hinzufügen.
4. **Konto verknüpfen & Token erzeugen:** Unter *Zugriffstoken generieren* dein Instagram-Konto hinzufügen und anmelden. Du erhältst ein **Access Token** (langlebig, 60 Tage gültig) und siehst deine **Instagram-User-ID**.
5. In `.env` eintragen:
   ```
   IG_ACCESS_TOKEN=IGAA...
   IG_USER_ID=1784...
   ```
6. Agent neu starten. Oben erscheint „Instagram: @dein_name“ ✅

> Da du die App nur für dein eigenes Konto nutzt, reicht der **Entwicklungsmodus** der Meta-App – ein App-Review ist nicht nötig, solange dein Konto als Tester/Rolle in der App eingetragen ist.

**Token verlängern:** Langlebige Tokens laufen nach 60 Tagen ab. Vorher erneuern mit:
```
https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=DEIN_TOKEN
```

**Facebook-Login statt Instagram-Login?** Dann `IG_GRAPH_HOST=graph.facebook.com` setzen und ein Page-Token mit `instagram_basic` + `instagram_content_publish` verwenden.

## So entsteht ein Reel

| Schritt | Was passiert |
|---|---|
| Inhalt eingeben | z. B. *„3 sanfte Rituale für einen ruhigen Morgen – Botschaft: Du darfst langsam anfangen.“* |
| Drehbuch | 3–10 Szenen: Hook → Inhalt → Call-to-Action, Dauer nach Lesezeit |
| Musik | 5 Stimmungen (ruhig, verträumt, aufbauend, energiegeladen, melancholisch) – jede Musik wird neu komponiert, passend zur Reel-Länge, mit Ein- und Ausblendung |
| Design | Markenfarben & Schriften der Seelenwende-Seite (Playfair Display, Jost), Schmetterlings-Signet, Handle-Einblendung; optional eigene Fotos als Hintergrund |
| Veröffentlichen | Upload → Instagram verarbeitet → Reel ist online, Link wird angezeigt |

Alle Reels werden unter `output/` gespeichert und erscheinen in „Meine Reels“.

## Musik – wichtig zu wissen

- Die **generierte Musik** ist komplett neu synthetisiert und damit frei von Rechten Dritter.
- Über die API lassen sich **keine Titel aus der Instagram-Musikbibliothek** anhängen – das geht nur in der App. Wenn du einen Trend-Sound willst: Reel hier erstellen, herunterladen und in der Instagram-App mit Musik versehen.
- Bei **eigenen Musikdateien** nur Titel verwenden, für die du die Rechte hast (z. B. lizenzfreie Musik), sonst kann Instagram den Ton stummschalten.

## Einstellungen (`.env`)

| Variable | Bedeutung |
|---|---|
| `ANTHROPIC_API_KEY` | Claude-API-Key für die Drehbücher |
| `ANTHROPIC_MODEL` | optional, Standard `claude-opus-5` |
| `BRAND_NAME`, `BRAND_HANDLE`, `BRAND_VOICE` | Markenangaben für Texte und Einblendung |
| `IG_ACCESS_TOKEN`, `IG_USER_ID` | Instagram-Zugang |
| `IG_GRAPH_HOST` | `graph.instagram.com` (Standard) oder `graph.facebook.com` |
| `IG_UPLOAD_MODE` | `resumable` (Datei direkt hochladen, Standard) oder `url` (Instagram lädt über `PUBLIC_BASE_URL`) |
| `PORT`, `HOST` | Server-Adresse. Standard nur lokal (`127.0.0.1`) |
| `APP_PASSWORD` | Passwortschutz (Benutzer `reel`), **Pflicht**, wenn der Agent im Netzwerk/Internet erreichbar ist |

## Entwicklung

```bash
npm test        # Tests (Musik, Drehbuch, Instagram-Ablauf mit simulierter API)
npm run dev     # Server mit Auto-Neustart
```

Aufbau:

```
src/server.js     Web-Server & API (Planen, Rendern, Veröffentlichen, Verlauf)
src/planner.js    Drehbuch mit Claude (strukturierte JSON-Ausgabe) + Offline-Modus
src/music.js      Musik-Synthesizer (Akkorde, Pad, Arpeggio, Bass, Beat, Hall)
src/render.js     Szenenbilder (SVG → PNG) + Videoschnitt mit ffmpeg
src/instagram.js  Instagram Graph API: Container, Upload, Status, Veröffentlichung
public/           Oberfläche
assets/fonts/     Playfair Display & Jost (SIL Open Font License)
```
