import type { Maybe } from "@gql/gql-types";
import { isBrowser, PUBLIC_URL } from "./const";

export const APPLICATIONS_URL_PREFIX = "/applications";
export const RESERVATION_UNIT_URL_PREFIX = "/reservation-units";
export const APPLICATION_ROUNDS_URL_PREFIX = "/application-rounds";
export const RESERVATIONS_URL_PREFIX = "/reservations";
export const MY_UNITS_URL_PREFIX = "/my-units";
export const UNITS_URL_PREFIX = "/units";
export const BANNER_NOTIFICATIONS_URL_PREFIX = "/notifications";
export const REQUESTED_RESERVATIONS_URL_PREFIX = "/reservations/requested";
const LOCAL_CLIENT_BASE_URL = "http://localhost:3000";

type ApplicationRoundPages = "criteria" | "";
/**
 * Builds a URL for an application round page
 * @param applicationRoundId - Application round primary key
 * @param page - Optional page within the application round (e.g., "criteria")
 * @returns URL path string, or empty string if applicationRoundId is invalid
 */
export function getApplicationRoundUrl(
  applicationRoundId: Maybe<number> | undefined,
  page: ApplicationRoundPages = ""
): string {
  if (applicationRoundId == null || !(applicationRoundId > 0)) {
    return "";
  }
  return `${APPLICATION_ROUNDS_URL_PREFIX}/${applicationRoundId}/${page}`;
}

/**
 * Builds a URL for a reservation page
 * @param pk - Reservation primary key
 * @param includePrefix - If true, includes PUBLIC_URL prefix (for anchor or vanilla JS route manipulation)
 * @returns URL path string, or empty string if pk is invalid
 * @note Generally never enable includePrefix - use react-router-dom Link/router instead
 */
export function getReservationUrl(pk: Maybe<number> | undefined, includePrefix = false): string {
  if (pk == null || !(pk > 0)) {
    return "";
  }
  const prefix = includePrefix ? PUBLIC_URL : "";
  return `${prefix}${RESERVATIONS_URL_PREFIX}/${pk}`;
}

/**
 * Builds a URL for an application page with optional section anchor
 * @param pk - Application primary key
 * @param sectionPk - Optional section primary key (added as URL hash/anchor)
 * @returns URL path string with section hash if provided, or empty string if pk is invalid
 */
export function getApplicationUrl(pk: Maybe<number> | undefined, sectionPk?: Maybe<number>): string {
  if (pk == null || !(pk > 0)) {
    return "";
  }
  const baseUrl = `${APPLICATIONS_URL_PREFIX}/${pk}`;
  if (sectionPk == null || !(sectionPk > 0)) {
    return baseUrl;
  }
  return `${baseUrl}#${sectionPk}`;
}

/**
 * Builds a URL for a reservation unit page
 * @param unitPk - Unit primary key
 * @param reservationUnitPk - Reservation unit primary key or "new" for creating new unit
 * @returns URL path string, or empty string if both pks are null/invalid
 */
export function getReservationUnitUrl(
  unitPk: Maybe<number> | undefined,
  reservationUnitPk: Maybe<number> | "new" | undefined = "new"
): string {
  if (unitPk == null && (reservationUnitPk == null || reservationUnitPk === "new")) {
    return "";
  } else if (unitPk == null || unitPk <= 0) {
    return `${RESERVATION_UNIT_URL_PREFIX}/${reservationUnitPk}`;
  }
  return `${UNITS_URL_PREFIX}/${unitPk}/reservation-units/${reservationUnitPk}`;
}

/**
 * Builds a URL for the spaces and resources page of a unit
 * @param unitPk - Unit primary key
 * @returns URL path string, or empty string if unitPk is null/undefined
 */
export function getSpacesResourcesUrl(unitPk: Maybe<number> | undefined): string {
  if (unitPk == null) {
    return "";
  }
  return `${UNITS_URL_PREFIX}/${unitPk}/spaces-resources`;
}

/**
 * Builds a URL for a space page
 * @param spacePk - Space primary key
 * @param unitPk - Unit primary key
 * @returns URL path string, or empty string if either pk is null/undefined
 */
export function getSpaceUrl(spacePk: Maybe<number> | undefined, unitPk: Maybe<number> | undefined): string {
  if (spacePk == null || unitPk == null) {
    return "";
  }
  return `${UNITS_URL_PREFIX}/${unitPk}/spaces/${spacePk}`;
}

/**
 * Builds a URL for a resource page
 * @param resourcePk - Resource primary key
 * @param unitPk - Unit primary key
 * @returns URL path string, or empty string if either pk is null/undefined
 */
