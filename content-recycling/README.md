# Content Recycling — Startpaket

Nebenverdienst-Modell: Unternehmen mit Podcast, Webinaren oder YouTube-Kanal
produzieren regelmäßig Material, das nach der Veröffentlichung ungenutzt liegen
bleibt. Du übersetzt es in Posts, Newsletter und Clips — zum Festpreis, monatlich
wiederkehrend.

## Was hier liegt

| Datei | Zweck |
|---|---|
| `index.html` | Angebotsseite mit Festpreisen. Platzhalter in Großbuchstaben ersetzen, dann online. |
| `lieferung/checkliste.md` | Der Ablauf pro Kunde und Monat, mit Zeitzielen |
| `lieferung/prompts.md` | Sechs Prompts: Stimmprofil, Kernaussagen, Posts, Newsletter, Clips, Redaktionsprüfung |
| `lieferung/freigabe.html` | Freigabedokument für den Kunden. Eine Datei, kein Konto nötig — er klickt durch und erzeugt seine Rückmeldung zum Kopieren. |
| `lieferung/freigabe-vorlage.md` | Dieselbe Struktur zum Einfügen in Google Docs oder Notion, plus Begleitmail |
| `akquise/nachrichten.md` | Zielkundenfilter, drei Nachrichtenvorlagen, Gesprächsleitfaden, Einwände |
| `akquise/kundenliste.csv` | Tabelle zum Mitschreiben der Pipeline |

## Freigabedokument befüllen

In `lieferung/freigabe.html` stehen oben im Skript fünf Konstanten (`KUNDE`, `MONAT`,
`FRIST`, `ABSENDER`, `MAIL_AN`) und darunter das Array `FOLGEN`. Beides ersetzen, Datei
speichern, dem Kunden schicken — als Anhang oder unter einer eigenen URL. Es braucht
keinen Server und kein Konto beim Kunden; seine Eingaben liegen in seinem Browser, bis
er auf „Rückmeldung erzeugen" drückt. Die Inhalte im Auslieferungszustand sind ein
Beispiel und müssen raus.

Ein Punkt, der in der Praxis zählt: Der Kunde bekommt pro Position nur **eine** Fassung
zu sehen, nie drei zur Auswahl. Varianten anzubieten heißt „entscheide du" — und das
ist die Arbeit, die er gerade ausgelagert hat. Ausnahme sind die Betreffzeilen: eine
Entscheidung, die er treffen darf, senkt den Widerstand gegen alles andere.

## Die Rechnung

| Paket | Preis | Aufwand/Monat | Stundensatz |
|---|---|---|---|
| Basis | 390 € | ~3 h | 130 € |
| Standard | 690 € | ~6 h | 115 € |
| Komplett | 1.190 € | ~12 h | 99 € |

Drei Standard-Kunden: **2.070 € im Monat bei etwa 18 Stunden.** Das ist das
realistische Ziel für Monat 4 bis 6, nicht für Monat 1.

Der Aufwand sinkt mit der Zeit, weil das Stimmprofil pro Kunde besser wird.
Monat 1 dauert regelmäßig das Doppelte der Angabe oben — das ist eingeplant und
kein Zeichen, dass es nicht funktioniert.

## Warum diese Preise

Unter 350 € rechnet es sich nach Redaktionsaufwand nicht. Über 1.500 € vergleicht
der Kunde dich mit einer Agentur, die Strategie, Design und Mediaplanung mitbringt
— diesen Vergleich verlierst du. Der Bereich dazwischen ist unbesetzt: zu klein für
Agenturen, zu strukturiert für Freelancer, die pro Post abrechnen.

Die Probefolge zu 149 € ist keine Einnahmequelle, sondern ein Filter. Wer 149 €
zahlt, zahlt auch 690 €. Wer bei 149 € zögert, hätte dich drei Monate Zeit gekostet.

## Die ersten 21 Tage

**Tag 1–2** — Platzhalter in `index.html` ersetzen (`[DEIN NAME]`, `[DEINE-MAIL]`,
`[DEIN-KALENDER-LINK]`), Impressum und Datenschutzerklärung ergänzen, Seite
veröffentlichen. Bei Netlify reicht Drag-and-drop dieses Ordners.

**Tag 3–7** — 30 Betriebe nach den vier Signalen in `akquise/nachrichten.md`
recherchieren, in `kundenliste.csv` eintragen. Noch keine Nachricht schreiben.

**Tag 8–12** — Für die besten 10 je zwei Posts fertig produzieren (Prompt 2 + 3 +
Redaktion). Rechne 20 Minuten pro Betrieb.

**Tag 13–15** — Alle 30 anschreiben: die 10 mit Probearbeit, die übrigen 20 mit
Nachricht B ohne Anlage. Der Vergleich zeigt dir, wie viel die Probearbeit bringt.

**Tag 16–18** — Gespräche führen. Drei Fragen stellen, Preis nennen, still sein.

**Tag 19–21** — Ersten Kunden aufsetzen: Stimmprofil bauen, Tabu-Liste, erste
Lieferung terminieren. Danach einmal nachfassen bei allen, die nicht geantwortet
haben — genau einmal.

## Formales (Deutschland, kurz)

Nebengewerbe beim Gewerbeamt anmelden, 20–60 €. Kleinunternehmerregelung nach
§ 19 UStG solange der Jahresumsatz unter 25.000 € liegt — dann weist du keine
Umsatzsteuer aus. Wenn du angestellt bist: Arbeitsvertrag prüfen, viele verlangen
eine Anzeige der Nebentätigkeit. Bei Kundenzugängen zu Planungstools nur
Einladungsfunktionen nutzen, keine Passwörter, und einen AV-Vertrag anbieten,
sobald du personenbezogene Daten verarbeitest (Newsletter-Listen). Das ist keine
Rechts- oder Steuerberatung, aber es sind die vier Punkte, an denen es sonst hakt.

## Wo es schiefgeht

1. **Rohausgabe ausliefern.** Der häufigste Grund für Kündigung in Monat 2.
2. **Freigabe ohne Frist.** Das Dokument bleibt liegen, du wartest, der Monat
   ist vorbei und die Rechnung fühlt sich für den Kunden unverdient an.
3. **Zu breites Angebot.** „Ich mache Social Media" verkauft nicht.
   „Aus einer Folge wird ein Monat" verkauft.
4. **Kein Report.** Die Verlängerung entscheidet sich am Monatsbericht, nicht an
   der Textqualität — weil der Kunde die Texte nur überfliegt, die Zahlen aber liest.
