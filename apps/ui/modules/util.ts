import { isSameDay, parseISO } from "date-fns";
import { type TFunction } from "next-i18next";
import { trim } from "lodash-es";
import {
  toUIDate,
  getTranslation,
  fromApiDate as fromAPIDate,
  fromUIDate,
} from "common/src/common/util";
import type { ImageFragment, LocationFieldsI18nFragment } from "@gql/gql-types";
import { isBrowser } from "./const";
import {
  formatMinutes,
  timeToMinutes,
  type LocalizationLanguages,
} from "common/src/helpers";

export { formatDuration } from "common/src/common/util";
export { fromAPIDate, fromUIDate };
export { getTranslation };

// TODO why? where is this used? why not use toUIDate(new Date(string))
// TODO why return "-" instead of null or ""?
export const formatDate = (date: string, formatStr?: string): string => {
  if (!date) {
    return "-";
  }
  return toUIDate(parseISO(date), formatStr);
};

export const capitalize = (s: string): string => {
  return s.charAt(0).toUpperCase() + s.slice(1);
};

type ParameterType =
  | {
      pk: number;
      nameFi: string;
      nameEn?: string;
      nameSv?: string;
    }
  | { pk: number; name: string };

function getLabel(
  parameter:
    | ParameterType
    | { minimum?: number | null; maximum?: number | null },
  lang: LocalizationLanguages = "fi"
): string {
  if ("minimum" in parameter) {
    return `${parameter.minimum || ""} - ${parameter.maximum || ""}`;
  }
  if ("name" in parameter) {
    return parameter.name;
  }
  if ("nameEn" in parameter && parameter.nameEn != null && lang === "en") {
    return parameter.nameEn;
  }
  if ("nameSv" in parameter && parameter.nameSv != null && lang === "sv") {
    return parameter.nameSv;
  }
  if ("nameFi" in parameter) {
    return parameter.nameFi;
  }
  return "no label";
}

export { getLabel as getParameterLabel };

const imagePriority = ["main", "map", "ground_plan", "other"].map((n) =>
  n.toUpperCase()
);

export const getMainImage = (ru?: {
  images: ImageFragment[];
}): ImageFragment | null => {
  if (!ru || !ru.images || ru.images.length === 0) {
    return null;
  }
  const images = [...ru.images].sort((a, b) => {
    return (
      imagePriority.indexOf(a.imageType) - imagePriority.indexOf(b.imageType)
    );
  });

  return images[0];
};

export function orderImages(images: ImageFragment[]): ImageFragment[] {
  if (!images || images.length === 0) {
    return [];
  }
  const result = [...images].sort((a, b) => {
    return (
      imagePriority.indexOf(a.imageType) - imagePriority.indexOf(b.imageType)
    );
  });

  return result;
}

export const getAddressAlt = (ru: {
  unit?: {
    location?: LocationFieldsI18nFragment | null;
  } | null;
}): string | null => {
  const { location } = ru.unit || {};

  if (!location) {
    return null;
  }

  const street =
    getTranslation(location, "addressStreet") || location.addressStreetFi || "";
  const city =
    getTranslation(location, "addressCity") || location.addressCityFi || "";
  return trim(`${street}, ${city}`, ", ");
};

export const isTouchDevice = (): boolean =>
  isBrowser && window?.matchMedia("(any-hover: none)").matches;

export function getPostLoginUrl() {
  if (!isBrowser) {
    return undefined;
  }
  const { origin, pathname, searchParams } = new URL(window.location.href);
  const params = new URLSearchParams(searchParams);
  params.set("isPostLogin", "true");
  return `${origin}${pathname}?${params.toString()}`;
}

// date format should always be in finnish, but the weekday and time separator should be localized
const dateFormatParams = {
  date: {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    locale: "fi",
  },
};

export function formatTime(t: TFunction, date: Date): string {
  return t("common:dateWithWeekday", {
    date,
    formatParams: {
      date: {
        hour: "numeric",
        minute: "numeric",
        // force HH:mm format even for finnish locale
        hour12: false,
        locale: "en-GB",
      },
    },
  });
}

function dayTimeSeparator(t: TFunction): string {
  return t("common:dayTimeSeparator");
}

export function formatDateTimeRange(
  t: TFunction,
  begin: Date,
  end: Date
): string {
  // TODO change the key names
  const beginDate = t("common:dateWithWeekday", {
    date: begin,
    formatParams: dateFormatParams,
  });

  const day = formatDay(t, begin);
  const showEndDate = !isSameDay(begin, end);
  const endTime = formatTime(t, end);
  const time = formatTime(t, begin);
  const separator = dayTimeSeparator(t);
  const endDate = showEndDate
    ? t("common:dateWithWeekday", {
        date: end,
        formatParams: dateFormatParams,
      })
    : "";

  return `${day} ${beginDate}${separator} ${time}–${endTime} ${endDate}`.trim();
}

function formatDay(t: TFunction, date: Date): string {
  return t("common:dateWithWeekday", {
    date,
    formatParams: {
      date: {
        weekday: "short",
      },
    },
  });
}

export function formatDateTime(
  t: TFunction,
  date: Date,
  includeWeekday = true
): string {
  const dateStr = t("common:dateWithWeekday", {
    date,
    formatParams: dateFormatParams,
  });

  const day = includeWeekday ? formatDay(t, date) : "";
  const time = formatTime(t, date);
  const separator = dayTimeSeparator(t);

  return `${day} ${dateStr}${separator} ${time}`.trim();
}

/// Creates time and date strings for reservations
/// @param t - translation function
/// @param res - reservation object
/// @param orig - original reservation object (use undefined if not possible to modify)
export function formatDateTimeStrings(
  t: TFunction,
  reservation: {
    begin: string;
    end: string;
  },
  orig?: {
    beginTime: string;
    endTime: string;
  },
  trailingMinutes = false
): { date: Date; time: string; dayOfWeek: string; isModified: boolean } {
  const start = new Date(reservation.begin);
  const end = new Date(reservation.end);
  const dayOfWeek = t(`weekDayLong.${start.getDay()}`);

  const originalBeginMins = orig != null ? timeToMinutes(orig.beginTime) : -1;
  const originalEndMins = orig != null ? timeToMinutes(orig.endTime) : -1;

  const beginMins = toMinutes(start);
  const endMins = toMinutes(end);
  const isModified =
    orig != null &&
    (originalBeginMins !== beginMins || originalEndMins !== endMins);
  const btime = formatMinutes(beginMins, trailingMinutes);
  const etime = formatMinutes(endMins, trailingMinutes);
  const time = `${btime} - ${etime}`;
  return {
    date: start,
    time,
    dayOfWeek,
    isModified,
  };
}

/// Converts a date to minutes discarding date and seconds
function toMinutes(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}
