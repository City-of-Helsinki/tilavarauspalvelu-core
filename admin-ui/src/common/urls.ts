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

export const applicationDetailsUrl = (applicationId: number | string): string =>
  `${prefixes.applications}/${applicationId}/details`;

export const applicationRoundApplications = (
  applicationRoundId: number | string | null
): string => `${applicationRoundUrl(String(applicationRoundId))}/applications`;

export const reservationUnitUrl = (
  reservationUnitId: number,
  unitId: number
): string => `/unit/${unitId}/reservationUnit/edit/${reservationUnitId}`;

export const unitUrl = (unitId: number): string => `/unit/${unitId}`;
