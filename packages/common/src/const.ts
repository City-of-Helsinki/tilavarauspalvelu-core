import { State } from "../gql/gql-types";

export const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6] as const;

export const genericTermsVariant = {
  BOOKING: "booking",
  SERVICE: "service",
  PRIVACY: "privacy",
  ACCESSIBILITY: "accessibility",
};

export const RELATED_RESERVATION_STATES: State[] = [
  State.Created,
  State.Confirmed,
  State.RequiresHandling,
  State.WaitingForPayment,
];
