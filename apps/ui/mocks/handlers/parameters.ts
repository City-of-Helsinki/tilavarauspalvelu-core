import { graphql } from "msw";
import { Query, CityNodeConnection } from "common/types/gql-types";

// TODO leaving these for now we might need to change them to GQL responses
const getAbilityGroupJSONResponse = [{ id: 1, name: "Keskitaso" }];

const getAgeGroupJSONResponse = [
  { id: 1, minimum: 5, maximum: 8 },
  { id: 2, minimum: 9, maximum: 12 },
  { id: 3, minimum: 12, maximum: 16 },
  { id: 4, minimum: 17, maximum: 20 },
];

const getCityJSONResponse = [{ id: 1, name: "Helsinki" }];

const getTypeJSONResponse = [
  { id: 1, name: "Äänitysstudio" },
  { id: 2, name: "Kokoustila" },
];

const citiesHandler = graphql.query<Query>("Cities", async (_req, res, ctx) => {
  const cities: CityNodeConnection = {
    edges: [
      {
        node: {
          id: "fgh",
          pk: 1,
          municipalityCode: "",
          name: "Helsinki",
          nameFi: "Helsinki",
          nameEn: "Helsinki",
          nameSv: "Helsingfors",
        },
        cursor: "r234rt",
      },
      {
        node: {
          id: "grt",
          pk: 2,
          municipalityCode: "",
          name: "Muu",
          nameFi: "Muu",
          nameEn: "Other",
          nameSv: "Annan",
        },
        cursor: "2rf3",
      },
    ],
    pageInfo: {
      hasNextPage: false,
      hasPreviousPage: false,
    },
  };
  return res(ctx.data({ cities }));
});

export const parameterHandlers = [citiesHandler];
