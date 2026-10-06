# Bio-Link

- `index.html` – Link-in-Bio-Seite von Seelenwende (siehe unten: Werkzeuge erst nach Mail-Adresse). Gruppen: Kostenlos starten · Für den Moment · Begleitung · Mehr. Die bezahlten Produkte verlinken auf ihre Angebotsseite, nicht direkt auf den Shop.
- `start.html` – **Website** von Seelenwende: drei Phasen (Noch drin · Im Gehen · Danach), alle kostenlosen Werkzeuge, alle Angebote nach Stufe, Haltung, Sicherheit, Fragen.
- `angebot-*.html` – **Salespages**: `angebot-mira`, `angebot-antwort-helfer` (Erste-Hilfe-Set), `angebot-kompass`, `angebot-tagebuch`, `angebot-programm`, `angebot-kreis`, `angebot-bundle` (inkl. „Du bist genug“ einzeln).
- `ueber-mich.html` – **Über mich**: Geschichte (über 15 Jahre in der Beziehung, letztes Jahr der Ausstieg), Weg als Zeitachse, Haltung. Kurzfassung auch auf `start.html`, je eine persönliche Notiz auf jeder Salespage.
- `assets/logo.svg` – Logo-Schmetterling als Vektor (Kopf, Bio-Link, Browser-Icon), nachgezeichnet nach `assets/logo-seelenwende.png` (Original mit Schriftzug). `assets/icons.svg` – Icon-Set (`<svg class="ic"><use href="assets/icons.svg#herz"/></svg>`).
- **Fotos:** `assets/ueber-mich.jpg` (Porträt 4:5, „Über mich“ und Startseite) und `assets/avatar.jpg` (quadratisch, persönliche Notizen auf den Salespages). Fehlt eine Datei, erscheint der Schmetterling.
- `assets/seite.css`, `assets/seite.js` – gemeinsames Aussehen und Skript für Website und Salespages: Kopf, Fuß, Krisenleiste, „Schnell weg“ (auch zweimal Esc), Mail-Fenster vor den kostenlosen Werkzeugen (derselbe Merk-Schlüssel wie im Bio-Link), Kaufleiste auf dem Handy. **Alle Kauf-Links stehen dort oben in `KAUF`.** Ist ein Link leer, zeigt die Seite statt des Knopfs „Bald erhältlich. Schreib MIRA/KOMPASS/… an @_seelenwende“.
- `muster-check.html` – **Muster-Check** „Ist das noch normal?“: 20 konkrete Alltagssituationen in fünf Bereichen (Wahrnehmung, Abwertung, Kontrolle & Rückzug, Heiß & kalt, Schuld & Angst). Zeigt, wo sich ein Muster wiederholt, wie es in einer gesunden Beziehung aussähe, einen Satz und eine Journal-Frage. Sicherheitshinweis mit Hilfenummern (CH/DE/AT), sobald sie Angst vor seiner Wut angibt; „Schnell weg“-Knopf (auch zweimal Esc). Läuft komplett im Browser, nichts wird gespeichert.
- `werte-finder.html` – Werte-Finder: in vier Schritten (5–15 Werte wählen, auf 5 eingrenzen, in eigenen Worten beschreiben, was jeder Wert bedeutet, einschätzen wie sehr man sie lebt) zu den eigenen fünf Kernwerten – mit eigenen Bedeutungssätzen und Impulsfragen zum Nachspüren. Läuft komplett im Browser, ohne KI, API-Schlüssel oder Kosten; Antworten bleiben auf dem Gerät.
- `notizen.html` – **Klarheits-Tagebuch** (bewusst neutral benannt, heißt im Browser nur „Notizen“): Vorfälle mit Datum festhalten – was passiert ist, was wörtlich gesagt wurde, erkannte Muster (Leugnen, Kleinreden, Schuldumkehr …), Gefühle, Belege und ein Satz „Was weißt du sicher?“ für Zweifelsmomente. Übersicht „Muster“ zeigt, was sich wiederholt. PIN-geschützt und mit AES-GCM verschlüsselt (Schlüssel per PBKDF2 aus der PIN), gespeichert nur im Browser des Geräts – kein Server, kein Konto. Sperrt sich nach 5 Min. ohne Eingabe oder 30 Sek. im Hintergrund, „Schnell weg“-Knopf (auch zweimal Esc), Bremse nach 5 falschen PINs. Export als Druck/PDF oder Text (z. B. für eine Beratungsstelle), verschlüsselte Sicherungsdatei zum Mitnehmen auf ein anderes Gerät. Vergessene PIN = Tagebuch verloren (Absicht). Knopf **„Mit Mira einordnen“** in jedem Eintrag: übergibt den Eintrag (ohne Belege/Zeugen) über `sessionStorage` an `begleiterin.html`, wo er nach dem Zugangscode im Textfeld steht – sie liest ihn und schickt ihn selbst ab. Mira liest den Wert sofort aus und löscht ihn; nichts landet in Adresse oder Verlauf.
- `affirmationen.html` – **Sei sanft mit dir**: persönliche Affirmationen für Frauen, die gerade zu hart mit sich sind. Sie wählt, was die harte Stimme sagt (bis zu drei Sätze, optional in eigenen Worten), wie es ihr gerade geht und wo sie steht, und beantwortet die Freundinnen-Frage („Was würdest du einer Freundin sagen?“). Danach bekommt sie zu jedem harten Satz eine Einordnung und einen freundlichen Satz in drei Stufen (ganz sanft · auf dem Weg · klar und stark) und wählt selbst, welche Stufe sie heute glauben kann. Dazu ein Satz für ihr Gefühl, ihre Phase und – falls vorhanden – ihre Werte aus dem Werte-Finder. Mit Lese-Moment im Vollbild, „Satz für heute“ beim nächsten Besuch und Krisenhinweis, wenn ihre eigenen Worte auf Gefahr deuten. Läuft komplett im Browser, ohne KI und ohne Kosten; alles bleibt auf dem Gerät.
- `neuer-satz-kompass.html` – **Neuer-Satz-Kompass** (bezahlt, mit Zugangscode): 30 Tage, ein Impuls pro Tag (Impuls, kleine Aufgabe, Frage, eigene Notiz). Baut auf dem lautesten Satz aus dem Glaubenssätze-Test und drei Werten aus dem Werte-Finder auf – beide werden automatisch übernommen, wenn sie auf dem Gerät gemacht wurden, sonst wählt sie die Frau selbst. Woche 1 Bemerken, Woche 2 Der neue Satz, Woche 3 Werte leben, Woche 4 Verankern. Die Startseite bietet zwei Wege: **Weg 1 (empfohlen)** über Glaubenssätze-Test → Werte-Finder → Kompass, wobei sich jeder Schritt erst nach dem vorherigen öffnet, oder **Weg 2** direkt starten (Satz und Werte selbst wählen, nichts wird übernommen). Die Einrichtung ist frei; die 30 Impulse liefert der Server erst nach gültigem Code (siehe unten). Jeden Kalendertag öffnet sich ein neuer Tag, verpasste bleiben offen. Optional Kalender-Erinnerung (.ics). Notizen bleiben auf dem Gerät. Die Weiter-Knöpfe aus Test und Werte-Finder öffnen `neuer-satz-kompass.html#neu`: Dann erscheint immer ein neuer, leerer Kompass zum Einrichten (ein laufender bleibt über „Zu deinem bisherigen Kompass“ erreichbar, bis der neue gestartet wird). Vorschau mit allen Tagen: `neuer-satz-kompass.html?alle` oder `#alle`.
- `red-flag-radar.html` – Red-Flag-Radar: „Passiert mir das wieder?“ – Check für neue Bekanntschaften mit 18 Situationen in sechs Bereichen (Tempo, zu perfekt, Grenzen, Verantwortung, Kontrolle, Bauchgefühl). Antwort „Weiß ich noch nicht“ wird als offener Beobachtungspunkt gezeigt. Ergebnis mit Was-dahinterstecken-kann, gesundem Gegenstück, „Sanft prüfen“ und Journal-Frage; bei deutlichen Signalen Beratungsnummern (CH/DE/AT). Läuft komplett im Browser, Antworten bleiben auf dem Gerät.
- `begleiterin.html` – **Mira**, die Seelenwende-Begleiterin: KI-Gesprächsbegleitung mit Zugangscode. Ein offenes Gespräch ohne Kategorien – die Begleiterin erkennt selbst, was gerade gebraucht wird. Krisenerkennung mit Notrufnummern (CH/DE/AT), „Schnell weg“-Knopf, Gespräche werden nicht gespeichert.
- `kreis.html` – **Seelenwende Kreis**: Mitgliedschaft (19 €/Monat). Ohne Code eine Einladungsseite, mit Code der Mitgliederbereich: ein Thema pro Monat mit vier Wochen-Impulsen (Text, Übung, Journal-Frage, Einstieg für Mira), Archiv, Mira mit Monatskontingent.
- `zugang-admin.html` – internes Werkzeug: Zugangscodes für Mira und den Kreis anlegen, sperren, nachschlagen.
- `antwort-helfer.html` – **Antwort-Helfer** mit Zugangscode: Sie fügt seine Nachricht ein und bekommt eine ruhige Einordnung – ob sie überhaupt antworten sollte, was wirklich eine Antwort braucht, welche Sätze nur Köder sind, und bei Bedarf ein bis zwei kurze, sachliche Antworten (BIFF/Grey Rock) zum Kopieren. Besonders für Co-Parenting. Erkennt Drohungen und zeigt dann Notrufnummern statt Antwortvorschlägen, „Schnell weg“-Knopf, Nachrichten werden nicht gespeichert.
- `programm.html` – **„Wieder bei dir“**, das 6-Wochen-Programm mit Zugangscode: sechs Wochen mit Impulsen zum Lesen, Schreibübungen, sieben Tagesankern pro Woche und Gesprächsanstößen für Mira. Die Inhalte liegen nur auf dem Server und kommen erst nach dem Code. Notizen bleiben auf dem Gerät (dauerhaft nur mit Häkchen, sonst nur im offenen Tab). Mit „Schnell weg“ und Krisenleiste.
- `planer.html` – **Ausstiegs-Planer** (gratis, ohne Code): Sicherheitsplan als Checkliste in neun Abschnitten (Handy und Spuren, Notfall, Dokumente, Geld, Notfalltasche, Menschen, Schutz und Recht, der Tag selbst, die ersten Wochen) mit Hinweisen und Beratungsstellen für die Schweiz, Deutschland und Österreich. Bewusst neutraler Tab-Titel („Checkliste“), „Schnell weg“-Knopf. Ohne PIN wird nichts gespeichert, mit PIN bleibt der Plan verschlüsselt (AES-GCM) nur auf dem Gerät. Läuft komplett im Browser, ohne Server und ohne Kosten. Der Inhalt (Punkte, Tipps, Hinweise je Land, Beratungsstellen) steht oben im Skript als `INHALT`. **Nummern und Stellen vor jeder Änderung fachlich prüfen lassen** (Stand: Oktober 2026).
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
| `BEGLEITERIN_CODES` | optional, Mira-Codes von Hand, kommagetrennt, Groß-/Kleinschreibung egal, z. B. `Wendepunkt, WENDE-AB12-CD34` |
| `BEGLEITERIN_LIMIT` | optional, Nachrichten pro Mira-Code insgesamt (Standard 300) |
| `KREIS_CODES` | optional, Kreis-Codes von Hand, kommagetrennt |
| `KREIS_LIMIT` | optional, Mira-Nachrichten pro Kreis-Code **pro Monat** (Standard 150) |
| `SEELENWENDE_ADMIN_KEY` | langer, zufälliger Schlüssel (mind. 16 Zeichen) für `zugang-admin.html` und Make; für Live und Vorschauen je ein eigener Wert |
| `BEGLEITERIN_MODEL` | optional, Standard `claude-opus-5-5` |

