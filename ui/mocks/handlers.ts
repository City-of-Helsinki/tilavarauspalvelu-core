import { graphql } from "msw";
import { ReservationUnit } from "../modules/types";

type Variables = {
  pk: number;
};

type ReturnType = {
  reservationUnit: ReservationUnit;
};

export const handlers = [
  graphql.query<ReturnType, Variables>(
    "SelectedReservationUnit",
    async (req, res, ctx) => {
      const { pk: id } = req.variables;

      const response = await import(
        `../cypress/fixtures/query/reservationUnit/${id}.json`
      );

      const reservationUnit = await response;
      return res(ctx.data({ reservationUnit }));
    }
  ),
];
