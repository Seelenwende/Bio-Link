# Seelenwende – Produktleiter

Stand: Oktober 2026. Diese Leiter ordnet alle KI-Tools und digitalen Produkte von Seelenwende. Preise wie auf der Website (`start.html`, `angebot-*.html`). Wo eine Änderung empfohlen, aber noch nicht umgesetzt ist, steht **Empfehlung**.

Seelenwende begleitet Frauen in toxischen und narzisstischen Beziehungen, egal wo sie stehen:

- **Noch drin** – sie spürt, dass etwas nicht stimmt, und zweifelt an sich.
- **Im Gehen** – sie plant den Ausstieg oder steht kurz davor.
- **Danach** – sie ist draußen und baut sich wieder auf.

Viele Frauen wissen selbst nicht, in welcher Phase sie sind. Darum gilt: **Die Eingänge unterscheiden sich, die Begleitung nicht.** Die Gratis-Einstiege sprechen je eine Phase an, Mira, Programm und Kreis sind für alle da.

## Die Leiter auf einen Blick

Jede Stufe beantwortet eine eigene Frage. Wer eine Stufe kauft, bekommt dort ein Ergebnis, das in die nächste Stufe hineinführt.

| Stufe | Ihre Frage | Preis | Produkte | Aufgabe im Geschäft |
|---|---|---|---|---|
| **0 · Erkennen** | „Was ist hier los?“ | gratis | Muster-Check · Glaubenssätze-Test · Ausstiegs-Planer · Mini-Guide „Der Weg nach draußen“ | Vertrauen und Mail-Liste. Sicherheit ist nie bezahlt. |
| **1 · Kleine Werkzeuge** | „Was hilft mir genau hier?“ | 7–9 € | Sei sanft mit dir (7 €) · Werte-Finder (9 €) · Red-Flag-Radar (9 €) · Self Care Journal (9 €, PDF) | Erster Kauf. Wer einmal 7–9 € ausgibt, kauft eher wieder. |
| **2 · Für jetzt** | „Was mache ich jetzt, in diesem Moment?“ | 14–24 € | Klarheits-Tagebuch (14 €) · Mira (19 €) · Erste-Hilfe-Set mit Antwort-Helfer (19 €) · Werte-Finder + Neuer-Satz-Kompass (24 €) | Akute Hilfe und die KI-Tools. Hier entstehen die laufenden KI-Kosten. |
| **3 · Selbstwert** | „Warum fühle ich mich so klein?“ | 29–49 € | Du bist genug (E-Book, 29 €) · Das Bundle – Zurück zu dir (49 €, mit „Sei sanft mit dir“ als Bonus) | Wissen zum Mitnehmen, ohne Laufzeit. |
| **4 · Herzstück** | „Wie komme ich wirklich zu mir zurück?“ | 149 € | „Wieder bei dir“ – 6 Wochen | Der Weg. Höchster Einmalbetrag. |
| **5 · Bleiben** | „Wie halte ich das?“ | 19 €/Monat | Seelenwende Kreis | Wiederkehrender Umsatz. Alles an einem Ort. |

Nicht auf der Leiter:

- **Klarheits-Analyse** (99 €, schriftliche Außensicht): nicht gebaut. **Empfehlung**: pausieren, bis die Stufen 2 bis 5 verkaufen. Sie wäre die einzige Leistung mit persönlicher Arbeitszeit.
- **Ältere PDF-Werkzeuge** (No-Contact-Kit, Grenz-Sätze, Klartext, Anker-Set): bleiben bei Tentary erhältlich, aber nicht auf der Website. Das Programm knüpft mit „Du hast schon …?“ an sie an. So bleibt die Leiter schlank.
- **KI-Profil-Check** (`profil-check.html`): internes Werkzeug für das eigene Instagram-Profil, kein Produkt für Kundinnen.

## Alle Produkte nach Art