Kosten: grob 0,01–0,04 $ pro Nachricht, also höchstens etwa 6 $ pro Kreis-Mitglied und Monat bei vollem Kontingent.

## Zugangscodes (Mira und Kreis)

Codes kommen aus zwei Quellen (`netlify/lib/zugang.mts`):

1. **Code-Register** (empfohlen): Codes über `zugang-admin.html` oder per API anlegen. Sie gelten sofort, ohne neues Deployment, und lassen sich wieder sperren, etwa wenn ein Kreis-Abo gekündigt wird. Gespeichert wird nur ein Hash des Codes.
2. **Umgebungsvariablen** `BEGLEITERIN_CODES` / `KREIS_CODES`: von Hand, nach jeder Änderung neu deployen.

Ein Kreis-Code öffnet auch Mira, ein Programm-Code ebenfalls (Kontingent `PROGRAMM_MIRA_LIMIT`, insgesamt). Das Kontingent zählt pro Kalendermonat (Schweizer Zeit) und ist am Monatsersten wieder voll. Ein Mira-Code öffnet den Kreis nicht.

API für Make (z. B. Tentary-Kauf → Code anlegen → MailerLite-Mail; Tentary-Kündigung → sperren):

```
POST /api/zugang/admin
Authorization: Bearer <SEELENWENDE_ADMIN_KEY>

{ "aktion": "erstellen", "plan": "kreis", "ref": "<Bestellnummer>" }   → { "code": "WENDE-XXXX-XXXX", … }
{ "aktion": "sperren",   "ref": "<Bestellnummer>" }                    → { "ok": true, "active": false }
{ "aktion": "entsperren" | "info", "code": "WENDE-…" }
```

