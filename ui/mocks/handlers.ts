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

      const url = id
        ? `../cypress/fixtures/query/reservationUnit/${id}.json`
        : null;
      const response = id ? await import(url) : Promise.resolve();

      const reservationUnit = await response;
      return res(ctx.data({ reservationUnit }));
    }
  ),
  rest.get<ReturnType, Vars>(
    "*/v1/reservation_unit/:id",
    async (req, res, ctx) => {
      const { id } = req.params;

      const url = id
        ? `../cypress/fixtures/rest/reservationUnit/${id}.json`
        : null;
      const response = id ? await import(url) : Promise.resolve();

      const reservationUnit = await response;
      return res(ctx.json(reservationUnit));
    }
  ),
];
