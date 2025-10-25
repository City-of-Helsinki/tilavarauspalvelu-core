/**
 * Display formatting functions, with i18n.t and/or date-fns format
 */
import { Day, format, isBefore, isSameDay, type Locale } from "date-fns";
import { enGB, fi, sv } from "date-fns/locale";
import { type TFunction } from "next-i18next";
import { transformWeekday } from "../modules/conversion";
import type { LocalizationLanguages } from "../modules/urlBuilder";
import { dateToMinutes, isValidDate, minutesToHoursString, setMondayFirst, timeToMinutes } from "./conversion";
import type {
  ApplicationReservationDateTime,
  FormatDateOptions,
  FormatDateRangeOptions,
  FormatDateTimeOptions,
  FormatDateTimeRangeOptions,
  TimeStruct,
} from "./types";

// Fallback localized separator between date and time, if i18n.t is not available
const localSeparator = {
  fi: " klo ",
  sv: " kl. ",
  en: ", ",
};

export const UI_DATE_FORMAT = "d.M.yyyy";
export const UI_DATE_FORMAT_SHORT = "d.M.";
const UI_DATE_FORMAT_WITH_WEEKDAY = "cccccc d.M.yyyy";
export const UI_TIME_FORMAT = "HH:mm";
export const API_DATE_FORMAT = "yyyy-MM-dd";

/**
 * Returns the date-fns locale object for the given locale code
 * @param {LocalizationLanguages} locale - locale code ("fi", "sv", "en")
 * @returns date-fns locale object, with week starting on Monday
 * @example
 *  getFormatLocaleObject("fi") // fi locale object
 *  getFormatLocaleObject("sv") // sv locale object
 *  getFormatLocaleObject("en") // enGB locale object
 */
function getFormatLocaleObject(locale?: LocalizationLanguages): { locale: Locale; weekStartsOn: Day } {
  switch (locale) {
    case "sv":
      return { locale: sv, weekStartsOn: 1 };
    case "en":
      return { locale: enGB, weekStartsOn: 1 };
    default:
    case "fi":
      return { locale: fi, weekStartsOn: 1 };
  }
}

/**
 * Returns a Date object from a valid Date or string input, or null if invalid
 * @param {Date | string} date - date string or Date object
 * @returns Date object or null if invalid
 * @example
 *   toDateObject("2023-12-25") // Date object for Dec 25, 2023
 *   toDateObject(new Date()) // Date object for current date and time
 *   toDateObject("invalid date") // null
 */
export function parseValidDateObject(date?: Date | string | null): Date | null {
  if (!date) {
    return null;
  }
  if (date instanceof Date) {
    return isValidDate(date) ? date : null;
  }
  const parsedDate = new Date(date);
  if (isValidDate(parsedDate)) {
    return parsedDate;
  } else {
    return null;
  }
}

/**
 * Returns just the time portion of a date as a string, with optional localized separator
 * @param {Date} date - Date object to format
 * @param {"fi" | "sv" | "en"} [locale="fi"] - Locale for formatting
 * @returns Formatted time string
 * @example
 *   formatTime(new Date("2023-12-25T15:30:00")) // "15:30"
 *   formatTime(new Date("invalid")) // ""
 *   formatTime(null) // ""
 */
export function formatTime(date: Date | null, locale: LocalizationLanguages = "fi"): string {
  return !date || !isValidDate(date) ? "" : format(date, UI_TIME_FORMAT, getFormatLocaleObject(locale));
}

/**
 * Returns just the date portion of a date as a string, with optional weekday
 * @param date - Date object to format
 * @param {FormatDateOptions} [options] - Format options
 *   @param [options.includeWeekday=false] - Whether to include the weekday name
 *   @param {"fi" | "sv" | "en"} [options.locale="fi"] - Locale for formatting
 * @returns Formatted date string or empty string if invalid
 * @example
 *   formatDate(new Date("2023-12-25T15:30:00")) // "25.12.2023"
 *   formatDate(new Date("2023-12-25T15:30:00"), { includeWeekday: true }) // "ma 25.12.2023"
 */
