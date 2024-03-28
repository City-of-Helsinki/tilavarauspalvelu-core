import { type Maybe } from "common/types/gql-types";

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

export const applicationUrl = (applicationId: number | string): string =>
  `${prefixes.applications}/${applicationId}`;

export const reservationUrl = (reservationId: number | string): string =>
  `${prefixes.reservations}/${reservationId}`;

export const requestedReservationsUrl = (): string =>
  `${prefixes.reservations}/requested`;

export const applicationDetailsUrl = (applicationId: number | string): string =>
  `${prefixes.applications}/${applicationId}/details`;

export const applicationRoundApplications = (
  applicationRoundId: number | string | null
): string => `${applicationRoundUrl(String(applicationRoundId))}/applications`;

export const reservationUnitUrl = (
  reservationUnitId: number,
  unitId: number
): string => `/unit/${unitId}/reservationUnit/edit/${reservationUnitId}`;

// @deprecated
export const spaceUrl = (spacePk: number, unitPk: number): string =>
  getSpaceUrl(spacePk, unitPk);

export function getSpaceUrl(
  spacePk: Maybe<number> | undefined,
  unitPk: Maybe<number> | undefined
): string {
  if (spacePk == null || unitPk == null) {
    return "";
  }
  return `/unit/${unitPk}/space/edit/${spacePk}`;
}

// @deprecated
export const resourceUrl = (resourcePk: number, unitPk: number): string =>
  getResourceUrl(resourcePk, unitPk);

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

export const myReservationUnitUrl = (
  unitId: number,
  reservationUnitId: number
): string => `${myUnitUrl(unitId)}/${reservationUnitId}`;

export const reservationUnitsUrl = `/premises-and-settings/reservation-units`;