## Kreis-Inhalte

Die Monatsthemen stehen in `netlify/lib/kreis-inhalte.mts` und werden nur mit gültigem Kreis-Code ausgeliefert (`/api/kreis/inhalt`). Ein Monat wird an seinem ersten Tag sichtbar, ältere bleiben im Archiv. Vom nächsten Monat zeigt die Seite vorab nur Titel und Untertitel. In Netlify-Vorschauen (Deploy Previews) kommen alle Monate mit, damit man sie prüfen kann. Ein Kreis-Code öffnet auch den Neuer-Satz-Kompass (`kompass-tage`) und den Antwort-Helfer (wie alle Codes, die Mira öffnen). Angelegt sind Oktober, November und Dezember 2026. Den Kauf-Link trägst du in `kreis.html` bei `KAUF_URL` ein; solange er leer ist, zeigt die Seite den Hinweis „Schreib KREIS an @_seelenwende“.


### Kreis in einer Netlify-Vorschau testen

In Netlify `KREIS_CODES` (z. B. `KREIS-TEST`) und `SEELENWENDE_ADMIN_KEY` mit dem Kontext *Deploy Previews* anlegen. Netlify übernimmt geänderte Variablen erst beim nächsten Build, also danach die Vorschau neu bauen lassen. Mira antwortet in Vorschauen nur, wenn `ANTHROPIC_API_KEY` auch dort gesetzt ist. Achtung: Das Code-Register ist für Vorschau und Live-Seite dasselbe; Test-Codes aus `zugang-admin.html` danach sperren.