export function formatDate(
  date: Date | null,
  { includeWeekday = false, showYear = true, locale = "fi" }: FormatDateOptions = {}
): string {
  if (!date || !isValidDate(date)) {
    return "";
  }
  const formatString = includeWeekday ? UI_DATE_FORMAT_WITH_WEEKDAY : showYear ? UI_DATE_FORMAT : UI_DATE_FORMAT_SHORT;
  return format(date, formatString, getFormatLocaleObject(locale));
}

/**
 * Returns date and time as a localized string, with optional weekday and day/time separator
 * @param date - Date object to format
 * @param options - Formatting options using FormatDateOptions
 *   @param {TFunction} [options.t] - i18n translation function, needed for localized separator
 *   @param [options.includeTimeSeparator=true] - Whether to include separator between date and time
 *   @param [options.includeWeekday=true] - Whether to include the weekday name
 *   @param {"fi" | "sv" | "en"} [options.locale="fi"] - Locale for i18n. Works best when options.t is also provided.
 * @returns Formatted datetime string or empty string if invalid
 * @example
 *   formatDateTime(new Date("2023-12-25T15:30:00")) // "ma 25.12.2023 @ 15:30"
 *   formatDateTime(new Date("2023-12-25T15:30:00"), { t, includeWeekday: false }) // "25.12.2023 klo 15:30"
 *   formatDateTime(new Date("2023-12-25T15:30:00"), { includeSeparator: true }) // "25.12.2023 @ 15:30"
 *   formatDateTime(new Date("2023-12-25T15:30:00"), { includeTimeSeparator: false }) // "ma 25.12.2023 15:30"
 */
export function formatDateTime(
  date: Date | null,
  { t, includeWeekday = true, includeTimeSeparator = true, showYear = true, locale = "fi" }: FormatDateTimeOptions = {}
): string {
  if (!date || !isValidDate(date)) {
    return "";
  }

  const separator = includeTimeSeparator ? localSeparator[locale] : "";

  if (t) {
    return `${t("common:weekdayShortEnum." + transformWeekday(setMondayFirst(date.getDay())))} ${format(date, UI_DATE_FORMAT)}${separator}${format(date, UI_TIME_FORMAT)}`.trim();
  }
  const formatString = showYear ? UI_DATE_FORMAT_WITH_WEEKDAY : UI_DATE_FORMAT_SHORT;
  return format(
    date,
    separator === ""
      ? `${includeWeekday ? formatString : UI_DATE_FORMAT} ${UI_TIME_FORMAT}`
      : `${includeWeekday ? formatString : UI_DATE_FORMAT}'${separator}'${UI_TIME_FORMAT}`,
    getFormatLocaleObject(locale)
  ).trim();
}

/**
 * Creates time and date strings for reservations
 * @param params - Parameters object
 *   @param {TFunction} params.t - i18n translation function
 *   @param params.reservation - Reservation object
 *   @param params.orig - Original reservation object (use undefined if not possible to modify)
 * @param {boolean} [params.trailingMinutes=true] - Whether to include trailing minutes
 * @returns Object with date, time, dayOfWeek, and isModified properties
 * @example
 *   formatDateTimeStrings({ t, reservation: { beginsAt: "2023-12-25T15:30:00", endsAt: "2023-12-25T17:00:00" } })
 *   // { date: Date("2023-12-25"), time: "15:30 - 17:00", dayOfWeek: "ma", isModified: false }
 *   formatDateTimeStrings({ t, reservation: { beginsAt: "2023-12-25T15:30:00", endsAt: "2023-12-25T17:00:00" },
 *   orig: { beginTime: "15:00", endTime: "16:30" } })
 *   // { date: Date("2023-12-25"), time: "15:30 - 17:00", dayOfWeek: "ma", isModified: true }
 */
