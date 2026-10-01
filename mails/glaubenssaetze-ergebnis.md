# Ergebnis-Mail zum Glaubenssätze-Test

Die Seite `glaubenssaetze.html` trägt die Frau über `/api/glaubenssaetze/mail` in MailerLite ein und speichert ihr Ergebnis in eigenen Feldern. Die Mail verschickt eine MailerLite-Automatisierung.

## Einmal in MailerLite einrichten

1. **Gruppe** anlegen: „Glaubenssätze-Test“. Die Gruppen-ID steht in der Adresszeile, wenn du die Gruppe öffnest.
2. **Felder** anlegen (Abonnenten → Felder, Typ Text), genau mit diesen Namen:
   `gs_bereich`, `gs_satz`, `gs_zeigt`, `gs_herkunft`, `gs_neu`, `gs_frage`, `gs_uebersicht`
3. **Double-Opt-in für API** einschalten (Einstellungen → Abonnement-Einstellungen → Double-Opt-in für API und Integrationen). Die Frau bestätigt dann zuerst ihre Adresse. Das schützt dich rechtlich und vor fremden Eintragungen.
4. **Automatisierung** anlegen: Auslöser „Wenn ein Abonnent der Gruppe Glaubenssätze-Test beitritt“, dann sofort die Mail unten senden.
5. **API-Schlüssel** erzeugen (Integrationen → API) und in Netlify eintragen:

| Variable | Inhalt |
|---|---|
| `MAILERLITE_API_KEY` | API-Schlüssel aus MailerLite |
| `MAILERLITE_GROUP_GLAUBENSSAETZE` | ID der Gruppe „Glaubenssätze-Test“ |

**Diskretion:** Viele Frauen, die den Test machen, sind noch in der Beziehung. Nimm einen ruhigen Betreff ohne Reizwörter. Die Seite weist darauf hin, eine Adresse zu nutzen, die nur sie liest.

## Die Mail

**Betreff:** Dein Ergebnis ist da
**Vorschautext:** Dein lautester Satz und eine kleine Übung für diese Woche

---

Hallo,

schön, dass du dir die fünf Minuten genommen hast. Hier ist dein Ergebnis zum Nachlesen.

**Dein lautester Satz**
„{$gs_satz}“
Bereich: {$gs_bereich}

**So kann er sich zeigen**
{$gs_zeigt}

**Woher er oft kommt**
{$gs_herkunft}

Ein Glaubenssatz ist kein Urteil über dich. Er war einmal ein Schutz. Heute darfst du prüfen, ob du ihn noch brauchst.

**Ein neuer Satz**
„{$gs_neu}“

Er muss sich noch nicht wahr anfühlen. Es reicht, wenn ein kleiner Teil von dir ihn schon glauben kann.

**Deine Journal-Frage**
{$gs_frage}

**Sieben Tage mit deinem Satz**
1. Schreib den alten Satz auf einen Zettel. Darunter den neuen.
2. Beobachte: Wann meldet sich der alte Satz heute? Notier die Situation.
3. Frag dich, wenn er kommt: Wessen Stimme ist das?
4. Such einen Moment aus deinem Leben, in dem der alte Satz nicht gestimmt hat.
5. Sag den neuen Satz laut, morgens vor dem Spiegel.
6. Beantworte deine Journal-Frage, fünf Minuten, ohne nachzudenken.
7. Lies deine Notizen der Woche. Was hat sich verändert, auch im Kleinen?

**Alle acht Sätze im Überblick**
{$gs_uebersicht}

**Wie es weitergehen kann**
Wenn du wissen möchtest, was dir statt des alten Satzes wirklich wichtig ist: Der Werte-Finder führt dich in zehn Minuten zu deinen fünf Kernwerten, kostenlos. [Zum Werte-Finder]

Bald gibt es den Neuer-Satz-Kompass: 30 Tage kleine Impulse, gebaut aus deinem Testergebnis und deinen Werten. Du erfährst es hier zuerst.

Von Herzen
Tamara · Seelenwende

*Dieser Test ist ein Impuls zur Selbstreflexion, keine Diagnose. Seelenwende ist Selbsthilfe und ersetzt keine Therapie. Wenn gerade viel hochkommt: TelefonSeelsorge Deutschland 0800 111 0 111, Die Dargebotene Hand Schweiz 143, Telefonseelsorge Österreich 142.*
