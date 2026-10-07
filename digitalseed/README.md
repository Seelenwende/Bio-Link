# DigitalSeed – Automatisierung

Du gibst die Website eines Unternehmens ein, den Rest erledigt das Tool: Es analysiert die gesamte Online-Präsenz, exportiert Logo, CI-Farben und Stimmprofil, baut eine Demo der neuen Website und produziert Inhalte für drei Monate. Danach prüfst du, schickst alles mit einem Klick zur Freigabe, und freigegebene Beiträge werden automatisch gepostet. Am Monatsersten entsteht der Bericht.

Eigenständige Netlify-Website im Ordner `digitalseed/`, unabhängig von der Seelenwende-Seite im Hauptordner.

## Ablauf

| # | Schritt | Ergebnis |
|---|---|---|
| 1 | Website und Profile erfassen | Startseite und bis zu 7 Unterseiten: Texte, Technik (Mobile, Meta-Angaben, Alt-Texte, Copyright, CMS …), CSS-Farben, Schriften, Logo-Kandidaten, bis zu 10 Fotos, Kontaktdaten, Social-Media-Profile, Google PageSpeed (mobil, mit Screenshot) |
| 2 | Analyse und Bewertung | Gesamtnote, 7 Bereiche mit Befund und Massnahmen, Social-Media-Status je Kanal, Potenziale nach Wirkung, Quick Wins, Angebotsempfehlung. Dazu nur für dich: Gesprächseinstieg, Argumente, Einwände |
| 3 | Logo, Stimmprofil, CI-Farben | Logo (Download, bei SVG auch als PNG), 5 Markenfarben, Google-Fonts-Schriften, Stimmprofil mit Anrede, Tonalität, typischen Wörtern und Beispielsätzen |
| 4 | Website-Demo | Komplette, responsive Website mit Animationen in der Marke des Kunden, mit seinen echten Inhalten und Fotos. Eigene Adresse `/demo/<token>` |
| 5 | Newsletter-Vorlage | Konzept (Name, Rubriken, Betreff-Formeln) und fertiges E-Mail-HTML zum Import in Mailchimp, MailerLite, Brevo & Co. |
| 6 | Social-Media-Vorlagen | Text-Vorlage je Kanal (Instagram, Facebook, LinkedIn) und 5 Grafik-Vorlagen (Aussage mit Foto, Tipps, Zitat, Zahl, Frage) in den CI-Farben |
| 7 | Content- und Redaktionsplan | Ziele, Zielgruppen, Content-Säulen, Monatsfokus; 13 Wochen × 3 Kanäle, je ein Beitrag pro Woche und Kanal, plus 3 Newsletter-Themen |
| 8 | Beiträge und Newsletter texten | 39 veröffentlichungsfertige Beiträge und 3 Newsletter-Ausgaben in der Stimme des Kunden |
| 9 | Bilder und Reels | Alle Grafiken (Einzelbild, Karussell-Folien, Reel-Szenen 9:16) als PNG, serverseitig gerendert mit Logo, Farben, Schriften und Fotos der Website |

Danach folgt die **Kundenreise**:

1. **Deine Prüfung**: Im Dashboard alles ansehen. Beiträge von Hand bearbeiten (Grafik wird neu gerendert) oder per Wunsch von der KI überarbeiten lassen. Die Reel-Videos (MP4, H.264) entstehen dabei automatisch im Browser aus den Reel-Szenen. Lass den Tab offen und nutze Chrome, Edge oder Safari.
2. **An Kunden senden**: Ein Klick. Der Kunde bekommt den Link zu seinem Portal.
3. **Freigabe**: Der Kunde sieht im Portal (in seinen eigenen Markenfarben) Analyse, Marke, Website-Demo, Pläne und alle Inhalte. Er gibt einzeln oder alle auf einmal frei, oder er beschreibt eine Änderung. Die KI überarbeitet den Inhalt dann automatisch und legt ihn erneut vor.
4. **Live**: Freigegebene Beiträge werden sofort in Buffer zum geplanten Termin eingeplant (Di 18:00 Instagram, Mi 08:30 LinkedIn, Do 19:00 Facebook, Schweizer Zeit).
5. **Monatsbericht**: Am 1. jedes Monats holt das Tool die Kennzahlen aus Buffer, die KI ordnet sie ein, und der Bericht erscheint im Kundenportal.

Nach drei Monaten: in den Einstellungen ein neues Startdatum setzen und bei „Contentplan und Redaktionsplan“ auf „Neu ab hier“ klicken.

## Einrichtung

1. In Netlify eine **neue Website** aus diesem Repository anlegen, mit **Base directory `digitalseed`**. Build-Befehl und Ordner kommen aus `digitalseed/netlify.toml`.
2. Umgebungsvariablen setzen (unten) und neu deployen.
3. Dashboard öffnen (`https://<deine-seite>/`) und mit dem Admin-Schlüssel anmelden.

