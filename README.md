# Letterpret

**[Speel Letterpret](https://scrauwel.github.io/letterpret/)** — een Nederlandstalig woordspel op je toestel of op een groot scherm met pen en papier. Zelfstandig spel, zonder officiële band met Scattergories of Hasbro.

## Spelen

1. Kies **Zelf invullen** of **Op scherm & papier**.
2. Kies een gehele speeltijd van **120 tot 480 seconden** (standaard 120).
3. Klik **Ronde klaarzetten**. De klok loopt nog niet. Je ziet de letter. De categorieën blijven verborgen.
4. Klik **Play**. Nu pas verschijnen alle 13 categorieën en start de ingestelde tijd.
5. Kijk na afloop samen na. **Nog een ronde** zet alleen een nieuwe ronde klaar: je start de klok altijd zelf.

Ook na herladen onthult het spel niet automatisch een ronde. Bij een eerder gestarte ronde staat er **Play · hervatten**; de oorspronkelijke eindtijd blijft gelden. Herladen levert geen extra tijd op. De timer blijft ook doorlopen in een ander tabblad.

## Categorieën van internet

Internetverrijking staat standaard aan en kan vóór een ronde worden uitgezet. Bij het klaarzetten verkent de browser categorieën en subcategorieën van **Nederlandstalige Wikipedia** via de publieke MediaWiki-API. Gevonden nieuwe onderwerpen worden gebruikt bij latere rondes; het spel heeft dus geen uitsluitend vaste lijst van internetcategorieën.

- Per voorbereiding maximaal zes categorieaanvragen, met een totale wachttijd van maximaal tien seconden. Er wordt niets opgehaald tijdens de actieve ronde.
- Een onderwerp moet door de naamfilters komen, minstens tien bruikbare artikeltitels hebben en voor minstens drie letters telkens twee voorbeelden bevatten. Voor de uiteindelijke ronde worden alleen ondersteunde beginletters gekozen.
- Maximaal drie internetcategorieën per ronde, gemengd met zelfbedachte opdrachten en klassiekers. Nederlandse categorienamen worden als tekst getoond; er wordt geen HTML van Wikipedia uitgevoerd.
- Via subcategorieën groeit de ontdekkingsvoorraad. Een roulerende lokale cache bewaart maximaal 2.000 bruikbare categorieën en 4.000 te verkennen onderwerpen. Geen gegarandeerd unieke of letterlijk oneindige voorraad: herhalingen en specialistische onderwerpen blijven mogelijk.
- Bij netwerkstoringen blijven bewaarde categorieën beschikbaar. Bij geen cache wordt de vaste voorraad gebruikt. De interface vermeldt of de bron bereikbaar was.
- Bij uitgeschakelde internetverrijking worden alleen vaste categorieën gebruikt en worden geen API-aanvragen gedaan.
- Bronlinks staan na afloop onder **Internetbronnen van deze ronde**. De bron is een hulpmiddel, geen onfeilbare scheidsrechter. Bij persoonsnamen telt de eerste letter van de voornaam.

Filters beperken ongeschikte onderwerpen, maar er is geen handmatige beoordeling van iedere internetcategorie. Het spel bepaalt zelf geen inhoudelijke juistheid van antwoorden.

API-documentatie: [Categorymembers](https://www.mediawiki.org/wiki/API:Categorymembers), [Cross-site requests](https://www.mediawiki.org/wiki/API:Cross-site_requests). Broninhoud en categorisering: [Nederlandstalige Wikipedia](https://nl.wikipedia.org/), zie de [hergebruikvoorwaarden](https://nl.wikipedia.org/wiki/Wikipedia:Auteursrechten). Er worden geen artikelteksten gepubliceerd.

## Delen en gegevens

Een deellink bevat de exacte 13 categorieën, letter, bronverwijzingen en speeltijd. Daardoor blijft een verrijkte ronde hetzelfde op een ander toestel, ook zonder toegang tot Wikipedia. Oude v1-links blijven werken met 120 seconden. Iedereen start zijn eigen klok; er is geen live spelkamer.

Antwoorden worden alleen in sessionStorage op dit toestel bewaard. De internetvoorraad wordt in localStorage bewaard. Geen account, betaalde API, analytics of server voor antwoorden. Wikipedia ontvangt bronaanvragen vanuit de browser (met de gebruikelijke netwerkgegevens), maar geen ingevoerde antwoorden. De deellink bevat evenmin antwoorden.

Hoofdletters en accenten worden bij de eenvoudige beginlettercontrole gelijk behandeld. Het eerste voorkomen van een dubbel woord kan een punt krijgen; latere herhalingen niet. Lidwoorden worden niet overgeslagen. De speler vinkt zelf inhoudelijk ongeldige of door medespelers herhaalde antwoorden uit.

## Ontwikkelen en publiceren

Open dist/index.html direct of start met Node.js, zonder extra packages:

```sh
node --test tests/*.test.cjs
node server.cjs
```

Lokale preview: http://127.0.0.1:4173. Publiceer dist via de meegeleverde GitHub Actions-workflow. Onder Settings → Pages staat de bron op GitHub Actions.

core.js bewaart de oorspronkelijke categorieën en v1-generator. online.js verzorgt internetverrijking, filtering en v2-deellinks. app.js beheert klaarzetten, timer en antwoorden. Behoud de volgorde van de basislijst voor compatibiliteit met v1-links.


## Niveaus, letterkeuze en pauze

- **6–12 jaar**: 130 eenvoudige categorieën, waaronder 80 zelfbedachte opdrachten en de letters ABDEGKLMNPRSTV. Geen internetcategorieën of internetaanvragen in dit niveau.
- **13 jaar en ouder**: volledige vaste bank en optionele internetverrijking.
- Het klaarzetscherm toont de letter vooraf. Alleen **Play** onthult de categorieën en start de klok.
- **Pauze** bewaart de resterende tijd tot op de milliseconde en verbergt categorieën en antwoorden. **Play** hervat met die resterende tijd. Een gepauzeerde ronde blijft na herladen gepauzeerd. Herladen van een niet-gepauzeerde ronde stopt de timer niet.
- Lokale lettergeschiedenis houdt per niveau bij welke letters al aan bod kwamen. Eerst worden de overige letters gebruikt; daarna start een nieuwe reeks. Opeenvolgende nieuwe rondes krijgen nooit dezelfde letter, ook bij niveauwissels. Dit werkt over herladen heen wanneer browseropslag beschikbaar is. Gedeelde uitdagingen en hervatten behouden bewust hun eigen letter.
- Deellinks bevatten ook het niveau. Oude links zonder niveau gelden als 13 jaar en ouder.

## Creatieve categorieën

200 zelfbedachte opdrachten: 80 voor kinderen en 120 voor oudere spelers. Nieuwe rondes bevatten minstens acht creatieve categorieën, met maximaal drie internetcategorieën. Bij fantasievragen mogen spelers antwoorden verzinnen; het eerste woord begint met de rondeletter en de groep beoordeelt of het past.

Per niveau worden de laatste 52 klaargezette categorieën (vier rondes) lokaal bewaard en overgeslagen. Deze geschiedenis werkt ook na herladen als browseropslag beschikbaar is. Gedeelde uitdagingen behouden hun exacte inhoud. De generator valt bij een uitgeputte voorraad terug op eerdere categorieën.