## So funktioniert das 6-Wochen-Programm „Wieder bei dir“ (Netlify)

1. `programm-inhalt` prüft den Zugangscode und liefert erst dann die Inhalte aus. Die Texte stehen in `netlify/lib/programm.mts`.
2. Notizen, Tagesanker und Fortschritt werden nie hochgeladen. Mit Häkchen bleiben sie auf dem Gerät, ohne Häkchen nur, solange der Tab offen ist.
3. Boni (Begleitheft und „Audio für schwere Tage“, beide nur im Programm) liegen in `bonus/`. `programm-bonus` gibt mit gültigem Code einen drei Stunden gültigen, signierten Link heraus; die Edge-Funktion `bonus-schutz` lässt nur solche Links durch. Welche Dateien wohin gehören, steht in `bonus/LIESMICH.md`. Einzelprodukte werden nicht mitgeliefert; die Wochen knüpfen mit „Du hast schon …?“ an sie an (Werkzeug und Weg).
4. Derselbe Code öffnet Mira, mit eigenem, größerem Kontingent. Die Gesprächsanstöße jeder Woche landen direkt in Miras Eingabefeld.

| Variable | Inhalt |
|---|---|
| `PROGRAMM_CODES` | gültige Programm-Codes, kommagetrennt, z. B. `WIEDER-AB12-CD34` |
| `BONUS_SECRET` | optional, eigenes Geheimnis für die Bonus-Links (sonst aus den Programm-Codes abgeleitet) |
| `PROGRAMM_MIRA_LIMIT` | optional, Mira-Nachrichten pro Programm-Code (Standard 1000) |