| Variable | Pflicht | Inhalt |
|---|---|---|
| `DIGITALSEED_ADMIN_KEY` | ja | Langer, zufälliger Schlüssel (mind. 16 Zeichen) für das Dashboard |
| `ANTHROPIC_API_KEY` | ja | API-Schlüssel von https://platform.claude.com |
| `DIGITALSEED_URL` | empfohlen | Öffentliche Adresse ohne `/` am Ende, z. B. `https://app.digitalseed.ch`. Wird für Bild-Links an Buffer, Mail-Links und den Monatsbericht gebraucht. Ohne sie nimmt Netlify die Standard-URL. |
| `BUFFER_API_TOKEN` | für Posten und Berichte | Token aus https://publish.buffer.com/settings/api |
| `BUFFER_ORGANIZATION_ID` | optional | Sonst wird die erste Organisation des Buffer-Kontos genommen |
| `DIGITALSEED_WEBHOOK_URL` | empfohlen | Webhook (z. B. Make), der die Mails verschickt, siehe unten |
| `PAGESPEED_API_KEY` | optional | Google-API-Schlüssel. Ohne ihn funktioniert PageSpeed auch, aber mit knapperem Limit |
| `IG_USER_ID`, `IG_ACCESS_TOKEN` | optional | Wie beim Seelenwende-Profil-Check: liest öffentliche Instagram-Business-Profile mit Kennzahlen und letzten Beiträgen |
| `DIGITALSEED_MODEL` | optional | Standard `claude-opus-5-5` |

### Buffer

Verbinde die Instagram-, Facebook- und LinkedIn-Profile des Kunden in **deinem** Buffer-Konto (der Kunde lädt dich dafür ein oder meldet sich einmal an). Ordne sie dann im Dashboard unter *Einstellungen* dem Kunden zu. Auf dem kostenlosen Buffer-Plan sind nur 10 geplante Beiträge pro Kanal möglich, für 13 Wochen brauchst du einen bezahlten Plan. Instagram muss ein Business- oder Creator-Konto sein.

### Mails über den Webhook

Bei jedem Ereignis schickt das Tool einen POST mit JSON an `DIGITALSEED_WEBHOOK_URL`:

```json
{
  "ereignis": "freigabe_angefragt",
  "zeit": "2026-10-07T09:00:00.000Z",
  "kunde": { "id": "…", "name": "Testfirma AG", "email": "kunde@example.ch", "website": "https://…" },
  "portal": "https://…/kunde.html?k=…",
  "dashboard": "https://…/#…"
}
```

| Ereignis | Mail an | Zusatzfelder |
|---|---|---|
| `analyse_fertig` | dich | – |
| `pruefung_bereit` | dich | – |
| `freigabe_angefragt` | Kunde (`kunde.email`, Link `portal`) | – |
| `aenderung_gewuenscht` | dich | `item`, `kommentar` |
| `freigabe_erteilt` | dich | `anzahl`, `alleFreigegeben` |
| `bericht_fertig` | Kunde | `monat`, `bericht` (Link) |
| `fehler` | dich | `schritt`, `fehler` |

In Make: *Custom Webhook* → *Router* nach `ereignis` → *Gmail/Outlook: Send an email*. Ohne Webhook zeigt das Dashboard einen fertigen Mailtext samt Link zum Kopieren.

## Kosten

Grob 2–5 USD KI-Kosten pro Kunde für den kompletten Durchlauf (Analyse mit Bildern, Website-Demo, 39 Beiträge, 3 Newsletter). Das Dashboard zeigt die tatsächlichen Kosten je Kunde. Überarbeitungen kosten wenige Cent, ein Monatsbericht etwa 0,05 USD. Dauer des Durchlaufs: etwa 15–25 Minuten.

## Grenzen, die du kennen solltest

- **Social-Media-Profile**: Facebook und LinkedIn zeigen ohne Anmeldung kaum Daten. Ausgewertet werden Existenz, Verlinkung und öffentliche Vorschau (Titel, Beschreibung, Bild). Instagram mit Kennzahlen und Beiträgen nur mit `IG_USER_ID`/`IG_ACCESS_TOKEN`. Die KI markiert nicht prüfbare Punkte als solche.
- **Bilder**: Die Beitragsgrafiken sind gestaltete Vorlagen in der Marke des Kunden, teils mit Fotos seiner Website. Es werden keine KI-Fotos erzeugt.
- **Reels**: Die Videos entstehen beim Prüfen im Dashboard-Browser (animierte Reel-Szenen, H.264-MP4). Fehlt ein Video, postet Buffer das Titelbild als normalen Beitrag.
- **Newsletter** werden nicht automatisch verschickt, weil jeder Kunde ein anderes Tool hat. Das HTML lässt sich importieren.
- **Fakten**: Die KI erfindet keine Preise, Zahlen oder Kundenstimmen. Fehlende Angaben stehen als `[Platzhalter]` im Text. Darum vor dem Senden prüfen.
- Website-Demo und Kundenportal sind über geheime Links erreichbar (nicht in Suchmaschinen). Wer den Link hat, kann freigeben.

## Technik

- `public/` – Dashboard (`index.html`), Kundenportal (`kunde.html`), gemeinsame Darstellung (`gemeinsam.js`, `stil.css`)
- `netlify/functions/aufgabe-background.mts` – führt je Aufruf einen Schritt aus (bis 15 Min.) und startet sich für den nächsten selbst neu, ausserdem Überarbeiten, Einplanen und Berichte
- `netlify/lib/schritte.mts` – alle KI-Schritte mit Prompts und Schemas
- `netlify/lib/erfassung.mts` – Website-, Social- und PageSpeed-Erfassung
- `netlify/lib/grafik.mts` – Grafik-Vorlagen (SVG → PNG mit resvg, Schriften von Google Fonts)
- `netlify/lib/buffer.mts` – Buffer GraphQL-API (Kanäle, Einplanen, Kennzahlen)
- Daten in Netlify Blobs (`digitalseed`, Medien in `digitalseed-medien`)

```bash
cd digitalseed && npm install && npm run typecheck
```
