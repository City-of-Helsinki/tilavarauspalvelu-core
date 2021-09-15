import { graphql } from "msw";
import { Promotion, ReservationUnit } from "../modules/types";

type ReservationUnitVariables = {
  pk: number;
};

type ReservationUnitReturn = {
  reservationUnit: ReservationUnit;
};

type PromotionsReturn = {
  promotions: Promotion[];
};

type RecommendationsReturn = {
  recommendations: ReservationUnit[];
};

export const handlers = [
  graphql.query<ReservationUnitReturn, ReservationUnitVariables>(
    "SelectedReservationUnit",
    async (req, res, ctx) => {
      const { pk: id } = req.variables;

      const url = id
        ? `../cypress/fixtures/query/reservationUnit/${id}.json`
        : null;
      const response = id ? await import(url) : Promise.resolve();

      const reservationUnit = await response;
      return res(ctx.data({ reservationUnit }));
    }
  ),
  graphql.query<PromotionsReturn>("Promotions", async (req, res, ctx) => {
    const response =
      await require("../cypress/fixtures/query/promotions/promotions.json");

    const promotions = await response;
    return res(ctx.data({ promotions }));
  }),
  graphql.query<RecommendationsReturn>(
    "Recommendations",
    async (req, res, ctx) => {
      const response =
        await require("../cypress/fixtures/query/recommendations/recommendations.json");

      const recommendations = await response;
      return res(ctx.data({ recommendations }));
    }
  ),
];