Neue Käuferin: Code an `PROGRAMM_CODES` anhängen, danach neu deployen.

## So funktioniert der Neuer-Satz-Kompass (Netlify)

Satz und Werte wählt die Frau frei. Auf der letzten Einrichtungsseite gibt sie ihren Zugangscode ein. `kompass-tage` (`/api/kompass/tage`) prüft den Code und liefert die 30 Impulse, fertig eingesetzt mit ihrem Satz und ihren Werten. Die Impulse stehen nur in `netlify/lib/kompass.mts`, nicht in der Seite. Danach läuft alles auf ihrem Gerät; gespeichert wird auf dem Server nichts.

| Variable | Inhalt |
|---|---|
| `KOMPASS_CODES` | gültige Kompass-Codes, kommagetrennt, Groß-/Kleinschreibung egal, z. B. `KOMPASS-AB12-CD34` |

Neue Käuferin: Code an `KOMPASS_CODES` anhängen, danach neu deployen. Ohne die Variable zeigt der Kompass „noch nicht eingerichtet“. Den Kauf-Link („Noch keinen Code?“) in `neuer-satz-kompass.html` auf das Tentary-Produkt setzen, sobald es angelegt ist.

## Bezahlte Browser-Werkzeuge (Red-Flag-Radar, Werte-Finder, Sei sanft mit dir)

Die drei Seiten laufen weiter komplett im Browser. Beim Öffnen fragt `assets/werkzeug-zugang.js` nach einem Zugangscode und prüft ihn über `werkzeug-zugang` (`/api/werkzeug/zugang`). Gemerkt wird nur „freigeschaltet“ (mit Häkchen dauerhaft, sonst bis der Tab zu ist), der Code selbst nicht. In Netlify-Vorschauen gibt es „Vorschau: ohne Code ansehen“. Weil der Inhalt in der Seite steht, ist das eine einfache Sperre, kein Kopierschutz – für Preise von 7–9 € reicht das.

| Variable | Inhalt |
|---|---|
| `RADAR_CODES` | Codes für den Red-Flag-Radar (9 €), kommagetrennt |
| `WERTE_CODES` | Codes nur für den Werte-Finder (9 €). Kompass-Codes (`KOMPASS_CODES`) öffnen ihn ebenfalls (Paket 24 €). |
| `SANFT_CODES` | Codes für „Sei sanft mit dir“ (7 €) – auch den Code für Bundle-Käuferinnen hier eintragen |

Kreis- und Programm-Codes öffnen alle drei. Salespages: `angebot-radar.html`, `angebot-sanft.html`, Werte-Finder auf `angebot-kompass.html`.

## Bio-Link: Werkzeuge erst nach Mail-Adresse

