import { type Maybe } from "@/gql/gql-types";

export const reservationUnitPrefix = "/reservation-unit";
export const singleSearchPrefix = "/search";
export const applicationsPrefix = "/applications";
export const reservationsPrefix = "/reservations";
export const seasonalPrefix = "/recurring";

export const applicationsPath = `${applicationsPrefix}/`;
export const reservationsPath = `${reservationsPrefix}/`;

type ApplicationRoundPages = "criteria";
export function getApplicationRoundPath(
  pk: Maybe<number> | undefined,
  page?: ApplicationRoundPages | undefined
): string {
  if (pk == null) {
    return "";
  }
  return `${seasonalPrefix}/${pk}/${page ?? ""}`;
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

type ApplicationReservationPages = "cancel";
export function getApplicationReservationPath(
  applicationPk: Maybe<number> | undefined,
  reservationPk: Maybe<number> | undefined,
  page: ApplicationReservationPages = "cancel"
): string {
  if (applicationPk == null || reservationPk == null) {
    return "";
  }
  return `${getApplicationPath(applicationPk)}reservations/${reservationPk}/${page}`;
}

type ApplicationSectionPages = "view" | "cancel";
export function getApplicationSectionPath(
  sectionPk: Maybe<number> | undefined,
  applicationPk: Maybe<number> | undefined,
  page: ApplicationSectionPages = "view"
): string {
  if (applicationPk == null || sectionPk == null) {
    return "";
  }
  return `${getApplicationPath(applicationPk)}sections/${sectionPk}/${page}`;
}

type ReservationPages = "cancel" | "edit" | "confirmation";
export function getReservationPath(
  pk: Maybe<number> | undefined,
  page?: ReservationPages | undefined
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
