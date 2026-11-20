# FE-2 · FE: Kassalta palaaminen hakemuksen sivulle

Kassan jälkeen asiakas palaa hakemuksensa sivulle ja näkee, onnistuiko vahvistus.

### Taustaa

* Yksittäisvarauksissa verkkokauppa palauttaa asiakkaan osoitteeseen `/success?orderId=…` tai `/reservation/cancel?orderId=…`.
  Asiakassovellus ohjaa ne sivuille `/callbacks/webstore/success` ja `/callbacks/webstore/cancel` (`next.config.ts`).
* Success-sivu hakee varauksen order ID:llä ja ohjaa sen tilan mukaan
  ([pages/callbacks/webstore/success.tsx](../../../frontend/apps/customer/src/pages/callbacks/webstore/success.tsx)).
* BE-4:n mockin kassa käyttää samoja paluu-URL:eja.
* Yksittäisvarauksissa paluubanneri sanoo "Varauksesi on maksettu" myös laskulle. Tätä tekstiä ei kopioida.

### Toteutus

* Kun order ID kuuluu hakemukselle, ohjataan hakemuksen sivulle bannerin kanssa: vahvistettu, tai odottaa vielä, jos webhook ei ole vielä tullut.
* Keskeytyksessä ohjataan hakemuksen sivulle tiedolla, että hakemusta ei ole vielä vahvistettu.
* Tekstit suomeksi, ruotsiksi ja englanniksi.

### Ei tässä tiketissä

* Oikeiden paluu-URL:ien muutokset. Niitä odotetaan OPS-2:n jälkeen, ja ne ovat pieniä.

### Valmis, kun

* Mockilla sekä vahvistus että keskeytys palaavat hakemuksen sivulle oikean bannerin kanssa.
* Yksittäisvarausten paluu toimii kuten ennen.

### Avoimet kysymykset

* Kertooko backend frontendille, kuuluuko order ID varaukselle vai hakemukselle? Vai kysyykö success-sivu molempia?

### Riippuvuudet

* Odottaa: [BE-4](BE-4.md)
* Estää: [UX-3](UX-3.md), [E2E-1](E2E-1.md)
