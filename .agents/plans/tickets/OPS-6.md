# OPS-6 · OPS: Vahvistuksen testaus verkkokaupan testiympäristöä vasten

Tarkistetaan, että oikea vahvistus toimii päästä päähän ennen kuin kesän 2027 kierroksen tulokset lähtevät.

### Taustaa

* Julkaisu 1 tehdään verkkokaupan mockia vasten. Tämä tiketti testaa sen oikeaa verkkokaupan testiympäristöä vasten.
* Varaamon dev-ympäristö käyttää verkkokaupan testiympäristöä.

### Tarkistettavat asiat

Dev-ympäristössä hakukierroksella, jolla on maksullisia ja maksuttomia vuoroja:

* Tulosten lähetys ja maksullisen hakemuksen sähköposti.
* Vahvistus ja laskutustiedot kassalla yhdistyksenä ja yrityksenä.
* Varaamo saa `SUBSCRIPTION_CREATED` -webhookin ja merkitsee hakemuksen vahvistetuksi.
* Asiakas saa verkkokaupalta subscription-sopimuksen sähköpostilla.
* Kassan keskeytys: hakemus jää vahvistamattomaksi.
* Tilaus verkkokaupassa: ei rivejä, oikea merchant ja ensimmäinen `invoicingDate`.

### Valmis, kun

* Kaikki kohdat on tarkistettu, ja löydetyt virheet on kirjattu tiketeiksi.
* Tulos on kirjattu epiciin TILA-4432.

### Riippuvuudet

* Odottaa: [BE-3](BE-3.md), [BE-5](BE-5.md), [FE-1](FE-1.md), [OPS-5](OPS-5.md), KYV-1384, KYV-1446
* Estää: -