| Produkt | Art | Seite | Zugang | Laufende Kosten | Stand |
|---|---|---|---|---|---|
| Muster-Check | Browser-Werkzeug | `muster-check.html` | gratis, Mail-Adresse im Bio-Link | keine | live |
| Glaubenssätze-Test | Browser-Werkzeug | `glaubenssaetze.html` | gratis, Ergebnis per Mail | keine | live, MailerLite-Automatik fehlt |
| Ausstiegs-Planer | Browser-Werkzeug | `planer.html` | gratis, ohne Anmeldung | keine | live |
| Der Weg nach draußen | PDF | Tentary | gratis | keine | live |
| Sei sanft mit dir | Browser-Werkzeug | `affirmationen.html` | Code (`SANFT_CODES`) | keine | gebaut, Kauf-Link fehlt |
| Werte-Finder | Browser-Werkzeug | `werte-finder.html` | Code (`WERTE_CODES`) | keine | gebaut, Kauf-Link fehlt |
| Red-Flag-Radar | Browser-Werkzeug | `red-flag-radar.html` | Code (`RADAR_CODES`) | keine | gebaut, Kauf-Link fehlt |
| Self Care Journal | PDF | Tentary | Kauf | keine | live |
| Klarheits-Tagebuch | Browser-Werkzeug | `notizen.html` | Code (noch offen) | keine | gebaut, Freischaltung fehlt |
| **Mira, die Begleiterin** | **KI-Tool** | `begleiterin.html` | Code, 300 Nachrichten | 0,01–0,04 $ pro Nachricht | gebaut, Kauf-Link fehlt |
| **Antwort-Helfer** (Erste-Hilfe-Set) | **KI-Tool** | `antwort-helfer.html` | Code, 100 Prüfungen | 0,02–0,06 $ pro Prüfung | gebaut, Codes fehlen |
| Neuer-Satz-Kompass | Browser-Werkzeug, Inhalte vom Server | `neuer-satz-kompass.html` | Code (`KOMPASS_CODES`) | keine | gebaut, Kauf-Link fehlt |
| Du bist genug | PDF | Tentary | Kauf | keine | live |
| Das Bundle | PDFs | Tentary | Kauf | keine | live |
| „Wieder bei dir“ | Programm, Inhalte vom Server, mit Mira | `programm.html` | Code (`PROGRAMM_CODES`) | bis 1000 Mira-Nachrichten | gebaut, Audios und Kauf-Link fehlen |
| Seelenwende Kreis | Mitgliedschaft, mit Mira | `kreis.html` | Code, monatlich | bis 150 Mira-Nachrichten pro Monat | gebaut, Abo-Link fehlt |

## Was welcher Code öffnet

So ist es im Code umgesetzt (`netlify/lib/zugang.mts`, `netlify/functions/werkzeug-zugang.mts`):

| Code ↓ öffnet → | Mira | Antwort-Helfer | Kompass | Werte-Finder | Radar | Sei sanft |
|---|---|---|---|---|---|---|
| Mira | ✓ (300) | ✓ | – | – | – | – |
| Erste-Hilfe-Set | – | ✓ (100) | – | – | – | – |
| Kompass-Paket | – | – | ✓ | ✓ | – | – |
| Einzelcode Werte / Radar / Sanft | – | – | – | je eins | je eins | je eins |
| Programm | ✓ (1000) | ✓ | – | ✓ | ✓ | ✓ |
| Kreis | ✓ (150/Monat) | ✓ | ✓ | ✓ | ✓ | ✓ |

Die PDFs (Journal, Du bist genug, Bundle, Mini-Guide) und das Klarheits-Tagebuch sind in keinem Code enthalten.

## Nach Phase: drei Schritte

So zeigt es der Phasen-Wegweiser auf `start.html#phasen` und im Bio-Link. Pro Phase genau ein Gratis-Einstieg, eine Hilfe für jetzt und ein nächster Schritt.

| | Kostenlos starten | Für jetzt | Nächster Schritt | Bleiben |
|---|---|---|---|---|
| **Noch drin** | Muster-Check | Mira (oder Klarheits-Tagebuch) | Bundle | Kreis |
| **Im Gehen** | Ausstiegs-Planer (oder Mini-Guide) | Erste-Hilfe-Set (oder Mira) | „Wieder bei dir“ | Kreis |
| **Danach** | Glaubenssätze-Test | Werte-Finder + Kompass (oder Red-Flag-Radar) | „Wieder bei dir“ | Kreis |
| **Weiß nicht** | Muster-Check | Mira | Kreis | Kreis |

Direkt verlinkbar: `start.html#drin`, `#gehen`, `#draussen`, `#unsicher`.

## Aufstiegswege

Jedes Werkzeug endet mit genau einem Vorschlag für die nächste Stufe, nicht mit einer Liste.

