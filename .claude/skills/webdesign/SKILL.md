---
name: webdesign
description: Seelenwende-Webdesign auf High-End-Niveau. Verwenden bei jeder neuen oder geänderten Seite (start.html, angebot-*.html, ueber-mich.html, Bio-Link index.html, Werkzeuge), bei Layout-, Farb-, Schrift- oder Animationsfragen und vor jedem Livegang. Enthält Design-Tokens, Bausteine, Qualitätsregeln und einen Seiten-Check mit Screenshots (Handy/Desktop, hell/dunkel).
---

# Seelenwende-Webdesign

Ziel: Jede Seite wirkt wie aus einem Guss – ruhig, warm, hochwertig, sicher. Die Leserin ist oft in einer belastenden Lage: Klarheit und Ruhe vor Effekt.

## 1. Grundlage: immer `assets/seite.css` nutzen

Website und Salespages binden `assets/seite.css` und `assets/seite.js` ein. Kopf (`<header id="kopf">`), Fuß, Krisenleiste, „Schnell weg“, Mail-Fenster und Kaufleiste kommen aus `seite.js` – nie auf einer Seite nachbauen. Neue Bausteine, die mehr als eine Seite braucht, gehören in `seite.css`, nicht in ein `<style>` der Seite. Inline-`style=""` nur für Einzelfälle (z. B. ein Abstand).

Kauf-Links stehen ausschließlich in `KAUF` oben in `assets/seite.js`.

## 2. Design-Tokens (nur diese verwenden)

| Token | Hell | Rolle |
|---|---|---|
| `--papier` | `#FAF6F4` | Seitenhintergrund, Karten |
| `--sand` | `#F3ECE9` | Abschnitt `.sand` |
| `--blush` | `#F6E9EC` | Abschnitt `.blush`, Held-Verlauf |
| `--rose` | `#B5808F` | Akzent, Überzeilen, Fokus-Ring – **nicht für Fließtext** (Kontrast zu schwach) |
| `--beere` | `#8C5A69` | Hauptknopf, Links |
| `--pflaume` | `#5C3A46` | Text, Überschriften |
| `--gedaempft` | `#8E7079` | Nebentext, Einleitungen |
| `--linie` | `#E4D8D8` | Rahmen, Trennlinien |
| `--mikro` | `#C3AEB2` | Kleinstes (Fuß-Handle) – nie für lesbaren Text |
| `--flaeche-dunkel` / `--auf-dunkel` | | dunkle Flächen und Text darauf |

Dunkelmodus ist in `seite.css` gepflegt (`prefers-color-scheme` + `[data-theme="dark"]`). Keine Hex-Werte in Seiten schreiben, sonst bricht der Dunkelmodus. Schatten immer warm getönt: `rgba(92,58,70,…)` mit negativem Spread, z. B. `0 24px 60px -40px rgba(92,58,70,.6)`.

**Schrift:** `--serif` Playfair Display (Überschriften, Knöpfe, Zitate, Preise; kursiv für Unterzeilen und persönliche Sätze) · `--sans` Jost 300 für Fließtext, 400/500 für Betonung. Fließtext 17px, Zeilenhöhe 1.7, Zeilenlänge max. 56–60ch. Überschriften mit `clamp()` und `text-wrap:balance`. Überzeilen (`.ueber`): Serif, .7rem, `letter-spacing:.32em`, Versalien, `--rose`.

**Raster:** Breite `--breit` 1080px / `--schmal` 680px, Abschnitte `padding:64px 16px`. Radien: Knöpfe 28px, Karten 18px, Preisbox 22px, Felder 12px. Abstände in Vielfachen von 4 (8, 12, 16, 22, 32, 64).

## 3. Bausteine (vorhandene Klassen zuerst)

`.held` / `.held.split` · `.abschnitt` (+ `.sand`, `.blush`, `.beere`, `.dunkel`) · `.innen` / `.innen.schmal` · `.ueber` · `.einleitung` · `.knopf` (+ `.dunkel`, `.leicht`, `.breit`) in `.knopf-reihe` · `.raster` (+ `.zwei`, `.vier`) mit `.karte` · `.phase` · `.punkte` · `.preisbox` · `.fragen details` · `.unterschrift` · `.badge` · Icons per `<svg class="ic"><use href="assets/icons.svg#name"/></svg>`.

Salespage-Reihenfolge: Held (Versprechen + Kaufknopf) → Erkennen (ihr Schmerz in ihren Worten) → Was drin ist → Persönliche Notiz mit `assets/avatar.jpg` → Preisbox `#kaufen` → Fragen → dunkler Abschluss. Pro Seite **eine** Hauptaktion; zweite Aktionen als `.knopf.leicht`.

## 4. High-End-Regeln

