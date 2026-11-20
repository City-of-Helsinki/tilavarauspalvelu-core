# BE-3 · BE: Verkkokaupan `SUBSCRIPTION_CREATED` -webhook

Kun verkkokauppa luo subscriptionin, Varaamo merkitsee hakemuksen vahvistetuksi. Webhookin osoite asetetaan verkkokauppaan.

### Taustaa

* Webhookit ovat kansiossa [api/webhooks/](../../../backend/tilavarauspalvelu/api/webhooks/) osoitteessa `v1/webhook/`: `payment`, `order` ja `refund`.
* Webhookeissa ei ole API-tokenia. `WebhookPermission` tarkistaa vain, että metodi on `POST`.
  Varaamo tarkistaa eventin `namespace`:n ja hakee sen jälkeen oikean tilan verkkokaupasta omalla API-tokenillaan
  (esim. `get_order`, [views.py:108](../../../backend/tilavarauspalvelu/api/webhooks/views.py#L108)).
* Verkkokaupan koodissa (27.11.2026) payload on:
  `subscriptionId`, `orderId`, `orderItemId`, `namespace`, `eventType`, `timestamp` ja `eventTimestamp`.
* Osoite on namespacen asetus `merchantSubscriptionWebhookUrl`, nimestään huolimatta (`RestWebHookService.postCallWebHook`).
  Yksi osoite riittää kaikille merchanteille.
* Jos vastaus ei ole 200, verkkokauppa yrittää uudelleen enintään 5 kertaa.
* Pyysimme verkkokaupalta (OPS-2): yksi subscription ja yksi event tilausta kohden, ilman `orderItemId`:tä,
  event laskutilauksen hyväksynnästä, ja `subscriptionId` tilauksen haussa.
* Order-tyyppi lukee jo `subscriptionId`:n ([order/types.py:204](../../../backend/tilavarauspalvelu/integrations/verkkokauppa/order/types.py#L204)).

### Toteutus

* Uusi webhook-endpoint subscription-eventeille samalla mallilla kuin nykyiset.
* Hyväksytään `SUBSCRIPTION_CREATED`, ja tarkistetaan namespace.
* Haetaan tilaus verkkokaupasta ja tarkistetaan, että sillä on sama `subscriptionId` ja että se kuuluu hakemukselle.
* Etsitään hakemus order ID:llä ja kutsutaan BE-2:n actionia.
* Tuntemattomasta orderista selkeä virhe ja Sentry.
* Asetetaan `merchantSubscriptionWebhookUrl` Varaamon namespacelle verkkokaupan testi- ja tuotantoympäristöön.
  Selvitetään, miten nykyiset webhook-osoitteet on asetettu, ja tehdään samoin. Kirjataan ohje.

### Ei tässä tiketissä

* Muut subscription-eventit, kuten `SUBSCRIPTION_CANCELLED`. Pyysimme, että asiakkaan oma peruutus estetään Varaamon namespacessa.

### Valmis, kun

* Kelvollinen event vahvistaa hakemuksen.
* Toistettu event ei muuta mitään ja palauttaa onnistumisen.
* Event väärällä namespacella tai tuntemattomalla orderilla ei muuta mitään.
* Testit käyttävät tallennettuja verkkokaupan vastauksia.
* Osoite on asetettu testi- ja tuotantoympäristöön, ja ohje on kirjattu.

### Riippuvuudet

* Odottaa: [BE-2](BE-2.md), [OPS-2](OPS-2.md)
* Estää: [OPS-6](OPS-6.md), [E2E-1](E2E-1.md)