1. **Zweifel → Klarheit → Selbstwert**
   Muster-Check → Mira oder Klarheits-Tagebuch → Bundle → Kreis
2. **Ausstieg → Schutz → Weg**
   Ausstiegs-Planer → Erste-Hilfe-Set → „Wieder bei dir“ → Kreis
3. **Alter Satz → Werte → neuer Satz**
   Glaubenssätze-Test → Werte-Finder (9 €) → Kompass-Paket → „Wieder bei dir“ oder Kreis
4. **Neu verlieben, ohne Wiederholung**
   Red-Flag-Radar → Du bist genug → Bundle

**Empfehlung, Anrechnung:** Wer den Werte-Finder einzeln gekauft hat, bekommt das Kompass-Paket für die Differenz (15 €). Wer Mira oder das Erste-Hilfe-Set gekauft hat, bekommt die 19 € innerhalb von 30 Tagen auf das Programm angerechnet (Gutschein-Code in der Kauf-Mail). Das senkt die Hürde zur nächsten Stufe, ohne den Preis zu senken.

## Grundsätze

- **Gratis ist, was erkennen lässt oder schützt.** Nur vier Gratis-Einstiege: Muster-Check, Glaubenssätze-Test, Ausstiegs-Planer, Mini-Guide. Dazu später der Mira-Schnupper-Code (10 Nachrichten gegen Mail-Adresse). Zu viel Gratis wirkt unglaubwürdig.
- **Sicherheit ist nie bezahlt.** Der Ausstiegs-Planer öffnet sich immer sofort, ohne Mail-Adresse.
- **Bezahlt ist, was vertieft, begleitet oder KI-Kosten hat.** Mira und Antwort-Helfer haben ein festes Kontingent pro Code.
- **Kein Produkt enthält ein anderes, mit einer Ausnahme:** Programm und Kreis öffnen die kleinen Browser-Werkzeuge und die KI-Tools („alle Werkzeuge inklusive“). PDFs bleiben einzeln, das Programm verweist mit „Du hast schon …?“ auf sie.
- **Exklusiv im Programm** (und später im Kreis): Begleitheft und Audios für schwere Tage. Sie werden nicht einzeln verkauft.
- **Einmalzahlung vor Abo.** Alles bis auf den Kreis ist einmalig. Eine monatliche Abbuchung kann eine Frau verraten, die noch drin ist.
- **Diskret in jedem Produkt.** „Schnell weg“-Knopf, nichts auf dem Server gespeichert, Tagebuch und Planer mit neutralem Tab-Namen.

## Offene Entscheidungen

- **Mira und Erste-Hilfe-Set kosten beide 19 €, aber Mira enthält den Antwort-Helfer.** Damit gibt es keinen Grund, das Erste-Hilfe-Set zu kaufen. **Empfehlung**: Mira auf 29 € anheben (300 Nachrichten kosten bis zu 12 $ an KI-Kosten, bei 19 € bleibt nach Gebühren und Steuern wenig übrig). Alternative: Antwort-Helfer aus dem Mira-Code nehmen.
- **Programm mit 1000 Mira-Nachrichten** kann bis zu 40 $ KI-Kosten verursachen. **Empfehlung**: 500 Nachrichten reichen für sechs Wochen (rund 12 pro Tag).
- **Kreis für 19 €/Monat** enthält Mira, Antwort-Helfer, Kompass und alle kleinen Werkzeuge. Bei vollem Kontingent höchstens etwa 6 $ KI-Kosten pro Monat, das trägt sich.
- **Klarheits-Tagebuch** braucht eine Code-Freischaltung, bevor es verkauft wird.

## Die Bausteine

