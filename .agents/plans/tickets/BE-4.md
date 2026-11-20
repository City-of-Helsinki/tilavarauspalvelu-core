# BE-4 · BE: Maksullisen hakemuksen vahvistus verkkokaupan mockia vasten

Asiakas painaa vahvista, Varaamo luo tilauksen, ja asiakas siirtyy kassalle.
Kun mock on päällä, kassa on Varaamon mock-sivu. Frontend ja testit voidaan silloin tehdä ennen rajapintasopimusta.

### Taustaa

* Yksittäisvaraukset maksetaan `PaymentOrder`illa. Sillä on one-to-one-yhteys varaukseen
  ([payment_order/model.py:35](../../../backend/tilavarauspalvelu/models/payment_order/model.py#L35)).
* Odottavan varauksen maksulinkki on REST-näkymä `redirect_to_verkkokauppa_for_pending_reservations`
  ([api/rest/views.py:407](../../../backend/tilavarauspalvelu/api/rest/views.py#L407)) osoitteessa `v1/pay_pending_reservation/<pk>/`.
  Se tarkistaa omistajan ja tilan, ja käyttää olemassa olevaa `checkout_url`:ia tai luo tilauksen.
* `create_order_in_verkkokauppa` tarkistaa `MOCK_VERKKOKAUPPA_API_ENABLED`:n ja tekee mock-tilauksen
  ([reservation/actions.py:356](../../../backend/tilavarauspalvelu/models/reservation/actions.py#L356)).
* Mockin kassasivu kutsuu `complete_payment`:ia ja ohjaa osoitteeseen `/success?orderId=…` tai `/reservation/cancel?orderId=…`
  ([mock_verkkokauppa_api/views.py:24](../../../backend/tilavarauspalvelu/api/mock_verkkokauppa_api/views.py#L24)).
* Verkkokaupan tilaus on voimassa, kunnes se maksetaan tai perutaan, tai kunnes `lastValidPurchaseDateTime` menee ohi.
  Kassa näyttää ajastimen vain tästä kentästä.
* Päätökset: tilauksella ei ole rivejä. `lastValidPurchaseDateTime` on kierroksen vahvistuksen määräaika.
  Tilaus tallentaa merchantin, jolla se luotiin. Uusinnat käyttävät sitä, vaikka kierroksen merchant muuttuisi.

### Toteutus

* Päätetään hakemuksen tilauksen malli: käytetäänkö `PaymentOrder`ia vai uutta mallia.
  `PaymentOrder` on nyt yksi tilaus yhdelle varaukselle, kiinteällä hinnalla ja maksettu-tilalla.
  Kausivarauksissa on yksi subscription per hakemus ja yksi uusintatilaus kuukaudessa.
* Vahvistusaskel: REST-ohjaus kuten `pay_pending_reservation`, tai GraphQL-mutaatio, joka palauttaa checkout URL:n.
  Valitaan se, jota FE-1 voi käyttää samoin kuin yksittäisvarauksen maksunappia.
* Tarkistukset: käyttäjä omistaa hakemuksen, tulokset on lähetetty, hakemus vaatii vahvistuksen, sitä ei ole vielä vahvistettu, eikä määräaika ole ohi.
* Tilaus tallennetaan: remote ID, checkout URL, tila, kieli ja kierroksen merchant.
* Toinen klikkaus käyttää samaa tilausta ja checkout URL:ia määräaikaan asti.
* Verkkokauppaa kutsutaan yhden funktion kautta. Kun mock on päällä, funktio palauttaa mock-tilauksen ja mock-kassan URL:n. BE-5 lisää oikean kutsun saman funktion taakse.
* Mockin kassasivu osaa vahvistaa tai keskeyttää hakemuksen tilauksen. Vahvistus kutsuu BE-2:n actionia.

### Ei tässä tiketissä

* Oikea verkkokaupan kutsu: BE-5.
* Tilauksen peruutus määräajan jälkeen: OPS-8 ja BE-7.

### Valmis, kun

* Mock päällä asiakas voi vahvistaa maksullisen hakemuksen API:n kautta, ja hakemus on vahvistettu.
* Toinen klikkaus ennen kassan loppuunvientiä käyttää samaa tilausta.
* Tarkistukset palauttavat selkeät virheet.
* Testit kattavat onnistumisen, keskeytyksen ja jokaisen tarkistuksen.

### Avoimet kysymykset

* Mallin valinta yllä. Päätetään tämän tiketin refinementissä. Se vaikuttaa julkaisuun 3 (BE-8, BE-11).

### Riippuvuudet

* Odottaa: [BE-1](BE-1.md), [BE-2](BE-2.md)
* Estää: [BE-5](BE-5.md), [FE-1](FE-1.md), [FE-2](FE-2.md), BE-17
