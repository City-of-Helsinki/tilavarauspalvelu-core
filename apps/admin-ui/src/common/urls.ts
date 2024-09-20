import { type Maybe } from "@gql/gql-types";
import { PUBLIC_URL } from "./const";

export const applicationsUrl = "/applications";
export const reservationUnitsUrl = "/reservation-units";
export const singleUnitUrl = "/unit";
export const applicationRoundsUrl = "/application-rounds";
export const unitsUrl = "/units";
export const bannerNotificationsUrl = "/messaging/notifications";
export const requestedReservationsUrl = "/reservations/requested";
export const reservationsUrl = "/reservations";
export const allReservationsUrl = "/reservations/all";
export const myUnitsUrl = "/my-units";

export function getApplicationRoundUrl(
  applicationRoundId: Maybe<number> | undefined
): string {
  if (applicationRoundId == null || !(applicationRoundId > 0)) {
    return "";
  }
  return `${applicationRoundsUrl}/${applicationRoundId}`;
}

/// @param pk is the primary key of the reservation
/// @param includePrefix is for anchor or vanilla js route manipulation
/// @returns the url for the reservation
/// Generally never enable includePrefix use react-router-dom link / router instead.
export function getReservationUrl(
  pk: Maybe<number> | undefined,
  includePrefix = false
): string {
  if (pk == null || !(pk > 0)) {
    return "";
  }
  const prefix = includePrefix ? PUBLIC_URL : "";
  return `${prefix}${reservationsUrl}/${pk}`;
}

export function getApplicationUrl(
  pk: Maybe<number> | undefined,
  sectionPk?: Maybe<number> | undefined
): string {
  if (pk == null || !(pk > 0)) {
    return "";
  }
  const baseUrl = `${applicationsUrl}/${pk}`;
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
  return `/unit/${unitPk}/reservationUnit/${reservationUnitPk ?? ""}`;
}

export function getSpacesResourcesUrl(
  unitPk: Maybe<number> | undefined
): string {
  if (unitPk == null) {
    return "";
  }
  return `/unit/${unitPk}/spacesResources`;
}

export function getSpaceUrl(
  spacePk: Maybe<number> | undefined,
  unitPk: Maybe<number> | undefined
): string {
  if (spacePk == null || unitPk == null) {
    return "";
  }
  return `/unit/${unitPk}/space/${spacePk}`;
}

export function getResourceUrl(
  resourcePk: Maybe<number> | undefined,
  unitPk: Maybe<number> | undefined
): string {
  if (resourcePk == null || unitPk == null) {
    return "";
  }
  return `/unit/${unitPk}/resource/${resourcePk}`;
}

export function getUnitUrl(unitPk: Maybe<number> | undefined): string {
  return `/unit/${unitPk}`;
}

export function getMyUnitUrl(unitPk: Maybe<number> | undefined): string {
  return `/my-units/${unitPk}`;
}

export function getRecurringReservationUrl(
  pk: Maybe<string | number> | undefined
): string {
  if (pk == null || !(Number(pk) > 0)) {
    return "";
  }
  return `/my-units/${pk}/recurring`;
}