export function applicationReservationDateTime({
  t,
  reservation,
  orig,
  trailingMinutes = true,
}: {
  t: TFunction;
  reservation: {
    beginsAt: string;
    endsAt: string;
  };
  orig?: {
    beginTime: string;
    endTime: string;
  };
  trailingMinutes?: boolean;
}): ApplicationReservationDateTime {
  const start = new Date(reservation.beginsAt);
  const end = new Date(reservation.endsAt);
  const dayOfWeek = t(`weekDayLong.${start.getDay()}`);

  const originalBeginMins = orig != null ? timeToMinutes(orig.beginTime) : -1;
  const originalEndMins = orig != null ? timeToMinutes(orig.endTime) : -1;
  const beginMins = dateToMinutes(start) ?? 0;
  const endMins = dateToMinutes(end) ?? 0;
  const isModified = orig != null && (originalBeginMins !== beginMins || originalEndMins !== endMins);
  const time = formatTimeRange(beginMins, endMins, trailingMinutes);
  return {
    date: start,
    time,
    dayOfWeek,
    isModified,
  };
}

/**
 * Formats a time range (in minutes) into a time range string, with beginning time and end time
 * @param {number} beginMins - Begin time in minutes
 * @param {number} endMins - End time in minutes
 * @param {boolean} [trailingMinutes=false] - Whether to include trailing minutes
 * @returns Formatted time range string
 * @example
 *   formatTimeRange(930, 1020) // "15:30–17:00"
 *   formatTimeRange(930, 1020, true) // "15:30–17:00"
 */
export function formatTimeRange(
  beginMins: number | null,
  endMins: number | null,
  trailingMinutes: boolean = true
): string {
  if (beginMins == null || beginMins < 0 || beginMins > 1440) {
    return "";
  }
  if (!endMins) {
    return minutesToHoursString(beginMins, trailingMinutes);
  }
  return `${minutesToHoursString(beginMins, trailingMinutes)}–${minutesToHoursString(endMins, trailingMinutes)}`;
}

/**
 * Formats a date range (without time) into a date range string, with proper localization
 * @param {Date} start - Start Date object to format
 * @param {Date} end - End Date object to format
 * @param [options] - Formatting options using FormatDateOptions
 *   @param {boolean} [options.includeWeekday=true] - Whether to include the weekday name
 *   @param {boolean} [options.showEndDate=true] - Whether to show the end date if different from start date
 *   @param {"fi" | "sv" | "en"} [options.locale="fi"] - Locale for formatting (defaults to "fi")
 * @returns Formatted date range string with beginning date and end date, or single date if both dates are the same
 * @example
 *   formatDateRange(new Date("2023-12-25T15:30:00"), new Date("2023-12-26T15:30:00"))
 *   // "ma 25.12.2023 – ti 26.12.2023"
 *   formatDateRange(new Date("2023-12-25T15:30:00"), new Date("2023-12-26T15:30:00"), { includeWeekday: false })
 *   // "25.12.2023 – 26.12.2023"
 *   formatDateRange(new Date("2023-12-25T00:00:01"), new Date("2023-12-25T23:59:59"))
 *   // "ma 25.12.2023"
 */
export function formatDateRange(
  start: Date | null,
  end: Date | null,
  { includeWeekday = true, showEndDate = true, showYear = true, locale = "fi" }: FormatDateRangeOptions = {}
): string {
  if (!start || !end || !isValidDate(start) || !isValidDate(end)) {
    return "";
  }

  if (!showEndDate || isSameDay(start, end)) {
    return formatDate(start, { includeWeekday, showYear, locale }) || "";
  }

  return `${formatDate(start, { includeWeekday, showYear, locale })}–${formatDate(end, { includeWeekday, showYear, locale })}`;
}