- **Weißraum statt Schmuck.** Lieber ein Element weniger. Keine Ränder um alles; Flächen über `--sand`/`--blush` trennen.
- **Typografische Hierarchie** max. drei Stufen pro Abschnitt (Überzeile → h2 → Einleitung).
- **Bilder:** `assets/bilder/*.jpg`, warm, ruhig, keine Stockfoto-Gesichter. Immer `alt`, `width`/`height` (kein Layout-Springen), `loading="lazy"` unterhalb des Helds, Held-Bild `fetchpriority="high"`. Neue Fotos ≤ 250 KB, lange Kante ≤ 1800px.
- **Bewegung:** Held mit `auftauchen` (Opazität + 12px), alles darunter blendet `seite.js` beim Scrollen ein (Klasse `enthuellen` → `da`; neue Bausteine dort in die Liste `ziele` aufnehmen). Dauer 0.2–0.8s, `ease`, gestaffelt max. 5 × 70ms. Hover nur in `@media (hover:hover)`. Bei `prefers-reduced-motion` ist alles aus – neue JS-Effekte müssen `ruhig` ebenfalls prüfen.
- **Handy zuerst:** bei 375px prüfen. Tippflächen ≥ 44px, kein waagrechtes Scrollen, Kaufleiste darf nichts verdecken.
- **Barrierefreiheit:** Kontrast ≥ 4.5:1 für Text (`--rose`/`--mikro` nur dekorativ), sichtbarer Fokus (in `seite.css` vorhanden), echte `<button>`/`<a>`, `lang="de"`, Überschriften lückenlos.
- **Kopf jeder Seite:** `<title>` „Name · Seelenwende“, `<meta name="description">` (≤ 160 Zeichen), `viewport-fit=cover`, `<meta name="referrer" content="no-referrer">`, Icon `assets/logo.svg`. Für Seiten, die geteilt werden: `og:title`, `og:description`, `og:image` (1200×630).
- **Sicherheit und Datenschutz:** keine Tracker, keine neuen externen Skripte oder Dienste ohne Eintrag in `datenschutz.html`. Werkzeuge mit Schutzbedarf (Planer, Notizen) behalten neutralen Tab-Titel und „Schnell weg“. Kein Inhalt in URL oder Verlauf.
- **Ton:** du, warm, klar, keine Diagnosen über „ihn“, kein Druck („nur heute“). Für Mikrotexte den Skill `design:ux-copy` nutzen.

## 5. Ablauf bei jeder Seitenänderung

1. Vorhandene Seite mit ähnlichem Aufbau als Vorlage nehmen (Salespage → `angebot-genug.html`).
2. Bauen – nur Tokens und Bausteine von oben.
3. Seiten-Check laufen lassen (Screenshots ansehen!):
   ```bash
   node .claude/skills/webdesign/scripts/seiten-check.mjs angebot-genug.html start.html
   # ohne Argumente: alle *.html im Hauptordner
   ```
   Prüft je Seite bei 375px und 1440px, hell und dunkel: waagrechtes Überlaufen, Bilder ohne `alt` oder Maße, fehlende Dateien (404), Konsolenfehler, Titel/Beschreibung, Tippflächen < 44px. Screenshots landen in `.seiten-check/` (nicht im Git).
4. Screenshots mit dem Read-Tool öffnen und kritisch ansehen: Abstände gleichmäßig? Hierarchie klar? Etwas abgeschnitten? Dunkelmodus lesbar?
5. Bei größeren Änderungen zusätzlich: `design:design-critique`, `design:accessibility-review`, `marketing:seo-audit`.
6. README-Abschnitt der Seite aktualisieren, wenn sich Aufbau oder Zweck ändert.

## 6. Ergänzende Skills

| Skill | Wann |
|---|---|
| `design:design-critique` | Gesamteindruck einer Seite oder eines Entwurfs |
| `design:design-system` | Prüfen, ob Seiten von Tokens/Bausteinen abweichen |
| `design:accessibility-review` | vor Livegang neuer Seiten |
| `design:ux-copy` | Knöpfe, Fehlermeldungen, leere Zustände |
| `marketing:seo-audit`, `small-business:seo-ai-visibility` | Auffindbarkeit |
| `small-business:brand-style` | Markenstil festhalten/ändern |
| `canva:*`, Figma | Grafiken, OG-Bilder, Entwürfe (Connector muss angemeldet sein) |
| `run` | Seite im Browser starten und ansehen |
| `ui-ux-pro-max` (im Projekt) | UX-Regeln nachschlagen: `python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<thema>" --domain ux` (auch `landing`, `typography`, `color`, `--stack html-tailwind` nur als Anregung) |
| `taste` / `design-taste-frontend` (im Projekt) | Gegen „KI-Look“: Lint/Inspektor und Blick-und-Korrektur-Schleife; neue Richtungen nur mit `--keep palette,type` |

**Vorrang:** Diese Datei schlägt `ui-ux-pro-max` und `taste`. Deren Vorschläge zu Farben, Schriften, Stilrichtungen oder Bildern (z. B. Picsum-Platzhalter, GSAP/Lenis aus dem CDN) nur übernehmen, wenn sie zu den Tokens und Regeln oben passen. Kein neues CDN-Skript ohne Eintrag in `datenschutz.html`.
