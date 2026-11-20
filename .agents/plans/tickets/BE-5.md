# BE-5 · BE: Oikea subscription order verkkokauppaan

Kun mock on pois päältä, BE-4:n vahvistusaskel luo oikean subscription orderin verkkokauppaan.

### Taustaa

* Verkkokaupan clientissa on `create_order`, `get_order` ja `get_payment`
  ([verkkokauppa_api_client.py:99](../../../backend/tilavarauspalvelu/integrations/verkkokauppa/verkkokauppa_api_client.py#L99)).
  Subscription-kutsuja ei vielä ole.
* Yksittäisvarauksen tilauksen parametrit tehdään funktiossa `get_verkkokauppa_order_params`
  ([verkkokauppa/helpers.py:73](../../../backend/tilavarauspalvelu/integrations/verkkokauppa/helpers.py#L73)).
* Verkkokauppa vahvisti 27.11.2026: samat kentät kuin tavallisella tilauksella, ja tilaukselle `type: subscription` ja ensimmäinen `invoicingDate`.
  `subscriptionEndDate`, `periodUnit` ja `periodFrequency` eivät ole käytössä.
* KYV-1382 on masterissa. Experience API validoi `type`:n objektina. Luultavasti merkkijono `"subscription"` hylätään. Pyysimme korjausta (OPS-2).
* Pyysimme verkkokaupalta (OPS-2): tilaus ilman rivejä koko polussa, ja uusi kenttä `merchantId` tilaukselle.
  Nyt rivin merchant tulee tuotteen product mappingista, ja tilaus ilman rivejä jää ilman merchantia.

### Toteutus

* Subscription orderin kutsu clientiin OPS-2:n rajapintasopimuksen mukaan.
* Pyyntö hakemuksesta: asiakas, kieli, namespace, `type: subscription`, ensimmäinen `invoicingDate`,
  `merchantId` BE-4:n tilaukselta ja `lastValidPurchaseDateTime` kierroksen määräajasta. Ei rivejä.
* Ensimmäinen `invoicingDate`: ensimmäisen laskutuskauden viimeisen varauksen päivä. Julkaisu 3 (BE-9) tekee koko laskutussäännöt. Tässä tarvitaan vain ensimmäinen päivä.
* Vastaus tallennetaan BE-4:n tilaukselle.
* Verkkokaupan virheet käsitellään kuten yksittäisvarauksissa: selkeä virhe asiakkaalle ja Sentry.

### Valmis, kun

* Mock pois päältä vahvistusaskel luo tilauksen ja palauttaa oikean checkout URL:n.
* Testit käyttävät tallennettuja verkkokaupan vastauksia, myös virhevastausta.

### Riippuvuudet

* Odottaa: [BE-4](BE-4.md), [OPS-2](OPS-2.md), KYV-1382, KYV-1438
* Estää: [OPS-6](OPS-6.md), [E2E-1](E2E-1.md)
