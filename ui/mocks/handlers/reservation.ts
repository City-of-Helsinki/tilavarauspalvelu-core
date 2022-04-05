import { graphql } from "msw";
import { addHours, addDays } from "date-fns";
import {
  ReservationType,
  ReservationConfirmMutationInput,
  ReservationConfirmMutationPayload,
  ReservationCreateMutationInput,
  ReservationCreateMutationPayload,
  ReservationUpdateMutationInput,
  ReservationUpdateMutationPayload,
  ReservationCancellationMutationInput,
  ReservationCancellationMutationPayload,
  Query,
  QueryReservationUnitByPkArgs,
  ReservationCancelReasonTypeConnection,
  ReservationsReservationStateChoices,
  ReservationUnitType,
  ReservationTypeEdge,
  QueryReservationPurposesArgs,
  ReservationPurposeTypeConnection,
  AgeGroupTypeConnection,
  QueryCitiesArgs,
  CityTypeConnection,
  QueryReservationsArgs,
} from "../../modules/gql-types";

const createReservation = graphql.mutation<
  { createReservation: ReservationCreateMutationPayload },
  { input: ReservationCreateMutationInput }
>("createReservation", (req, res, ctx) => {
  return res(
    ctx.data({
      createReservation: {
        pk: 42,
        price: 42.0,
        errors: null,
      },
    })
  );
});

const updateReservation = graphql.mutation<
  { updateReservation: ReservationUpdateMutationPayload },
  { input: ReservationUpdateMutationInput }
>("updateReservation", (req, res, ctx) => {
  const { input } = req.variables;
  return res(
    ctx.data({
      updateReservation: {
        reservation: {
          pk: input.pk,
          calendarUrl: `http://calendarUrl/${input.pk}`,
          state: input.state || "",
          user: "USER@NA.ME",
          name: input.name,
          description: input.description,
          purpose: {
            pk: input.purposePk,
          },
          numPersons: input.numPersons,
          ageGroup: {
            pk: input.ageGroupPk,
          },
          reserveeFirstName: input.reserveeFirstName,
          reserveeLastName: input.reserveeLastName,
          reserveeOrganisationName: input.reserveeOrganisationName,
          reserveePhone: input.reserveePhone,
          reserveeEmail: input.reserveeEmail,
          reserveeId: input.reserveeId,
          reserveeIsUnregisteredAssociation:
            input.reserveeIsUnregisteredAssociation,
          reserveeAddressStreet: input.reserveeAddressStreet,
          reserveeAddressZip: input.reserveeAddressZip,
          reserveeAddressCity: input.reserveeAddressCity,
          billingFirstName: input.billingFirstName,
          billingLastName: input.billingLastName,
          billingPhone: input.billingPhone,
          billingEmail: input.billingEmail,
          billingAddressStreet: input.billingAddressStreet,
          billingAddressZip: input.billingAddressZip,
          billingAddressCity: input.billingAddressCity,
          homeCity: {
            pk: input.homeCityPk,
          },
          applyingForFreeOfCharge: input.applyingForFreeOfCharge,
          freeOfChargeReason: input.freeOfChargeReason,
        },
      } as ReservationUpdateMutationPayload,
    })
  );
});

const confirmReservation = graphql.mutation<
  { confirmReservation: ReservationConfirmMutationPayload },
  { input: ReservationConfirmMutationInput }
>("confirmReservation", (req, res, ctx) => {
  const { input } = req.variables;
  return res(
    ctx.data({
      confirmReservation: {
        pk: input.pk,
        state: ReservationsReservationStateChoices.Confirmed,
      },
    })
  );
});

const cancelReservation = graphql.mutation<
  { cancelReservation: ReservationCancellationMutationPayload },
  { input: ReservationCancellationMutationInput }
>("cancelReservation", (req, res, ctx) => {
  const { input } = req.variables;
  return res(
    ctx.data({
      cancelReservation: {
        pk: input.pk,
        cancelReasonPk: input.cancelReasonPk,
        cancelDetails: input.cancelDetails,
        state: "CANCELLED",
      } as ReservationCancellationMutationPayload,
    })
  );
});

const reservationCancelReasons = graphql.query<Query, null>(
  "getReservationCancelReasons",
  (req, res, ctx) => {
    return res(
      ctx.data({
        reservationCancelReasons: {
          edges: [
            {
              node: {
                reason: "Eka syy",
                reasonFi: "Eka syy",
                pk: 1,
                id: "UmVzZXJ2YXRpb25DYW5jZWxSZWFzb25UeXBlOjE=",
              },
            },
            {
              node: {
                reason: "Toka syy",
                reasonFi: "Toka syy",
                pk: 2,
                id: "UmVzZXJ2YXXpb25DYW5jZWxSZWFzb25UeXBlOjJ=",
              },
            },
          ],
        } as ReservationCancelReasonTypeConnection,
      })
    );
  }
);

const reservationPurposes = graphql.query<Query, QueryReservationPurposesArgs>(
  "ReservationPurposes",
  (req, res, ctx) => {
    return res(
      ctx.data({
        reservationPurposes: {
          edges: [
            {
              node: {
                pk: 1,
                nameFi: "Liikkua tai pelata FI",
                nameEn: "Liikkua tai pelata EN",
                nameSv: "Liikkua tai pelata SV",
              },
            },
            {
              node: {
                pk: 2,
                nameFi: "Lukupiiri FI",
                nameEn: "Lukupiiri EN",
                nameSv: "Lukupiiri SV",
              },
            },
            {
              node: {
                pk: 3,
                nameFi: "Opastus FI",
                nameEn: "Opastus EN",
                nameSv: "Opastus SV",
              },
            },
            {
              node: {
                pk: 4,
                nameFi: "Pitää kokous FI",
                nameEn: "Pitää kokous EN",
                nameSv: "Pitää kokous SV",
              },
            },
          ],
        } as ReservationPurposeTypeConnection,
      })
    );
  }
);

const ageGroups = graphql.query<Query, null>("AgeGroups", (req, res, ctx) => {
  return res(
    ctx.data({
      ageGroups: {
        edges: [
          {
            node: {
              pk: 1,
              minimum: 5,
              maximum: 8,
            },
          },
          {
            node: {
              pk: 2,
              minimum: 9,
              maximum: 12,
            },
          },
          {
            node: {
              pk: 3,
              minimum: 12,
              maximum: 16,
            },
          },
          {
            node: {
              pk: 4,
              minimum: 17,
              maximum: 20,
            },
          },
        ],
      } as AgeGroupTypeConnection,
    })
  );
});

const cities = graphql.query<Query, QueryCitiesArgs>(
  "getCities",
  (req, res, ctx) => {
    return res(
      ctx.data({
        cities: {
          edges: [
            {
              node: {
                pk: 1,
                name: "Helsinki",
              },
            },
          ],
        } as CityTypeConnection,
      })
    );
  }
);

const reservationByPk = graphql.query<Query, QueryReservationUnitByPkArgs>(
  "reservationByPk",
  (req, res, ctx) => {
    const { pk } = req.variables;
    const data = {
      pk,
      id: "UmVzZXJ2YXRpb246Mg==",
      name: "Reservation name",
      description: "Reservation description",
      reserveeFirstName: "First name",
      reserveeLastName: "Last name",
      reserveePhone: "+358 123 4567",
      begin: "2021-04-28T04:23:20+00:00",
      end: "2021-04-28T08:23:20+00:00",
      calendarUrl: `http://localhost:8000/v1/reservation_calendar/${pk}/?hash=12c580bc07340b05441feb8f261786a7ceabb5423a1966c7c13241f39916233c`,
      user: "user@gmail.com",
      state: ReservationsReservationStateChoices.Confirmed,
      bufferTimeBefore: 3600,
      bufferTimeAfter: 1800,
      price: 42.0,
      reservationUnits: [
        {
          id: "UmVzZXJ2YXRpb25Vbml0VHlwZTo5",
          pk: 9,
          nameFi: "Toimistohuone 1",
          nameEn: null,
          nameSv: null,
          termsOfUseFi: "Terms of use FI",
          termsOfUseEn: null,
          termsOfUseSv: null,
          additionalInstructionsFi: "Additional Instructions FI",
          additionalInstructionsEn: "Additional Instructions FI",
          additionalInstructionsSv: "Additional Instructions FI",
          serviceSpecificTerms: {
            textFi: "Service specific terms FI",
            textEn: null,
            textSv: null,
          },
          unit: {
            id: "VW5pdFR5cGU6NA==",
            nameFi: "Ympyrätalo",
            nameEn: null,
            nameSv: null,
            location: {
              addressStreetFi: "Jokukatu 5",
              addressStreetEn: null,
              addressStreetSv: null,
            },
          },
          cancellationRule: null,
          spaces: [
            {
              pk: 36,
              nameFi: "Toimistohuone 1",
              nameEn: null,
              nameSv: null,
            },
          ],
        },
      ],
    };

    if (pk === 21) {
      data.begin = addDays(new Date(), 10).toISOString();
      data.end = addHours(addDays(new Date(), 10), 2).toISOString();
      data.reservationUnits[0].cancellationRule = {
        canBeCancelled: 10,
        needsHandling: false,
      };
    }

    return res(
      ctx.data({
        reservationByPk: data as ReservationType,
      })
    );
  }
);

