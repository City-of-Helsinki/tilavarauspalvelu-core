# OPS-1 · OPS: Kausivarausten vahvistuksen määräaika ja maksulliset vuorot

Päätetään, mihin mennessä asiakkaan on vahvistettava maksulliset kausivaraukset ja mitkä vuorot vaativat vahvistuksen.
Julkaisun 1 backend ja suunnitelmat tarvitsevat molemmat vastaukset.

### Taustaa

* Vuorojen jaon jälkeen asiakas vahvistaa maksulliset vuorot ja antaa laskutustiedot verkkokauppaan.
* Jos asiakas ei vahvista ennen määräaikaa, maksulliset vuorot perutaan. Julkaisussa 2 käsittelijä perii ne käsin (OPS-8).
* Tavoite on noin 15.1.2027. Ehdoton määräaika on 31.1.2027.
* Hakemuksessa voi olla sekä maksullisia että maksuttomia osioita. Osiossa voi myös olla sekä maksullisia että maksuttomia varausyksiköitä.

### Päätettävät asiat

* Määräaika: yksi päivämäärä koko hakukierrokselle vai tietty määrä päiviä tulosten lähettämisestä.
* Kuka asettaa määräajan: käsittelijä vai kiinteä sääntö.
* Vaativatko vahvistuksen vain maksulliset osiot vai koko hakemus, jos jokin osio on maksullinen.
* Mitä tehdään osiolle, jossa on sekä maksullisia että maksuttomia varausyksiköitä.
* Mitä tapahtuu vahvistamattoman hakemuksen maksuttomille vuoroille.

### Ei tässä tiketissä

* Sähköpostin ja hakemussivun tekstit: UX-1 ja UX-2.
* Muistutussähköposti: BE-14 (julkaisu 4).

### Valmis, kun

* Päätökset on kirjattu epiciin TILA-4432 päivämäärän kanssa.
* BE-1 tietää, tallennetaanko määräaika hakukierrokselle vai hakemukselle.

### Avoimet kysymykset

* Onko kesän 2027 kierros vain yrityksille ja yhteisöille? Suunnitelma olettaa niin.

### Riippuvuudet

* Odottaa: -
* Estää: [UX-1](UX-1.md), [UX-2](UX-2.md), [BE-1](BE-1.md), OPS-7, OPS-8
