import { publicUrl } from "./const";

export const prefixes = {
  recurringReservations: "/recurring-reservations",
  reservations: "/reservations",
  applications: "/application",
  reservationUnits: "/reservation-units",
};

export const applicationRoundUrl = (
  applicationRoundId: number | string
): string =>
  `${publicUrl}${prefixes.recurringReservations}/application-rounds/${applicationRoundId}`;

export const applicationUrl = (applicationId: number | string): string =>
  `${publicUrl}${prefixes.applications}/${applicationId}`;

export const reservationUrl = (reservationId: number | string): string =>
  `${publicUrl}${prefixes.reservations}/${reservationId}`;

export const requestedReservationsUrl = (): string =>
  `${publicUrl}${prefixes.reservations}/requested`;

export const applicationDetailsUrl = (applicationId: number | string): string =>
  `${publicUrl}${prefixes.applications}/${applicationId}/details`;

export const applicationRoundApplications = (
  applicationRoundId: number | string | null
): string => `${applicationRoundUrl(String(applicationRoundId))}/applications`;

export const reservationUnitUrl = (
  reservationUnitId: number,
  unitId: number
): string =>
  `${publicUrl}/unit/${unitId}/reservationUnit/edit/${reservationUnitId}`;

export const unitUrl = (unitId: number): string =>
  `${publicUrl}/unit/${unitId}`;
