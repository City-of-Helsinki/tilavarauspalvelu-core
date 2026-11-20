# OPS-4 · OPS: Maauimalakierroksen tuotteet, määräaika ja merchant tuotannossa

Tarkistetaan, että kesän 2027 maauimalakierroksella on kaikki, mitä vahvistus ja lasku tarvitsevat, ennen kuin vahvistus avautuu 15.1.2027.

### Taustaa

* TILA-4594 tekee verkkokaupan tuotteen jokaiselle varausyksikön, sales itemin ja merchantin yhdistelmälle.
* Kuukausilaskun rivit käyttävät näitä tuotteita ja niiden accountingeja.
* TILA-4594:ssä lasku tarjotaan vain, jos jokaisella maksullisella sales itemillä on material.
* BE-1 lisää kierrokselle vahvistuksen määräajan ja subscriptionin merchantin.
* Kierros avautuu hakijoille 7.12.2026.

### Tarkistettavat asiat

* Kierroksen varausyksiköt, joilla on maksullinen hinta.
* Jokaiselta: payment productit, accounting ja jokaisen sales itemin material.
* Kierrokselta: määräaika 28.2.2027 ja subscriptionin merchant.
* Kierroksella ei ole maksuttomia varausyksiköitä.
* Puuttuvat tiedot listataan käsittelijöille, ja tarkistetaan uudelleen korjausten jälkeen.

### Ei tässä tiketissä

* Muutokset tuotteiden synkronointiin: TILA-4594.

### Valmis, kun

* Kaikki kohdat ovat kunnossa tuotannossa ennen 15.1.2027.

### Huomiot

Listan voi tehdä skriptillä, joka ajetaan `just infra oc-run-script production <tiedosto>`.

### Riippuvuudet

* Odottaa: TILA-4594 tuotannossa, [BE-1](BE-1.md) tuotannossa
* Estää: -
