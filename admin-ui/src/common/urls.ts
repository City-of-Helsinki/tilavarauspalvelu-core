export const prefixes = {
  recurringReservations: "/recurring-reservations",
  reservations: "/reservations",
  applications: "/application",
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
): string => `${applicationRoundUrl(String(applicationRoundId))}/applicarions`;
