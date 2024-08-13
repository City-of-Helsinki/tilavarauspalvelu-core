import { type Maybe } from "@gql/gql-types";
import { PUBLIC_URL } from "./const";

export const prefixes = {
  recurringReservations: "/recurring-reservations",
  reservations: "/reservations",
  applications: "/application",
  reservationUnits: "/reservation-units",
};

export const reservationUnitsUrl = "/premises-and-settings/reservation-units";
export const singleUnitUrl = "/unit";
export const applicationRoundsUrl =
  "/recurring-reservations/application-rounds";
export const unitsUrl = "/premises-and-settings/units";
export const bannerNotificationsUrl = "/messaging/notifications";
export const requestedReservationsUrl = "/reservations/requested";
export const reservationsUrl = "/reservations";
export const allReservationsUrl = "/reservations/all";
export const myUnitsUrl = "/my-units";

export const applicationRoundUrl = (
  applicationRoundId: number | string
): string =>
  `${prefixes.recurringReservations}/application-rounds/${applicationRoundId}`;

export function getReservationUrl(pk: Maybe<number> | undefined): string {
  if (pk == null || !(pk > 0)) {
    return "";
  }
  return `${PUBLIC_URL}/${prefixes.reservations}/${pk}`;
}
export const reservationUrl = (reservationId: number | string): string =>
  `${prefixes.reservations}/${reservationId}`;

export function getApplicationUrl(
  pk: Maybe<number> | undefined,
  sectionPk?: Maybe<number> | undefined
): string {
  if (pk == null || !(pk > 0)) {
    return "";
  }
  if (sectionPk == null || !(sectionPk > 0)) {
    return `${prefixes.applications}/${pk}`;
  }
  return `${PUBLIC_URL}/${prefixes.applications}/${pk}/details#${sectionPk}`;
}

export const applicationDetailsUrl = (applicationId: number | string): string =>
  `${prefixes.applications}/${applicationId}/details`;

export const reservationUnitUrl = (
  reservationUnitId: number,
  unitId: number
): string => `/unit/${unitId}/reservationUnit/edit/${reservationUnitId}`;

export function getSpaceUrl(
  spacePk: Maybe<number> | undefined,
  unitPk: Maybe<number> | undefined
): string {
  if (spacePk == null || unitPk == null) {
    return "";
  }
  return `/unit/${unitPk}/space/edit/${spacePk}`;
}

export function getResourceUrl(
  resourcePk: Maybe<number> | undefined,
  unitPk: Maybe<number> | undefined
): string {
  if (resourcePk == null || unitPk == null) {
    return "";
  }
  return `/unit/${unitPk}/resource/edit/${resourcePk}`;
}

export const unitUrl = (unitId: number): string => `/unit/${unitId}`;

// ids start from 1
// fallback to root route instead of alerting on errors
export const myUnitUrl = (unitId: number): string =>
  `/my-units/${!Number.isNaN(unitId) && unitId > 0 ? unitId : ""}`;

// Weird why the other urls are not relative to PUBLIC_URL
// This is passed as Link href
export function getApplicationSectionUrl(
  applicationPk: Maybe<number> | undefined,
  sectionPk: Maybe<number> | undefined
): string {
  if (applicationPk == null || sectionPk == null) {
    return "";
  }
  if (applicationPk < 1 || sectionPk < 1) {
    return "";
  }
  return `${PUBLIC_URL}/application/${applicationPk}/details#${sectionPk}`;
}

// TODO PUBLIC_URL is problematic, it needs to be added when not using react-router or something else?
export function getRecurringReservationUrl(
  pk: Maybe<string | number> | undefined,
  includePrefix = false
): string {
  if (pk == null || !(Number(pk) > 0)) {
    return "";
  }
  const prefix = includePrefix ? PUBLIC_URL : "";
  return `${prefix}/my-units/${pk}/recurring`;
}
