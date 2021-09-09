import { graphql, rest } from "msw";
import { ReservationUnit } from "../modules/types";

type Variables = {
  pk: number;
};

type Vars = {
  id: string;
};

type ReturnType = {
  reservationUnit: ReservationUnit;
};

export const handlers = [
  graphql.query<ReturnType, Variables>(
    "SelectedReservationUnit",
    async (req, res, ctx) => {
      const { pk: id } = req.variables;

      const response = id
        ? await import(`../cypress/fixtures/query/reservationUnit/${id}.json`)
        : Promise.resolve();

      const reservationUnit = await response;
      return res(ctx.data({ reservationUnit }));
    }
  ),
  rest.get<ReturnType, Vars>(
    "*/v1/reservation_unit/:id",
    async (req, res, ctx) => {
      const { id } = req.params;

      const response = id
        ? await import(`../cypress/fixtures/rest/reservationUnit/${id}.json`)
        : Promise.resolve();

      const reservationUnit = await response;
      return res(ctx.json(reservationUnit));
    }
  ),
];
