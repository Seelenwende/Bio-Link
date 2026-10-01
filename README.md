# Bio-Link

- `index.html` – Link-in-Bio-Seite von Seelenwende.
- `werte-finder.html` – Werte-Finder: in vier Schritten (5–15 Werte wählen, auf 5 eingrenzen, in eigenen Worten beschreiben, was jeder Wert bedeutet, einschätzen wie sehr man sie lebt) zu den eigenen fünf Kernwerten – mit eigenen Bedeutungssätzen und Impulsfragen zum Nachspüren. Läuft komplett im Browser, ohne KI, API-Schlüssel oder Kosten; Antworten bleiben auf dem Gerät.
- `begleiterin.html` – **Mira**, die Seelenwende-Begleiterin: KI-Gesprächsbegleitung mit Zugangscode. Ein offenes Gespräch ohne Kategorien – die Begleiterin erkennt selbst, was gerade gebraucht wird. Krisenerkennung mit Notrufnummern (CH/DE/AT), „Schnell weg“-Knopf, Gespräche werden nicht gespeichert.
- `kreis.html` – **Seelenwende Kreis**: Mitgliedschaft (19 €/Monat). Ohne Code eine Einladungsseite, mit Code der Mitgliederbereich: ein Thema pro Monat mit vier Wochen-Impulsen (Text, Übung, Journal-Frage, Einstieg für Mira), Archiv, Mira mit Monatskontingent.
- `zugang-admin.html` – internes Werkzeug: Zugangscodes für Mira und den Kreis anlegen, sperren, nachschlagen.
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
| `SEELENWENDE_ADMIN_KEY` | langer, zufälliger Schlüssel (mind. 16 Zeichen) für `zugang-admin.html` und Make |
| `BEGLEITERIN_MODEL` | optional, Standard `claude-opus-5-5` |

Kosten: grob 0,01–0,04 $ pro Nachricht, also höchstens etwa 6 $ pro Kreis-Mitglied und Monat bei vollem Kontingent.

## Zugangscodes (Mira und Kreis)

Codes kommen aus zwei Quellen (`netlify/lib/zugang.mts`):

1. **Code-Register** (empfohlen): Codes über `zugang-admin.html` oder per API anlegen. Sie gelten sofort, ohne neues Deployment, und lassen sich wieder sperren, etwa wenn ein Kreis-Abo gekündigt wird. Gespeichert wird nur ein Hash des Codes.
2. **Umgebungsvariablen** `BEGLEITERIN_CODES` / `KREIS_CODES`: von Hand, nach jeder Änderung neu deployen.

Ein Kreis-Code öffnet auch Mira. Das Kontingent zählt pro Kalendermonat (Schweizer Zeit) und ist am Monatsersten wieder voll. Ein Mira-Code öffnet den Kreis nicht.

API für Make (z. B. Tentary-Kauf → Code anlegen → MailerLite-Mail; Tentary-Kündigung → sperren):

```
POST /api/zugang/admin
Authorization: Bearer <SEELENWENDE_ADMIN_KEY>

{ "aktion": "erstellen", "plan": "kreis", "ref": "<Bestellnummer>" }   → { "code": "WENDE-XXXX-XXXX", … }
{ "aktion": "sperren",   "ref": "<Bestellnummer>" }                    → { "ok": true, "active": false }
{ "aktion": "entsperren" | "info", "code": "WENDE-…" }
```

## Kreis-Inhalte

Die Monatsthemen stehen in `netlify/lib/kreis-inhalte.mts` und werden nur mit gültigem Kreis-Code ausgeliefert (`/api/kreis/inhalt`). Ein Monat wird an seinem ersten Tag sichtbar, ältere bleiben im Archiv. Angelegt sind Oktober, November und Dezember 2026. Den Kauf-Link trägst du in `kreis.html` bei `KAUF_URL` ein; solange er leer ist, zeigt die Seite den Hinweis „Schreib KREIS an @_seelenwende“.
