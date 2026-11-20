# OPS-5 · OPS: Varaamon merchanttien subscription webhook URL verkkokauppaan

Verkkokauppa lähettää `SUBSCRIPTION_CREATED` -webhookin Varaamoon testi- ja tuotantoympäristöissä.

### Taustaa

* Verkkokaupassa on merchantin asetus `merchantSubscriptionWebhookUrl` subscription-webhookeille.
* Varaamon merchanttien order- ja payment-webhookien URL:t on jo asetettu. Pitää selvittää, kuka ne asetti ja miten.

### Toteutus

* Selvitetään, miten nykyiset order- ja payment-webhookien URL:t on asetettu.
* Asetetaan subscription webhook URL samalla tavalla jokaiselle merchantille testissä ja tuotannossa.
* Kirjataan ohje, jotta myös uusi merchant saa URL:n.

### Valmis, kun

* Jokaisella merchantilla on subscription webhook URL testissä ja tuotannossa.
* Testiympäristön subscription lähettää webhookin Varaamoon. Tämä tarkistetaan OPS-6:ssa.
* Uusi merchant saa URL:n kirjatun ohjeen mukaan.

### Riippuvuudet

* Odottaa: [OPS-2](OPS-2.md)
* Estää: [OPS-6](OPS-6.md), [E2E-1](E2E-1.md)