/**
 * Formats a date and time range with proper localization
 * @param start - Start date object to format
 * @param end - End date object to format
 * @param options - Formatting options using FormatDateOptions
 *   @param {TFunction} [options.t] - i18n translation function, needed for localized separator
 *   @param {boolean} [options.includeWeekday=true] - Whether to include the weekday name
 *   @param {boolean} [options.includeTimeSeparator=true] - Whether to include separator between date and time
 *   @param {boolean} [options.showEndDate=true] - Whether to show the end date if different from start date
 *   @param {"fi" | "sv" | "en"} [options.locale="fi"] - Locale for formatting
 * @returns Formatted datetime range string, or single date with time range if both dates are the same
 * @example
 * formatDateTimeRange(new Date("2023-12-25T15:30:00"), new Date("2023-12-25T17:00:00"), { t })
 * // "ma 25.12.2023 klo 15:30–17:00"
 * formatDateTimeRange(new Date("2023-12-25T15:30:00"), new Date("2023-12-25T17:00:00"), { t })
 * // "ma 25.12.2023 @ 15:30–17:00"
 * formatDateTimeRange(new Date("2023-12-25T15:30:00"), new Date("2023-12-25T17:00:00"), { includeWeekday: false,
 * includeTimeSeparator: false })
 * // "25.12.2023 15:30–17:00"
 * formatDateTimeRange(new Date("2023-12-25T15:30:00"), new Date("2023-13-25T18:00:00"), { includeWeekday: false,
 * includeTimeSeparator: false })
 * // "25.12.2023 15:30–18:00 26.12.2023"
 */
export function formatDateTimeRange(
  start: Date | null,
  end: Date | null,
  {
    t,
    includeWeekday = true,
    showEndDate = true,
    includeTimeSeparator = true,
    locale = "fi",
    showYear = true,
  }: FormatDateTimeRangeOptions = {}
): string {
  if (!start || !end || !isValidDate(start) || !isValidDate(end)) {
    return "";
  }

  const startDateTime = formatDateTime(start, { t, includeWeekday, includeTimeSeparator, locale, showYear });
  const endFormat =
    !isSameDay(start, end) && showEndDate
      ? `${UI_TIME_FORMAT} ${showYear ? UI_DATE_FORMAT : UI_DATE_FORMAT_SHORT}`
      : UI_TIME_FORMAT;
  const endDateTime = format(end, endFormat, getFormatLocaleObject(locale));

  return `${startDateTime}–${endDateTime}`.trim();
}

/**
 * Formats a duration into hours and minutes with proper localization
 * @param {TFunction} t - Translation function
 * @param {TimeStruct} duration - Duration object with hours, minutes, and seconds (e.g. { hours: 1, minutes:
 * 30 } or { seconds: 5400 })
 * @param {boolean} [abbreviated=true] - Whether to use abbreviated units (e.g. "hours" -> "h"),
 * @returns Formatted duration string in hours and minutes, or "-" if duration is zero
 * @example
 *   formatDuration( t, { hours: 1, minutes: 30 } }) // "1 h 30 min"
 *   formatDuration( t, { hours: 1, minutes: 30 }, false }) // "1 hours 30 minutes"
 *   formatDuration( t, { seconds: 5400 } }) // "1 h 30 min"
 */
export function formatDuration(t: TFunction, duration: TimeStruct, abbreviated: boolean = true): string {
  const { hours = 0, minutes = 0, seconds = 0 } = duration;
  const secs = (hours ?? 0) * 3600 + (minutes ?? 0) * 60 + (seconds ?? 0);
  if (!secs && secs !== 0) {
    return "-";
  }

  const hour = Math.floor(secs / 60 / 60);
  const min = Math.floor((secs / 60) % 60);

  const hourKey = abbreviated ? "common:abbreviations:hour" : "common:hour";
  const minuteKey = abbreviated ? "common:abbreviations:minute" : "common:minute";

  const p: string[] = [];

  if (hour > 0) {
    p.push(t(hourKey, { count: hour }));
  }
  if (min > 0) {
    p.push(t(minuteKey, { count: min }));
  }
  if (hour === 0 && min === 0) {
    p.push(t(minuteKey, { count: 0 }));
  }

  return p.join(" ");
}

