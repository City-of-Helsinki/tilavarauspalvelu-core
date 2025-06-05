import { isSameDay } from "date-fns";
import { type TFunction } from "next-i18next";
import {
  toUIDate,
  fromApiDate as fromAPIDate,
  fromUIDate,
} from "common/src/common/util";
import { isBrowser } from "./const";
import { formatMinutes, timeToMinutes } from "common/src/helpers";
import { ReadonlyURLSearchParams } from "next/navigation";
import { type Maybe, ApplicationStatusChoice } from "@/gql/gql-types";

export { formatDuration } from "common/src/common/util";
export { fromAPIDate, fromUIDate };

export function getPostLoginUrl(
  params: Readonly<URLSearchParams> = new ReadonlyURLSearchParams()
): string | undefined {
  if (!isBrowser) {
    return undefined;
  }
  const { origin, pathname, searchParams } = new URL(window.location.href);
  const p = new URLSearchParams(searchParams);
  for (const [key, value] of params) {
    p.append(key, value);
  }
  p.set("isPostLogin", "true");
  return `${origin}${pathname}?${p.toString()}`;
}

function formatDurationSeconds(seconds: number, t: TFunction): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds - hours * 3600) / 60);

  if (hours === 0) {
    return t("common:abbreviations:minute", { count: minutes });
  }
  if (minutes === 0) {
    return t("common:abbreviations:hour", { count: hours });
  }
  return `${t("common:abbreviations:hour", { count: hours })} ${t(
    "common:abbreviations:minute",
    { count: minutes }
  )}`;
}

export function formatDurationRange(
  t: TFunction,
  beginSecs: number,
  endSecs: number
): string {
  const beginHours = formatDurationSeconds(beginSecs, t);
  const endHours = formatDurationSeconds(endSecs, t);
  return beginSecs === endSecs ? beginHours : `${beginHours} – ${endHours}`;
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

// A function which takes two Date objects, and returns a string with the date range in dd.mm.yyyy format and a separator,
// as long as begin and end are not the same day. If they are, it returns only the day in question in dd.mm.yyyy format.
export function formatDateRange(begin: Date, end: Date): string {
  const beginDate = toUIDate(begin);
  const endDate = toUIDate(end);

  return `${beginDate}${!isSameDay(begin, end) ? " – " + endDate : ""}`.trim();
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

export function isSent(
  status: Maybe<ApplicationStatusChoice> | undefined
): boolean {
  if (status == null) {
    return false;
  }
  switch (status) {
    case ApplicationStatusChoice.Draft:
    case ApplicationStatusChoice.Expired:
    case ApplicationStatusChoice.Cancelled:
      return false;
    case ApplicationStatusChoice.Received:
    case ApplicationStatusChoice.ResultsSent:
    case ApplicationStatusChoice.Handled:
    case ApplicationStatusChoice.InAllocation:
      return true;
  }
}
