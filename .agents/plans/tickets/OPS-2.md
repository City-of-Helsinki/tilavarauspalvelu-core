# OPS-2 · OPS: Verkkokaupan rajapintasopimus subscription orderille ja webhookille

Pyydetään verkkokaupalta kirjallinen rajapintasopimus subscription orderille ja `SUBSCRIPTION_CREATED` -webhookille.
Sen jälkeen Varaamo voi korvata mockin oikealla kutsulla (BE-5) ja tarkistaa webhookin (BE-3).

### Taustaa

* Varaamo tekee vahvistuksen ensin verkkokaupan mockia vasten.
* Sopimus on nyt vain palaverimuistiinpanoissa. Määrittelyjen piti valmistua viikolla 46.
* Kysymykset Slackin kanavalle `talpa-verkkokauppa`. Pysyvät vastaukset Confluenceen.

### Kysyttävät asiat

* Subscription orderin pyyntö: mitkä kentät Varaamo lähettää `type: subscription` -tilauksella, ja ensimmäinen `invoicingDate`.
* Missä `invoicingDate` on, kun ensimmäisellä tilauksella ei ole rivejä. Nyt se on tilausrivillä.
* Voiko tilauksella olla nolla riviä? Varaamo olettaa, että rivit tulevat vasta kuukausilaskulla.
* Voiko Varaamo esitäyttää asiakkaan Y-tunnuksen, ettei asiakas syötä sitä kassalla uudelleen?
* Voiko yhdellä tilauksella olla useamman merchantin tuotteita? Nyt maksu- ja palautusputki lukee merchantin vain ensimmäiseltä riviltä.
* Laskulla SAP ottaa myyntiorganisaation, myyntitoimiston ja tilauslajin ensimmäiseltä riviltä. Toimiiko se hakemuksella, jonka varausyksiköt ovat eri paikoissa?
* Paluu-URL:t ja niiden parametrit subscription checkoutin jälkeen, myös kun asiakas keskeyttää.
* `SUBSCRIPTION_CREATED`: URL-asetus (`merchantSubscriptionWebhookUrl`?), payload ja miten Varaamo tarkistaa sen.
* Mitä tilaukselle tapahtuu, jos asiakas ei koskaan vie checkoutia loppuun.
* Milloin koodi on verkkokaupan testiympäristössä.

### Ei tässä tiketissä

* Uusinnan ja laskurivien sopimus: OPS-9 (julkaisu 3).

### Valmis, kun

* Confluence-sivulla tai Swaggerissa on vastaus jokaiseen kysymykseen.
* Tikettijaon julkaisun 1 oletukset on vahvistettu tai korjattu.

### Riippuvuudet

* Odottaa: -
* Estää: [OPS-5](OPS-5.md), [BE-3](BE-3.md), [BE-5](BE-5.md)