export function getResourceUrl(resourcePk: Maybe<number> | undefined, unitPk: Maybe<number> | undefined): string {
  if (resourcePk == null || unitPk == null) {
    return "";
  }
  return `${UNITS_URL_PREFIX}/${unitPk}/resources/${resourcePk}`;
}

type UnitPage = "spaces-resources" | "";
/**
 * Builds a URL for a unit page
 * @param unitPk - Unit primary key
 * @param page - Optional page within the unit (e.g., "spaces-resources")
 * @returns URL path string
 */
export function getUnitUrl(unitPk: Maybe<number> | undefined, page?: UnitPage): string {
  return `${UNITS_URL_PREFIX}/${unitPk}/${page ?? ""}`;
}

/**
 * Builds a URL for a unit in the "my units" section
 * @param unitPk - Unit primary key
 * @returns URL path string
 */
export function getMyUnitUrl(unitPk: Maybe<number> | undefined): string {
  return `${MY_UNITS_URL_PREFIX}/${unitPk}`;
}

type SeriesPage = "completed";
/**
 * Builds a URL for a reservation series page
 * @param unitPk - Unit primary key
 * @param seriesPk - Optional reservation series primary key
 * @param page - Optional page within the series (e.g., "completed")
 * @returns URL path string, or empty string if unitPk is invalid
 */
export function getReservationSeriesUrl(
  unitPk: Maybe<number> | undefined,
  seriesPk?: Maybe<number>,
  page?: SeriesPage
): string {
  if (unitPk == null || !(Number(unitPk) > 0)) {
    return "";
  }
  if (seriesPk != null && seriesPk > 0) {
    return `${MY_UNITS_URL_PREFIX}/${unitPk}/recurring/${seriesPk}/${page ?? ""}`;
  }
  return `${MY_UNITS_URL_PREFIX}/${unitPk}/recurring`;
}

/**
 * Builds a URL for the banner notifications list page
 * @returns URL path string for notifications list
 */
export function getNotificationListUrl(): string {
  return BANNER_NOTIFICATIONS_URL_PREFIX;
}

/**
 * Builds a URL for a specific banner notification page
 * @param pk - Notification primary key
 * @returns URL path string, or empty string if pk is invalid
 */
export function getNotificationUrl(pk: Maybe<number> | undefined): string {
  if (pk == null || !(pk > 0)) {
    return "";
  }
  return `${BANNER_NOTIFICATIONS_URL_PREFIX}/${pk}`;
}

/**
 * Gets the customer-facing app base URL
 * Returns localhost URL in development, otherwise uses window.location.origin
 * @returns Base URL string for customer app, or empty string on server
 */
function getCustomerUrl(): string {
  if (!isBrowser) {
    return "";
  }
  // Return the localhost client side base URL if in dev environment, to ease with development & testing
  return process.env.NODE_ENV === "development" ? LOCAL_CLIENT_BASE_URL : window.location.origin;
}

/**
 * Builds a URL for the accessibility terms page on the customer app
 * @returns URL string for accessibility terms admin page
 */
export function getAccessibilityTermsUrl(): string {
  return `${getCustomerUrl()}/terms/accessibility-admin`;
}

/**
 * Builds a URL for editing opening hours in the backend system
 * @param apiBaseUrl - Base URL of the API
 * @param reservationUnitPk - Reservation unit primary key(s) to edit opening hours for
 * @param errorUrl - Optional URL to redirect to on error
 * @returns URL string for opening hours editor, or empty string if invalid parameters
 */
export function getOpeningHoursUrl(
  apiBaseUrl: string,
  reservationUnitPk: number | number[] | null,
  errorUrl?: string
): string {
  let reservationUnitsParam = "";
  if (Array.isArray(reservationUnitPk)) {
    reservationUnitPk.filter((pk) => pk > 0);
    if (reservationUnitPk.length === 0) {
      return "";
    }
    reservationUnitsParam = reservationUnitPk.join(",");
  } else if (reservationUnitPk == null || !(reservationUnitPk > 0)) {
    return "";
  } else {
    reservationUnitsParam = reservationUnitPk.toString();
  }
  try {
    const url = new URL(`/v1/edit_opening_hours/`, apiBaseUrl);
    const { searchParams } = url;
    searchParams.set("reservation_units", reservationUnitsParam);
    if (errorUrl) {
      searchParams.set("redirect_on_error", errorUrl);
    }
    return url.toString();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
  }
  return "";
}
