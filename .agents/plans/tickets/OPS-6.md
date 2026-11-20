# OPS-6 · OPS: Vahvistuksen testaus verkkokaupan testiympäristöä vasten

Tarkistetaan, että oikea vahvistus toimii päästä päähän ennen kuin vahvistus avautuu 15.1.2027.

### Taustaa

* Julkaisu 1 tehdään verkkokaupan mockia vasten. Tämä tiketti testaa sen oikeaa verkkokaupan testiympäristöä vasten.
* Varaamon dev-ympäristö käyttää verkkokaupan testiympäristöä.
* Tavoite on testata viikolla 51, ennen joulutaukoa.

### Tarkistettavat asiat

Dev-ympäristössä maksullisella hakukierroksella:

* Tulosten lähetys ja maksullisen hakemuksen sähköposti.
* Vahvistus ja laskutustiedot kassalla yhdistyksenä ja yrityksenä.
* Kassalla ei näy ajastinta.
* Varaamo saa yhden `SUBSCRIPTION_CREATED` -webhookin ja merkitsee hakemuksen vahvistetuksi.
* Asiakas saa Varaamon vahvistussähköpostin ja verkkokaupan tilaussopimuksen.
* Kassan keskeytys: hakemus jää vahvistamattomaksi.
* Tilaus verkkokaupassa: ei rivejä, kierroksen merchant, ensimmäinen `invoicingDate` ja `subscriptionId`.

### Valmis, kun

* Kaikki kohdat on tarkistettu, ja löydetyt virheet on kirjattu tiketeiksi.
* Tulos on kirjattu epiciin TILA-4432.

### Riippuvuudet

* Odottaa: [BE-3](BE-3.md), [BE-5](BE-5.md), [FE-1](FE-1.md), KYV-1384, KYV-1446
* Estää: -
