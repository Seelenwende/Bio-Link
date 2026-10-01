# Boni für „Wieder bei dir“

Hier liegen die Bonus-Dateien des 6-Wochen-Programms. Sie sind nicht öffentlich abrufbar:
Die Edge-Funktion `bonus-schutz` lässt nur zeitlich begrenzte, signierte Links durch, und die gibt es nur mit gültigem Programm-Code über `/api/programm/bonus`.

Fehlt eine Datei, zeigt das Programm „wird gerade vorbereitet“ bzw. „Diese Aufnahme kommt bald“.

## Begleitheft

- `wieder-bei-dir-begleitheft.pdf` – alle Übungen und Tagesanker zum Ausdrucken. Wird aus den Programminhalten erzeugt: `npm run begleitheft` (braucht Playwright). Nach jeder Textänderung im Programm neu erzeugen.

Einzelprodukte (Kits, Journals, E-Book, Bundle) gehören bewusst nicht hierher: Das Programm knüpft in „aufbau“ an sie an, liefert sie aber nicht mit.

## Kostenlose PDFs zum Herunterladen im Programm

- `self-care-journal.pdf` – Self Care Journal (Woche 1)
- `mini-guide-der-weg-nach-draussen.pdf` – Mini-Guide „Der Weg nach draußen“ (Woche 2)

## Audio für schwere Tage (in den Unterordner `audio/`, Woche 4, nur im Programm)

- `01-wenn-du-nicht-schlafen-kannst.mp3` (ca. 14 Min)
- `02-wenn-die-panik-kommt.mp3` (ca. 6 Min)
- `03-wenn-du-ihn-vermisst.mp3` (ca. 11 Min)
- `04-affirmationen-zum-mitsprechen.mp3` (ca. 9 Min)
- `05-morgen-danach.mp3` (ca. 3 Min)

Empfohlenes Format für Sprache: MP3, Mono, 64–96 kbit/s, 44,1 kHz. So bleibt eine 14-Minuten-Spur unter 10 MB und lädt auch unterwegs schnell.
Titel, Texte und Dauer der Spuren stehen in `netlify/lib/programm.mts` (`BONI`).
