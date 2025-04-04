import { ReservationStateChoice } from "../gql/gql-types";

export const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6] as const;

export const genericTermsVariant = {
  BOOKING: "booking",
  SERVICE: "service",
  PRIVACY: "privacy",
  ACCESSIBILITY: "accessibility",
};

export const RELATED_RESERVATION_STATES: ReservationStateChoice[] = [
  ReservationStateChoice.Created,
  ReservationStateChoice.Confirmed,
  ReservationStateChoice.RequiresHandling,
  ReservationStateChoice.WaitingForPayment,
];

export const breakpoints = {
  xs: "320px",
  s: "576px",
  m: "768px",
  l: "992px",
  xl: "1248px",
} as const;

export const pixel =
  "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";
