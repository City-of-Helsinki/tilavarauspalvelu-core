import { graphql } from "msw";
import {
  SearchFormParamsUnitQuery,
  SearchReservationUnitsQuery,
  SearchReservationUnitsQueryVariables,
  ReservationUnitImageType,
  Query,
  PurposeType,
  ReservationUnitsReservationUnitPriceUnitChoices,
} from "../../modules/gql-types";

export const reservationUnitSearchHandlers = [
  graphql.query<
    SearchReservationUnitsQuery,
    SearchReservationUnitsQueryVariables
  >("SearchReservationUnits", (req, res, ctx) => {
    const reservationUnitData: SearchReservationUnitsQuery = {
      reservationUnits: {
        edges: [
          {
            node: {
              id: "1",
              pk: 1,
              nameFi: "Arabian nuorisotalon sali",
              nameEn: "Arabian nuorisotalon sali",
              nameSv: "Arabian nuorisotalon sali",
              lowestPrice: 12.34,
              highestPrice: 20,
              priceUnit:
                "PER_HOUR" as ReservationUnitsReservationUnitPriceUnitChoices,
              reservationUnitType: {
                id: 3,
                nameFi: "Nuorisopalvelut",
                nameEn: "Nuorisopalvelut",
                nameSv: "Nuorisopalvelut",
              },
              unit: {
                id: 11,
                nameFi: "Arabian nuorisotalo",
                nameEn: "Arabian nuorisotalo",
                nameSv: "Arabian nuorisotalo",
                location: {
                  addressStreetFi: "Arabianpolku 1 A 2",
                  addressStreetEn: "Arabianpolku 1 A 2",
                  addressStreetSv: "Arabianpolku 1 A 2",
                },
              },
              maxPersons: 100,
              images: [
                {
                  imageUrl:
                    "http://localhost:8000/media/reservation_unit_images/lavenderhouse_1-x_large.jpg",
                  mediumUrl:
                    "http://localhost:8000/media/reservation_unit_images/lavenderhouse_1-x_large.jpg.384x384_q85_crop.jpg",
                  smallUrl:
                    "http://localhost:8000/media/reservation_unit_images/lavenderhouse_1-x_large.jpg.250x250_q85_crop.jpg",
                  imageType: "MAIN",
                },
              ] as ReservationUnitImageType[],
            },
          },
          {
            node: {
              id: "2",
              pk: 2,
              nameFi: "Hertsin nuorisotalon sali",
              nameEn: "Hertsin nuorisotalon sali",
              nameSv: "Hertsin nuorisotalon sali",
              lowestPrice: 0.0,
              highestPrice: 20,
              priceUnit:
                "PER_HALF_DAY" as ReservationUnitsReservationUnitPriceUnitChoices,
              reservationUnitType: {
                id: 3,
                nameFi: "Nuorisopalvelut",
                nameEn: "Nuorisopalvelut",
                nameSv: "Nuorisopalvelut",
              },
              unit: {
                id: 13,
                nameFi: "Hertsin nuorisotila",
                nameEn: "Hertsin nuorisotila",
                nameSv: "Hertsin nuorisotila",
                location: {
                  addressStreetFi: "Linnanrakentajantie 2",
                  addressStreetEn: "Linnanrakentajantie 2",
                  addressStreetSv: "Linnanrakentajantie 2",
                },
              },
              maxPersons: 15,
              images: [],
            },
          },
          {
            node: {
              id: "40",
              pk: 40,
              nameFi: "Jakomäen sydämen liikkumistila",
              nameEn: "Jakomäen sydämen liikkumistila",
              nameSv: "Jakomäen sydämen liikkumistila",
              lowestPrice: 0.0,
              highestPrice: 0.0,
              priceUnit:
                "PER_HOUR" as ReservationUnitsReservationUnitPriceUnitChoices,
              reservationUnitType: {
                id: 3,
                nameFi: "Nuorisopalvelut",
                nameEn: "Nuorisopalvelut",
                nameSv: "Nuorisopalvelut",
              },
              unit: {
                id: 14,
                nameFi: "Jakomäen nuorisotalo",
                nameEn: "Jakomäen nuorisotalo",
                nameSv: "Jakomäen nuorisotalo",
                location: {
                  addressStreetFi: "Jakomäenpolku 6",
                  addressStreetEn: "Jakomäenpolku 6",
                  addressStreetSv: "Jakomäenpolku 6",
                },
              },
              maxPersons: 10,
              images: [],
            },
          },
          {
            node: {
              id: "53",
              pk: 53,
              nameFi: "Pasilan nuorisotalon järjestötila",
              nameEn: "Pasilan nuorisotalon järjestötila",
              nameSv: "Pasilan nuorisotalon järjestötila",
              lowestPrice: 0.0,
              highestPrice: 0.0,
              priceUnit:
                "PER_HOUR" as ReservationUnitsReservationUnitPriceUnitChoices,
              reservationUnitType: {
                id: 3,
                nameFi: "Nuorisopalvelut",
                nameEn: "Nuorisopalvelut",
                nameSv: "Nuorisopalvelut",
              },
              unit: {
                id: 9,
                nameFi: "Pasilan nuorisotalo",
                nameEn: "Pasilan nuorisotalo",
                nameSv: "Pasilan nuorisotalo",
                location: {
                  addressStreetFi: "Pasilanraitio 6",
                  addressStreetEn: "Pasilanraitio 6",
                  addressStreetSv: "Pasilanraitio 6",
                },
              },
              maxPersons: 15,
              images: [],
            },
          },
          {
            node: {
              id: "52",
              pk: 52,
              nameFi: "Koskelan nuorisotalon yläkerran ryhmätila 2",
              nameEn: "Koskelan nuorisotalon yläkerran ryhmätila 2",
              nameSv: "Koskelan nuorisotalon yläkerran ryhmätila 2",
              lowestPrice: 0.0,
              highestPrice: 0.0,
              priceUnit:
                "PER_HOUR" as ReservationUnitsReservationUnitPriceUnitChoices,
              reservationUnitType: {
                id: 3,
                nameFi: "Nuorisopalvelut",
                nameEn: "Nuorisopalvelut",
                nameSv: "Nuorisopalvelut",
              },
              unit: {
                id: 10,
                nameFi: "Koskelan nuorisotalo",
                nameEn: "Koskelan nuorisotalo",
                nameSv: "Koskelan nuorisotalo",
                location: {
                  addressStreetFi: "Antti Korpin tie 3 a",
                  addressStreetEn: "Antti Korpin tie 3 a",
                  addressStreetSv: "Antti Korpin tie 3 a",
                },
              },
              maxPersons: 15,
              images: [],
            },
          },
          {
            node: {
              id: "51",
              pk: 51,
              nameFi: "Koskelan nuorisotalon yläkerran ryhmätila 1",
              nameEn: "Koskelan nuorisotalon yläkerran ryhmätila 1",
              nameSv: "Koskelan nuorisotalon yläkerran ryhmätila 1",
              lowestPrice: 0.0,
              highestPrice: 0.0,
              priceUnit:
                "PER_HOUR" as ReservationUnitsReservationUnitPriceUnitChoices,
              reservationUnitType: {
                id: 3,
                nameFi: "Nuorisopalvelut",
                nameEn: "Nuorisopalvelut",
                nameSv: "Nuorisopalvelut",
              },
              unit: {
                id: 10,
                nameFi: "Koskelan nuorisotalo",
                nameEn: "Koskelan nuorisotalo",
                nameSv: "Koskelan nuorisotalo",
                location: {
                  addressStreetFi: "Antti Korpin tie 3 a",
                  addressStreetEn: "Antti Korpin tie 3 a",
                  addressStreetSv: "Antti Korpin tie 3 a",
                },
              },
              maxPersons: 15,

              images: [],
            },
          },
          {
            node: {
              id: "35",
              pk: 35,
              nameFi: "Malmin nuorisotalon alakerta",
              nameEn: "Malmin nuorisotalon alakerta",
              nameSv: "Malmin nuorisotalon alakerta",
              lowestPrice: 0.0,
              highestPrice: 0.0,
              priceUnit:
                "PER_HOUR" as ReservationUnitsReservationUnitPriceUnitChoices,
              reservationUnitType: {
                id: 3,
                nameFi: "Nuorisopalvelut",
                nameEn: "Nuorisopalvelut",
                nameSv: "Nuorisopalvelut",
              },
              unit: {
                id: 6,
                nameFi: "Malmin nuorisotalo",
                nameEn: "Malmin nuorisotalo",
                nameSv: "Malmin nuorisotalo",
                location: {
                  addressStreetFi: "Kunnantie 3",
                  addressStreetEn: "Kunnantie 3",
                  addressStreetSv: "Kunnantie 3",
                },
              },
              maxPersons: 16,
              images: [],
            },
          },
          {
            node: {
              id: "32",
              pk: 32,
              nameFi: "Ruoholahden nuorisotalon sali",
              nameEn: "Ruoholahden nuorisotalon sali",
              nameSv: "Ruoholahden nuorisotalon sali",
              lowestPrice: 0.0,
              highestPrice: 0.0,
              priceUnit:
                "PER_HOUR" as ReservationUnitsReservationUnitPriceUnitChoices,
              reservationUnitType: {
                id: 3,
                nameFi: "Nuorisopalvelut",
                nameEn: "Nuorisopalvelut",
                nameSv: "Nuorisopalvelut",
              },
              unit: {
                id: 5,
                nameFi: "Ruoholahden nuorisotalo",
                nameEn: "Ruoholahden nuorisotalo",
                nameSv: "Ruoholahden nuorisotalo",
                location: {
                  addressStreetFi: "Messitytönkatu 4",
                  addressStreetEn: "Messitytönkatu 4",
                  addressStreetSv: "Messitytönkatu 4",
                },
              },
              maxPersons: 80,
              images: [],
            },
          },
          {
            node: {
              id: "34",
              pk: 34,
              nameFi: "Malmin nuorisotalon yläkerta",
              nameEn: "Malmin nuorisotalon yläkerta",
              nameSv: "Malmin nuorisotalon yläkerta",
              lowestPrice: 0.0,
              highestPrice: 0.0,
              priceUnit:
                "PER_HOUR" as ReservationUnitsReservationUnitPriceUnitChoices,
              reservationUnitType: {
                id: 3,
                nameFi: "Nuorisopalvelut",
                nameEn: "Nuorisopalvelut",
                nameSv: "Nuorisopalvelut",
              },
              unit: {
                id: 6,
                nameFi: "Malmin nuorisotalo",
                nameEn: "Malmin nuorisotalo",
                nameSv: "Malmin nuorisotalo",
                location: {
                  addressStreetFi: "Kunnantie 3",
                  addressStreetEn: "Kunnantie 3",
                  addressStreetSv: "Kunnantie 3",
                },
              },
              maxPersons: 10,
              images: [],
            },
          },
          {
            node: {
              id: "42",
              pk: 42,
              nameFi: "Jakomäen sydämen olohuone",
              nameEn: "Jakomäen sydämen olohuone",
              nameSv: "Jakomäen sydämen olohuone",
              lowestPrice: 0.0,
              highestPrice: 0.0,
              priceUnit:
                "PER_HOUR" as ReservationUnitsReservationUnitPriceUnitChoices,
              reservationUnitType: {
                id: 3,
                nameFi: "Nuorisopalvelut",
                nameEn: "Nuorisopalvelut",
                nameSv: "Nuorisopalvelut",
              },
              unit: {
                id: 14,
                nameFi: "Jakomäen nuorisotalo",
                nameEn: "Jakomäen nuorisotalo",
                nameSv: "Jakomäen nuorisotalo",
                location: {
                  addressStreetFi: "Jakomäenpolku 6",
                  addressStreetEn: "Jakomäenpolku 6",
                  addressStreetSv: "Jakomäenpolku 6",
                },
              },
              maxPersons: 30,
              images: [],
            },
          },
        ],
        pageInfo: {
          endCursor: "YXJyYXljb25uZWN0aW9uOjk=",
          hasNextPage: true,
        },
      },
    };

    return res(
      ctx.data({ reservationUnits: reservationUnitData.reservationUnits })
    );
  }),
  graphql.query<SearchFormParamsUnitQuery>(
    "SearchFormParamsUnit",
    (req, res, ctx) => {
      const response = [
        { pk: 1, nameFi: "Tila #1", nameEn: "Tila #1", nameSv: "Tila #1" },
        { pk: 2, nameFi: "Tila #2", nameEn: "Tila #2", nameSv: "Tila #2" },
        { pk: 3, nameFi: "Tila #3", nameEn: "Tila #3", nameSv: "Tila #3" },
      ];
      return res(
        ctx.data({
          units: {
            edges: response.map((n) => ({
              node: n,
            })),
          },
        })
      );
    }
  ),
  graphql.query<Query>("SearchFormParamsPurpose", (req, res, ctx) => {
    const response: PurposeType[] = [
      {
        id: "UHVycG9zZVR5cGU6NQ==",
        pk: 1,
        nameFi: "Purpose #1",
        nameEn: "Purpose #1",
        nameSv: "Purpose #1",
      },
      {
        id: "UHVycG9zZVR5cGU6NQ==",
        pk: 2,
        nameFi: "Purpose #2",
        nameEn: "Purpose #2",
        nameSv: "Purpose #2",
      },
      {
        id: "UHVycG9zZVR5cGU6NQ==",
        pk: 3,
        nameFi: "Purpose #3",
        nameEn: "Purpose #3",
        nameSv: "Purpose #3",
      },
      {
        id: "UHVycG9zZVR5cGU6NQ==",
        pk: 4,
        nameFi: "Purpose #11",
        nameEn: "Purpose #11",
        nameSv: "Purpose #11",
      },
    ];
    return res(
      ctx.data({
        purposes: {
          edges: response.map((n) => ({
            node: n,
            cursor: "awioefja903",
          })),
          pageInfo: {
            hasPreviousPage: false,
            hasNextPage: true,
          },
        },
      })
    );
  }),
];
