import { type Maybe } from "@gql/gql-types";
import { PUBLIC_URL } from "./const";

export const APPLICATIONS_URL_PREFIX = "/applications";
export const RESERVATION_UNIT_URL_PREFIX = "/reservation-units";
export const APPLICATION_ROUNDS_URL_PREFIX = "/application-rounds";
export const RESERVATIONS_URL_PREFIX = "/reservations";
export const MY_UNITS_URL_PREFIX = "/my-units";
export const UNITS_URL_PREFIX = "/units";
export const BANNER_NOTIFICATIONS_URL_PREFIX = "/notifications";
export const REQUESTED_RESERVATIONS_URL_PREFIX = "/reservations/requested";

type ApplicationRoundPages = "criteria" | "";
export function getApplicationRoundUrl(
  applicationRoundId: Maybe<number> | undefined,
  page: ApplicationRoundPages = ""
): string {
  if (applicationRoundId == null || !(applicationRoundId > 0)) {
    return "";
  }
  return `${APPLICATION_ROUNDS_URL_PREFIX}/${applicationRoundId}/${page}`;
}

/// @param pk is the primary key of the reservation
/// @param includePrefix is for anchor or vanilla js route manipulation
/// @returns the url for the reservation
/// Generally never enable includePrefix use react-router-dom link / router instead.
export function getReservationUrl(pk: Maybe<number> | undefined, includePrefix = false): string {
  if (pk == null || !(pk > 0)) {
    return "";
  }
  const prefix = includePrefix ? PUBLIC_URL : "";
  return `${prefix}${RESERVATIONS_URL_PREFIX}/${pk}`;
}

export function getApplicationUrl(pk: Maybe<number> | undefined, sectionPk?: Maybe<number> | undefined): string {
  if (pk == null || !(pk > 0)) {
    return "";
  }
  const baseUrl = `${APPLICATIONS_URL_PREFIX}/${pk}`;
  if (sectionPk == null || !(sectionPk > 0)) {
    return baseUrl;
  }
  return `${baseUrl}#${sectionPk}`;
}

export function getReservationUnitUrl(
  reservationUnitPk: Maybe<number> | undefined,
  unitPk: Maybe<number> | undefined
): string {
  if (unitPk == null) {
    return "";
  }
  return `${UNITS_URL_PREFIX}/${unitPk}/reservation-unit/${reservationUnitPk ?? ""}`;
}

export function getSpacesResourcesUrl(unitPk: Maybe<number> | undefined): string {
  if (unitPk == null) {
    return "";
  }
  return `${UNITS_URL_PREFIX}/${unitPk}/spaces-resources`;
}

export function getSpaceUrl(spacePk: Maybe<number> | undefined, unitPk: Maybe<number> | undefined): string {
  if (spacePk == null || unitPk == null) {
    return "";
  }
  return `${UNITS_URL_PREFIX}/${unitPk}/spaces/${spacePk}`;
}

export function getResourceUrl(resourcePk: Maybe<number> | undefined, unitPk: Maybe<number> | undefined): string {
  if (resourcePk == null || unitPk == null) {
    return "";
  }
  return `${UNITS_URL_PREFIX}/${unitPk}/resources/${resourcePk}`;
}

type UnitPage = "spaces-resources" | "";
export function getUnitUrl(unitPk: Maybe<number> | undefined, page?: UnitPage): string {
  return `${UNITS_URL_PREFIX}/${unitPk}/${page ?? ""}`;
}

export function getMyUnitUrl(unitPk: Maybe<number> | undefined): string {
  return `${MY_UNITS_URL_PREFIX}/${unitPk}`;
}

type SeriesPage = "completed";
export function getReservationSeriesUrl(
  unitPk: Maybe<number> | undefined,
  seriesPk?: Maybe<number> | undefined,
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

export function getNotificationListUrl(): string {
  return `${BANNER_NOTIFICATIONS_URL_PREFIX}`;
}

export function getNotificationUrl(pk: Maybe<number> | undefined): string {
  if (pk == null || !(pk > 0)) {
    return "";
  }
  return `${BANNER_NOTIFICATIONS_URL_PREFIX}/${pk}`;
}
