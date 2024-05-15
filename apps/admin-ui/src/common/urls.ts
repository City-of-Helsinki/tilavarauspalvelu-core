import { type Maybe } from "@gql/gql-types";
import { PUBLIC_URL } from "./const";

export const prefixes = {
  recurringReservations: "/recurring-reservations",
  reservations: "/reservations",
  applications: "/application",
  reservationUnits: "/reservation-units",
};

export const applicationRoundUrl = (
  applicationRoundId: number | string
): string =>
  `${prefixes.recurringReservations}/application-rounds/${applicationRoundId}`;

export const reservationUrl = (reservationId: number | string): string =>
  `${prefixes.reservations}/${reservationId}`;

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

export const reservationUnitsUrl = `/premises-and-settings/reservation-units`;

// Weird why the other urls are not relative to PUBLIC_URL
// This is passed as Link href
export function getApplicationSectionUrl(
  applicationPk: Maybe<number> | undefined,
  sectionPk: Maybe<number> | undefined
) {
  if (applicationPk == null || sectionPk == null) {
    return "";
  }
  if (applicationPk < 1 || sectionPk < 1) {
    return "";
  }
  return `${PUBLIC_URL}/application/${applicationPk}/details#${sectionPk}`;
}
