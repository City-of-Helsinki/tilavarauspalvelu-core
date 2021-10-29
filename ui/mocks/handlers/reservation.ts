import { graphql } from "msw";
import {
  ReservationCreateMutationInput,
  ReservationCreateMutationPayload,
  ReservationUpdateMutationInput,
} from "../../modules/gql-types";

const createReservation = graphql.mutation<
  { createReservation: ReservationCreateMutationPayload },
  { input: ReservationCreateMutationInput }
>("createReservation", (req, res, ctx) => {
  return res(
    ctx.data({
      createReservation: {
        pk: 42,
        errors: null,
      },
    })
  );
});

const updateReservation = graphql.mutation<
  { updateReservation: unknown },
  { input: ReservationUpdateMutationInput }
>("updateReservation", (req, res, ctx) => {
  const { input } = req.variables;
  return res(
    ctx.data({
      updateReservation: {
        reservation: {
          pk: input.pk,
          calendarUrl: `http://calendarUrl/${input.pk}`,
        },
      },
    })
  );
});

export const reservationHandlers = [createReservation, updateReservation];
