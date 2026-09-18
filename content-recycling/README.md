# Content Recycling — Startpaket

Nebenverdienst-Modell: Unternehmen mit Podcast, Webinaren oder YouTube-Kanal
produzieren regelmässig Material, das nach der Veröffentlichung ungenutzt liegen
bleibt. Du übersetzt es in Posts, Newsletter und Clips — zum Festpreis, monatlich
wiederkehrend.

## Was hier liegt

| Datei | Zweck |
|---|---|
| `index.html` | Angebotsseite mit Festpreisen. Platzhalter in Grossbuchstaben ersetzen, dann online. |
| `lieferung/checkliste.md` | Der Ablauf pro Kunde und Monat, mit Zeitzielen |
| `lieferung/prompts.md` | Sechs Prompts: Stimmprofil, Kernaussagen, Posts, Newsletter, Clips, Redaktionsprüfung |
| `lieferung/freigabe.html` | Freigabedokument für den Kunden. Eine Datei, kein Konto nötig — er klickt durch und erzeugt seine Rückmeldung zum Kopieren. |
| `lieferung/freigabe-vorlage.md` | Dieselbe Struktur zum Einfügen in Google Docs oder Notion, plus Begleitmail |
| `akquise/nachrichten.md` | Zielkundenfilter, drei Nachrichtenvorlagen, Gesprächsleitfaden, Einwände |
| `akquise/kundenliste.csv` | Tabelle zum Mitschreiben der Pipeline |
| `tool/` | CLI, das den Lieferprozess ausführt: Transkript rein, Freigabedokument raus. Eigenes README im Ordner. |

## Das Tool

`tool/` führt den Ablauf aus `lieferung/checkliste.md` aus: Transkript rein, und
heraus kommen Kernaussagen, Posts je Kanal, Newsletter, Clip-Timecodes, eine
Redaktionsprüfung und ein gefülltes Freigabedokument.

```bash
cd tool && npm install && export ANTHROPIC_API_KEY=sk-ant-...
node recycle.mjs profil --kunde meiereiag folge12.vtt folge13.vtt folge14.vtt
node recycle.mjs folge --kunde meiereiag --nummer 47 --titel "…" \
  --datum 18.02.2026 --monat "März 2026" --frist "27.02.2026" folge47.vtt
```

Kosten je Folge etwa USD 1 bis 2; das Tool zeigt nach jedem Durchlauf die
tatsächlichen Zahlen. Vier Folgen gegen 950 CHF Umsatz — die Modellkosten sind bei
diesem Geschäftsmodell nicht die Grösse, über die du nachdenken musst.

Was das Tool nicht tut, ist der Redaktionsdurchgang. Es liefert Entwürfe plus eine
Prüfliste; die Entscheidung, was rausfliegt, bleibt bei dir. Genau die verkaufst du.
Details in `tool/README.md`.

## Freigabedokument befüllen

In `lieferung/freigabe.html` stehen oben im Skript fünf Konstanten (`KUNDE`, `MONAT`,
`FRIST`, `ABSENDER`, `MAIL_AN`) und darunter das Array `FOLGEN`. Beides ersetzen, Datei
speichern, dem Kunden schicken — als Anhang oder unter einer eigenen URL. Es braucht
keinen Server und kein Konto beim Kunden; seine Eingaben liegen in seinem Browser, bis
er auf „Rückmeldung erzeugen" drückt. Die Inhalte im Auslieferungszustand sind ein
Beispiel und müssen raus.

Ein Punkt, der in der Praxis zählt: Der Kunde bekommt pro Position nur **eine** Fassung
zu sehen, nie drei zur Auswahl. Varianten anzubieten heisst „entscheide du" — und das
ist die Arbeit, die er gerade ausgelagert hat. Ausnahme sind die Betreffzeilen: eine
Entscheidung, die er treffen darf, senkt den Widerstand gegen alles andere.

## Die Rechnung

| Paket | Preis | Aufwand/Monat | Stundensatz |
|---|---|---|---|
| Basis | 550 CHF | ~3 h | 183 CHF |
| Standard | 950 CHF | ~6 h | 158 CHF |
| Komplett | 1’650 CHF | ~12 h | 138 CHF |

Drei Standard-Kunden: **2’850 CHF im Monat bei etwa 18 Stunden.** Das ist das
realistische Ziel für Monat 4 bis 6, nicht für Monat 1.

Der Aufwand sinkt mit der Zeit, weil das Stimmprofil pro Kunde besser wird.
Monat 1 dauert regelmässig das Doppelte der Angabe oben — das ist eingeplant und
kein Zeichen, dass es nicht funktioniert.

Die Stundenangaben setzen voraus, dass du `tool/` benutzt. Von Hand, mit Prompts im
Chatfenster, liegt derselbe Umfang bei zwei bis drei Mal so viel Zeit.

## Warum diese Preise

Unter 500 CHF rechnet es sich nach Redaktionsaufwand nicht. Über 2’000 CHF vergleicht
der Kunde dich mit einer Agentur, die Strategie, Design und Mediaplanung mitbringt
— diesen Vergleich verlierst du. Der Bereich dazwischen ist unbesetzt: zu klein für
Agenturen, zu strukturiert für Freelancer, die pro Post abrechnen.

Die Preise liegen deutlich über dem, was in Deutschland für dieselbe Leistung bezahlt
wird. Das ist richtig so: Schweizer Tagesansätze für Freelancer liegen bei 800 bis
1’500 CHF, und ein Kunde, der 950 CHF im Monat zahlt, vergleicht dich mit diesen
Zahlen, nicht mit deutschen. Rechne deutsche Preise nicht um, wenn du hier verkaufst.

