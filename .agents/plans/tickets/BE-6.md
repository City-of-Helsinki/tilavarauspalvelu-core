# BE-6 · BE: Vahvistusteksti ja linkki maksullisen hakemuksen tulossähköpostiin

Maksullisen hakemuksen asiakas saa tulossähköpostista tiedon, että maksulliset vuorot pitää vahvistaa, ja miten se tehdään.

### Taustaa

* Käsittelijä lähettää tulokset mutaatiolla `set_application_round_results_sent`. Se käynnistää `send_application_handled_email_task`:n
  ([application_round/serializers.py:52](../../../backend/tilavarauspalvelu/api/graphql/types/application_round/serializers.py#L52)).
* Sähköposti lähetetään erissä, ja sen jälkeen asetetaan `results_ready_notification_sent_at`
  ([integrations/email/main.py:505](../../../backend/tilavarauspalvelu/integrations/email/main.py#L505)).
* Sähköpostin context on yleinen: yksi per kieli ja linkki "Omat hakemukset" -sivulle. Siinä ei ole yksittäisen hakemuksen tietoja
  ([template_context/seasonal_bookings.py:179](../../../backend/tilavarauspalvelu/integrations/email/template_context/seasonal_bookings.py#L179)).
* Templatet ovat `seasonal_booking_application_round_handled.jinja` kansioissa `backend/templates/email/html/` ja `text/`.

### Toteutus

* UX-2:n teksti lähetetään maksullisten hakemusten hakijoille määräajan ja hakemuksen linkin kanssa.
* Valitaan toinen:
  * uusi sähköpostityyppi maksullisille hakemuksille nykyisen rinnalle, tai
  * nykyinen sähköposti hakemuskohtaisilla tiedoilla.
  Nykyinen sähköposti lähtee erissä ilman hakemuksen tietoja, joten uusi tyyppi on luultavasti yksinkertaisempi.
* Maksuttoman hakemuksen sähköposti pysyy ennallaan.
* Sähköposti lisätään Django adminin sähköpostitesteriin kuten muut tyypit.

### Ei tässä tiketissä

* Hinnat sähköpostissa: BE-13 (julkaisu 4).

### Valmis, kun

* Maksullisen hakemuksen hakija saa vahvistustekstin, määräajan ja toimivan linkin omalla kielellään.
* Maksuttoman hakemuksen hakija saa saman sähköpostin kuin nyt.
* Testit kattavat maksullisen ja maksuttoman hakemuksen.

### Riippuvuudet

* Odottaa: [UX-2](UX-2.md), [BE-1](BE-1.md) (määräaika ja maksullisuus)
* Estää: -
