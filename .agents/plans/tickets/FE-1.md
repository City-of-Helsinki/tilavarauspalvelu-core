# FE-1 · FE: Hinnat, vahvistuksen tila ja vahvistusnappi hakemuksen sivulla

Asiakas näkee maksullisten vuorojen hinnat, määräajan ja vahvistuksen tilan, ja voi aloittaa vahvistuksen.

### Taustaa

* Hakemuksen sivu on asiakassovelluksen `pages/applications/[id]/view/index.tsx`.
  Jaetut vuorot näkyvät komponentissa `ApprovedReservations`
  ([ApprovedReservations.tsx](../../../frontend/apps/customer/src/components/application/ApprovedReservations.tsx)).
* Yksittäisvarauksissa on "odottaa maksua" -laatikko ja maksunappi komponentissa `PaymentNotification`
  ([lib/reservation/[id]/PaymentNotification.tsx:76](../../../frontend/apps/customer/src/lib/reservation/%5Bid%5D/PaymentNotification.tsx#L76)).
  Maksun URL tulee hookista `usePaymentUrl`.

### Toteutus

* UX-1:n neljä tilaa: maksuton, maksullinen ja vahvistamaton, maksullinen ja vahvistettu, sekä määräaika ohi.
* Hinnat BE-1:n API:sta.
* Vahvistusnappi käyttää BE-4:n vahvistusaskelta samalla tavalla kuin yksittäisvarauksen maksunappi.
* Tekstit suomeksi, ruotsiksi ja englanniksi.

### Ei tässä tiketissä

* Paluusivu kassalta: FE-2.
* Laskutusnäkymä: FE-4 (julkaisu 4).

### Valmis, kun

* Backendin mock päällä asiakas voi vahvistaa maksullisen hakemuksen sivulta, ja sivu näyttää sen vahvistettuna.
* Maksuton hakemus näyttää samalta kuin nyt.
* Yksikkötestit kattavat neljä tilaa.

### Riippuvuudet

* Odottaa: [UX-1](UX-1.md), [BE-1](BE-1.md), [BE-4](BE-4.md)
* Estää: [E2E-1](E2E-1.md), [OPS-6](OPS-6.md)