/**
 * Formats a duration range into hours and minutes with proper localization
 * @param params - Parameters object
 *   @param {TFunction} params.t - I18next Translation function
 *   @param {number} params.minDuration - Minimum duration TimeStruct
 *   @param {number} params.maxDuration - Maximum duration TimeStruct
 *   @param {boolean} [params.abbreviated=true] - Whether to use abbreviated units (e.g. "h" instead of "hours"),
 * @returns Formatted duration range if beginSecs and endSecs are different values, otherwise single duration
 * @example
 *   formatDuration({ t, beginSecs: 5400, endSecs: 10800 }) // "1 h 30 min – 3 h"
 *   formatDuration({ t, beginSecs: 7200, endSecs: 7200, abbreviated: false } }) // "2 hours"
 */
export function formatDurationRange({
  t,
  minDuration,
  maxDuration,
  abbreviated = true,
}: {
  t: TFunction;
  minDuration: TimeStruct;
  maxDuration: TimeStruct;
  abbreviated?: boolean;
}): string {
  const min = formatDuration(t, minDuration, abbreviated);
  const max = formatDuration(t, maxDuration, abbreviated);
  const minSecs = (minDuration.hours ?? 0) * 3600 + (minDuration.minutes ?? 0) * 60 + (minDuration.seconds ?? 0);
  const maxSecs = (maxDuration.hours ?? 0) * 3600 + (maxDuration.minutes ?? 0) * 60 + (maxDuration.seconds ?? 0);
  return minSecs === maxSecs ? max : `${min}–${max}`;
}

export function formatDurationFromDates(
  t: TFunction,
  start: Date | null,
  end: Date | null,
  abbreviated: boolean = true
): string {
  if (!start || !end || !isValidDate(start) || !isValidDate(end)) {
    return "";
  }
  if (isBefore(start, end)) {
    return "-";
  }
  const beginMins = dateToMinutes(start);
  const endMins = dateToMinutes(end);
  if (beginMins == null || endMins == null) {
    return "";
  }
  return formatDuration(
    t,
    { hours: Math.floor((endMins - beginMins) / 60), minutes: (endMins - beginMins) % 60 },
    abbreviated
  );
}

/**
 * Converts a Date object to API date format (yyyy-MM-dd)
 * @param date - Date object to convert
 * @returns API date string or null if invalid
 * @example formatApiDate(new Date("2023-12-25")) // "2023-12-25"
 */
export function formatApiDate(date: Date): string | null {
  if (!date || !isValidDate(date)) {
    return null;
  }
  try {
    return format(date, API_DATE_FORMAT);
  } catch {
    return null;
  }
}

/**
 * Converts Date to API date format (yyyy-MM-dd) - throws on invalid input
 * @param date - Date object to convert
 * @returns API date string
 * @throws Error if date is invalid
 * @example formatApiDateUnsafe(new Date("2023-12-25")) // "2023-12-25"
 */
export function formatApiDateUnsafe(date: Date): string {
  const apiDate = formatApiDate(date);
  if (apiDate == null) {
    throw new Error("Invalid date: " + date);
  }
  return apiDate;
}

/**
 * Converts time struct to API time format (HH:mm)
 * @param hours - Hours (0-23)
 * @param minutes - Minutes (0-59, defaults to 0)
 * @returns API time string or null if invalid
 * @example formatApiTime(15, 30) // "15:30"
 */
export function formatApiTime(hours: number, minutes: number = 0): string | null {
  if ((hours === 24 && minutes !== 0) || hours < 0 || hours > 24 || minutes < 0 || minutes > 59) {
    return null;
  }
  const normalizedHours = hours === 24 ? 0 : hours;
  return `${String(normalizedHours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/**
 * Converts time struct to API time format (HH:mm) - throws on invalid input
 * @param hours - Hours (0-23)
 * @param minutes - Minutes (0-59, defaults to 0)
 * @returns API time string
 * @throws Error if time is invalid
 * @example formatApiTimeUnsafe(15, 30) // "15:30"
 */
export function formatApiTimeUnsafe(hours: number, minutes: number = 0): string {
  const time = formatApiTime(hours, minutes);
  if (time == null) {
    throw new Error("Invalid time: " + JSON.stringify({ hours, minutes }));
  }
  return time;
}
