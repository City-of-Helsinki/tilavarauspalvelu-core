import { graphql } from "msw";
import { ReservationUnit } from "../../modules/types";

type Variables = {
  pk: number;
};

type ReturnType = {
  reservationUnit: ReservationUnit;
};

export const reservationUnitHandlers = [
  graphql.query<ReturnType, Variables>(
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
];
