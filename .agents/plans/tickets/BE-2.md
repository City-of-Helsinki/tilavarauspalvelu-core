# BE-2 · BE: Hakemuksen vahvistus, kun subscription on luotu

Yksi action merkitsee maksullisen hakemuksen vahvistetuksi ja lähettää Varaamon vahvistussähköpostin. Mockin kassa ja oikea webhook käyttävät molemmat sitä.

### Taustaa

* Yksittäisvarauksissa yhteinen askel on `PaymentOrder.actions.complete_payment`
  ([payment_order/actions.py:123](../../../backend/tilavarauspalvelu/models/payment_order/actions.py#L123)).
  Payment-webhook ja mockin kassa kutsuvat molemmat sitä.
* Kausivarauksiin tarvitaan vastaava yhteinen askel hakemukselle.
* Päätös 24.11.2026: Varaamo lähettää oman vahvistussähköpostin. Verkkokauppa lähettää lisäksi tilaussopimuksen.

### Toteutus

* Action hakemukselle (tai BE-4:n tilaukselle), joka:
  * asettaa BE-1:n vahvistuksen aikaleiman,
  * tallentaa verkkokaupan subscription ID:n,
  * päivittää BE-4:n tilauksen tilan,
  * lähettää vahvistussähköpostin taustatehtävänä.
* Action on idempotentti. Toinen kutsu vahvistetulle hakemukselle ei muuta mitään eikä lähetä toista sähköpostia.
* Action hylkää hakemuksen, joka ei vaadi vahvistusta, ja kirjaa sen lokiin.
* Uusi sähköpostityyppi templateineen suomeksi, ruotsiksi ja englanniksi. Sähköposti lisätään Django adminin sähköpostitesteriin.

### Ei tässä tiketissä

* Webhookin endpoint: BE-3.

### Valmis, kun

* Actionin jälkeen BE-1:n API näyttää hakemuksen vahvistettuna, ja asiakas saa vahvistussähköpostin.
* Testit kattavat ensimmäisen kutsun, toisen kutsun ja maksuttoman hakemuksen.

### Avoimet kysymykset

* Vahvistussähköpostin teksti. Tehdään UX-2:n yhteydessä.

### Riippuvuudet

* Odottaa: [BE-1](BE-1.md)
* Estää: [BE-3](BE-3.md), [BE-4](BE-4.md)