Auf `index.html` und `start.html` öffnen die kostenlosen Einstiege (Muster-Check, Glaubenssätze-Test, Mini-Guide) nicht direkt. Zuerst kommt ein Fenster, in das die Frau ihre Mail-Adresse einträgt und den Mails zustimmt. `werkzeuge-anmeldung` (`/api/werkzeuge/anmelden`) trägt sie in MailerLite ein, danach öffnet sich das Werkzeug. Der Browser merkt sich die Anmeldung, beim nächsten Besuch geht es direkt weiter. Der Mini-Guide öffnet danach seine Tentary-Seite im selben Fenster. Das Self Care Journal ist jetzt ein Produkt für 9 € (Preis in Tentary einstellen). Die Werkzeug-Seiten selbst bleiben über ihren direkten Link erreichbar (z. B. aus dem Programm oder den Ergebnis-Mails).

| Variable | Inhalt |
|---|---|
| `MAILERLITE_API_KEY` | API-Schlüssel aus MailerLite (derselbe wie beim Glaubenssätze-Test) |
| `MAILERLITE_GROUP_WERKZEUGE` | optional: ID einer anderen Gruppe. Ohne sie sucht die Funktion die Gruppe „Bio-Link Werkzeuge“ per Name und legt sie bei Bedarf selbst an. |

## Glaubenssätze-Test: Ergebnis per Mail (MailerLite)

Die Texte des Tests stehen in `glaubenssaetze.json` (für Seite und Mail). Unter dem Ergebnis kann die Frau ihre Mail-Adresse eintragen. `test-ergebnis-mail` rechnet das Ergebnis aus den Punkten nach und trägt sie mit ihrem Hauptsatz in MailerLite ein; die Mail verschickt eine MailerLite-Automatisierung. Einrichtung, Felder und Mailtext: `mails/glaubenssaetze-ergebnis.md`.

| Variable | Inhalt |
|---|---|
| `MAILERLITE_API_KEY` | API-Schlüssel aus MailerLite |
| `MAILERLITE_GROUP_GLAUBENSSAETZE` | ID der Gruppe „Glaubenssätze-Test“ |
## So funktioniert der Antwort-Helfer (Netlify)

Gleicher Aufbau wie bei Mira, nur ohne Gesprächsverlauf – eine Nachricht rein, eine Einordnung raus:

1. `antwort-helfer-zugang` prüft den Zugangscode und das Kontingent.
2. `antwort-helfer-send` zählt die Prüfung und startet `antwort-helfer-background` (fragt Claude, Hintergrund-Funktion).
3. `antwort-helfer-status` liefert das Ergebnis und löscht es sofort danach. Gespeichert wird nur der Zähler pro Code (als Hash).

Die Anweisungen stehen in `netlify/lib/antwort-helfer.mts`, die Code-Prüfung kommt aus `netlify/lib/codes.mts`.

| Variable | Inhalt |
|---|---|
| `ANTWORT_HELFER_CODES` | eigene Zugangscodes, kommagetrennt (z. B. für Käuferinnen des Erste-Hilfe-Sets) |
| `ANTWORT_HELFER_LIMIT` | optional, Prüfungen pro Code (Standard 100) |
| `ANTWORT_HELFER_MODEL` | optional, Standard `claude-opus-5-5` |

Alle Codes aus `BEGLEITERIN_CODES` und `PROGRAMM_CODES` gelten auch hier (mit eigenem Zähler), damit Mira-Käuferinnen und das 6-Wochen-Programm den Antwort-Helfer automatisch mitnutzen. Kosten: grob 0,02–0,06 $ pro Prüfung.

## Bildnachweis

Stimmungsfotos in `assets/bilder/` von [Pexels](https://www.pexels.com) (Pexels-Lizenz: kostenlos, auch kommerziell, ohne Namensnennung). Foto-IDs: `antwort-nachricht` 7341894 · `start-fenster` 11012771 · `kreis-lesen` 5358916 · `bundle-blumen` 545018 · `abschluss-weite` und `band-weite` 11727471 (Hintergrund der Abschluss-Bereiche und des Bild-Bands) · Kartenbilder in `karten/`: Planer 7365452, Journal 6913375, sonst wie oben. Original: `https://www.pexels.com/photo/<ID>/`. Die Bilder liegen auf der eigenen Seite, damit keine Besucherdaten an Dritte gehen.
