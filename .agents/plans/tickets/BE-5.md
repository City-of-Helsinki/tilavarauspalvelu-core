# BE-5 · BE: Oikea subscription order verkkokauppaan

Kun mock on pois päältä, BE-4:n vahvistusaskel luo oikean subscription orderin verkkokauppaan.

### Taustaa

* Verkkokaupan clientissa on `create_order`, `get_order` ja `get_payment`
  ([verkkokauppa_api_client.py:99](../../../backend/tilavarauspalvelu/integrations/verkkokauppa/verkkokauppa_api_client.py#L99)).
  Subscription-kutsuja ei vielä ole.
* Yksittäisvarauksen tilauksen parametrit tehdään funktiossa `get_verkkokauppa_order_params`
  ([verkkokauppa/helpers.py:73](../../../backend/tilavarauspalvelu/integrations/verkkokauppa/helpers.py#L73)).
* Palaverista 7.10.2026: tilauksella on `type: subscription` ja ensimmäinen `invoicingDate`. `periodUnit` ja `periodFrequency` eivät ole käytössä.

### Toteutus

* Subscription orderin kutsu clientiin OPS-2:n sopimuksen mukaan.
* Pyyntö hakemuksesta: asiakas, kieli, merchant, namespace, ensimmäinen `invoicingDate` ja Y-tunnus, jos verkkokauppa sallii esitäytön.
* `subscriptionEndDate` lähetetään vain, jos OPS-3 niin sanoo.
* Ensimmäinen `invoicingDate`: ensimmäisen laskutuskauden viimeisen varauksen päivä. Julkaisu 3 (BE-9) tekee koko laskutussäännöt. Tässä tarvitaan vain ensimmäinen päivä.
* Vastaus tallennetaan BE-4:n tilaukselle.
* Verkkokaupan virheet käsitellään kuten yksittäisvarauksissa: selkeä virhe asiakkaalle ja Sentry.

### Ei tässä tiketissä

* Tilausrivit (oletus: ensimmäisellä tilauksella ei ole rivejä).
* Useampi merchant samassa hakemuksessa. Jos OPS-2:n mukaan tilauksella voi olla vain yksi merchant, tämä tiketti hylkää tällaisen hakemuksen selkeällä virheellä, ja tehdään uusi tiketti.

### Valmis, kun

* Mock pois päältä vahvistusaskel luo tilauksen ja palauttaa oikean checkout URL:n.
* Testit käyttävät tallennettuja verkkokaupan vastauksia, myös virhevastausta.

### Riippuvuudet

* Odottaa: [BE-4](BE-4.md), [OPS-2](OPS-2.md), [OPS-3](OPS-3.md), KYV-1382, KYV-1438
* Estää: [OPS-6](OPS-6.md), [E2E-1](E2E-1.md)
