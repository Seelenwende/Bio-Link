# Kanäle, IDs und Werkzeuge

Konkrete Anbindungen. Prüfe IDs neu, wenn ein Aufruf fehlschlägt — Kanäle können
neu verbunden werden und bekommen dann neue IDs.

## Buffer

Buffer ist das Veröffentlichungswerkzeug. Über die Buffer-Tools laufen Planung,
Entwürfe und Metriken.

```
Organisation   Seelenwende        6a5e8bc473fd71ea462fb30c
Instagram      @_seelenwende      6a698f4e4b2d03035f5e8bdd   (business)
Facebook       Seelenwende        6a698f954b2d03035f5e8cb4   (page)
Zeitzone       Europe/Zurich
```

**Grundsätze:**
- **Immer als `draft` anlegen, nie direkt veröffentlichen**, außer es ist
  ausdrücklich anders abgesprochen. Jeder Post wird vor dem Erscheinen gesichtet.
- Zeiten immer in `Europe/Zurich` denken und beim Anlegen umrechnen.
- Instagram und Facebook nicht blind parallel bespielen — der Facebook-Kanal hat
  ein anderes Publikum. Nur auf Ansage.
- Der Instagram-Kanal ist ein Business-Account, Reels und Karussells lassen sich
  damit planen.

Nützliche Tools: `list_channels`, `create_post`, `edit_post`, `list_posts`,
`get_aggregated_post_metrics`, `create_idea`, `list_ideas`.

## Canva

Für Karussell-Grafiken, Reel-Cover und Zitatkacheln. Siehe Skill `ig-visuals` für
die Gestaltungsregeln.

## Make

Es existiert mindestens ein Szenario (`seelenwende_nachtschicht`). Vermutlich
laufen darüber die Keyword-Automatisierungen (CARE, PROGRAMM). **Bevor du an
Make-Szenarien etwas änderst, frag nach** — daran hängen die DM-Auslieferungen
der kostenlosen Produkte.

## MailerLite

E-Mail-Liste. Wer CARE kommentiert, landet hier. Für Instagram meist nur indirekt
relevant, aber wichtig zu wissen: Der kostenlose Download ist der Übergang von
Instagram zur Liste.

## Dieses Repository

`index.html` ist die Bio-Link-Seite. Änderungen an Produkten, Preisen oder Links
gehören auch dorthin. Entwicklungszweig: `claude/instagram-agent-skills-6obohx`.

## Was diese Skills nicht können

Es gibt **keine direkte Instagram-API-Anbindung** in dieser Session. Das heißt:

- Kommentare und DMs kann ich nicht selbst lesen — sie müssen hereinkopiert oder
  als Screenshot geschickt werden.
- Follower-Zahlen, Story-Views und Reichweiten-Details aus Instagram Insights
  liegen nicht vor. Was über Buffer läuft, ist auswertbar; alles andere nicht.
- Veröffentlichen geht ausschließlich über Buffer.

Behaupte nie, du hättest etwas auf Instagram nachgesehen. Sag, was du hast, und
frag nach dem Rest.
