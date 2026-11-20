# UX-1 · UX/UI: Hinnat, vahvistuksen tila ja vahvistusnappi hakemuksen sivulla

Suunnitellaan asiakkaan hakemuksen sivulle maksullisten vuorojen hinnat, vahvistuksen tila, määräaika ja vahvistusnappi.

### Taustaa

* Kun tulokset on lähetetty, asiakas avaa hakemuksensa Varaamossa.
* Maksullisen hakemuksen asiakas vahvistaa vuorot ja siirtyy verkkokaupan kassalle antamaan laskutustiedot.
* Verkkokauppa laskuttaa asiakasta sen jälkeen kuukausittain.
* Yksittäisvarauksissa on vastaava "varauksesi odottaa maksua" -laatikko ja maksunappi.

### Suunniteltavat asiat

* Hakemuksen tilat:
  * maksuton: ei muutosta,
  * maksullinen, vahvistamaton: hinnat, määräaika, miten kuukausilasku toimii ja vahvistusnappi,
  * maksullinen, vahvistettu: hinnat ja lyhyt vahvistettu-merkintä,
  * maksullinen, vahvistamaton, määräaika ohi: maksulliset vuorot perutaan (julkaisussa 2 käsin).
* Jokaisen maksullisen vuoron hinta hintarivien mukaan.
* Näytetäänkö arvio kokonaishinnasta. Design päättää tämän (24.11.2026).
* Lasku tulee kuukausittain, ja laskutustiedot annetaan verkkokaupassa.

### Ei tässä tiketissä

* Laskutusnäkymä laskutetuista ja laskuttamattomista varauksista: UX-5 (julkaisu 4).
* Paluusivu kassalta: FE-2 tekee sen, ja UX-3 tarkistaa sen.

### Valmis, kun

* Suunnitelmat neljälle tilalle desktopilla ja mobiilissa.
* Tekstit suomeksi, ruotsiksi ja englanniksi, tai merkintä että käännökset tulevat myöhemmin.

### Riippuvuudet

* Odottaa: -
* Estää: [FE-1](FE-1.md)
