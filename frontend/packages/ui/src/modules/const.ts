import { ReservationStateChoice, Weekday } from "../../gql/gql-types";

export const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6] as const;
export type DayT = (typeof WEEKDAYS)[number];

export const WEEKDAYS_SORTED: Weekday[] = [
  Weekday.Monday,
  Weekday.Tuesday,
  Weekday.Wednesday,
  Weekday.Thursday,
  Weekday.Friday,
  Weekday.Saturday,
  Weekday.Sunday,
];

export const genericTermsVariant = {
  BOOKING: "booking",
  SERVICE: "service",
  PRIVACY: "privacy",
  ACCESSIBILITY: "accessibility",
} as const;

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

export const pixel = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";

export const EXPECTED_TIMEZONE = "Europe/Helsinki";

/// Timeout for one backend request made by the Next.js server (SSR and the proxy middleware).
/// The backend is in the same cluster, so a normal query takes much less time than this.
/// It must stay well below the gateway timeout, so we can show an error page and not a 504.
export const SERVER_FETCH_TIMEOUT_MS = 2000;

/// Default timeout for one backend request made by the browser.
/// The user can have a slow connection, so this is much longer than the server timeout.
/// Slow mutations run as background tasks that the client polls, so no request should take longer.
/// Override it at runtime with the CLIENT_FETCH_TIMEOUT_MS environment variable.
export const CLIENT_FETCH_TIMEOUT_MS = 30_000;

/// Timeout for a file upload from the browser.
/// The timeout includes the time to send the file, so it must be longer than CLIENT_FETCH_TIMEOUT_MS.
export const CLIENT_UPLOAD_TIMEOUT_MS = 300_000;