Die Probefolge zu 220 CHF ist keine Einnahmequelle, sondern ein Filter. Wer 220 CHF
zahlt, zahlt auch 950 CHF. Wer bei 220 CHF zögert, hätte dich drei Monate Zeit gekostet.

## Die ersten 21 Tage

**Tag 1–2** — Platzhalter in `index.html` ersetzen (`[DEIN NAME]`, `[DEINE-MAIL]`,
`[DEIN-KALENDER-LINK]`), Kontaktseite mit Anbieterangaben und Datenschutzerklärung
ergänzen, Seite veröffentlichen. Bei Netlify reicht Drag-and-drop dieses Ordners.

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

## Formales (Schweiz, kurz)

**Keine Gewerbeanmeldung.** Anders als in Deutschland gibt es keinen Gang zum
Gewerbeamt. Der eigentliche Schritt ist die Anmeldung als selbstständig erwerbend bei
der **AHV-Ausgleichskasse deines Kantons**. Darauf zahlst du AHV/IV/EO — grob rund
10 % des Einkommens, mit sinkender Skala und einem Mindestbeitrag bei kleinen
Einkommen. Bei Nebenerwerb neben einer Anstellung kommt das zu den Abzügen aus dem
Lohn hinzu.

**Handelsregister** erst ab 100’000 CHF Jahresumsatz Pflicht. Darunter freiwillig.
Eine Einzelfirma muss deinen Familiennamen im Firmennamen tragen — „Content
Recycling" allein geht nicht, „Content Recycling Muster" schon.

**MWST** erst ab 100’000 CHF Umsatz Pflicht, Normalsatz 8,1 %. Darunter bist du
befreit und weist keine MWST aus; eine freiwillige Unterstellung lohnt sich bei
diesem Geschäftsmodell selten, weil du kaum Vorsteuern hast. Die Angebotsseite sagt
darum „exkl. MWST sofern ausgewiesen".

**Steuern:** kein separates Konstrukt. Das Einkommen aus selbstständiger Tätigkeit
kommt in die normale Steuererklärung, mit dem Hilfsblatt deines Kantons. Keine
Gewerbesteuer. Führe von Anfang an eine einfache Einnahmen-Ausgaben-Rechnung und lege
Belege ab — das ist kantonal die einzige Anforderung unterhalb der
Buchführungspflicht.

**Säule 3a:** Hier lohnt eine genaue Abklärung. Bist du angestellt und in einer
Pensionskasse, gilt für dich der kleine 3a-Betrag, unabhängig vom Nebenerwerb.
Erst wenn die Selbstständigkeit die Anstellung ersetzt und keine Pensionskasse mehr
besteht, greift der grosse Abzug von bis zu 20 % des Nettoeinkommens. Die konkreten
Höchstbeträge ändern jährlich — vor der Einzahlung prüfen.

**Nebentätigkeit neben einer Anstellung:** Art. 321a Abs. 3 OR verbietet
Konkurrenztätigkeit während des Arbeitsverhältnisses; viele Arbeitsverträge verlangen
zusätzlich eine Meldung oder Zustimmung. Vertrag lesen, bevor du die Seite
veröffentlichst — nicht danach.

**Datenschutz:** Es gilt das revidierte DSG (seit September 2023), nicht die DSGVO.
Sobald du für einen Kunden Personendaten bearbeitest — Newsletter-Empfänger sind
Personendaten — brauchst du einen Auftragsbearbeitungsvertrag. Bei Kunden in der EU
kommt die DSGVO zusätzlich dazu. Zugänge zu Kundentools nur über
Einladungsfunktionen, keine Passwörter.

**Website:** Es gibt keine Impressumspflicht wie in Deutschland, aber Art. 3 Abs. 1
lit. s UWG verlangt bei kommerziellen Online-Angeboten klare Angaben zu Identität
und Kontaktadresse. Eine Kontaktseite mit vollem Namen, Adresse und E-Mail erfüllt
das.

**Kunden im Ausland:** Bei Firmenkunden in Deutschland oder Österreich gilt das
Empfängerortsprinzip — du fakturierst ohne schweizerische MWST, der Kunde versteuert
die Leistung selbst. Das vergrössert deinen Markt erheblich. Dann aber in EUR
anbieten und die Preise anpassen, nicht umrechnen.

Das ist keine Rechts- oder Steuerberatung, und einige Beträge und Sätze ändern
jährlich. Es sind die Punkte, an denen es sonst hakt — die aktuellen Zahlen holst du
bei deiner kantonalen Ausgleichskasse und dem Steueramt, beide geben dazu kostenlos
Auskunft.

## Wo es schiefgeht

1. **Rohausgabe ausliefern.** Der häufigste Grund für Kündigung in Monat 2.
2. **Freigabe ohne Frist.** Das Dokument bleibt liegen, du wartest, der Monat
   ist vorbei und die Rechnung fühlt sich für den Kunden unverdient an.
3. **Zu breites Angebot.** „Ich mache Social Media" verkauft nicht.
   „Aus einer Folge wird ein Monat" verkauft.
4. **Kein Report.** Die Verlängerung entscheidet sich am Monatsbericht, nicht an
   der Textqualität — weil der Kunde die Texte nur überfliegt, die Zahlen aber liest.
