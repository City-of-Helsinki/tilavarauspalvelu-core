# OPS-3 · OPS: Onko `subscriptionEndDate` yhä osa subscription orderia

Selvitetään, pitääkö Varaamon lähettää päättymispäivä subscription orderin mukana.

### Taustaa

* Palaverissa 7.10.2026 verkkokauppa poisti `subscriptionEndDate`:n suunnitelmista, koska se on toinen totuuden lähde tilauksen päättymiselle.
* Päättyminen ilmaistaan sillä, että Varaamo ei palauta seuraavaa `invoicingDate`:a.
* Verkkokaupan tiketti KYV-1382 listaa kentän silti vielä 18.11.2026.

### Toteutus

* Kysytään verkkokaupalta, onko kenttä yhä suunnitelmissa.
* Jos kenttä jää, sovitaan mitä Varaamo lähettää: hakemuksen viimeisen varauksen päivän tai ei mitään.

### Valmis, kun

* Vastaus on kirjattu samalle Confluence-sivulle kuin OPS-2:n vastaukset.

### Huomiot

Tämä voisi olla yksi kysymys OPS-2:ssa. Se on oma tikettinsä, koska se muuttaa BE-5:n pyyntöä.

### Riippuvuudet

* Odottaa: -
* Estää: [BE-5](BE-5.md)
