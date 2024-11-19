import { type Maybe } from "@/gql/gql-types";

export const reservationUnitPrefix = "/reservation-unit";
export const singleSearchPrefix = "/search/single";
export const applicationsPrefix = "/applications";
export const reservationsPrefix = "/reservations";
export const seasonalPrefix = "/recurring";

export const applicationsPath = `${applicationsPrefix}/`;
export const reservationsPath = `${reservationsPrefix}/`;

export function getApplicationRoundPath(
  id: Maybe<number> | undefined,
  page?: string | undefined
): string {
  if (id == null) {
    return "";
  }
  return `${seasonalPrefix}/${id}/${page ?? ""}`;
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

  if (params != null) {
    return `${base}?${params.toString()}`;
  }

  return base;
}

type ApplicationPages =
  | "page1"
  | "page2"
  | "page3"
  | "view"
  | "preview"
  | "sent";
export function getApplicationPath(
  pk: Maybe<number> | undefined,
  page?: ApplicationPages | undefined
): string {
  if (pk == null) {
    return "";
  }
  return `${applicationsPrefix}/${pk}/${page ?? ""}`;
}

export function getApplicationSectionPath(
  sectionPk: Maybe<number> | undefined,
  applicationPk: Maybe<number> | undefined
): string {
  if (applicationPk == null || sectionPk == null) {
    return "";
  }
  return `${getApplicationPath(applicationPk, "view")}/${sectionPk}`;
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
  return `${reservationUnitPrefix}/${pk}/reservation/${reservationPk}`;
}

export function getReservationUnitPath(pk: Maybe<number> | undefined): string {
  if (pk == null) {
    return "";
  }
  return `${reservationUnitPrefix}/${pk}`;
}