- **Muster-Check** (`muster-check.html`, gratis) – „Ist das noch normal?“: 20 konkrete Situationen zeigen, ob sich ein Muster wiederholt, ohne über ihn zu urteilen. Eingang für „Noch drin“. Führt zu Glaubenssätze-Test und Mini-Guide. Mit Sicherheitshinweis und „Schnell weg“.
- **Glaubenssätze-Test** (`glaubenssaetze.html`, gratis) – erklärt, *warum* sie bleibt oder sich klein fühlt, ohne sie zum Gehen zu drängen. Eingang für „Danach“, wirkt auch „Noch drin“. Ergebnis auf Wunsch per Mail (`mails/glaubenssaetze-ergebnis.md`).
- **Ausstiegs-Planer** (`planer.html`, gratis) – Sicherheitsplan als Checkliste mit Beratungsstellen für CH, DE und AT. Ohne Code, ohne Mail-Adresse. Neutraler Tab-Titel, speichert nur mit PIN und nur verschlüsselt auf dem Gerät.
- **Der Weg nach draußen** (Mini-Guide, gratis) – für den Moment, in dem sie gehen will.
- **Sei sanft mit dir** (`affirmationen.html`, 7 €) – für jeden harten Satz wählt sie selbst die Stufe, die sie heute glauben kann, und findet über die Freundinnen-Frage ihren eigenen Satz. Bonus im Bundle.
- **Werte-Finder** (`werte-finder.html`, 9 €) – in vier Schritten zu den eigenen fünf Kernwerten, in eigenen Worten. Im Kompass-Paket enthalten.
- **Red-Flag-Radar** (`red-flag-radar.html`, 9 €) – „Passiert mir das wieder?“ 18 Situationen für neue Bekanntschaften. Zeigt Warnzeichen und Zeichen von Sicherheit.
- **Self Care Journal** (PDF, 9 €) – der sanfte Anfang.
- **Klarheits-Tagebuch** (`notizen.html`, 14 €) – Vorfälle diskret festhalten, gegen Gaslighting. Übersicht der Muster, Export für Beratungsstelle oder Anwältin. Bewusst kein Abo. PIN, verschlüsselt, nur auf dem Gerät. „Mit Mira einordnen“ braucht einen Mira-Code.
- **Mira, die Begleiterin** (`begleiterin.html`, 19 €, KI) – einfach losschreiben, sie erkennt selbst, was gebraucht wird. 300 Nachrichten, ohne Ablaufdatum, Antwort-Helfer inklusive.
- **Erste-Hilfe-Set mit Antwort-Helfer** (`antwort-helfer.html`, 19 €, KI) – sie fügt seine Nachricht ein und bekommt eine ruhige Einordnung und bei Bedarf eine kurze, sachliche Antwort. Zeigt, welche Sätze nur Köder sind. Besonders bei gemeinsamen Kindern.
- **Werte-Finder + Neuer-Satz-Kompass** (`neuer-satz-kompass.html`, 24 €) – 30 Tage Mini-Impulse vom alten Satz über die eigenen Werte zum neuen Satz. Übernimmt Test-Ergebnis und Werte automatisch.
- **Du bist genug** (E-Book, 29 €) und **Das Bundle – Zurück zu dir** (49 €: E-Book, Vision Board, Journal, „Sei sanft mit dir“) – Selbstwert und Neuanfang.
- **„Wieder bei dir“ – 6 Wochen** (`programm.html`, 149 €) – Ankommen · Verstehen, was war · Abstand und Grenzen · Trauern dürfen · Alte Sätze, neue Sätze · Wieder bei dir. Impulse, Schreibübungen, Tagesanker, Mira-Anstöße. Exklusiv: Begleitheft und Audios für schwere Tage.
- **Seelenwende Kreis** (`kreis.html`, 19 €/Monat) – ein Thema pro Monat mit vier Wochen-Impulsen, Archiv, Mira mit 150 Nachrichten pro Monat, alle Werkzeuge an einem Ort. Keine App, kein Gruppenchat.

## Offene Punkte

- Kauf-Links in `assets/seite.js` (`KAUF`) eintragen, sobald die Tentary-Produkte stehen; beim Kreis zusätzlich `KAUF_URL` in `kreis.html`. Vor dem Livegang: Impressum und Datenschutzerklärung im Fuß verlinken, eigene Domain.
- Kaufweg Tentary → Code → Mail (Make und MailerLite). Für Mira und den Kreis legt Make die Codes über `/api/zugang/admin` an; beim Kreis zusätzlich: Kündigung → sperren. Bis dahin Codes von Hand in `zugang-admin.html`.
- Antwort-Helfer live schalten: `ANTWORT_HELFER_CODES` in Netlify anlegen, Code in die Erste-Hilfe-Set-Mail.
- MailerLite für die Ergebnis-Mail einrichten (Gruppe, Felder, Double-Opt-in, Automatisierung).
- Audios für schwere Tage aufnehmen (Dateinamen in `bonus/LIESMICH.md`).
- Code-Freischaltung für das Klarheits-Tagebuch.
- Shop-Links der älteren PDFs für die „Du hast schon …?“-Hinweise im Programm.
