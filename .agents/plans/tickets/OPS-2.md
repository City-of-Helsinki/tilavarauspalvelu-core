# OPS-2 · OPS: Rajapintasopimus verkkokaupan kanssa julkaisulle 1

Saadaan verkkokaupalta rajapintasopimus 4.12.2026 mennessä ja koodi testiympäristöön 11.12.2026 mennessä.

### Taustaa

* Verkkokauppa on saanut Varaamon ehdotuksen esityksenä "Kausivarausten toistuvaislaskutus" (`~/Downloads/maksaminen-3-verkkokauppa-rajapinnat.html`).
* Rajapintasopimuksen ei tarvitse olla muodollinen. Esimerkkikutsut riittävät: osoite, otsakkeet, esimerkkipyyntö ja -vastaus, pakolliset kentät, virheet ja uudelleenyritykset.
  Varaamo tarvitsee sen mockia varten.
* Päätökset ja avoimet kysymykset ovat tiedostossa [seasonal-booking-payments.md](../seasonal-booking-payments.md).

### Pyynnöt julkaisulle 1

* Kenttä `merchantId` tilaukselle.
* Tilaus ilman rivejä toimii kassalla, paluussa ja subscriptionin luonnissa.
* Yksi subscription ja yksi `SUBSCRIPTION_CREATED` tilausta kohden. Event lähtee laskutilauksen hyväksynnästä.
* `subscriptionId` näkyy tilauksen haussa.
* Ajastin piiloon subscription-tilauksilta.
* Kentän `type` validointi ja testi.
* Asiakkaan oma subscriptionin peruutus estetty Varaamon namespacessa.
* KYV-1438, KYV-1446 ja KYV-1384 testiympäristössä.

### Ei tässä tiketissä

* Laskurivikutsun rajapintasopimus: OPS-9 (julkaisu 3).
* SAP-jako myyntiorganisaation mukaan: OPS-15 (ennen kevään 2027 kierrosta).

### Valmis, kun

* Verkkokauppa on vahvistanut tai korjannut esimerkkikutsut kirjallisesti.
* Jokaiseen pyyntöön on vastaus ja päivä.
* Varaamon mock vastaa sovittuja kutsuja.

### Riippuvuudet

* Odottaa: -
* Estää: [BE-3](BE-3.md), [BE-5](BE-5.md), OPS-9, OPS-15
