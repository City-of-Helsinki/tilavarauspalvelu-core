import { format, parseISO } from "date-fns";
import i18next from "i18next";
import { trim } from "lodash";
import type { LocationFieldsFragment } from "@gql/gql-types";
import { NUMBER_OF_DECIMALS } from "./const";
import type { TFunction } from "next-i18next";

export { formatDuration } from "common/src/common/util";

export const DATE_FORMAT = "d.M.yyyy";
export const DATE_FORMAT_SHORT = "d.M.";

/// @deprecated use format directly
/// why convert date -> string -> date?
export const formatDate = (
  date: string | null,
  outputFormat = DATE_FORMAT
): string | null => {
  return date ? format(parseISO(date), outputFormat) : null;
};

export const formatTime = (
  date: string | null,
  outputFormat = "HH:mm"
): string | null => {
  return date ? format(parseISO(date), outputFormat) : null;
};

export const formatDateTime = (date: string): string =>
  `${formatDate(date)} ${formatTime(date)}`;

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
  return `${i18next.t("common.agesSuffix", {
    range: trim(`${ageGroups.minimum || ""}-${ageGroups.maximum || ""}`, "-"),
  })}`;
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
