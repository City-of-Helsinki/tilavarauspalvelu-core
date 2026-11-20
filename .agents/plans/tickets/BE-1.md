# BE-1 · BE: Maksullisen hakemuksen vahvistuksen tila, määräaika ja hinnat API:ssa

Asiakkaan ja käsittelijän käyttöliittymä näkee, vaatiiko hakemus vahvistuksen, mihin mennessä, onko se vahvistettu ja mitä maksulliset vuorot maksavat.

### Taustaa

* `Application.status` lasketaan, sitä ei tallenneta ([application/model.py:136](../../../backend/tilavarauspalvelu/models/application/model.py#L136)).
  `RESULTS_SENT` tulee `ApplicationRound.sent_at`:sta.
* `Application`-mallissa on jo ilmoitusten aikaleimoja, esim. `results_ready_notification_sent_at`. Vahvistuksen aikaleima sopii samaan malliin.
* Kausivaraukset saavat hintarivit, kun kierros tekee reservation seriesit
  ([application_round/actions.py:105](../../../backend/tilavarauspalvelu/models/application_round/actions.py#L105)).
* `ReservationSeries.total_price` laskee toteutuvien varausten hintarivit yhteen
  ([reservation_series/model.py:205](../../../backend/tilavarauspalvelu/models/reservation_series/model.py#L205)).
* GraphQL:ssä on jo `ReservationSeriesNode.totalPrice` ja `ReservationNode.priceLines`. Hakemuksen ja osion nodeilla ei ole hintoja.
* Oletus on yksi subscription order per hakemus. Siksi vahvistus kuuluu hakemukselle.

### Toteutus

* Maksullinen hakemus: hakemus, jonka reservation seriesien hintarivien summa on yli nolla. OPS-1:n päätös ratkaisee hakemukset, joissa on sekä maksullisia että maksuttomia vuoroja.
* Määräaika tallennetaan OPS-1:n mukaan hakukierrokselle tai hakemukselle.
* Vahvistus tallennetaan hakemukselle, esim. `payment_confirmed_at` (nullable).
* Hakemuksen GraphQL-nodeen: vaatiiko vahvistuksen, määräaika ja vahvistuksen aika.
* Maksullisten vuorojen hinnat API:ssa siinä muodossa, jota UX-1 tarvitsee. Käytetään `totalPrice`:a ja `priceLines`:ia, jos ne riittävät.
* Määräaika staff UI:hin tai Django adminiin, jos OPS-1:n mukaan käsittelijä asettaa sen.

### Ei tässä tiketissä

* Tilauksen tallennus ja tila: BE-4.
* Vahvistuksen asetus: BE-2.

### Valmis, kun

* Maksuton hakemus ei vaadi vahvistusta.
* Maksullinen hakemus vaatii vahvistuksen, kunnes se on vahvistettu.
* Asiakas näkee kentät vain omista hakemuksistaan. Käsittelijä näkee ne nykyisillä oikeuksilla.
* Testit kattavat maksuttoman, maksullisen ja sekahakemuksen.

### Avoimet kysymykset

* Tarvitaanko kokonaishinta hakemukselle vai riittääkö osioittain? Kysytään UX-1:ltä.
* `ReservationSeries.total_price` jättää perutut varaukset pois, mutta peruttu yksittäinen varaus laskutetaan silti. Tässä näytettävä hinta on arvio ennen laskutusta, joten tämä on luultavasti ok. Tarkistetaan refinementissä.

### Riippuvuudet

* Odottaa: [OPS-1](OPS-1.md)
* Estää: [BE-2](BE-2.md), [BE-4](BE-4.md), [BE-6](BE-6.md), [FE-1](FE-1.md), FE-3, BE-7, BE-10, BE-13, BE-14
