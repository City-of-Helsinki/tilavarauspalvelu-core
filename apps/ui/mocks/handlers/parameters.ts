import { graphql } from "msw";
import { Query, CityNodeConnection } from "common/types/gql-types";

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
