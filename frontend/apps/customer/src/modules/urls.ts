import type { Maybe } from "@gql/gql-types";

export const reservationUnitPrefix = "/reservation-unit";
export const singleSearchPrefix = "/search";
export const applicationsPrefix = "/applications";
export const reservationsPrefix = "/reservations";
export const seasonalPrefix = "/recurring";

export const applicationsPath = `${applicationsPrefix}/`;
export const reservationsPath = `${reservationsPrefix}/`;

type ApplicationRoundPages = "criteria";

/**
 * Builds a URL path for an application round page
 * @param pk - Application round primary key
 * @param page - Optional page within the application round (e.g., "criteria")
 * @returns URL path string, or empty string if pk is null/undefined
 */
export function getApplicationRoundPath(pk: Maybe<number> | undefined, page?: ApplicationRoundPages): string {
  if (pk == null) {
    return "";
  }
  return `${seasonalPrefix}/${pk}/${page ?? ""}`;
}

/**
 * Builds a URL path for the single search page with optional query parameters
 * @param params - Optional URL search parameters to append to the path
 * @returns URL path string with query parameters if provided
 */
export function getSingleSearchPath(params?: URLSearchParams): string {
  const base = `${singleSearchPrefix}/`;

  if (params != null) {
    return `${base}?${params.toString()}`;
  }

  return base;
}

type ApplicationPages = "page1" | "page2" | "page3" | "page4" | "view" | "sent";

/**
 * Builds a URL path for an application page
 * @param pk - Application primary key
 * @param page - Optional page within the application (e.g., "page1", "view", "sent")
 * @returns URL path string, or empty string if pk is null/undefined
 */
export function getApplicationPath(pk: Maybe<number> | undefined, page?: ApplicationPages): string {
  if (pk == null) {
    return "";
  }
  return `${applicationsPrefix}/${pk}/${page ?? ""}`;
}

type ApplicationReservationPages = "cancel";
/**
 * Builds a URL path for an application reservation page
 * @param applicationPk - Application primary key
 * @param reservationPk - Reservation primary key
 * @param page - Page within the reservation (defaults to "cancel")
 * @returns URL path string, or empty string if either pk is null/undefined
 */
export function getApplicationReservationPath(
  applicationPk: Maybe<number> | undefined,
  reservationPk: Maybe<number> | undefined,
  page: ApplicationReservationPages = "cancel"
): string {
  if (applicationPk == null || reservationPk == null) {
    return "";
  }
  return `${getApplicationPath(applicationPk)}reservations/${reservationPk}/${page}`;
}

type ApplicationSectionPages = "view" | "cancel";
/**
 * Builds a URL path for an application section page
 * @param sectionPk - Application section primary key
 * @param applicationPk - Application primary key
 * @param page - Page within the section (defaults to "view")
 * @returns URL path string, or empty string if either pk is null/undefined
 */
export function getApplicationSectionPath(
  sectionPk: Maybe<number> | undefined,
  applicationPk: Maybe<number> | undefined,
  page: ApplicationSectionPages = "view"
): string {
  if (applicationPk == null || sectionPk == null) {
    return "";
  }
  return `${getApplicationPath(applicationPk)}sections/${sectionPk}/${page}`;
}

type ReservationPages = "cancel" | "edit";
export type ReservationNotifications = "requires_handling" | "confirmed" | "paid" | "polling_timeout";
/**
 * Builds a URL path for a reservation page with optional notification parameter
 * @param pk - Reservation primary key
 * @param page - Optional page within the reservation (e.g., "cancel", "edit")
 * @param notify - Optional notification type to display
 * @returns URL path string with query parameter if notify is provided, or empty string if pk is null/undefined
 */
export function getReservationPath(
  pk: Maybe<number> | undefined,
  page?: ReservationPages,
  notify?: ReservationNotifications
): string {
  if (pk == null) {
    return "";
  }
  return `${reservationsPrefix}/${pk}/${page ?? ""}${notify != null ? `?notify=${notify}` : ""}`;
}

/**
 * Builds a URL path for a reservation that is in progress (being created)
 * @param pk - Reservation unit primary key
 * @param reservationPk - Reservation primary key
 * @param step - Optional step number in the reservation process (0 or 1)
 * @returns URL path string with step query parameter if provided, or empty string if either pk is null/undefined
 */
export function getReservationInProgressPath(
  pk: Maybe<number> | undefined,
  reservationPk: Maybe<number> | undefined,
  step?: 0 | 1
): string {
  if (pk == null || reservationPk == null) {
    return "";
  }
  return `${reservationUnitPrefix}/${pk}/reservation/${reservationPk}${step != null ? `?step=${step}` : ""}`;
}

/**
 * Builds a URL path for a reservation unit page with optional query parameters
 * @param pk - Reservation unit primary key
 * @param params - Optional URL search parameters to append
 * @returns URL path string with query parameters if provided, or empty string if pk is null/undefined
 */
export function getReservationUnitPath(pk: Maybe<number> | undefined, params?: Readonly<URLSearchParams>): string {
  if (pk == null) {
    return "";
  }
  return `${reservationUnitPrefix}/${pk}?${params?.toString() ?? ""}`;
}

/**
 * Builds a feedback URL with the current language parameter
 * @param feedbackUrl - Base feedback URL string
 * @param i18n - Internationalization object containing the current language
 * @returns Feedback URL with language parameter, or null if URL is invalid
 */
export function getFeedbackUrl(feedbackUrl: string, i18n: { language: string }) {
  try {
    const url = new URL(feedbackUrl);
    url.searchParams.set("lang", i18n.language);
    return url.toString();
  } catch {
    return null;
  }
}
