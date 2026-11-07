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

// The server timeouts must stay below the gateway timeout, so we can show an error page and not a 504.
// The backend is in the same cluster, so the network adds almost no time.

/// Timeout for one backend request made by the proxy middleware.
/// The middleware runs on every page request and its queries are small, so this is short.
export const MIDDLEWARE_FETCH_TIMEOUT_MS = 2000;

/// Timeout for one query made by the Next.js server, in getServerSideProps and getInitialProps.
export const SERVER_QUERY_TIMEOUT_MS = 10_000;

/// Timeout for one mutation made by the Next.js server, in getServerSideProps.
/// Some mutations call external services, for example the webshop (15 second timeout in the backend).
/// After a timeout the backend can still complete the mutation, so this must be longer than those calls.
export const SERVER_MUTATION_TIMEOUT_MS = 20_000;

/// Default timeout for one backend request made by the browser.
/// The user can have a slow connection, so this is longer than the server timeouts.
/// Slow mutations run as background tasks that the client polls, so no request should take longer.
/// Override it at runtime with the CLIENT_FETCH_TIMEOUT_MS environment variable.
export const CLIENT_FETCH_TIMEOUT_MS = 30_000;

/// Timeout for a file upload from the browser.
/// The timeout includes the time to send the file, so it must be longer than CLIENT_FETCH_TIMEOUT_MS.
export const CLIENT_UPLOAD_TIMEOUT_MS = 300_000;