const reservationData = [
  {
    node: {
      id: "UmVzZXJ2YXRpb25UeXBlOjI=",
      pk: 2,
      name: "",
      begin: "2021-04-28T04:23:20+00:00",
      end: "2021-04-28T06:23:20+00:00",
      user: "user@gmail.com",
      state: ReservationsReservationStateChoices.Confirmed,
      bufferTimeBefore: 3600,
      bufferTimeAfter: 1800,
      reservationUnits: [
        {
          pk: 1,
          nameFi: "Studiohuone 1 + soittimet",
          nameEn: null,
          nameSv: null,
          termsOfUseFi:
            "Kirjaston varattavien tilojen yleiset käyttösäännöt:\r\n1. Varattu tila kalusteineen on vuokralaisen käytettävissä sopimuksessa määriteltynä aikana.\r\n2. Mahdollisten alkuvalmistelujen ja loppusiivouksen tulee sisältyä varattuun aikaan. Varaus laskutetaan täysiltä tunneilta.\r\n3. Peruuttamatta jääneet varaukset laskutetaan.\r\n4. Vuokraajan tulee olla täysi-ikäinen.\r\n5. Kirjastossa ei voi järjestää kursseja tai toistuvia tilaisuuksia, joista otetaan pääsy- tai osallistumismaksu (koskien myös materiaalikuluja). Yksittäisiä osallistujille maksullisia tapahtumia voi järjestää.\r\n6. Vuokrausajan päättyessä vuokraajan tulee jättää tila samaan kuntoon kuin se oli vuokrausajan alkaessa.\r\n7. Vuokraaja on korvausvelvollinen, mikäli tilan käyttäjät aiheuttavat vahinkoa kiinteistölle tai irtaimistolle. Vahingoista on ilmoitettava välittömästi kirjaston henkilökunnalle.\r\n8. Vuokrattavassa tilassa järjestettävä tilaisuus ei saa häiritä muuta kirjaston toimintaa, asiakkaita tai käyttäjiä.\r\n9. Vuokrattavassa tilassa järjestettävän tilaisuuden sisältö tai luonne ei voi olla ristiriidassa Suomen lain kanssa tai hyvän tavan vastainen.\r\n10. Kirjastolla on tarvittaessa ja harkintansa mukaan oikeus evätä vuokralaisen pääsy vuokrattavaan tilaan tai keskeyttää vuokrattavassa tilassa järjestettävä tilaisuus, mikäli ilmenee, että edellä mainittuja sääntöjä rikotaan tai on rikottu.",
          unit: {
            nameFi: "Helsingin keskustakirjasto Oodi",
            nameEn: null,
            nameSv: null,
          },
          cancellationRule: {
            canBeCancelledTimeBefore: 86400,
            needsHandling: false,
          },
          location: null,
          images: [],
        } as ReservationUnitType,
      ],
    },
  },
  {
    node: {
      id: "UmVzZXJ2YXRpb25UeXBlOjE=",
      pk: 1,
      name: "",
      begin: "2021-04-28T04:23:20+00:00",
      end: "2021-04-28T08:23:20+00:00",
      user: "user@gmail.com",
      state: ReservationsReservationStateChoices.Confirmed,
      bufferTimeBefore: 3600,
      bufferTimeAfter: 1800,
      reservationUnits: [
        {
          pk: 9,
          nameFi: "Toimistohuone 1",
          nameEn: null,
          nameSv: null,
          termsOfUseFi: "",
          unit: {
            nameFi: "Ympyrätalo",
            nameEn: null,
            nameSv: null,
          },
          cancellationRule: null,
          location: {
            addressStreetFi: "Jokukatu 5",
            addressStreetEn: null,
            addressStreetSv: null,
          },
          images: [],
        } as ReservationUnitType,
      ],
    },
  },
  {
    node: {
      id: "UmVzZXJ2YXRpb25UeXBlOjQ=",
      pk: 4,
      name: "Name",
      begin: addDays(new Date(), 1).toISOString(),
      end: addHours(addDays(new Date(), 1), 1).toISOString(),
      user: "user@gmail.com",
      state: ReservationsReservationStateChoices.Confirmed,
      bufferTimeBefore: 3600,
      bufferTimeAfter: 1800,
      price: 42.0,
      reservationUnits: [
        {
          pk: 2,
          nameFi: "Studiohuone 2 + soittimet",
          nameEn: null,
          nameSv: null,
          termsOfUseFi:
            "Kirjaston varattavien tilojen yleiset käyttösäännöt:\r\n1. Varattu tila kalusteineen on vuokralaisen käytettävissä sopimuksessa määriteltynä aikana.\r\n2. Mahdollisten alkuvalmistelujen ja loppusiivouksen tulee sisältyä varattuun aikaan. Varaus laskutetaan täysiltä tunneilta.\r\n3. Peruuttamatta jääneet varaukset laskutetaan.\r\n4. Vuokraajan tulee olla täysi-ikäinen.\r\n5. Kirjastossa ei voi järjestää kursseja tai toistuvia tilaisuuksia, joista otetaan pääsy- tai osallistumismaksu (koskien myös materiaalikuluja). Yksittäisiä osallistujille maksullisia tapahtumia voi järjestää.\r\n6. Vuokrausajan päättyessä vuokraajan tulee jättää tila samaan kuntoon kuin se oli vuokrausajan alkaessa.\r\n7. Vuokraaja on korvausvelvollinen, mikäli tilan käyttäjät aiheuttavat vahinkoa kiinteistölle tai irtaimistolle. Vahingoista on ilmoitettava välittömästi kirjaston henkilökunnalle.\r\n8. Vuokrattavassa tilassa järjestettävä tilaisuus ei saa häiritä muuta kirjaston toimintaa, asiakkaita tai käyttäjiä.\r\n9. Vuokrattavassa tilassa järjestettävän tilaisuuden sisältö tai luonne ei voi olla ristiriidassa Suomen lain kanssa tai hyvän tavan vastainen.\r\n10. Kirjastolla on tarvittaessa ja harkintansa mukaan oikeus evätä vuokralaisen pääsy vuokrattavaan tilaan tai keskeyttää vuokrattavassa tilassa järjestettävä tilaisuus, mikäli ilmenee, että edellä mainittuja sääntöjä rikotaan tai on rikottu.",
          unit: {
            nameFi: "Helsingin keskustakirjasto Oodi",
            nameEn: null,
            nameSv: null,
          },
          cancellationRule: {
            canBeCancelledTimeBefore: 86400,
            needsHandling: false,
          },
          location: null,
          images: [
            {
              imageUrl:
                "https://tvp-core-dev.agw.arodevtest.hel.fi/media/reservation_unit_images/Leikkipuisto_2_4SSB34h.jpg",
              mediumUrl:
                "https://tvp-core-dev.agw.arodevtest.hel.fi/media/reservation_unit_images/Leikkipuisto_2_4SSB34h.jpg.384x384_q85_crop.jpg",
              smallUrl:
                "https://tvp-core-dev.agw.arodevtest.hel.fi/media/reservation_unit_images/Leikkipuisto_2_4SSB34h.jpg.250x250_q85_crop.jpg",
              imageType: "OTHER",
            },
            {
              imageUrl:
                "https://tvp-core-dev.agw.arodevtest.hel.fi/media/reservation_unit_images/Musiikki_2.jpg",
              mediumUrl:
                "https://tvp-core-dev.agw.arodevtest.hel.fi/media/reservation_unit_images/Musiikki_2.jpg.384x384_q85_crop.jpg",
              smallUrl:
                "https://tvp-core-dev.agw.arodevtest.hel.fi/media/reservation_unit_images/Musiikki_2.jpg.250x250_q85_crop.jpg",
              imageType: "MAIN",
            },
          ],
        } as ReservationUnitType,
      ],
    },
  },
  {
    node: {
      id: "UmVzZXJ2YXRpb25UeXBlOjg=",
      pk: 8,
      name: "99",
      begin: "2021-11-27T15:00:00+00:00",
      end: "2021-11-27T16:00:00+00:00",
      user: "user@email.com",
      state: ReservationsReservationStateChoices.Created,
      bufferTimeBefore: 3600,
      bufferTimeAfter: 1800,
      reservationUnits: [
        {
          pk: 1,
          nameFi: "Studiohuone 1 + soittimet",
          nameEn: null,
          nameSv: null,
          termsOfUseFi:
            "Kirjaston varattavien tilojen yleiset käyttösäännöt:\r\n1. Varattu tila kalusteineen on vuokralaisen käytettävissä sopimuksessa määriteltynä aikana.\r\n2. Mahdollisten alkuvalmistelujen ja loppusiivouksen tulee sisältyä varattuun aikaan. Varaus laskutetaan täysiltä tunneilta.\r\n3. Peruuttamatta jääneet varaukset laskutetaan.\r\n4. Vuokraajan tulee olla täysi-ikäinen.\r\n5. Kirjastossa ei voi järjestää kursseja tai toistuvia tilaisuuksia, joista otetaan pääsy- tai osallistumismaksu (koskien myös materiaalikuluja). Yksittäisiä osallistujille maksullisia tapahtumia voi järjestää.\r\n6. Vuokrausajan päättyessä vuokraajan tulee jättää tila samaan kuntoon kuin se oli vuokrausajan alkaessa.\r\n7. Vuokraaja on korvausvelvollinen, mikäli tilan käyttäjät aiheuttavat vahinkoa kiinteistölle tai irtaimistolle. Vahingoista on ilmoitettava välittömästi kirjaston henkilökunnalle.\r\n8. Vuokrattavassa tilassa järjestettävä tilaisuus ei saa häiritä muuta kirjaston toimintaa, asiakkaita tai käyttäjiä.\r\n9. Vuokrattavassa tilassa järjestettävän tilaisuuden sisältö tai luonne ei voi olla ristiriidassa Suomen lain kanssa tai hyvän tavan vastainen.\r\n10. Kirjastolla on tarvittaessa ja harkintansa mukaan oikeus evätä vuokralaisen pääsy vuokrattavaan tilaan tai keskeyttää vuokrattavassa tilassa järjestettävä tilaisuus, mikäli ilmenee, että edellä mainittuja sääntöjä rikotaan tai on rikottu.",
          unit: {
            nameFi: "Helsingin keskustakirjasto Oodi",
            nameEn: null,
            nameSv: null,
          },
          cancellationRule: {
            canBeCancelledTimeBefore: 86400,
            needsHandling: false,
          },
          location: null,
          images: [],
        } as ReservationUnitType,
      ],
    },
  },
  {
    node: {
      id: "UmVzZXJ2YXRpb25UeXBlOjEx",
      pk: 11,
      name: "",
      begin: addDays(new Date(), 5).toISOString(),
      end: addHours(addDays(new Date(), 5), 2).toISOString(),
      user: "user@email.com",
      state: ReservationsReservationStateChoices.Confirmed,
      bufferTimeBefore: 3600,
      bufferTimeAfter: 1800,
      reservationUnits: [
        {
          pk: 4,
          nameFi: "Studiohuone 4 + soittimet",
          nameEn: null,
          nameSv: null,
          termsOfUseFi:
            "Kirjaston varattavien tilojen yleiset käyttösäännöt:\r\n1. Varattu tila kalusteineen on vuokralaisen käytettävissä sopimuksessa määriteltynä aikana.\r\n2. Mahdollisten alkuvalmistelujen ja loppusiivouksen tulee sisältyä varattuun aikaan. Varaus laskutetaan täysiltä tunneilta.\r\n3. Peruuttamatta jääneet varaukset laskutetaan.\r\n4. Vuokraajan tulee olla täysi-ikäinen.\r\n5. Kirjastossa ei voi järjestää kursseja tai toistuvia tilaisuuksia, joista otetaan pääsy- tai osallistumismaksu (koskien myös materiaalikuluja). Yksittäisiä osallistujille maksullisia tapahtumia voi järjestää.\r\n6. Vuokrausajan päättyessä vuokraajan tulee jättää tila samaan kuntoon kuin se oli vuokrausajan alkaessa.\r\n7. Vuokraaja on korvausvelvollinen, mikäli tilan käyttäjät aiheuttavat vahinkoa kiinteistölle tai irtaimistolle. Vahingoista on ilmoitettava välittömästi kirjaston henkilökunnalle.\r\n8. Vuokrattavassa tilassa järjestettävä tilaisuus ei saa häiritä muuta kirjaston toimintaa, asiakkaita tai käyttäjiä.\r\n9. Vuokrattavassa tilassa järjestettävän tilaisuuden sisältö tai luonne ei voi olla ristiriidassa Suomen lain kanssa tai hyvän tavan vastainen.\r\n10. Kirjastolla on tarvittaessa ja harkintansa mukaan oikeus evätä vuokralaisen pääsy vuokrattavaan tilaan tai keskeyttää vuokrattavassa tilassa järjestettävä tilaisuus, mikäli ilmenee, että edellä mainittuja sääntöjä rikotaan tai on rikottu.",
          unit: {
            nameFi: "Helsingin keskustakirjasto Oodi",
            nameEn: null,
            nameSv: null,
          },
          cancellationRule: {
            canBeCancelledTimeBefore: 86400,
            needsHandling: true,
          },
          location: null,
          images: [],
        } as ReservationUnitType,
      ],
    },
  },
  {
    node: {
      id: "UmVzZXJ2YXRpb25UeXBlOjU=",
      pk: 5,
      name: "44",
      begin: "2021-11-28T08:00:00+00:00",
      end: "2021-11-28T09:00:00+00:00",
      user: "user@gmail.com",
      state: ReservationsReservationStateChoices.Created,
      bufferTimeBefore: 3600,
      bufferTimeAfter: 1800,
      reservationUnits: [
        {
          pk: 1,
          nameFi: "Studiohuone 1 + soittimet",
          nameEn: null,
          nameSv: null,
          termsOfUseFi:
            "Kirjaston varattavien tilojen yleiset käyttösäännöt:\r\n1. Varattu tila kalusteineen on vuokralaisen käytettävissä sopimuksessa määriteltynä aikana.\r\n2. Mahdollisten alkuvalmistelujen ja loppusiivouksen tulee sisältyä varattuun aikaan. Varaus laskutetaan täysiltä tunneilta.\r\n3. Peruuttamatta jääneet varaukset laskutetaan.\r\n4. Vuokraajan tulee olla täysi-ikäinen.\r\n5. Kirjastossa ei voi järjestää kursseja tai toistuvia tilaisuuksia, joista otetaan pääsy- tai osallistumismaksu (koskien myös materiaalikuluja). Yksittäisiä osallistujille maksullisia tapahtumia voi järjestää.\r\n6. Vuokrausajan päättyessä vuokraajan tulee jättää tila samaan kuntoon kuin se oli vuokrausajan alkaessa.\r\n7. Vuokraaja on korvausvelvollinen, mikäli tilan käyttäjät aiheuttavat vahinkoa kiinteistölle tai irtaimistolle. Vahingoista on ilmoitettava välittömästi kirjaston henkilökunnalle.\r\n8. Vuokrattavassa tilassa järjestettävä tilaisuus ei saa häiritä muuta kirjaston toimintaa, asiakkaita tai käyttäjiä.\r\n9. Vuokrattavassa tilassa järjestettävän tilaisuuden sisältö tai luonne ei voi olla ristiriidassa Suomen lain kanssa tai hyvän tavan vastainen.\r\n10. Kirjastolla on tarvittaessa ja harkintansa mukaan oikeus evätä vuokralaisen pääsy vuokrattavaan tilaan tai keskeyttää vuokrattavassa tilassa järjestettävä tilaisuus, mikäli ilmenee, että edellä mainittuja sääntöjä rikotaan tai on rikottu.",
          unit: {
            nameFi: "Helsingin keskustakirjasto Oodi",
            nameEn: null,
            nameSv: null,
          },
          cancellationRule: {
            canBeCancelledTimeBefore: 86400,
            needsHandling: false,
          },
          location: null,
          images: [],
        } as ReservationUnitType,
      ],
    },
  },
  {
    node: {
      id: "UmVzZXJ2YXRpb25UeXBlOjY=",
      pk: 6,
      name: "nee",
      begin: "2021-11-28T09:00:00+00:00",
      end: "2021-11-28T10:00:00+00:00",
      user: "user@email.com",
      state: ReservationsReservationStateChoices.Created,
      bufferTimeBefore: 3600,
      bufferTimeAfter: 1800,
      reservationUnits: [
        {
          pk: 1,
          nameFi: "Studiohuone 1 + soittimet",
          nameEn: null,
          nameSv: null,
          termsOfUseFi:
            "Kirjaston varattavien tilojen yleiset käyttösäännöt:\r\n1. Varattu tila kalusteineen on vuokralaisen käytettävissä sopimuksessa määriteltynä aikana.\r\n2. Mahdollisten alkuvalmistelujen ja loppusiivouksen tulee sisältyä varattuun aikaan. Varaus laskutetaan täysiltä tunneilta.\r\n3. Peruuttamatta jääneet varaukset laskutetaan.\r\n4. Vuokraajan tulee olla täysi-ikäinen.\r\n5. Kirjastossa ei voi järjestää kursseja tai toistuvia tilaisuuksia, joista otetaan pääsy- tai osallistumismaksu (koskien myös materiaalikuluja). Yksittäisiä osallistujille maksullisia tapahtumia voi järjestää.\r\n6. Vuokrausajan päättyessä vuokraajan tulee jättää tila samaan kuntoon kuin se oli vuokrausajan alkaessa.\r\n7. Vuokraaja on korvausvelvollinen, mikäli tilan käyttäjät aiheuttavat vahinkoa kiinteistölle tai irtaimistolle. Vahingoista on ilmoitettava välittömästi kirjaston henkilökunnalle.\r\n8. Vuokrattavassa tilassa järjestettävä tilaisuus ei saa häiritä muuta kirjaston toimintaa, asiakkaita tai käyttäjiä.\r\n9. Vuokrattavassa tilassa järjestettävän tilaisuuden sisältö tai luonne ei voi olla ristiriidassa Suomen lain kanssa tai hyvän tavan vastainen.\r\n10. Kirjastolla on tarvittaessa ja harkintansa mukaan oikeus evätä vuokralaisen pääsy vuokrattavaan tilaan tai keskeyttää vuokrattavassa tilassa järjestettävä tilaisuus, mikäli ilmenee, että edellä mainittuja sääntöjä rikotaan tai on rikottu.",
          unit: {
            nameFi: "Helsingin keskustakirjasto Oodi",
            nameEn: null,
            nameSv: null,
          },
          cancellationRule: {
            canBeCancelledTimeBefore: 86400,
            needsHandling: false,
          },
          location: null,
          images: [],
        } as ReservationUnitType,
      ],
    },
  },
  {
    node: {
      id: "UmVzZXJ2YXRpb25UeXBlOjk=",
      pk: 9,
      name: "",
      begin: "2021-11-28T11:00:00+00:00",
      end: "2021-11-28T12:00:00+00:00",
      user: "user@email.com",
      state: ReservationsReservationStateChoices.Created,
      bufferTimeBefore: 3600,
      bufferTimeAfter: 1800,
      reservationUnits: [
        {
          pk: 1,
          nameFi: "Studiohuone 1 + soittimet",
          nameEn: null,
          nameSv: null,
          termsOfUseFi:
            "Kirjaston varattavien tilojen yleiset käyttösäännöt:\r\n1. Varattu tila kalusteineen on vuokralaisen käytettävissä sopimuksessa määriteltynä aikana.\r\n2. Mahdollisten alkuvalmistelujen ja loppusiivouksen tulee sisältyä varattuun aikaan. Varaus laskutetaan täysiltä tunneilta.\r\n3. Peruuttamatta jääneet varaukset laskutetaan.\r\n4. Vuokraajan tulee olla täysi-ikäinen.\r\n5. Kirjastossa ei voi järjestää kursseja tai toistuvia tilaisuuksia, joista otetaan pääsy- tai osallistumismaksu (koskien myös materiaalikuluja). Yksittäisiä osallistujille maksullisia tapahtumia voi järjestää.\r\n6. Vuokrausajan päättyessä vuokraajan tulee jättää tila samaan kuntoon kuin se oli vuokrausajan alkaessa.\r\n7. Vuokraaja on korvausvelvollinen, mikäli tilan käyttäjät aiheuttavat vahinkoa kiinteistölle tai irtaimistolle. Vahingoista on ilmoitettava välittömästi kirjaston henkilökunnalle.\r\n8. Vuokrattavassa tilassa järjestettävä tilaisuus ei saa häiritä muuta kirjaston toimintaa, asiakkaita tai käyttäjiä.\r\n9. Vuokrattavassa tilassa järjestettävän tilaisuuden sisältö tai luonne ei voi olla ristiriidassa Suomen lain kanssa tai hyvän tavan vastainen.\r\n10. Kirjastolla on tarvittaessa ja harkintansa mukaan oikeus evätä vuokralaisen pääsy vuokrattavaan tilaan tai keskeyttää vuokrattavassa tilassa järjestettävä tilaisuus, mikäli ilmenee, että edellä mainittuja sääntöjä rikotaan tai on rikottu.",
          unit: {
            nameFi: "Helsingin keskustakirjasto Oodi",
            nameEn: null,
            nameSv: null,
          },
          cancellationRule: {
            canBeCancelledTimeBefore: 86400,
            needsHandling: false,
          },
          location: null,
          images: [],
        } as ReservationUnitType,
      ],
    },
  },
  {
    node: {
      id: "UmVzZXJ2YXRpb25UeXBlOjc=",
      pk: 7,
      name: "66",
      begin: "2021-11-28T13:45:00+00:00",
      end: "2021-11-28T15:15:00+00:00",
      user: "user@email.com",
      state: ReservationsReservationStateChoices.Created,
      bufferTimeBefore: 3600,
      bufferTimeAfter: 1800,
      reservationUnits: [
        {
          pk: 1,
          nameFi: "Studiohuone 1 + soittimet",
          nameEn: null,
          nameSv: null,
          termsOfUseFi:
            "Kirjaston varattavien tilojen yleiset käyttösäännöt:\r\n1. Varattu tila kalusteineen on vuokralaisen käytettävissä sopimuksessa määriteltynä aikana.\r\n2. Mahdollisten alkuvalmistelujen ja loppusiivouksen tulee sisältyä varattuun aikaan. Varaus laskutetaan täysiltä tunneilta.\r\n3. Peruuttamatta jääneet varaukset laskutetaan.\r\n4. Vuokraajan tulee olla täysi-ikäinen.\r\n5. Kirjastossa ei voi järjestää kursseja tai toistuvia tilaisuuksia, joista otetaan pääsy- tai osallistumismaksu (koskien myös materiaalikuluja). Yksittäisiä osallistujille maksullisia tapahtumia voi järjestää.\r\n6. Vuokrausajan päättyessä vuokraajan tulee jättää tila samaan kuntoon kuin se oli vuokrausajan alkaessa.\r\n7. Vuokraaja on korvausvelvollinen, mikäli tilan käyttäjät aiheuttavat vahinkoa kiinteistölle tai irtaimistolle. Vahingoista on ilmoitettava välittömästi kirjaston henkilökunnalle.\r\n8. Vuokrattavassa tilassa järjestettävä tilaisuus ei saa häiritä muuta kirjaston toimintaa, asiakkaita tai käyttäjiä.\r\n9. Vuokrattavassa tilassa järjestettävän tilaisuuden sisältö tai luonne ei voi olla ristiriidassa Suomen lain kanssa tai hyvän tavan vastainen.\r\n10. Kirjastolla on tarvittaessa ja harkintansa mukaan oikeus evätä vuokralaisen pääsy vuokrattavaan tilaan tai keskeyttää vuokrattavassa tilassa järjestettävä tilaisuus, mikäli ilmenee, että edellä mainittuja sääntöjä rikotaan tai on rikottu.",
          unit: {
            nameFi: "Helsingin keskustakirjasto Oodi",
            nameEn: null,
            nameSv: null,
          },
          cancellationRule: {
            canBeCancelledTimeBefore: 86400,
            needsHandling: false,
          },
          location: null,
          images: [],
        } as ReservationUnitType,
      ],
    },
  },
  {
    node: {
      id: "UmVzZXJ2YXRpb25UeXBlOjEw",
      pk: 10,
      name: "",
      begin: "2021-11-28T17:00:00+00:00",
      end: "2021-11-28T18:15:00+00:00",
      user: "user@email.com",
      state: ReservationsReservationStateChoices.Created,
      bufferTimeBefore: 3600,
      bufferTimeAfter: 1800,
      reservationUnits: [
        {
          pk: 1,
          nameFi: "Studiohuone 1 + soittimet",
          nameEn: null,
          nameSv: null,
          termsOfUseFi:
            "Kirjaston varattavien tilojen yleiset käyttösäännöt:\r\n1. Varattu tila kalusteineen on vuokralaisen käytettävissä sopimuksessa määriteltynä aikana.\r\n2. Mahdollisten alkuvalmistelujen ja loppusiivouksen tulee sisältyä varattuun aikaan. Varaus laskutetaan täysiltä tunneilta.\r\n3. Peruuttamatta jääneet varaukset laskutetaan.\r\n4. Vuokraajan tulee olla täysi-ikäinen.\r\n5. Kirjastossa ei voi järjestää kursseja tai toistuvia tilaisuuksia, joista otetaan pääsy- tai osallistumismaksu (koskien myös materiaalikuluja). Yksittäisiä osallistujille maksullisia tapahtumia voi järjestää.\r\n6. Vuokrausajan päättyessä vuokraajan tulee jättää tila samaan kuntoon kuin se oli vuokrausajan alkaessa.\r\n7. Vuokraaja on korvausvelvollinen, mikäli tilan käyttäjät aiheuttavat vahinkoa kiinteistölle tai irtaimistolle. Vahingoista on ilmoitettava välittömästi kirjaston henkilökunnalle.\r\n8. Vuokrattavassa tilassa järjestettävä tilaisuus ei saa häiritä muuta kirjaston toimintaa, asiakkaita tai käyttäjiä.\r\n9. Vuokrattavassa tilassa järjestettävän tilaisuuden sisältö tai luonne ei voi olla ristiriidassa Suomen lain kanssa tai hyvän tavan vastainen.\r\n10. Kirjastolla on tarvittaessa ja harkintansa mukaan oikeus evätä vuokralaisen pääsy vuokrattavaan tilaan tai keskeyttää vuokrattavassa tilassa järjestettävä tilaisuus, mikäli ilmenee, että edellä mainittuja sääntöjä rikotaan tai on rikottu.",
          unit: {
            nameFi: "Helsingin keskustakirjasto Oodi",
            nameEn: null,
            nameSv: null,
          },
          cancellationRule: {
            canBeCancelledTimeBefore: 86400,
            needsHandling: false,
          },
          location: null,
          images: [],
        } as ReservationUnitType,
      ],
    },
  },
  {
    node: {
      id: "UmVzZXJ2YXRpb25UeXBlOjM=",
      pk: 3,
      name: "",
      begin: "2021-12-01T01:00:00+00:00",
      end: "2021-12-01T02:00:00+00:00",
      user: "user@gmail.com",
      state: "CANCELLED",
      bufferTimeBefore: 3600,
      bufferTimeAfter: 1800,
      reservationUnits: [
        {
          pk: 3,
          nameFi: "Mika Waltarin sali, kolmasosa",
          nameEn: null,
          nameSv: null,
          termsOfUseFi:
            "Kirjaston varattavien tilojen yleiset käyttösäännöt:\r\n1. Varattu tila kalusteineen on vuokralaisen käytettävissä sopimuksessa määriteltynä aikana.\r\n2. Mahdollisten alkuvalmistelujen ja loppusiivouksen tulee sisältyä varattuun aikaan. Varaus laskutetaan täysiltä tunneilta.\r\n3. Peruuttamatta jääneet varaukset laskutetaan.\r\n4. Vuokraajan tulee olla täysi-ikäinen.\r\n5. Kirjastossa ei voi järjestää kursseja tai toistuvia tilaisuuksia, joista otetaan pääsy- tai osallistumismaksu (koskien myös materiaalikuluja). Yksittäisiä osallistujille maksullisia tapahtumia voi järjestää.\r\n6. Vuokrausajan päättyessä vuokraajan tulee jättää tila samaan kuntoon kuin se oli vuokrausajan alkaessa.\r\n7. Vuokraaja on korvausvelvollinen, mikäli tilan käyttäjät aiheuttavat vahinkoa kiinteistölle tai irtaimistolle. Vahingoista on ilmoitettava välittömästi kirjaston henkilökunnalle.\r\n8. Vuokrattavassa tilassa järjestettävä tilaisuus ei saa häiritä muuta kirjaston toimintaa, asiakkaita tai käyttäjiä.\r\n9. Vuokrattavassa tilassa järjestettävän tilaisuuden sisältö tai luonne ei voi olla ristiriidassa Suomen lain kanssa tai hyvän tavan vastainen.\r\n10. Kirjastolla on tarvittaessa ja harkintansa mukaan oikeus evätä vuokralaisen pääsy vuokrattavaan tilaan tai keskeyttää vuokrattavassa tilassa järjestettävä tilaisuus, mikäli ilmenee, että edellä mainittuja sääntöjä rikotaan tai on rikottu.",
          unit: {
            nameFi: "Töölön kirjasto",
            nameEn: null,
            nameSv: null,
          },
          cancellationRule: null,
          location: null,
          images: [],
        } as ReservationUnitType,
      ],
    },
  },
  {
    node: {
      id: "UmVzZXJ2YXRpb25UeXBlOjE0",
      pk: 14,
      name: "",
      begin: addDays(new Date(), 10).toISOString(),
      end: addHours(addDays(new Date(), 10), 2).toISOString(),
      user: "user@email.com",
      state: ReservationsReservationStateChoices.Confirmed,
      bufferTimeBefore: 3600,
      bufferTimeAfter: 1800,
      reservationUnits: [
        {
          pk: 11,
          nameFi: "Studiohuone 111 + soittimet",
          nameEn: null,
          nameSv: null,
          termsOfUseFi:
            "Kirjaston varattavien tilojen yleiset käyttösäännöt:\r\n1. Varattu tila kalusteineen on vuokralaisen käytettävissä sopimuksessa määriteltynä aikana.\r\n2. Mahdollisten alkuvalmistelujen ja loppusiivouksen tulee sisältyä varattuun aikaan. Varaus laskutetaan täysiltä tunneilta.\r\n3. Peruuttamatta jääneet varaukset laskutetaan.\r\n4. Vuokraajan tulee olla täysi-ikäinen.\r\n5. Kirjastossa ei voi järjestää kursseja tai toistuvia tilaisuuksia, joista otetaan pääsy- tai osallistumismaksu (koskien myös materiaalikuluja). Yksittäisiä osallistujille maksullisia tapahtumia voi järjestää.\r\n6. Vuokrausajan päättyessä vuokraajan tulee jättää tila samaan kuntoon kuin se oli vuokrausajan alkaessa.\r\n7. Vuokraaja on korvausvelvollinen, mikäli tilan käyttäjät aiheuttavat vahinkoa kiinteistölle tai irtaimistolle. Vahingoista on ilmoitettava välittömästi kirjaston henkilökunnalle.\r\n8. Vuokrattavassa tilassa järjestettävä tilaisuus ei saa häiritä muuta kirjaston toimintaa, asiakkaita tai käyttäjiä.\r\n9. Vuokrattavassa tilassa järjestettävän tilaisuuden sisältö tai luonne ei voi olla ristiriidassa Suomen lain kanssa tai hyvän tavan vastainen.\r\n10. Kirjastolla on tarvittaessa ja harkintansa mukaan oikeus evätä vuokralaisen pääsy vuokrattavaan tilaan tai keskeyttää vuokrattavassa tilassa järjestettävä tilaisuus, mikäli ilmenee, että edellä mainittuja sääntöjä rikotaan tai on rikottu.",
          unit: {
            nameFi: "Helsingin keskustakirjasto Oodi",
            nameEn: null,
            nameSv: null,
          },
          cancellationRule: null,
          location: null,
          images: [],
        } as ReservationUnitType,
      ],
    },
  },
  {
    node: {
      id: "UmVzZX43tfgrb25UeXBlOjE2",
      pk: 124,
      name: "",
      begin: addDays(new Date(), 40).toISOString(),
      end: addHours(addDays(new Date(), 40), 2).toISOString(),
      user: "user@email.com",
      state: ReservationsReservationStateChoices.RequiresHandling,
      bufferTimeBefore: 3600,
      bufferTimeAfter: 1800,
      reservationUnits: [
        {
          pk: 11,
          nameFi: "Studiohuone 11 + soittimet",
          nameEn: null,
          nameSv: null,
          termsOfUseFi:
            "Kirjaston varattavien tilojen yleiset käyttösäännöt:\r\n1. Varattu tila kalusteineen on vuokralaisen käytettävissä sopimuksessa määriteltynä aikana.\r\n2. Mahdollisten alkuvalmistelujen ja loppusiivouksen tulee sisältyä varattuun aikaan. Varaus laskutetaan täysiltä tunneilta.\r\n3. Peruuttamatta jääneet varaukset laskutetaan.\r\n4. Vuokraajan tulee olla täysi-ikäinen.\r\n5. Kirjastossa ei voi järjestää kursseja tai toistuvia tilaisuuksia, joista otetaan pääsy- tai osallistumismaksu (koskien myös materiaalikuluja). Yksittäisiä osallistujille maksullisia tapahtumia voi järjestää.\r\n6. Vuokrausajan päättyessä vuokraajan tulee jättää tila samaan kuntoon kuin se oli vuokrausajan alkaessa.\r\n7. Vuokraaja on korvausvelvollinen, mikäli tilan käyttäjät aiheuttavat vahinkoa kiinteistölle tai irtaimistolle. Vahingoista on ilmoitettava välittömästi kirjaston henkilökunnalle.\r\n8. Vuokrattavassa tilassa järjestettävä tilaisuus ei saa häiritä muuta kirjaston toimintaa, asiakkaita tai käyttäjiä.\r\n9. Vuokrattavassa tilassa järjestettävän tilaisuuden sisältö tai luonne ei voi olla ristiriidassa Suomen lain kanssa tai hyvän tavan vastainen.\r\n10. Kirjastolla on tarvittaessa ja harkintansa mukaan oikeus evätä vuokralaisen pääsy vuokrattavaan tilaan tai keskeyttää vuokrattavassa tilassa järjestettävä tilaisuus, mikäli ilmenee, että edellä mainittuja sääntöjä rikotaan tai on rikottu.",
          unit: {
            nameFi: "Helsingin keskustakirjasto Oodi",
            nameEn: null,
            nameSv: null,
          },
          cancellationRule: null,
          location: null,
          images: [],
        } as ReservationUnitType,
      ],
    },
  },
  {
    node: {
      id: "UmVzZXJ2YXRpb25UeXBlOjE1",
      pk: 15,
      name: "",
      begin: "2021-12-04T13:00:00+00:00",
      end: "2021-12-04T14:00:00+00:00",
      user: "user@email.com",
      state: ReservationsReservationStateChoices.Created,
      bufferTimeBefore: 3600,
      bufferTimeAfter: 1800,
      reservationUnits: [
        {
          pk: 1,
          nameFi: "Studiohuone 1 + soittimet",
          nameEn: null,
          nameSv: null,
          termsOfUseFi:
            "Kirjaston varattavien tilojen yleiset käyttösäännöt:\r\n1. Varattu tila kalusteineen on vuokralaisen käytettävissä sopimuksessa määriteltynä aikana.\r\n2. Mahdollisten alkuvalmistelujen ja loppusiivouksen tulee sisältyä varattuun aikaan. Varaus laskutetaan täysiltä tunneilta.\r\n3. Peruuttamatta jääneet varaukset laskutetaan.\r\n4. Vuokraajan tulee olla täysi-ikäinen.\r\n5. Kirjastossa ei voi järjestää kursseja tai toistuvia tilaisuuksia, joista otetaan pääsy- tai osallistumismaksu (koskien myös materiaalikuluja). Yksittäisiä osallistujille maksullisia tapahtumia voi järjestää.\r\n6. Vuokrausajan päättyessä vuokraajan tulee jättää tila samaan kuntoon kuin se oli vuokrausajan alkaessa.\r\n7. Vuokraaja on korvausvelvollinen, mikäli tilan käyttäjät aiheuttavat vahinkoa kiinteistölle tai irtaimistolle. Vahingoista on ilmoitettava välittömästi kirjaston henkilökunnalle.\r\n8. Vuokrattavassa tilassa järjestettävä tilaisuus ei saa häiritä muuta kirjaston toimintaa, asiakkaita tai käyttäjiä.\r\n9. Vuokrattavassa tilassa järjestettävän tilaisuuden sisältö tai luonne ei voi olla ristiriidassa Suomen lain kanssa tai hyvän tavan vastainen.\r\n10. Kirjastolla on tarvittaessa ja harkintansa mukaan oikeus evätä vuokralaisen pääsy vuokrattavaan tilaan tai keskeyttää vuokrattavassa tilassa järjestettävä tilaisuus, mikäli ilmenee, että edellä mainittuja sääntöjä rikotaan tai on rikottu.",
          unit: {
            nameFi: "Helsingin keskustakirjasto Oodi",
            nameEn: null,
            nameSv: null,
          },
          cancellationRule: {
            canBeCancelledTimeBefore: 86400,
            needsHandling: false,
          },
          location: null,
          images: [],
        } as ReservationUnitType,
      ],
    },
  },
  {
    node: {
      id: "UmVzZXJ2YXRpb25UeXBlOjIw",
      pk: 20,
      name: "opkop",
      begin: "2021-12-04T15:00:00+00:00",
      end: "2021-12-04T16:15:00+00:00",
      user: "user@email.com",
      state: ReservationsReservationStateChoices.Created,
      bufferTimeBefore: 3600,
      bufferTimeAfter: 1800,
      reservationUnits: [
        {
          pk: 1,
          nameFi: "Studiohuone 1 + soittimet",
          nameEn: null,
          nameSv: null,
          termsOfUseFi:
            "Kirjaston varattavien tilojen yleiset käyttösäännöt:\r\n1. Varattu tila kalusteineen on vuokralaisen käytettävissä sopimuksessa määriteltynä aikana.\r\n2. Mahdollisten alkuvalmistelujen ja loppusiivouksen tulee sisältyä varattuun aikaan. Varaus laskutetaan täysiltä tunneilta.\r\n3. Peruuttamatta jääneet varaukset laskutetaan.\r\n4. Vuokraajan tulee olla täysi-ikäinen.\r\n5. Kirjastossa ei voi järjestää kursseja tai toistuvia tilaisuuksia, joista otetaan pääsy- tai osallistumismaksu (koskien myös materiaalikuluja). Yksittäisiä osallistujille maksullisia tapahtumia voi järjestää.\r\n6. Vuokrausajan päättyessä vuokraajan tulee jättää tila samaan kuntoon kuin se oli vuokrausajan alkaessa.\r\n7. Vuokraaja on korvausvelvollinen, mikäli tilan käyttäjät aiheuttavat vahinkoa kiinteistölle tai irtaimistolle. Vahingoista on ilmoitettava välittömästi kirjaston henkilökunnalle.\r\n8. Vuokrattavassa tilassa järjestettävä tilaisuus ei saa häiritä muuta kirjaston toimintaa, asiakkaita tai käyttäjiä.\r\n9. Vuokrattavassa tilassa järjestettävän tilaisuuden sisältö tai luonne ei voi olla ristiriidassa Suomen lain kanssa tai hyvän tavan vastainen.\r\n10. Kirjastolla on tarvittaessa ja harkintansa mukaan oikeus evätä vuokralaisen pääsy vuokrattavaan tilaan tai keskeyttää vuokrattavassa tilassa järjestettävä tilaisuus, mikäli ilmenee, että edellä mainittuja sääntöjä rikotaan tai on rikottu.",
          unit: {
            nameFi: "Helsingin keskustakirjasto Oodi",
            nameEn: null,
            nameSv: null,
          },
          cancellationRule: {
            canBeCancelledTimeBefore: 86400,
            needsHandling: false,
          },
          location: null,
          images: [],
        } as ReservationUnitType,
      ],
    },
  },
  {
    node: {
      id: "UmVzZXJ2YXRpb25UeXBlOjE3",
      pk: 17,
      name: "jimi",
      begin: "2021-12-04T17:00:00+00:00",
      end: "2021-12-04T18:00:00+00:00",
      user: "user@email.com",
      state: ReservationsReservationStateChoices.Created,
      bufferTimeBefore: 3600,
      bufferTimeAfter: 1800,
      reservationUnits: [
        {
          pk: 1,
          nameFi: "Studiohuone 1 + soittimet",
          nameEn: null,
          nameSv: null,
          termsOfUseFi:
            "Kirjaston varattavien tilojen yleiset käyttösäännöt:\r\n1. Varattu tila kalusteineen on vuokralaisen käytettävissä sopimuksessa määriteltynä aikana.\r\n2. Mahdollisten alkuvalmistelujen ja loppusiivouksen tulee sisältyä varattuun aikaan. Varaus laskutetaan täysiltä tunneilta.\r\n3. Peruuttamatta jääneet varaukset laskutetaan.\r\n4. Vuokraajan tulee olla täysi-ikäinen.\r\n5. Kirjastossa ei voi järjestää kursseja tai toistuvia tilaisuuksia, joista otetaan pääsy- tai osallistumismaksu (koskien myös materiaalikuluja). Yksittäisiä osallistujille maksullisia tapahtumia voi järjestää.\r\n6. Vuokrausajan päättyessä vuokraajan tulee jättää tila samaan kuntoon kuin se oli vuokrausajan alkaessa.\r\n7. Vuokraaja on korvausvelvollinen, mikäli tilan käyttäjät aiheuttavat vahinkoa kiinteistölle tai irtaimistolle. Vahingoista on ilmoitettava välittömästi kirjaston henkilökunnalle.\r\n8. Vuokrattavassa tilassa järjestettävä tilaisuus ei saa häiritä muuta kirjaston toimintaa, asiakkaita tai käyttäjiä.\r\n9. Vuokrattavassa tilassa järjestettävän tilaisuuden sisältö tai luonne ei voi olla ristiriidassa Suomen lain kanssa tai hyvän tavan vastainen.\r\n10. Kirjastolla on tarvittaessa ja harkintansa mukaan oikeus evätä vuokralaisen pääsy vuokrattavaan tilaan tai keskeyttää vuokrattavassa tilassa järjestettävä tilaisuus, mikäli ilmenee, että edellä mainittuja sääntöjä rikotaan tai on rikottu.",
          unit: {
            nameFi: "Helsingin keskustakirjasto Oodi",
            nameEn: null,
            nameSv: null,
          },
          cancellationRule: {
            canBeCancelledTimeBefore: 86400,
            needsHandling: false,
          },
          location: null,
          images: [],
        } as ReservationUnitType,
      ],
    },
  },
  {
    node: {
      id: "UmVzZXJ2YXRpb25UeXBlOjE2",
      pk: 16,
      name: "",
      begin: "2021-12-04T18:00:00+00:00",
      end: "2021-12-04T19:00:00+00:00",
      user: "user@email.com",
      state: ReservationsReservationStateChoices.Created,
      bufferTimeBefore: 3600,
      bufferTimeAfter: 1800,
      reservationUnits: [
        {
          pk: 1,
          nameFi: "Studiohuone 1 + soittimet",
          nameEn: null,
          nameSv: null,
          termsOfUseFi:
            "Kirjaston varattavien tilojen yleiset käyttösäännöt:\r\n1. Varattu tila kalusteineen on vuokralaisen käytettävissä sopimuksessa määriteltynä aikana.\r\n2. Mahdollisten alkuvalmistelujen ja loppusiivouksen tulee sisältyä varattuun aikaan. Varaus laskutetaan täysiltä tunneilta.\r\n3. Peruuttamatta jääneet varaukset laskutetaan.\r\n4. Vuokraajan tulee olla täysi-ikäinen.\r\n5. Kirjastossa ei voi järjestää kursseja tai toistuvia tilaisuuksia, joista otetaan pääsy- tai osallistumismaksu (koskien myös materiaalikuluja). Yksittäisiä osallistujille maksullisia tapahtumia voi järjestää.\r\n6. Vuokrausajan päättyessä vuokraajan tulee jättää tila samaan kuntoon kuin se oli vuokrausajan alkaessa.\r\n7. Vuokraaja on korvausvelvollinen, mikäli tilan käyttäjät aiheuttavat vahinkoa kiinteistölle tai irtaimistolle. Vahingoista on ilmoitettava välittömästi kirjaston henkilökunnalle.\r\n8. Vuokrattavassa tilassa järjestettävä tilaisuus ei saa häiritä muuta kirjaston toimintaa, asiakkaita tai käyttäjiä.\r\n9. Vuokrattavassa tilassa järjestettävän tilaisuuden sisältö tai luonne ei voi olla ristiriidassa Suomen lain kanssa tai hyvän tavan vastainen.\r\n10. Kirjastolla on tarvittaessa ja harkintansa mukaan oikeus evätä vuokralaisen pääsy vuokrattavaan tilaan tai keskeyttää vuokrattavassa tilassa järjestettävä tilaisuus, mikäli ilmenee, että edellä mainittuja sääntöjä rikotaan tai on rikottu.",
          unit: {
            nameFi: "Helsingin keskustakirjasto Oodi",
            nameEn: null,
            nameSv: null,
          },
          cancellationRule: {
            canBeCancelledTimeBefore: 86400,
            needsHandling: false,
          },
          location: null,
          images: [],
        } as ReservationUnitType,
      ],
    },
  },
  {
    node: {
      id: "UmVzZXJ2YXRpb25UeXBlOjEy",
      pk: 12,
      name: "",
      begin: "2021-12-05T08:00:00+00:00",
      end: "2021-12-05T09:00:00+00:00",
      user: "user@email.com",
      state: "CANCELLED",
      bufferTimeBefore: 3600,
      bufferTimeAfter: 1800,
      reservationUnits: [
        {
          pk: 1,
          nameFi: "Studiohuone 1 + soittimet",
          nameEn: null,
          nameSv: null,
          termsOfUseFi:
            "Kirjaston varattavien tilojen yleiset käyttösäännöt:\r\n1. Varattu tila kalusteineen on vuokralaisen käytettävissä sopimuksessa määriteltynä aikana.\r\n2. Mahdollisten alkuvalmistelujen ja loppusiivouksen tulee sisältyä varattuun aikaan. Varaus laskutetaan täysiltä tunneilta.\r\n3. Peruuttamatta jääneet varaukset laskutetaan.\r\n4. Vuokraajan tulee olla täysi-ikäinen.\r\n5. Kirjastossa ei voi järjestää kursseja tai toistuvia tilaisuuksia, joista otetaan pääsy- tai osallistumismaksu (koskien myös materiaalikuluja). Yksittäisiä osallistujille maksullisia tapahtumia voi järjestää.\r\n6. Vuokrausajan päättyessä vuokraajan tulee jättää tila samaan kuntoon kuin se oli vuokrausajan alkaessa.\r\n7. Vuokraaja on korvausvelvollinen, mikäli tilan käyttäjät aiheuttavat vahinkoa kiinteistölle tai irtaimistolle. Vahingoista on ilmoitettava välittömästi kirjaston henkilökunnalle.\r\n8. Vuokrattavassa tilassa järjestettävä tilaisuus ei saa häiritä muuta kirjaston toimintaa, asiakkaita tai käyttäjiä.\r\n9. Vuokrattavassa tilassa järjestettävän tilaisuuden sisältö tai luonne ei voi olla ristiriidassa Suomen lain kanssa tai hyvän tavan vastainen.\r\n10. Kirjastolla on tarvittaessa ja harkintansa mukaan oikeus evätä vuokralaisen pääsy vuokrattavaan tilaan tai keskeyttää vuokrattavassa tilassa järjestettävä tilaisuus, mikäli ilmenee, että edellä mainittuja sääntöjä rikotaan tai on rikottu.",
          unit: {
            nameFi: "Helsingin keskustakirjasto Oodi",
            nameEn: null,
            nameSv: null,
          },
          cancellationRule: {
            canBeCancelledTimeBefore: 86400,
            needsHandling: false,
          },
          location: null,
          images: [],
        } as ReservationUnitType,
      ],
    },
  },
  {
    node: {
      id: "UmVzZXJ2YXRpb25UeXBlOjE5",
      pk: 19,
      name: "-k-kopk",
      begin: "2021-12-05T10:00:00+00:00",
      end: "2021-12-05T11:00:00+00:00",
      user: "user@email.com",
      state: "CANCELLED",
      bufferTimeBefore: 3600,
      bufferTimeAfter: 1800,
      reservationUnits: [
        {
          pk: 1,
          nameFi: "Studiohuone 1 + soittimet",
          nameEn: null,
          nameSv: null,
          termsOfUseFi:
            "Kirjaston varattavien tilojen yleiset käyttösäännöt:\r\n1. Varattu tila kalusteineen on vuokralaisen käytettävissä sopimuksessa määriteltynä aikana.\r\n2. Mahdollisten alkuvalmistelujen ja loppusiivouksen tulee sisältyä varattuun aikaan. Varaus laskutetaan täysiltä tunneilta.\r\n3. Peruuttamatta jääneet varaukset laskutetaan.\r\n4. Vuokraajan tulee olla täysi-ikäinen.\r\n5. Kirjastossa ei voi järjestää kursseja tai toistuvia tilaisuuksia, joista otetaan pääsy- tai osallistumismaksu (koskien myös materiaalikuluja). Yksittäisiä osallistujille maksullisia tapahtumia voi järjestää.\r\n6. Vuokrausajan päättyessä vuokraajan tulee jättää tila samaan kuntoon kuin se oli vuokrausajan alkaessa.\r\n7. Vuokraaja on korvausvelvollinen, mikäli tilan käyttäjät aiheuttavat vahinkoa kiinteistölle tai irtaimistolle. Vahingoista on ilmoitettava välittömästi kirjaston henkilökunnalle.\r\n8. Vuokrattavassa tilassa järjestettävä tilaisuus ei saa häiritä muuta kirjaston toimintaa, asiakkaita tai käyttäjiä.\r\n9. Vuokrattavassa tilassa järjestettävän tilaisuuden sisältö tai luonne ei voi olla ristiriidassa Suomen lain kanssa tai hyvän tavan vastainen.\r\n10. Kirjastolla on tarvittaessa ja harkintansa mukaan oikeus evätä vuokralaisen pääsy vuokrattavaan tilaan tai keskeyttää vuokrattavassa tilassa järjestettävä tilaisuus, mikäli ilmenee, että edellä mainittuja sääntöjä rikotaan tai on rikottu.",
          unit: {
            nameFi: "Helsingin keskustakirjasto Oodi",
            nameEn: null,
            nameSv: null,
          },
          cancellationRule: {
            canBeCancelledTimeBefore: 86400,
            needsHandling: false,
          },
          location: null,
          images: [],
        } as ReservationUnitType,
      ],
    },
  },
  {
    node: {
      id: "UmVzZXJ2YXRpb25UeXBlOjE4",
      pk: 18,
      name: "kopkl;ko",
      begin: "2021-12-05T14:30:00+00:00",
      end: "2021-12-05T15:30:00+00:00",
      user: "user@email.com",
      state: ReservationsReservationStateChoices.Created,
      bufferTimeBefore: 3600,
      bufferTimeAfter: 1800,
      reservationUnits: [
        {
          pk: 1,
          nameFi: "Studiohuone 1 + soittimet",
          nameEn: null,
          nameSv: null,
          termsOfUseFi:
            "Kirjaston varattavien tilojen yleiset käyttösäännöt:\r\n1. Varattu tila kalusteineen on vuokralaisen käytettävissä sopimuksessa määriteltynä aikana.\r\n2. Mahdollisten alkuvalmistelujen ja loppusiivouksen tulee sisältyä varattuun aikaan. Varaus laskutetaan täysiltä tunneilta.\r\n3. Peruuttamatta jääneet varaukset laskutetaan.\r\n4. Vuokraajan tulee olla täysi-ikäinen.\r\n5. Kirjastossa ei voi järjestää kursseja tai toistuvia tilaisuuksia, joista otetaan pääsy- tai osallistumismaksu (koskien myös materiaalikuluja). Yksittäisiä osallistujille maksullisia tapahtumia voi järjestää.\r\n6. Vuokrausajan päättyessä vuokraajan tulee jättää tila samaan kuntoon kuin se oli vuokrausajan alkaessa.\r\n7. Vuokraaja on korvausvelvollinen, mikäli tilan käyttäjät aiheuttavat vahinkoa kiinteistölle tai irtaimistolle. Vahingoista on ilmoitettava välittömästi kirjaston henkilökunnalle.\r\n8. Vuokrattavassa tilassa järjestettävä tilaisuus ei saa häiritä muuta kirjaston toimintaa, asiakkaita tai käyttäjiä.\r\n9. Vuokrattavassa tilassa järjestettävän tilaisuuden sisältö tai luonne ei voi olla ristiriidassa Suomen lain kanssa tai hyvän tavan vastainen.\r\n10. Kirjastolla on tarvittaessa ja harkintansa mukaan oikeus evätä vuokralaisen pääsy vuokrattavaan tilaan tai keskeyttää vuokrattavassa tilassa järjestettävä tilaisuus, mikäli ilmenee, että edellä mainittuja sääntöjä rikotaan tai on rikottu.",
          unit: {
            nameFi: "Helsingin keskustakirjasto Oodi",
            nameEn: null,
            nameSv: null,
          },
          cancellationRule: {
            canBeCancelledTimeBefore: 86400,
            needsHandling: false,
          },
          location: null,
          images: [],
        } as ReservationUnitType,
      ],
    },
  },
  {
    node: {
      id: "UmVzZXJ2YXRpb25UeXBlOjEz",
      pk: 13,
      name: "",
      begin: "2021-12-12T09:00:00+00:00",
      end: "2021-12-12T10:00:00+00:00",
      user: "user@email.com",
      state: "CANCELLED",
      bufferTimeBefore: 3600,
      bufferTimeAfter: 1800,
      reservationUnits: [
        {
          pk: 1,
          nameFi: "Studiohuone 1 + soittimet",
          nameEn: null,
          nameSv: null,
          termsOfUseFi:
            "Kirjaston varattavien tilojen yleiset käyttösäännöt:\r\n1. Varattu tila kalusteineen on vuokralaisen käytettävissä sopimuksessa määriteltynä aikana.\r\n2. Mahdollisten alkuvalmistelujen ja loppusiivouksen tulee sisältyä varattuun aikaan. Varaus laskutetaan täysiltä tunneilta.\r\n3. Peruuttamatta jääneet varaukset laskutetaan.\r\n4. Vuokraajan tulee olla täysi-ikäinen.\r\n5. Kirjastossa ei voi järjestää kursseja tai toistuvia tilaisuuksia, joista otetaan pääsy- tai osallistumismaksu (koskien myös materiaalikuluja). Yksittäisiä osallistujille maksullisia tapahtumia voi järjestää.\r\n6. Vuokrausajan päättyessä vuokraajan tulee jättää tila samaan kuntoon kuin se oli vuokrausajan alkaessa.\r\n7. Vuokraaja on korvausvelvollinen, mikäli tilan käyttäjät aiheuttavat vahinkoa kiinteistölle tai irtaimistolle. Vahingoista on ilmoitettava välittömästi kirjaston henkilökunnalle.\r\n8. Vuokrattavassa tilassa järjestettävä tilaisuus ei saa häiritä muuta kirjaston toimintaa, asiakkaita tai käyttäjiä.\r\n9. Vuokrattavassa tilassa järjestettävän tilaisuuden sisältö tai luonne ei voi olla ristiriidassa Suomen lain kanssa tai hyvän tavan vastainen.\r\n10. Kirjastolla on tarvittaessa ja harkintansa mukaan oikeus evätä vuokralaisen pääsy vuokrattavaan tilaan tai keskeyttää vuokrattavassa tilassa järjestettävä tilaisuus, mikäli ilmenee, että edellä mainittuja sääntöjä rikotaan tai on rikottu.",
          unit: {
            nameFi: "Helsingin keskustakirjasto Oodi",
            nameEn: null,
            nameSv: null,
          },
          cancellationRule: {
            canBeCancelledTimeBefore: 86400,
            needsHandling: false,
          },
          location: null,
          images: [],
        } as ReservationUnitType,
      ],
    },
  },
  {
    node: {
      id: "UmVzZXJ2YXRpb25UeXBlOjIx",
      pk: 21,
      name: "oij",
      begin: addDays(new Date(), 23).toISOString(),
      end: addHours(addDays(new Date(), 23), 2).toISOString(),
      user: "user@email.com",
      state: ReservationsReservationStateChoices.Confirmed,
      bufferTimeBefore: 3600,
      bufferTimeAfter: 1800,
      reservationUnits: [
        {
          pk: 3,
          nameFi: "Studiohuone 3 + soittimet",
          nameEn: null,
          nameSv: null,
          termsOfUseFi:
            "Kirjaston varattavien tilojen yleiset käyttösäännöt:\r\n1. Varattu tila kalusteineen on vuokralaisen käytettävissä sopimuksessa määriteltynä aikana.\r\n2. Mahdollisten alkuvalmistelujen ja loppusiivouksen tulee sisältyä varattuun aikaan. Varaus laskutetaan täysiltä tunneilta.\r\n3. Peruuttamatta jääneet varaukset laskutetaan.\r\n4. Vuokraajan tulee olla täysi-ikäinen.\r\n5. Kirjastossa ei voi järjestää kursseja tai toistuvia tilaisuuksia, joista otetaan pääsy- tai osallistumismaksu (koskien myös materiaalikuluja). Yksittäisiä osallistujille maksullisia tapahtumia voi järjestää.\r\n6. Vuokrausajan päättyessä vuokraajan tulee jättää tila samaan kuntoon kuin se oli vuokrausajan alkaessa.\r\n7. Vuokraaja on korvausvelvollinen, mikäli tilan käyttäjät aiheuttavat vahinkoa kiinteistölle tai irtaimistolle. Vahingoista on ilmoitettava välittömästi kirjaston henkilökunnalle.\r\n8. Vuokrattavassa tilassa järjestettävä tilaisuus ei saa häiritä muuta kirjaston toimintaa, asiakkaita tai käyttäjiä.\r\n9. Vuokrattavassa tilassa järjestettävän tilaisuuden sisältö tai luonne ei voi olla ristiriidassa Suomen lain kanssa tai hyvän tavan vastainen.\r\n10. Kirjastolla on tarvittaessa ja harkintansa mukaan oikeus evätä vuokralaisen pääsy vuokrattavaan tilaan tai keskeyttää vuokrattavassa tilassa järjestettävä tilaisuus, mikäli ilmenee, että edellä mainittuja sääntöjä rikotaan tai on rikottu.",
          unit: {
            nameFi: "Helsingin keskustakirjasto Oodi",
            nameEn: null,
            nameSv: null,
          },
          cancellationRule: {
            canBeCancelledTimeBefore: 86400,
            needsHandling: false,
          },
          location: null,
          images: [],
        } as ReservationUnitType,
      ],
    },
  },
] as ReservationTypeEdge[];

const listReservations = graphql.query<Query, QueryReservationsArgs>(
  "listReservations",
  async (req, res, ctx) => {
    return res(
      ctx.data({
        reservations: {
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
          },
          edges: reservationData.filter((reservationEdge) =>
            req.variables?.state
              ? req.variables.state.includes(reservationEdge.node.state)
              : reservationEdge
          ),
        },
      })
    );
  }
);

export const reservationHandlers = [
  createReservation,
  updateReservation,
  reservationByPk,
  confirmReservation,
  cancelReservation,
  listReservations,
  reservationCancelReasons,
  reservationPurposes,
  ageGroups,
  cities,
];
