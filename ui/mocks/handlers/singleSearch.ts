import { graphql } from "msw";
import {
  SearchFormParamsQuery,
  SearchReservationUnitsQuery,
  SearchReservationUnitsQueryVariables,
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
              id: 48,
              name: "Arabian nuorisotalon sali",
              reservationUnitType: {
                id: 3,
                name: "Nuorisopalvelut",
              },
              building: {
                id: 11,
                name: "Arabian nuorisotalo",
              },
              maxPersons: 100,
              location: {
                addressStreet: "Arabianpolku 1 A 2",
              },
              images: [],
            },
          },
          {
            node: {
              id: 45,
              name: "Hertsin nuorisotalon sali",
              reservationUnitType: {
                id: 3,
                name: "Nuorisopalvelut",
              },
              building: {
                id: 13,
                name: "Hertsin nuorisotila",
              },
              maxPersons: 15,
              location: {
                addressStreet: "Linnanrakentajantie 2",
              },
              images: [],
            },
          },
          {
            node: {
              id: 40,
              name: "Jakomäen sydämen liikkumistila",
              reservationUnitType: {
                id: 3,
                name: "Nuorisopalvelut",
              },
              building: {
                id: 14,
                name: "Jakomäen nuorisotalo",
              },
              maxPersons: 10,
              location: {
                addressStreet: "Jakomäenpolku 6",
              },
              images: [],
            },
          },
          {
            node: {
              id: 53,
              name: "Pasilan nuorisotalon järjestötila",
              reservationUnitType: {
                id: 3,
                name: "Nuorisopalvelut",
              },
              building: {
                id: 9,
                name: "Pasilan nuorisotalo",
              },
              maxPersons: 15,
              location: {
                addressStreet: "Pasilanraitio 6",
              },
              images: [],
            },
          },
          {
            node: {
              id: 52,
              name: "Koskelan nuorisotalon yläkerran ryhmätila 2",
              reservationUnitType: {
                id: 3,
                name: "Nuorisopalvelut",
              },
              building: {
                id: 10,
                name: "Koskelan nuorisotalo",
              },
              maxPersons: 15,
              location: {
                addressStreet: "Antti Korpin tie 3 a",
              },
              images: [],
            },
          },
          {
            node: {
              id: 51,
              name: "Koskelan nuorisotalon yläkerran ryhmätila 1",
              reservationUnitType: {
                id: 3,
                name: "Nuorisopalvelut",
              },
              building: {
                id: 10,
                name: "Koskelan nuorisotalo",
              },
              maxPersons: 15,
              location: {
                addressStreet: "Antti Korpin tie 3 a",
              },
              images: [],
            },
          },
          {
            node: {
              id: 35,
              name: "Malmin nuorisotalon alakerta",
              reservationUnitType: {
                id: 3,
                name: "Nuorisopalvelut",
              },
              building: {
                id: 6,
                name: "Malmin nuorisotalo",
              },
              maxPersons: 16,
              location: {
                addressStreet: "Kunnantie 3",
              },
              images: [],
            },
          },
          {
            node: {
              id: 32,
              name: "Ruoholahden nuorisotalon sali",
              reservationUnitType: {
                id: 3,
                name: "Nuorisopalvelut",
              },
              building: {
                id: 5,
                name: "Ruoholahden nuorisotalo",
              },
              maxPersons: 80,
              location: {
                addressStreet: "Messitytönkatu 4",
              },
              images: [],
            },
          },
          {
            node: {
              id: 34,
              name: "Malmin nuorisotalon yläkerta",
              reservationUnitType: {
                id: 3,
                name: "Nuorisopalvelut",
              },
              building: {
                id: 6,
                name: "Malmin nuorisotalo",
              },
              maxPersons: 10,
              location: {
                addressStreet: "Kunnantie 3",
              },
              images: [],
            },
          },
          {
            node: {
              id: 42,
              name: "Jakomäen sydämen olohuone",
              reservationUnitType: {
                id: 3,
                name: "Nuorisopalvelut",
              },
              building: {
                id: 14,
                name: "Jakomäen nuorisotalo",
              },
              maxPersons: 30,
              location: {
                addressStreet: "Jakomäenpolku 6",
              },
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
  graphql.query<SearchFormParamsQuery>("SearchFormParams", (req, res, ctx) => {
    const response = [
      { pk: 1, name: "Tila #1" },
      { pk: 2, name: "Tila #2" },
      { pk: 3, name: "Tila #3" },
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
  }),
];
