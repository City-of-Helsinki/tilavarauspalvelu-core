import { type Maybe } from "@/gql/gql-types";

export const searchPrefix = "/search";
export const reservationUnitPrefix = "/reservation-unit";
export const singleSearchPrefix = "/search/single";
export const applicationsPrefix = "/applications";
export const reservationsPrefix = "/reservations";
export const seasonalPrefix = "/recurring";

export const applicationsPath = `${applicationsPrefix}/`;
export const reservationsPath = `${reservationsPrefix}/`;

export function getApplicationRoundPath(
  pk: Maybe<number> | undefined,
  page?: string | undefined
): string {
  if (pk == null) {
    return "";
  }
  return `${seasonalPrefix}/${pk}/${page ?? ""}`;
}

export function getSeasonalSearchPath(
  pk: Maybe<number> | undefined,
  params?: URLSearchParams
): string {
  if (pk == null) {
    return "";
  }
  const base = `${seasonalPrefix}/${pk}`;

  if (params && Object.keys(params).length > 0) {
    return `${base}?${params.toString()}`;
  }

  return base;
}

export function getSingleSearchPath(params?: URLSearchParams): string {
  const base = `${singleSearchPrefix}/`;

  if (params && Object.keys(params).length > 0) {
    return `${base}?${params.toString()}`;
  }

  return base;
}

type ApplicationPages = "page1" | "page2" | "page3" | "view" | "preview";
export function getApplicationPath(
  pk: Maybe<number> | undefined,
  page?: ApplicationPages | undefined
): string {
  if (pk == null) {
    return "";
  }
  return `${applicationsPrefix}/${pk}/${page ?? ""}`;
}

export function getReservationPath(
  pk: Maybe<number> | undefined,
  page?: string | undefined
): string {
  if (pk == null) {
    return "";
  }
  return `${reservationsPrefix}/${pk}/${page ?? ""}`;
}

export function getReservationInProgressPath(
  pk: Maybe<number> | undefined,
  reservationPk: Maybe<number> | undefined
): string {
  if (pk == null || reservationPk == null) {
    return "";
  }
  return `${reservationsPrefix}/${pk}/reservation/${reservationPk}`;
}

export function getReservationUnitPath(pk: Maybe<number> | undefined): string {
  if (pk == null) {
    return "";
  }
  return `${reservationUnitPrefix}/${pk}`;
}
