/* Inhalt des Ausstiegs-Planers. Wird nur mit gültigem Zugangscode ausgeliefert.
   Nummern und Stellen vor jeder Änderung fachlich prüfen (Stand: Oktober 2026). */

export type Land = "CH" | "DE" | "AT";

export interface Punkt {
  id: string;
  text: string;
  tipp?: string;
  /** Ergänzung je Land, wird unter dem Tipp gezeigt. */
  land?: Partial<Record<Land, string>>;
}

export interface Abschnitt {
  id: string;
  titel: string;
  intro: string;
  punkte: Punkt[];
}

export interface Stelle {
  name: string;
  nummer?: string;
  web?: string;
  info: string;
  notruf?: boolean;
}

export interface Feld {
  id: string;
  label: string;
  hilfe: string;
}

export interface PlanerInhalt {
  version: number;
  abschnitte: Abschnitt[];
  felder: Feld[];
  stellen: Record<Land, Stelle[]>;
}

export const PLANER_INHALT: PlanerInhalt = {
  version: 1,

  felder: [
    { id: "vertraut", label: "Meine Vertrauensperson(en)", hilfe: "Wer weiß Bescheid und ist erreichbar? Name und Nummer." },
    { id: "codewort", label: "Unser Codewort", hilfe: "Ein harmloses Wort, das heißt: Ruf die Polizei. Zum Beispiel „Hast du noch das Rezept?“" },
    { id: "ziel", label: "Wohin ich gehen kann", hilfe: "Freundin, Familie, Frauenhaus, Pension. Am besten zwei Möglichkeiten." },
    { id: "tasche", label: "Wo meine Notfalltasche liegt", hilfe: "Ein Ort, den er nicht kennt, z. B. bei der Vertrauensperson oder im Spind." },
    { id: "notizen", label: "Sonstiges", hilfe: "Termine, Fragen an die Beratungsstelle, was dir noch einfällt." },
  ],

  abschnitte: [
    {
      id: "sicher",
      titel: "Dein Handy und deine Spuren",
      intro: "Bevor du planst: Sorg dafür, dass er nicht mitlesen kann. Plötzliche Änderungen können ihn aber misstrauisch machen. Mach nur, was sich gerade sicher anfühlt.",
      punkte: [
        { id: "geraet", text: "Ein Gerät nutzen, auf das er keinen Zugriff hat", tipp: "Zum Beispiel das Handy einer Freundin, ein Computer bei der Arbeit oder in der Bibliothek. Wenn das nicht geht: privates Fenster und danach den Verlauf löschen." },
        { id: "verlauf", text: "Verlauf löschen, wenn du diese Seite benutzt hast", tipp: "Lösch nur die Einträge zu Seelenwende und Beratungsstellen, nicht den ganzen Verlauf – ein komplett leerer Verlauf fällt eher auf." },
        { id: "standort", text: "Standortfreigaben prüfen", tipp: "Google Maps, „Wo ist?“ bei Apple, Life360, Snapchat-Karte, Familienfreigabe, Fitness-Apps. Auch geteilte Kalender und Fotoalben verraten viel." },
        { id: "tracker", text: "Auf Ortungsgeräte achten", tipp: "AirTags oder andere Tracker in Tasche, Auto oder Jacke. iPhones warnen bei fremden AirTags, auf Android gibt es die Suche in den Einstellungen unter „Sicherheit“ bzw. „Unbekannte Tracker“." },
        { id: "mail", text: "Eine neue E-Mail-Adresse anlegen, die er nicht kennt", tipp: "Nur auf einem sicheren Gerät. Darüber laufen Beratung, Wohnungssuche und neue Konten." },
        { id: "passwoerter", text: "Passwörter ändern – erst, wenn du in Sicherheit bist", tipp: "Vorher könnte es ihn alarmieren. Danach: E-Mail, Bank, Cloud, Apple-ID oder Google-Konto, soziale Netzwerke, und alle angemeldeten fremden Geräte abmelden." },
      ],
    },
    {
      id: "notfall",
      titel: "Für den Notfall",
      intro: "Falls es eskaliert, bevor du gehst. Diese Punkte schützen dich auch dann, wenn du dich noch nicht entschieden hast.",
      punkte: [
        { id: "nummern", text: "Notrufnummern im Handy speichern, unter unauffälligem Namen", land: { CH: "Polizei 117, Sanität 144, Opferhilfe 142.", DE: "Polizei 110, Notruf 112, Hilfetelefon 116 016.", AT: "Polizei 133, Notruf 112, Frauenhelpline 0800 222 555." } },
        { id: "codewort", text: "Ein Codewort mit einer Vertrauensperson ausmachen", tipp: "Wenn du es schreibst oder sagst, ruft sie die Polizei. Trag es unten bei „Meine Angaben“ ein." },
        { id: "raeume", text: "Wissen, wo du im Streit hingehst", tipp: "Möglichst in einen Raum mit Ausgang oder Telefon. Küche, Bad und Garage meiden – dort gibt es harte Kanten und Gegenstände." },
        { id: "ausweg", text: "Den schnellsten Weg nach draußen kennen", tipp: "Auch nachts. Schlüssel immer am gleichen Ort, Auto mit der Front zur Ausfahrt parken, wenn möglich." },
        { id: "kinder", text: "Kinder vorbereiten, wenn sie alt genug sind", tipp: "Den Notruf wählen können, wissen, zu welcher Nachbarin sie laufen. Ohne Details zu deinem Plan – Kinder können sich verplappern." },
      ],
    },
    {
      id: "dokumente",
      titel: "Dokumente",
      intro: "Originale, wenn es unauffällig geht. Sonst Fotos – gespeichert in der neuen E-Mail oder bei deiner Vertrauensperson, nicht in einer Cloud, die er sieht.",
      punkte: [
        { id: "ausweis", text: "Ausweis oder Pass, Aufenthaltstitel", tipp: "Für dich und die Kinder." },
        { id: "geburt", text: "Geburtsurkunden, Familienbuch oder Heiratsurkunde" },
        { id: "kasse", text: "Krankenkassenkarte, Impfpass, Medikamentenplan" },
        { id: "geld", text: "Bankkarten, Kontoauszüge, Lohnabrechnungen, letzte Steuererklärung" },
        { id: "wohnung", text: "Mietvertrag oder Grundbuchauszug, Versicherungspolicen" },
        { id: "auto", text: "Führerschein, Fahrzeugpapiere, Zweitschlüssel" },
        { id: "kinderdok", text: "Unterlagen der Kinder", tipp: "Schulzeugnisse, Sorgerechtsbeschlüsse, Unterlagen von Ärztinnen und Kita." },
        { id: "beweise", text: "Belege, was passiert ist", tipp: "Screenshots von Nachrichten, Fotos von Verletzungen oder zerstörten Sachen, Arztberichte, Anzeigen. Mit Datum. Schick sie an die neue E-Mail und lösch sie dann vom Handy." },
      ],
    },
    {
      id: "geld",
      titel: "Eigenes Geld",
      intro: "Finanzielle Abhängigkeit ist einer der häufigsten Gründe, zu bleiben. Schon kleine Schritte geben dir Spielraum.",
      punkte: [
        { id: "konto", text: "Ein eigenes Konto, am besten bei einer anderen Bank", tipp: "Kontoauszüge nur digital an die neue E-Mail, keine Post nach Hause." },
        { id: "bargeld", text: "Eine kleine Bargeld-Reserve anlegen", tipp: "Auch kleine Beträge zählen. Lagere sie bei deiner Vertrauensperson oder in der Notfalltasche." },
        { id: "ueberblick", text: "Überblick über gemeinsame Konten, Schulden und Verträge", tipp: "Fotografier Kontoauszüge, Kredite, Handy- und Stromverträge. Was läuft auf deinen Namen?" },
        { id: "ansprueche", text: "Fragen, worauf du Anspruch hast", tipp: "Unterhalt, Sozialleistungen, Wohnkosten, Hilfe vom Frauenhaus oder der Opferhilfe. Die Beratungsstellen unten wissen das." },
      ],
    },
    {
      id: "tasche",
      titel: "Notfalltasche",
      intro: "Eine kleine Tasche, die du im Ernstfall nur noch greifen musst. Am sichersten bei einer Vertrauensperson.",
      punkte: [
        { id: "schluessel", text: "Ersatzschlüssel für Wohnung und Auto" },
        { id: "medis", text: "Medikamente für ein paar Tage, Brille, Ladekabel" },
        { id: "kopien", text: "Kopien der wichtigsten Dokumente" },
        { id: "kleidung", text: "Kleidung zum Wechseln, für dich und die Kinder" },
        { id: "handy", text: "Wenn möglich: ein altes Handy mit Prepaid-Karte", tipp: "Mit den wichtigsten Nummern. Er kennt die Nummer nicht und kann es nicht orten." },
        { id: "trost", text: "Etwas Vertrautes für die Kinder", tipp: "Kuscheltier, Lieblingsbuch. Das hilft mehr als man denkt." },
      ],
    },
    {
      id: "menschen",
      titel: "Menschen an deiner Seite",
      intro: "Du musst das nicht allein schaffen. Ein, zwei Menschen reichen.",
      punkte: [
        { id: "vertraut", text: "Eine oder zwei Vertrauenspersonen einweihen", tipp: "Menschen, die ihm nichts weitererzählen. Trag sie unten bei „Meine Angaben“ ein." },
        { id: "beratung", text: "Mit einer Beratungsstelle sprechen", tipp: "Anonym, kostenlos, auch wenn du dich noch nicht entschieden hast. Sie helfen dir, diesen Plan auf deine Lage anzupassen." },
        { id: "arbeit", text: "Überlegen, ob jemand bei der Arbeit Bescheid wissen sollte", tipp: "Zum Beispiel, damit er am Empfang nicht durchgestellt wird." },
        { id: "schule", text: "Kita oder Schule informieren, wer die Kinder abholen darf", tipp: "Erst, wenn du gegangen bist – oder wenn die Beratungsstelle es dir rät." },
      ],
    },
    {
      id: "recht",
      titel: "Schutz und Recht",
      intro: "Du hast Rechte, auch wenn er dir etwas anderes erzählt. Lass dich beraten, bevor du etwas unterschreibst oder vereinbarst.",
      punkte: [
        {
          id: "schutz", text: "Nach Schutzmaßnahmen fragen",
          tipp: "Je nach Lage kann er aus der Wohnung gewiesen werden oder darf sich dir nicht nähern.",
          land: {
            CH: "Die Polizei kann ihn wegweisen (kantonal geregelt). Längerer Schutz über das Zivilgericht (Art. 28b ZGB). Die Opferhilfe begleitet dich dabei.",
            DE: "Die Polizei kann ihn der Wohnung verweisen. Schutzanordnungen und Wohnungszuweisung nach dem Gewaltschutzgesetz beim Familiengericht, auch als Eilantrag.",
            AT: "Die Polizei kann ein Betretungs- und Annäherungsverbot aussprechen (zwei Wochen). Danach meldet sich das Gewaltschutzzentrum bei dir. Länger über eine einstweilige Verfügung beim Bezirksgericht.",
          },
        },
        { id: "arzt", text: "Verletzungen ärztlich festhalten lassen", tipp: "Auch wenn sie klein wirken. Ein Bericht kann später wichtig sein, für Schutzanordnungen oder das Sorgerecht." },
        { id: "anwaeltin", text: "Eine Anwältin für Familienrecht suchen", tipp: "Vor allem bei Kindern, gemeinsamer Wohnung oder gemeinsamem Besitz. Die Beratungsstelle kennt Anwältinnen, die sich mit Gewalt auskennen, und weiß, wie die Kosten übernommen werden können." },
        { id: "nichts", text: "Nichts unterschreiben, was er dir vorlegt", tipp: "Keine Vereinbarung zu Kindern, Wohnung oder Geld ohne Beratung – auch wenn er Druck macht." },
      ],
    },
    {
      id: "tag",
      titel: "Der Tag, an dem du gehst",
      intro: "Die Zeit rund um die Trennung ist oft die gefährlichste. Plane den Tag so, dass er es nicht vorher erfährt.",
      punkte: [
        { id: "zeit", text: "Einen Zeitpunkt wählen, an dem er nicht da ist", tipp: "Kündige es nicht an. Erklären kannst du es später, aus sicherer Entfernung, wenn überhaupt." },
        { id: "ziel", text: "Wissen, wohin du gehst", tipp: "Freundin, Familie oder Frauenhaus. Frauenhäuser nehmen auch kurzfristig auf, frag vorher nach freien Plätzen." },
        { id: "polizei", text: "Wenn du Angst hast: die Polizei um Begleitung bitten", tipp: "Sie kann dabei sein, wenn du deine Sachen holst." },
        { id: "handyaus", text: "Standort ausschalten, bevor du losfährst" },
      ],
    },
    {
      id: "danach",
      titel: "Die ersten Wochen danach",
      intro: "Draußen sein heißt noch nicht sicher sein. Diese Schritte schützen deinen neuen Ort.",
      punkte: [
        {
          id: "adresse", text: "Deine neue Adresse schützen",
          land: {
            CH: "Bei der Einwohnerkontrolle deiner Gemeinde eine Datensperre beantragen.",
            DE: "Beim Bürgeramt eine Auskunftssperre im Melderegister beantragen.",
            AT: "Beim Meldeamt eine Auskunftssperre beantragen.",
          },
        },
        { id: "sichern", text: "Jeden Kontakt von ihm sichern, nicht beantworten", tipp: "Screenshots mit Datum. Wenn ihr wegen der Kinder Kontakt braucht: kurz, sachlich, schriftlich." },
        { id: "wege", text: "Gewohnte Wege und Zeiten ändern", tipp: "Arbeitsweg, Einkauf, Sport – zumindest in den ersten Wochen." },
        { id: "soziale", text: "Soziale Netzwerke prüfen", tipp: "Keine Fotos, die zeigen, wo du bist. Gemeinsame Bekannte können mitlesen." },
        { id: "du", text: "Dir selbst etwas Gutes tun", tipp: "Schlaf, Essen, ein Mensch, der dich in den Arm nimmt. Zweifel und Sehnsucht sind normal und kein Zeichen, dass du falsch entschieden hast." },
      ],
    },
  ],

  stellen: {
    CH: [
      { name: "Polizei", nummer: "117", info: "Bei akuter Gefahr. Sanität 144, europäischer Notruf 112.", notruf: true },
      { name: "Opferhilfe", nummer: "142", web: "opferhilfe-schweiz.ch", info: "Rund um die Uhr, kostenlos und vertraulich. Verbindet dich mit der Fachstelle in deinem Kanton. Kein Notruf." },
      { name: "Frauenhäuser Schweiz", web: "frauenhaus-schweiz.ch", info: "Übersicht der Frauenhäuser in der Schweiz und Liechtenstein, mit Notfallnummern." },
      { name: "Die Dargebotene Hand", nummer: "143", web: "143.ch", info: "Wenn du einfach jemanden zum Reden brauchst, rund um die Uhr." },
    ],
    DE: [
      { name: "Polizei", nummer: "110", info: "Bei akuter Gefahr. Rettungsdienst und europäischer Notruf 112.", notruf: true },
      { name: "Hilfetelefon Gewalt gegen Frauen", nummer: "116 016", web: "hilfetelefon.de", info: "Rund um die Uhr, anonym, kostenlos, in vielen Sprachen. Auch per Chat und Mail." },
      { name: "Frauenhaus-Suche", web: "frauenhaus-suche.de", info: "Zeigt täglich, welche Frauenhäuser freie Plätze haben." },
      { name: "Weisser Ring", nummer: "116 006", web: "weisser-ring.de", info: "Opfer-Telefon, auch Begleitung zu Polizei und Gericht." },
      { name: "TelefonSeelsorge", nummer: "0800 111 0 111", web: "telefonseelsorge.de", info: "Wenn du einfach jemanden zum Reden brauchst, rund um die Uhr." },
    ],
    AT: [
      { name: "Polizei", nummer: "133", info: "Bei akuter Gefahr. Europäischer Notruf 112.", notruf: true },
      { name: "Frauenhelpline gegen Gewalt", nummer: "0800 222 555", web: "frauenhelpline.at", info: "Rund um die Uhr, anonym, kostenlos, mehrsprachig. Vermittelt auch Frauenhausplätze." },
      { name: "Gewaltschutzzentren", nummer: "0800 700 217", web: "gewaltschutzzentrum.at", info: "Kostenlose Beratung, Hilfe beim Sicherheitsplan und Begleitung zu Gericht." },
      { name: "Autonome Österreichische Frauenhäuser", web: "aoef.at", info: "Übersicht der Frauenhäuser in Österreich." },
      { name: "Telefonseelsorge", nummer: "142", info: "Wenn du einfach jemanden zum Reden brauchst, rund um die Uhr." },
    ],
  },
};
