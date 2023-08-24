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
  TermsOfUseTermsOfUseTermsTypeChoices,
  ReservationUnitsReservationUnitImageImageTypeChoices,
  SpaceType,
  UnitType,
  ReservationsReservationReserveeTypeChoices,
  ReservationDeleteMutationPayload,
  ReservationDeleteMutationInput,
  ReservationUnitsReservationUnitPricingStatusChoices,
  ReservationUnitsReservationUnitPricingPricingTypeChoices,
  ReservationUnitsReservationUnitPricingPriceUnitChoices,
  ReservationAdjustTimeMutationPayload,
  ReservationAdjustTimeMutationInput,
  QueryOrderArgs,
  PaymentOrderType,
  RefreshOrderMutationPayload,
  RefreshOrderMutationInput,
  ReservationsReservationPriorityChoices,
  ReservationsReservationTypeChoices,
} from "common/types/gql-types";
import { toUIDate } from "common/src/common/util";

const createReservation = graphql.mutation<
  { createReservation: ReservationCreateMutationPayload },
  { input: ReservationCreateMutationInput }
>("createReservation", (req, res, ctx) => {
  const getPk = (resUnitPk: number): number => {
    switch (resUnitPk) {
      case 700:
        return 701;
      case 903:
        return 43;
      case 908:
      case 909:
        return 99;
      default:
        return 42;
    }
  };

  const getPrice = (pk: number): number => {
    switch (pk) {
      case 903:
        return 42.0;
      default:
        return 0;
    }
  };

  const resUnitPk = req.variables?.input?.reservationUnitPks[0];

  return res(
    ctx.data({
      createReservation: {
        pk: getPk(resUnitPk),
        price: getPrice(resUnitPk),
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
          user: { email: "USER@NA.ME" },
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
  let state: ReservationsReservationStateChoices;
  switch (input.pk) {
    case 43:
      state = ReservationsReservationStateChoices.WaitingForPayment;
      break;
    default:
      state = ReservationsReservationStateChoices.Confirmed;
  }

  return res(
    ctx.data({
      confirmReservation: {
        pk: input.pk,
        state,
        order: {
          pk: 1234,
          id: "vmearo094r",
          checkoutUrl:
            "https://www.google.com/00-11-22-33?user=1234-abcd-9876-efgh",
          receiptUrl:
            "https://www.google.com/receiptUrl/00-11-22-33/receipt?user=1234-abcd-9876",
        },
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

const deleteReservation = graphql.mutation<
  { deleteReservation: ReservationDeleteMutationPayload },
  { input: ReservationDeleteMutationInput }
>("deleteReservation", (req, res, ctx) => {
  const { pk } = req.variables.input;
  let deleted: boolean;
  switch (pk) {
    case 3333:
      deleted = false;
      break;
    default:
      deleted = true;
  }

  if ([23, 6666].includes(pk)) {
    return res(
      ctx.errors([
        {
          message: "No Reservation matches the given query.",
          extensions: {
            error_code: "OOPS",
          },
        },
      ])
    );
  }

  return res(
    ctx.data({
      deleteReservation: {
        deleted,
      },
    })
  );
});

const adjustReservationTime = graphql.mutation<
  { adjustReservationTime: ReservationAdjustTimeMutationPayload },
  { input: ReservationAdjustTimeMutationInput }
>("adjustReservationTime", (req, res, ctx) => {
  return res(
    ctx.data({
      adjustReservationTime: {
        pk: 42,
        errors: null,
      },
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
                id: "Q2l0eTof",
                pk: 1,
                name: "Helsinki",
                nameFi: "Helsinki FI",
                nameEn: "Helsinki EN",
                nameSv: "Helsinki Sv",
              },
            },
            {
              node: {
                id: "Q2l0eTod",
                pk: 2,
                name: "Lande",
                nameFi: "Lande FI",
                nameEn: "Lande EN",
                nameSv: "Lande SV",
              },
            },
            {
              node: {
                id: "Q2l0eToz",
                pk: 3,
                name: "Muu",
                nameFi: "Muu FI",
                nameEn: "Muu EN",
                nameSv: "Muu SV",
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
    const data: ReservationType = {
      pk,
      type: ReservationsReservationTypeChoices.Normal,
      id: "UmVzZXJ2YXRpb246Mg==",
      name: "Reservation name",
      description:
        "Reservation description - a long one with alotta text and then some",
      handlingDetails: "",
      reserveeFirstName: "First name",
      reserveeLastName: "Last name",
      reserveePhone: "+358 123 4567",
      reserveeEmail: "email@example.com",
      begin: "2021-04-28T04:23:20+00:00",
      end: "2021-04-28T08:23:20+00:00",
      calendarUrl: `http://localhost:8000/v1/reservation_calendar/${pk}/?hash=12c580bc07340b05441feb8f261786a7ceabb5423a1966c7c13241f39916233c`,
      user: {
        email: "user@gmail.com",
        isSuperuser: false,
        username: "",
        id: "",
        firstName: "",
        lastName: "",
        uuid: "",
      },
      state: ReservationsReservationStateChoices.Confirmed,
      bufferTimeBefore: 3600,
      bufferTimeAfter: 1800,
      price: 42.0,
      purpose: {
        id: "aoeirgfj",
        nameFi: "Liikkua tai pelata FI",
        nameEn: "Liikkua tai pelata EN",
        nameSv: "Liikkua tai pelata SV",
      },
      orderStatus: "DRAFT",
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
          reservationPendingInstructionsFi: "Pending Instructions FI",
          reservationPendingInstructionsEn: "Pending Instructions EN",
          reservationPendingInstructionsSv: "Pending Instructions SV",
          reservationConfirmedInstructionsFi: "Confirmed Instructions FI",
          reservationConfirmedInstructionsEn: "Confirmed Instructions EN",
          reservationConfirmedInstructionsSv: "Confirmed Instructions SV",
          reservationCancelledInstructionsFi: "Cancelled Instructions FI",
          reservationCancelledInstructionsEn: "Cancelled Instructions EN",
          reservationCancelledInstructionsSv: "Cancelled Instructions SV",
          serviceSpecificTerms: {
            id: "fawoifhj",
            textFi: "Service specific terms FI",
            textEn: null,
            textSv: null,
            termsType: TermsOfUseTermsOfUseTermsTypeChoices.ServiceTerms,
          },
          paymentTerms: {
            id: "fawoifhj",
            textFi: "Payment terms FI",
            textEn: null,
            textSv: null,
            termsType: TermsOfUseTermsOfUseTermsTypeChoices.PaymentTerms,
          },
          cancellationTerms: {
            id: "fawoifhj",
            textFi: "Cancellation terms FI",
            textEn: null,
            textSv: null,
            termsType: TermsOfUseTermsOfUseTermsTypeChoices.CancellationTerms,
          },
          pricingTerms: {
            id: "fawoifhj",
            textFi: "Pricing terms FI",
            textEn: null,
            textSv: null,
            termsType: TermsOfUseTermsOfUseTermsTypeChoices.PricingTerms,
          },
          unit: {
            id: "VW5pdFR5cGU6NA==",
            nameFi: "Ympyrätalo",
            nameEn: null,
            nameSv: null,
            location: {
              id: "r82394j",
              addressStreetFi: "Jokukatu 5",
              addressStreetEn: null,
              addressStreetSv: null,
              addressCityFi: "Helsinki",
              addressCityEn: null,
              addressCitySv: null,
              addressZip: "00100",
            },
          } as UnitType,
          cancellationRule: null,
          spaces: [
            {
              pk: 36,
              id: "fawpeifje",
              nameFi: "Toimistohuone 1",
              nameEn: null,
              nameSv: null,
            } as SpaceType,
          ],
          images: [
            {
              imageUrl: "/Leikkipuisto_2_4SSB34h.jpg",
              mediumUrl: "https://via.placeholder.com/384x384",
              smallUrl: "/Leikkipuisto_2_4SSB34h.jpg.250x250_q85_crop.jpg",
              imageType:
                ReservationUnitsReservationUnitImageImageTypeChoices.Other,
            },
            {
              imageUrl: "/Musiikki_2.jpg",
              mediumUrl: "https://via.placeholder.com/384x384",
              smallUrl: "/Musiikki_2.jpg.250x250_q85_crop.jpg",
              imageType:
                ReservationUnitsReservationUnitImageImageTypeChoices.Main,
            },
          ],
        } as ReservationUnitType,
      ],
      ageGroup: {
        id: "famwieopfm",
        pk: 1,
        minimum: 5,
        maximum: 8,
      },
      numPersons: 18,
      priority: ReservationsReservationPriorityChoices.A_200,
    };

    if (pk === 4 || pk === 44) {
      data.price = 0;
      data.begin = addDays(new Date(), 11).toISOString();
      data.end = addHours(addDays(new Date(), 11), 2).toISOString();
      data.reservationUnits[0].pk = 888;
      data.reservationUnits[0].canApplyFreeOfCharge = true;
      data.reservationUnits[0].cancellationRule = {
        id: "234",
        canBeCancelledTimeBefore: 0,
        needsHandling: false,
      };
      data.orderUuid = "6666-6666-6666-6666";
      data.reservationUnits[0].pricings = [
        {
          begins: addDays(new Date(), -10).toISOString(),
          lowestPrice: 0,
          lowestPriceNet: 0,
          highestPrice: 0,
          highestPriceNet: 0,
          priceUnit:
            ReservationUnitsReservationUnitPricingPriceUnitChoices.PerHour,
          pricingType:
            ReservationUnitsReservationUnitPricingPricingTypeChoices.Free,
          status: ReservationUnitsReservationUnitPricingStatusChoices.Active,
          taxPercentage: {
            id: "fawoifhj",
            value: 24.0,
          },
        },
        {
          begins: addDays(new Date(), 10).toISOString(),
          lowestPrice: 0,
          lowestPriceNet: 0,
          highestPrice: 20,
          highestPriceNet: 15,
          priceUnit:
            ReservationUnitsReservationUnitPricingPriceUnitChoices.PerHour,
          pricingType:
            ReservationUnitsReservationUnitPricingPricingTypeChoices.Paid,
          status: ReservationUnitsReservationUnitPricingStatusChoices.Future,
          taxPercentage: {
            id: "fawoifhj",
            value: 24.0,
          },
        },
      ];
      data.reservationUnits[0].metadataSet = {
        id: "fawoifhj",
        name: "Company metadata",
        supportedFields: [
          "reservee_organisation_name",
          "reservee_first_name",
          "reservee_last_name",
          "reservee_phone",
          "reservee_email",
          "description",
          "purpose",
          "ageGroup",
          "numPersons",
        ],
      };
    }

    if (pk === 44) {
      data.isHandled = true;
    }

    if (pk === 11) {
      data.reserveeType = ReservationsReservationReserveeTypeChoices.Business;
      data.reserveeOrganisationName = "Acme Oyj";
      data.orderStatus = "PAID";
      data.reservationUnits[0].metadataSet = {
        id: "fawoifhj",
        name: "Company metadata",
        supportedFields: [
          "reservee_organisation_name",
          "reservee_first_name",
          "reservee_last_name",
          "reservee_phone",
          "reservee_email",
          "description",
          "purpose",
          "ageGroup",
          "numPersons",
        ],
      };
    }

    if (pk === 20) {
      data.begin = addDays(new Date(), 1).toISOString();
      data.end = addHours(addDays(new Date(), 1), 2).toISOString();
      data.reservationUnits[0].cancellationRule = {
        id: "fawkpofk3490",
        canBeCancelledTimeBefore: 90000,
        needsHandling: false,
      };
    }

    if (pk === 21) {
      data.begin = addDays(new Date(), 10).toISOString();
      data.end = addHours(addDays(new Date(), 10), 2).toISOString();
      data.reservationUnits[0].cancellationRule = {
        id: "fr8ejifod",
        canBeCancelledTimeBefore: 10,
        needsHandling: false,
      };
      data.reservationUnits[0].reservationCancelledInstructionsFi =
        "Ohjeet perutulle varaukselle";
      data.orderStatus = "foobar";
      data.reservationUnits[0].metadataSet = {
        pk: 4,
        id: "fawoifhj",
        name: "Metadata set",
        supportedFields: [
          "reservee_first_name",
          "reservee_last_name",
          "reservee_address_street",
          "reservee_address_zip",
          "reservee_address_city",
          "reservee_email",
          "reservee_phone",
          "name",
          "purpose",
          "num_persons",
          "age_group",
          "description",
          "applying_for_free_of_charge",
          "free_of_charge_reason",
          "reservee_organisation_name",
          "home_city",
          "reservee_is_unregistered_association",
          "reservee_id",
        ],
      };
    }

    if (pk === 22 || pk === 23) {
      data.state = ReservationsReservationStateChoices.WaitingForPayment;
      data.orderUuid = "22-1";
    }

    if (pk === 42) {
      data.price = 0;
    }

    if (pk === 99) {
      data.description = "";
    }

    if (pk === 701) {
      data.reserveeFirstName = "Foo";
      data.reserveeLastName = "Bar";
      data.reserveeEmail = "foo@bar.baz";
      data.reserveePhone = "123456789";
      data.reserveeAddressStreet = "Katu 13";
      data.reserveeAddressCity = "Helsinki";
      data.reserveeAddressZip = "00100";
      data.homeCity = {
        id: "123",
        name: "Lande",
        nameFi: "Lande FI",
        nameEn: "Lande En",
        nameSv: "Lande Sv",
        pk: 2,
      };
    }

    if (pk === 702) {
      data.state = ReservationsReservationStateChoices.Denied;
    }

    if (pk === 4444) {
      data.state = ReservationsReservationStateChoices.WaitingForPayment;
    }

    if (pk === 5555) {
      data.state = ReservationsReservationStateChoices.Confirmed;
    }

    if (pk === 6666) {
      data.state = ReservationsReservationStateChoices.Confirmed;
      data.orderUuid = "6666-6666-6666-6666";
    }

    return res(
      ctx.data({
        reservationByPk: data as unknown as ReservationType,
      })
    );
  }
);

const listReservations = graphql.query<Query, QueryReservationsArgs>(
  "listReservations",
  (req, res, ctx) => {
    const reservationData = [
      {
        node: {
          id: "UmVzZXJ2YXRpb25UeXBlOjI=",
          pk: 2,
          name: "",
          begin: "2021-04-28T04:23:20+00:00",
          end: "2021-04-28T06:23:20+00:00",
          user: { email: "user@gmail.com" },
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
          orderStatus: "PAID",
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
                  imageUrl: "/Leikkipuisto_2_4SSB34h.jpg",
                  mediumUrl: "/Leikkipuisto_2_4SSB34h.jpg.384x384_q85_crop.jpg",
                  smallUrl: "/Leikkipuisto_2_4SSB34h.jpg.250x250_q85_crop.jpg",
                  imageType: "OTHER",
                },
                {
                  imageUrl: "/Musiikki_2.jpg",
                  mediumUrl: "/Musiikki_2.jpg.384x384_q85_crop.jpg",
                  smallUrl: "/Musiikki_2.jpg.250x250_q85_crop.jpg",
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
          state: ReservationsReservationStateChoices.WaitingForPayment,
          bufferTimeBefore: 3600,
          bufferTimeAfter: 1800,
          orderUuid: "7777-7777-7777-7777",
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
          orderStatus: "DRAFT",
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
              pricings: [
                {
                  begins: toUIDate(addDays(new Date(), 2), "yyyy-MM-dd"),
                  lowestPrice: 10,
                  lowestPriceNet: 10 / 1.24,
                  highestPrice: 30,
                  highestPriceNet: 30 / 1.24,
                  priceUnit:
                    ReservationUnitsReservationUnitPricingPriceUnitChoices.Per_15Mins,
                  pricingType:
                    ReservationUnitsReservationUnitPricingPricingTypeChoices.Paid,
                  taxPercentage: {
                    id: "goier1",
                    value: 20,
                  },
                  status:
                    ReservationUnitsReservationUnitPricingStatusChoices.Future,
                },
                {
                  begins: toUIDate(new Date(), "yyyy-MM-dd"),
                  lowestPrice: 20,
                  lowestPriceNet: 20 / 1.24,
                  highestPrice: 20,
                  highestPriceNet: 20 / 1.24,
                  priceUnit:
                    ReservationUnitsReservationUnitPricingPriceUnitChoices.Per_15Mins,
                  pricingType:
                    ReservationUnitsReservationUnitPricingPricingTypeChoices.Paid,
                  taxPercentage: {
                    id: "goier1",
                    value: 20,
                  },
                  status:
                    ReservationUnitsReservationUnitPricingStatusChoices.Active,
                },
              ],
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
          orderStatus: "PAID_MANUALLY",
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
      {
        node: {
          id: "UmVzZXJ2YXRpb25UeXBlOjIx",
          pk: 22,
          name: "Cancelled reservation",
          begin: addDays(new Date(), 21).toISOString(),
          end: addHours(addDays(new Date(), 21), 1).toISOString(),
          user: "user@email.com",
          state: ReservationsReservationStateChoices.Denied,
          bufferTimeBefore: 3600,
          bufferTimeAfter: 1800,
          orderStatus: "PAID_MANUALLY",
          reservationUnits: [
            {
              pk: 3,
              nameFi: "Studiohuone 42 + soittimet",
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
          pk: 23,
          name: "Cancelled reservation",
          begin: addDays(new Date(), -25).toISOString(),
          end: addHours(addDays(new Date(), -25), 1).toISOString(),
          user: "user@email.com",
          state: ReservationsReservationStateChoices.Denied,
          bufferTimeBefore: 3600,
          bufferTimeAfter: 1800,
          orderStatus: "PAID_MANUALLY",
          reservationUnits: [
            {
              pk: 3,
              nameFi: "Studiohuone 43 + soittimet",
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

    const edges = reservationData.filter((reservationEdge) =>
      req.variables?.state
        ? req.variables.state.includes(reservationEdge.node.state)
        : reservationEdge
    );

    return res(
      ctx.status(200),
      ctx.data({
        reservations: {
          edges,
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
          },
        },
      })
    );
  }
);

const getOrder = graphql.query<Query, QueryOrderArgs>(
  "order",
  (req, res, ctx) => {
    const { orderUuid } = req.variables ?? {};

    const baseOrder = {
      id: "1",
      pk: 1,
      orderUuid,
    };
    let order: PaymentOrderType | null = null;

    switch (orderUuid) {
      case "22-1":
        order = {
          ...baseOrder,
          checkoutUrl: "https://google.com/search?user=123",
        };
        break;
      case "2222-2222-2222-2222":
        order = baseOrder;
        break;
      case "3333-3333-3333-3333":
        order = {
          ...baseOrder,
          reservationPk: "3333",
          status: ReservationsReservationStateChoices.WaitingForPayment,
        };
        break;
      case "3333-3333-3333-3333-2":
        order = {
          ...baseOrder,
          reservationPk: "6666",
          status: ReservationsReservationStateChoices.WaitingForPayment,
        };
        break;
      case "4444-4444-4444-4444":
        order = {
          ...baseOrder,
          reservationPk: "4444",
          status: "PAID",
        };
        break;
      case "5555-5555-5555-5555":
        order = {
          ...baseOrder,
          reservationPk: "5555",
          status: "PAID",
        };
        break;
      case "6666-6666-6666-6666":
        order = {
          ...baseOrder,
          reservationPk: "6666",
          status: "PAID",
          receiptUrl: "https://example.com/receipt.pdf?orderId=123",
        };
        break;
      case "7777-7777-7777-7777":
        order = {
          ...baseOrder,
          reservationPk: "7777",
          status: "PAID",
          receiptUrl: "https://example.com/receipt.pdf?orderId=123",
          checkoutUrl: "https://google.com/search?user=123",
        };
        break;
      default:
        break;
    }

    return res(ctx.data({ order }));
  }
);

const refreshOrder = graphql.mutation<
  { refreshOrder: RefreshOrderMutationPayload },
  { input: RefreshOrderMutationInput }
>("refreshOrder", (req, res, ctx) => {
  const { orderUuid } = req.variables.input ?? {};

  if (orderUuid === "3333-3333-3333-3333") {
    return res(
      ctx.errors([
        {
          message: "External service error",
          extensions: {
            error_code: "EXTERNAL_SERVICE_ERROR",
          },
        },
      ])
    );
  }

  if (orderUuid === "3333-3333-3333-3333-2") {
    return res(
      ctx.data({
        refreshOrder: {
          orderUuid,
          status: "PAID",
        },
      })
    );
  }

  return res(
    ctx.data({
      refreshOrder: {
        orderUuid,
      },
    })
  );
});

export const reservationHandlers = [
  createReservation,
  updateReservation,
  reservationByPk,
  confirmReservation,
  cancelReservation,
  deleteReservation,
  adjustReservationTime,
  listReservations,
  reservationCancelReasons,
  reservationPurposes,
  ageGroups,
  cities,
  getOrder,
  refreshOrder,
];
