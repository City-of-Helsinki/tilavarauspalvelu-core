# OPS-4 · OPS: Kesän 2027 maksullisten varausyksiköiden verkkokaupan tuotteet tuotannossa

Tarkistetaan, että jokaisella kesän 2027 kierroksen maksullisella varausyksiköllä on kaikki, mitä lasku tarvitsee, ennen kuin tulokset lähtevät.

### Taustaa

* TILA-4594 tekee verkkokaupan tuotteen jokaiselle varausyksikön, sales itemin ja merchantin yhdistelmälle.
* Kuukausilaskun rivit käyttävät näitä tuotteita ja niiden accountingeja.
* TILA-4594:ssä lasku tarjotaan vain, jos jokaisella maksullisella sales itemillä on material.
* TILA-4594 sulkee verkkokaupan varausyksiköt, joilla ei ole payment productia.

### Tarkistettavat asiat

* Kierroksen varausyksiköt, joilla on maksullinen hinta.
* Jokaiselta: merchant, payment productit, accounting ja jokaisen sales itemin material.
* Puuttuvat tiedot listataan käsittelijöille, ja tarkistetaan uudelleen korjausten jälkeen.

### Ei tässä tiketissä

* Muutokset tuotteiden synkronointiin: TILA-4594.

### Valmis, kun

* Jokaisella kierroksen maksullisella varausyksiköllä on merchant, payment product jokaiselle sales itemille, accounting ja material.
* Tarkistus on tehty tuotannossa ennen tulosten lähettämistä.

### Huomiot

Listan voi tehdä `shell_plus`-skriptillä, joka ajetaan `just infra oc-run-script production <tiedosto>`.

### Riippuvuudet

* Odottaa: TILA-4594 tuotannossa
* Estää: -
