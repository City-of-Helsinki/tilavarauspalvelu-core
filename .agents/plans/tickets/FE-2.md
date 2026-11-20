# FE-2 · FE: Kassalta palaaminen hakemuksen sivulle

Kassan jälkeen asiakas palaa hakemuksensa sivulle ja näkee, onnistuiko vahvistus.

### Taustaa

* Yksittäisvarauksissa verkkokauppa palauttaa asiakkaan osoitteeseen `/success?orderId=…` tai `/reservation/cancel?orderId=…`.
  Asiakassovellus ohjaa ne sivuille `/callbacks/webstore/success` ja `/callbacks/webstore/cancel` (`next.config.ts`).
* Success-sivu hakee varauksen order ID:llä ja ohjaa sen tilan mukaan
  ([pages/callbacks/webstore/success.tsx](../../../frontend/apps/customer/src/pages/callbacks/webstore/success.tsx)).
* BE-4:n mockin kassa käyttää samoja paluu-URL:eja.
* Verkkokauppa käyttää subscription-tilauksille samoja paluu-URL:eja kuin yksittäisvarauksille: laskun jälkeen `ORDER_CREATED_REDIRECT_URL?orderId=…&user=…`, keskeytyksessä `ORDER_CANCEL_REDIRECT_URL?orderId=…`.
  Order ID ei siis kerro, onko kyse varauksesta vai hakemuksesta.
* Yksittäisvarauksissa paluubanneri sanoo "Varauksesi on maksettu" myös laskulle. Tätä tekstiä ei kopioida.

### Toteutus

* Backend kertoo order ID:llä, kuuluuko tilaus varaukselle vai hakemukselle. Success- ja cancel-sivut kysyvät tätä ja ohjaavat sen mukaan.
* Kun order ID kuuluu hakemukselle, ohjataan hakemuksen sivulle bannerin kanssa: vahvistettu, tai odottaa vielä, jos webhook ei ole vielä tullut.
* Keskeytyksessä ohjataan hakemuksen sivulle tiedolla, että hakemusta ei ole vielä vahvistettu.
* Tekstit suomeksi, ruotsiksi ja englanniksi.

### Ei tässä tiketissä

* Muutokset paluu-URL:eihin. Verkkokauppa käyttää nykyisiä osoitteita.

### Valmis, kun

* Mockilla sekä vahvistus että keskeytys palaavat hakemuksen sivulle oikean bannerin kanssa.
* Yksittäisvarausten paluu toimii kuten ennen.

### Riippuvuudet

* Odottaa: [BE-4](BE-4.md)
* Estää: [UX-3](UX-3.md), [E2E-1](E2E-1.md)
