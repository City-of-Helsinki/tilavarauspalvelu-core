import { format, getDay, isSameDay, parseISO } from "date-fns";
import i18next from "i18next";
import { trim, camelCase, get, pick, zipObject } from "lodash";
import {
  ReservationTypeChoice,
  type LocationFieldsFragment,
  type ReservationCommonFragment,
  type ReservationMetadataFieldNode,
} from "@gql/gql-types";
import { NUMBER_OF_DECIMALS } from "./const";
import type { TFunction } from "next-i18next";
import { toMondayFirstUnsafe, truncate } from "common/src/helpers";
import {
  type ReservationFormType,
  type RecurringReservationForm,
  type ReservationChangeFormType,
} from "@/schemas";

export { formatDuration } from "common/src/common/util";

export const DATE_FORMAT = "d.M.yyyy";
export const DATE_FORMAT_SHORT = "d.M.";

/// @deprecated use format directly
/// why convert date -> string -> date?
export function formatDate(
  date: string | null,
  outputFormat = DATE_FORMAT
): string | null {
  return date ? format(parseISO(date), outputFormat) : null;
}

export function formatTime(
  date: string | null,
  outputFormat = "HH:mm"
): string | null {
  return date ? format(parseISO(date), outputFormat) : null;
}

// TODO why is this taking in a string?
export function formatDateTime(date: string): string {
  return `${formatDate(date)} ${formatTime(date)}`;
}

// TODO move to common and combine with ui (requires i18n changes: replace messages.ts with json)
export function formatDateTimeRange(
  t: TFunction,
  start: Date,
  end: Date
): string {
  const startDay = t(`dayShort.${toMondayFirstUnsafe(getDay(start))}`);

  if (isSameDay(start, end)) {
    return `${startDay} ${format(start, DATE_FORMAT)} ${format(
      start,
      "HH:mm"
    )}–${format(end, "HH:mm")}`;
  }

  return `${format(start, DATE_FORMAT)} ${format(start, "HH:mm")}–${format(
    end,
    "HH:mm"
  )} ${format(end, "HH:mm")}`;
}

export const formatNumber = (
  input?: number | null,
  suffix?: string
): string => {
  if (input == null) return "";

  const number = new Intl.NumberFormat("fi").format(input);

  return `${number}${suffix || ""}`;
};

// Formats decimal to n -places, and trims trailing zeroes
export const formatDecimal = ({
  input,
  decimals = NUMBER_OF_DECIMALS,
  fallbackValue = 0,
}: {
  input?: number | string;
  decimals?: number;
  fallbackValue?: number;
}): number => {
  if (!input) return fallbackValue;

  const value = typeof input === "string" ? parseFloat(input) : input;

  return parseFloat(value.toFixed(decimals));
};

interface HMS {
  h?: number;
  m?: number;
  s?: number;
}

export const secondsToHms = (duration?: number | null): HMS => {
  if (!duration || duration < 0) return {};
  const h = Math.floor(duration / 3600);
  const m = Math.floor((duration % 3600) / 60);
  const s = Math.floor((duration % 3600) % 60);

  return { h, m, s };
};

export const parseDurationString = (time: string): HMS | undefined => {
  const [hours, minutes] = time.split(":");
  if (!hours && !minutes) {
    return undefined;
  }
  const h = Number(hours);
  const m = Number(minutes);
  if (
    Number.isNaN(h) ||
    Number.isNaN(m) ||
    h >= 24 ||
    h < 0 ||
    m < 0 ||
    m >= 60
  ) {
    return undefined;
  }
  return { h, m };
};

export const convertHMSToSeconds = (input: string): number | null => {
  const result = Number(new Date(`1970-01-01T${input}Z`).getTime() / 1000);
  return Number.isNaN(result) ? null : result;
};

export const formatTimeDistance = (
  timeStart: string,
  timeEnd: string
): number | undefined => {
  const startArr = timeStart.split(":");
  const endArr = timeEnd.split(":");

  if ([...startArr, ...endArr].some((n) => !Number.isInteger(Number(n)))) {
    return undefined;
  }

  const startDate = new Date(
    1,
    1,
    1970,
    Number(startArr[0]),
    Number(startArr[1]),
    Number(startArr[2])
  );
  const endDate = new Date(
    1,
    1,
    1970,
    Number(endArr[0]),
    Number(endArr[1]),
    Number(endArr[2])
  );

  return Math.abs(endDate.getTime() - startDate.getTime()) / 1000;
};

interface IAgeGroups {
  minimum?: number;
  maximum?: number;
}

// TODO rename to print or format
export const parseAgeGroups = (ageGroups: IAgeGroups): string => {
  return i18next.t("common.agesSuffix", {
    range: trim(`${ageGroups.minimum || ""}-${ageGroups.maximum || ""}`, "-"),
  });
};

// TODO rename to print or format
export function parseAddress(
  location: LocationFieldsFragment | null | undefined
): string {
  if (!location) {
    return "";
  }
  return trim(
    `${location.addressStreetFi ?? ""}, ${location.addressZip} ${
      location.addressCityFi ?? ""
    }`,
    ", "
  );
}

export const sortByName = (a?: string, b?: string): number =>
  a && b ? a.toLowerCase().localeCompare(b.toLowerCase()) : !a ? 1 : -1;

export function getTranslatedError(
  t: TFunction,
  error: string | undefined
): string | undefined {
  if (error == null) {
    return undefined;
  }
  // TODO use a common translation key for these
  return t(`Notifications.form.errors.${error}`);
}

// TODO this should be typed
// some mutations expect purpose others purposePk
// but because this isn't typed we have to check runtime errors for each mutation
export function flattenMetadata(
  values:
    | ReservationFormType
    | RecurringReservationForm
    | ReservationChangeFormType,
  metadataSetFields: Pick<ReservationMetadataFieldNode, "fieldName">[],
  shouldRenamePkFields = true
) {
  const fieldNames = metadataSetFields.map((f) => f.fieldName).map(camelCase);
  // TODO don't use pick
  const metadataSetValues = pick(values, fieldNames);

  const renamePkFields = shouldRenamePkFields
    ? ["ageGroup", "homeCity", "purpose"]
    : [];

  return zipObject(
    Object.keys(metadataSetValues).map((k) =>
      renamePkFields.includes(k) ? `${k}Pk` : k
    ),
    Object.values(metadataSetValues).map((v) => get(v, "value") || v)
  );
}

export function getReserveeName(
  reservation: ReservationCommonFragment,
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
