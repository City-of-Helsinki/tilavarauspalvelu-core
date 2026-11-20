# BE-1 · BE: Hakukierroksen määräaika ja merchant, maksullisen hakemuksen vahvistuksen tila API:ssa

Hakukierrokselle tulee vahvistuksen määräaika ja subscriptionin merchant. Kierros, jossa on sekä maksullisia että maksuttomia varausyksiköitä, estetään.
Asiakkaan ja käsittelijän käyttöliittymä näkee, vaatiiko hakemus vahvistuksen, mihin mennessä, onko se vahvistettu ja mitä maksulliset vuorot maksavat.

### Taustaa

* Päätökset 24.11.2026 ja 27.11.2026:
  * Määräaika on hakukierroksen kenttä. Käsittelijä asettaa sen kierrosta luodessa, ja sitä voi muuttaa myöhemmin.
  * Subscriptionin merchant on hakukierroksen kenttä. Varausyksikön merchantia ei käytetä subscriptionille. Hakija ei näe merchantia.
  * Toistaiseksi estetään kierrokset, joissa on sekä maksullisia että maksuttomia varausyksiköitä. Tuki tulee ennen kevään 2027 kierrosta (OPS-14, BE-18).
* Maauimalakierroksen vahvistus avautuu 15.1.2027 ja päättyy 28.2.2027.
* `Application.status` lasketaan, sitä ei tallenneta ([application/model.py:136](../../../backend/tilavarauspalvelu/models/application/model.py#L136)).
  `RESULTS_SENT` tulee `ApplicationRound.sent_at`:sta.
* `Application`-mallissa on jo ilmoitusten aikaleimoja, esim. `results_ready_notification_sent_at`. Vahvistuksen aikaleima sopii samaan malliin.
* Kausivaraukset saavat hintarivit, kun kierros tekee reservation seriesit
  ([application_round/actions.py:105](../../../backend/tilavarauspalvelu/models/application_round/actions.py#L105)).
* `ReservationSeries.total_price` laskee toteutuvien varausten hintarivit yhteen
  ([reservation_series/model.py:205](../../../backend/tilavarauspalvelu/models/reservation_series/model.py#L205)).
* GraphQL:ssä on jo `ReservationSeriesNode.totalPrice` ja `ReservationNode.priceLines`. Hakemuksen ja osion nodeilla ei ole hintoja.

### Toteutus

* `ApplicationRound`-malliin:
  * vahvistuksen määräaika (nullable),
  * subscriptionin merchant: nullable foreign key `PaymentMerchant`iin.
* Molemmat kentät staff UI:hin tai Django adminiin. Ne voi muuttaa kierroksen luonnin jälkeen.
* Kierroksen tallennus hylätään, jos sen varausyksiköissä on sekä maksullisia että maksuttomia. Selkeä virheviesti käsittelijälle.
* Tulosten lähetys (`set_application_round_results_sent`) hylätään, jos kierroksella on maksullisia yksiköitä mutta ei määräaikaa tai merchantia.
* Maksullinen hakemus: hakemus, jonka reservation seriesien hintarivien summa on yli nolla.
* Vahvistus tallennetaan hakemukselle, esim. `payment_confirmed_at` (nullable).
* Hakemuksen GraphQL-nodeen: vaatiiko vahvistuksen, kierroksen määräaika ja vahvistuksen aika.
* Maksullisten vuorojen hinnat API:ssa siinä muodossa, jota UX-1 tarvitsee. Käytetään `totalPrice`:a ja `priceLines`:ia, jos ne riittävät.

### Ei tässä tiketissä

* Tilauksen tallennus ja tila: BE-4.
* Vahvistuksen asetus: BE-2.
* Kierrokset, joissa on sekä maksullisia että maksuttomia yksiköitä: BE-18.

### Valmis, kun

* Kierroksella on määräaika ja merchant, ja niitä voi muuttaa.
* Kierrosta, jossa on maksullisia ja maksuttomia yksiköitä, ei voi tallentaa.
* Maksullisen kierroksen tuloksia ei voi lähettää ilman määräaikaa ja merchantia.
* Maksuton hakemus ei vaadi vahvistusta.
* Maksullinen hakemus vaatii vahvistuksen, kunnes se on vahvistettu.
* Asiakas näkee kentät vain omista hakemuksistaan. Käsittelijä näkee ne nykyisillä oikeuksilla.

### Avoimet kysymykset

* Tarvitaanko kokonaishinta hakemukselle vai riittääkö osioittain? Design päättää UX-1:ssä.
* `ReservationSeries.total_price` jättää perutut varaukset pois, mutta peruttu yksittäinen varaus laskutetaan silti. Tässä näytettävä hinta on arvio ennen laskutusta, joten tämä on luultavasti ok. Tarkistetaan refinementissä.

### Riippuvuudet

* Odottaa: -
* Estää: [BE-2](BE-2.md), [BE-4](BE-4.md), [BE-6](BE-6.md), [FE-1](FE-1.md), [OPS-4](OPS-4.md), FE-3, BE-7, BE-13, BE-14, BE-18
