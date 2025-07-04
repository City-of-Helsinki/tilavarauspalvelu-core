import { format, getDay, isSameDay, parseISO } from "date-fns";
import { trim } from "lodash-es";
import {
  type Maybe,
  type ReservationNode,
  ReservationTypeChoice,
  type LocationFieldsFragment,
  type ReservationCommonFieldsFragment,
} from "@gql/gql-types";
import type { TFunction } from "next-i18next";
import { toMondayFirstUnsafe, truncate } from "common/src/helpers";

export const DATE_FORMAT = "d.M.yyyy";
export const DATE_FORMAT_SHORT = "d.M.";

/// @deprecated use format directly
/// why convert date -> string -> date?
export function formatDate(date: string | null | undefined, outputFormat = DATE_FORMAT): string | null {
  return date ? format(parseISO(date), outputFormat) : null;
}

export function formatTime(date: string | null | undefined, outputFormat = "HH:mm"): string | null {
  return date ? format(parseISO(date), outputFormat) : null;
}

// TODO why is this taking in a string?
export function formatDateTime(date: string): string {
  return `${formatDate(date)} ${formatTime(date)}`;
}

// TODO move to common and combine with ui (requires i18n changes: replace messages.ts with json)
export function formatDateTimeRange(t: TFunction, start: Date, end: Date): string {
  const startDay = t(`dayShort.${toMondayFirstUnsafe(getDay(start))}`);

  if (isSameDay(start, end)) {
    return `${startDay} ${format(start, DATE_FORMAT)} ${format(start, "HH:mm")}–${format(end, "HH:mm")}`;
  }

  return `${format(start, DATE_FORMAT)} ${format(start, "HH:mm")}–${format(end, "HH:mm")} ${format(end, "HH:mm")}`;
}

export function formatDateRange(t: TFunction, start: Date, end: Date): string {
  const startDay = t(`dayShort.${toMondayFirstUnsafe(getDay(start))}`);
  if (isSameDay(start, end)) {
    return `${startDay} ${format(start, DATE_FORMAT)}`;
  }
  return `${startDay} ${format(start, DATE_FORMAT)}–${format(end, DATE_FORMAT)}`;
}

export const formatNumber = (input?: number | null, suffix?: string): string => {
  if (input == null) return "";

  const number = new Intl.NumberFormat("fi").format(input);

  return `${number}${suffix || ""}`;
};

interface IAgeGroups {
  minimum?: number;
  maximum?: number;
}

export function formatAgeGroups(ageGroups: IAgeGroups, t: TFunction): string {
  return t("common.agesSuffix", {
    range: trim(`${ageGroups.minimum || ""}-${ageGroups.maximum || ""}`, "-"),
  });
}

// TODO why have the two separate versions of this? (s)
export function formatAgeGroup(
  group: Maybe<Pick<NonNullable<ReservationNode["ageGroup"]>, "minimum" | "maximum">> | undefined
): string | null {
  return group ? `${group.minimum}-${group.maximum || ""}` : null;
}

export function formatAddress(location: LocationFieldsFragment | null | undefined): string {
  if (!location) {
    return "-";
  }
  const res = trim(`${location.addressStreetFi ?? ""}, ${location.addressZip} ${location.addressCityFi ?? ""}`, ", ");
  if (res === "") {
    return "-";
  }
  return res;
}

export const sortByName = (a?: string, b?: string): number =>
  a && b ? a.toLowerCase().localeCompare(b.toLowerCase()) : !a ? 1 : -1;

export function getTranslatedError(t: TFunction, error: string | undefined): string | undefined {
  if (error == null) {
    return undefined;
  }
  // TODO use a common translation key for these
  return t(`Notifications.form.errors.${error}`);
}

export function getReserveeName(
  reservation: Pick<ReservationCommonFieldsFragment, "reserveeName" | "type">,
  t: TFunction,
  length = 50
): string {
  let prefix = "";
  if (reservation.type === ReservationTypeChoice.Behalf) {
    prefix = t ? t("Reservations.prefixes.behalf") : "";
  }
  if (
    // commented extra condition out for now, as the staff prefix was requested to be used for all staff reservations
    reservation.type === ReservationTypeChoice.Staff /* &&
    reservation.reserveeName ===
      `${reservation.user?.firstName} ${reservation.user?.lastName}` */
  ) {
    prefix = t ? t("Reservations.prefixes.staff") : "";
  }
  return truncate(prefix + (reservation.reserveeName ?? "-"), length);
}
