# BE-2 · BE: Hakemuksen vahvistus, kun subscription on luotu

Yksi action merkitsee maksullisen hakemuksen vahvistetuksi. Mockin kassa ja oikea webhook käyttävät molemmat sitä.

### Taustaa

* Yksittäisvarauksissa yhteinen askel on `PaymentOrder.actions.complete_payment`
  ([payment_order/actions.py:123](../../../backend/tilavarauspalvelu/models/payment_order/actions.py#L123)).
  Payment-webhook ja mockin kassa kutsuvat molemmat sitä.
* Kausivarauksiin tarvitaan vastaava yhteinen askel hakemukselle.

### Toteutus

* Action hakemukselle (tai BE-4:n tilaukselle), joka:
  * asettaa BE-1:n vahvistuksen aikaleiman,
  * tallentaa verkkokaupan subscription ID:n, jos kutsussa on sellainen,
  * päivittää BE-4:n tilauksen tilan.
* Action on idempotentti. Toinen kutsu vahvistetulle hakemukselle ei muuta mitään.
* Action hylkää hakemuksen, joka ei vaadi vahvistusta, ja kirjaa sen lokiin.

### Ei tässä tiketissä

* Webhookin endpoint: BE-3.
* Sähköpostit. Verkkokauppa lähettää asiakkaalle subscription-sopimuksen.

### Valmis, kun

* Actionin jälkeen BE-1:n API näyttää hakemuksen vahvistettuna.
* Testit kattavat ensimmäisen kutsun, toisen kutsun ja maksuttoman hakemuksen.

### Avoimet kysymykset

* Lähettääkö Varaamo oman vahvistussähköpostin, vai riittääkö verkkokaupan sopimussähköposti? Kysytään tuoteomistajalta.

### Riippuvuudet

* Odottaa: [BE-1](BE-1.md)
* Estää: [BE-3](BE-3.md), [BE-4](BE-4.md)
