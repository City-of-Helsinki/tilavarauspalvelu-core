# BE-3 · BE: Verkkokaupan `SUBSCRIPTION_CREATED` -webhook

Kun verkkokauppa luo subscriptionin, Varaamo merkitsee hakemuksen vahvistetuksi.

### Taustaa

* Webhookit ovat kansiossa [api/webhooks/](../../../backend/tilavarauspalvelu/api/webhooks/) osoitteessa `v1/webhook/`: `payment`, `order` ja `refund`.
* Webhookeissa ei ole autentikointia. `WebhookPermission` tarkistaa vain, että metodi on `POST`.
* Varaamo tarkistaa eventin `namespace`:n ja hakee sen jälkeen oikean tilan verkkokaupasta omalla API-avaimellaan
  (esim. `get_payment`, [views.py:50](../../../backend/tilavarauspalvelu/api/webhooks/views.py#L50)).
* Eventtien tyypit ovat merkkijonoja serializereissa, esim. `"PAYMENT_PAID"`.
* `SUBSCRIPTION_CREATED` on jo olemassa verkkokaupassa. Sen URL on merchantin asetus `merchantSubscriptionWebhookUrl`.

### Toteutus

* Uusi webhook-endpoint subscription-eventeille samalla mallilla kuin nykyiset.
* Hyväksytään `SUBSCRIPTION_CREATED`, ja tarkistetaan namespace.
* Haetaan subscription tai order verkkokaupasta ja tarkistetaan, että se on olemassa ja kuuluu hakemukselle.
* Etsitään hakemus order ID:llä ja kutsutaan BE-2:n actionia.
* Tuntemattomasta orderista selkeä virhe ja Sentry.

### Ei tässä tiketissä

* Muut subscription-eventit, kuten `SUBSCRIPTION_CANCELLED` tai uusinnan eventit. Julkaisu 3 tarvitsee osan niistä.

### Valmis, kun

* Kelvollinen event vahvistaa hakemuksen.
* Toistettu event ei muuta mitään ja palauttaa onnistumisen.
* Event väärällä namespacella tai tuntemattomalla orderilla ei muuta mitään.
* Testit käyttävät tallennettuja verkkokaupan vastauksia.

### Huomiot

Nykyisen eventin payload tunnetaan, joten suurin osa tiketistä voidaan tehdä ennen OPS-2:ta.
Vain subscriptionin takaisinhaku tarvitsee sopimuksen.

### Riippuvuudet

* Odottaa: [BE-2](BE-2.md), [OPS-2](OPS-2.md)
* Estää: [OPS-6](OPS-6.md)
