# Letterpret

Een Nederlandstalig woordspel geïnspireerd op het categorieënspel: **één letter, 13 categorieën, 120 seconden**. Een zelfstandig spel zonder officiële band met Scattergories of Hasbro.

## Spelen

Open `dist/index.html` in je browser, of open de GitHub Pages-link van deze repository. Geen installatie, account, betaalde dienst of API-sleutel nodig.

- 143 Nederlandstalige categorieën en 23 letters (geen Q, X en Y).
- Iedere ronde kiest 13 verschillende categorieën en één letter. Onbeperkt rondes spelen; combinaties zijn niet letterlijk oneindig en kunnen terugkomen.
- De timer werkt met een eindtijd: van tabblad wisselen of herladen geeft geen extra tijd.
- Antwoorden worden alleen tijdens deze browsersessie op dit toestel bewaard (sessionStorage). Geen server, tracking of externe lettertypen.
- Automatische controle van beginletter en herhaalde woorden. De speler beoordeelt zelf of een antwoord inhoudelijk past. De getoonde score is dus een zelf beoordeelde score.
- Deel na een ronde een link naar dezelfde uitdaging. Elke speler start zelf; geen live multiplayer of automatische vergelijking tussen spelers.
- Hoofdletters en accenten worden bij de eenvoudige controle gelijk behandeld. Het eerste voorkomen van een dubbel woord kan een punt krijgen; latere herhalingen niet. Lidwoorden worden niet overgeslagen.

## GitHub Pages

Publiceer de map `dist` met de meegeleverde workflow. Kies onder **Settings → Pages → Build and deployment → Source: GitHub Actions**. De workflow draait bij een push naar `main` en kan ook handmatig gestart worden.

## Lokaal testen

Met Node.js (geen extra packages):

```sh
node --test tests/core.test.cjs
node server.cjs
```

Open daarna http://localhost:4173. De server bindt alleen lokaal.

Test ook op je telefoon: start een ronde, vul antwoorden in, laat de timer aflopen, controleer de score en probeer een gedeelde uitdagingslink in een nieuw browservenster.

## Bestanden

- `dist/index.html` — interface en spelregels
- `dist/style.css` — mobiel en desktop
- `dist/core.js` — vaste categorieënlijst, rondegenerator en antwoordcontrole
- `dist/app.js` — timer, invoer, score en delen

Behoud de volgorde van de categorieën in versie 1: de gedeelde rondecode gebruikt die volgorde. Maak bij een gewijzigde lijst een nieuwe linkversie.
