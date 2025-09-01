import { format, isSameDay, type Locale } from "date-fns";
import { fi, sv, enGB } from "date-fns/locale";
import { type TFunction } from "next-i18next";
import type { LocalizationLanguages } from "../urlBuilder";
import { dateToMinutes, isValidDate, minutesToHoursString, timeToMinutes } from "./conversion";
import type { FormatTimeOptions, FormatDateOptions, FormatDateTimeOptions, FormatDateTimeRangeOptions } from "./types";

export const UI_DATE_FORMAT = "d.M.yyyy";
export const UI_DATE_FORMAT_SHORT = "d.M.";
export const UI_DATE_FORMAT_WITH_WEEKDAY = "cccccc d.M.yyyy";
export const UI_TIME_FORMAT = "HH:mm";
export const API_DATE_FORMAT = "yyyy-MM-dd";

/**
 * Returns the date-fns locale object for the given locale code
 * @param {LocalizationLanguages} locale - locale code ("fi", "sv", "en")
 * @returns date-fns locale object
 * @example
 *  getFormatLocaleObject("fi") // fi locale object
 *  getFormatLocaleObject("sv") // sv locale object
 *  getFormatLocaleObject("en") // enGB locale object
 */
function getFormatLocaleObject(locale?: LocalizationLanguages): { locale: Locale } {
  switch (locale) {
    case "sv":
      return { locale: sv };
    case "en":
      return { locale: enGB };
    default:
    case "fi":
      return { locale: fi };
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
export function toValidDateObject(date: Date | string): Date | null {
  if (date instanceof Date) {
    return isValidDate({ date }) ? date : null;
  }
  const parsedDate = new Date(date);
  if (isValidDate({ date: parsedDate })) {
    return parsedDate;
  } else {
    return null;
  }
}

/**
 * Formats just the time portion of a date
 * @param date - Date object to format
 * @param [options] - Format options
 *   @param {TFunction} [options.t] - i18n translation function, needed for localized separator
 *   @param {boolean} [options.includeTimeSeparator=false] - Whether to include localized separator before time
 *   @param {"fi" | "sv" | "en"} [options.locale="fi"] - Locale for formatting
 * @returns Formatted time string
 * @example
 *   formatTime(date: new Date("2023-12-25T15:30:00")) // "15:30"
 *   formatTime(date: new Date("2023-12-25T15:30:00"), { t, includeTimeSeparator: true }) // "klo 15:30"
 */
export function formatTime(date: Date | null, options?: FormatTimeOptions): string {
  const { t, includeTimeSeparator = false, locale = "fi", formatString = UI_TIME_FORMAT } = options || {};

  if (!date || !isValidDate({ date: date })) {
    return "";
  }

  const separator = t ? (includeTimeSeparator ? t("common:dayTimeSeparator") : "") : "@";
  return `${separator} ${format(date, formatString, getFormatLocaleObject(locale))}`.trim();
}

/**
 * Formats just the date portion of a date
 * @param date - Date object to format
 * @param {FormatDateOptions} [options] - Format options
 *   @param [options.includeWeekday=false] - Whether to include the weekday name (defaults to false)
 *   @param {"fi" | "sv" | "en"} [options.locale="fi"] - Locale for formatting (defaults to "fi")
 * @returns Formatted date string or null if invalid
 * @example
 *   formatDate(new Date("2023-12-25T15:30:00")) // "25.12.2023"
 *   formatDate(new Date("2023-12-25T15:30:00"), { includeWeekday: true }) // "ma 25.12.2023"
 */
export function formatDate(date: Date | null, options?: FormatDateOptions): string {
  const {
    includeWeekday = false,
    locale = "fi",
    formatString = includeWeekday ? UI_DATE_FORMAT_WITH_WEEKDAY : UI_DATE_FORMAT,
  } = options ?? {};

  if (!date || !isValidDate({ date })) {
    return "";
  }

  return format(date, formatString, getFormatLocaleObject(locale));
}

/**
 * Formats a date and time with localized weekday and separators
 * @param date - Date object to format
 * @param options - Formatting options using FormatDateOptions
 *   @param {TFunction} [options.t] - i18n translation function, needed for localized separator
 *   @param [options.includeTimeSeparator=true] - Whether to include separator between date and time
 *   @param [options.includeWeekday=true] - Whether to include the weekday name
 *   @param {"fi" | "sv" | "en"} [options.locale="fi"] - Locale for formatting
 * @returns Formatted datetime string
 * @example
 *   formatDateTime(new Date("2023-12-25T15:30:00")) // "ma 25.12.2023 @ 15:30"
 *   formatDateTime(new Date("2023-12-25T15:30:00"), { t, includeWeekday: false }) // "25.12.2023 klo 15:30"
 *   formatDateTime(new Date("2023-12-25T15:30:00"), { includeSeparator: true }) // "25.12.2023 @ 15:30"
 *   formatDateTime(new Date("2023-12-25T15:30:00"), { includeTimeSeparator: false }) // "ma 25.12.2023 15:30"
 */
export function formatDateTime(date: Date | null, options?: FormatDateTimeOptions): string {
  const {
    t,
    includeWeekday = true,
    includeTimeSeparator = true,
    locale = "fi",
    formatString = includeWeekday ? UI_DATE_FORMAT_WITH_WEEKDAY : UI_DATE_FORMAT,
  } = options ?? {};

  if (!date || !isValidDate({ date: date })) {
    return "";
  }

  const separator = includeTimeSeparator ? (t ? t("common:dayTimeSeparator") : "@") : "";

  return format(date, `${formatString} '${separator}${UI_TIME_FORMAT}`, getFormatLocaleObject(locale)).trim();
}

/**
 * Creates time and date strings for reservations
 * @param params - Parameters object
 * @param {TFunction} params.t - i18n translation function
 * @param params.reservation - Reservation object
 * @param params.orig - Original reservation object (use undefined if not possible to modify)
 * @param {boolean} [params.trailingMinutes=false] - Whether to include trailing minutes
 */
export function formatDateTimeStrings({
  t,
  reservation,
  orig,
  trailingMinutes = false,
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
}): { date: Date; time: string; dayOfWeek: string; isModified: boolean } {
  const start = new Date(reservation.beginsAt);
  const end = new Date(reservation.endsAt);
  const dayOfWeek = t(`weekDayLong.${start.getDay()}`);

  const originalBeginMins = orig != null ? timeToMinutes(orig.beginTime) : -1;
  const originalEndMins = orig != null ? timeToMinutes(orig.endTime) : -1;
  const beginMins = dateToMinutes(start);
  const endMins = dateToMinutes(end);
  const isModified = orig != null && (originalBeginMins !== beginMins || originalEndMins !== endMins);
  const btime = minutesToHoursString(beginMins, trailingMinutes);
  const etime = minutesToHoursString(endMins, trailingMinutes);
  const time = `${btime} - ${etime}`;
  return {
    date: start,
    time,
    dayOfWeek,
    isModified,
  };
}

/**
 * Formats a time range (in minutes) into a string
 * @param {number} beginMins - Begin time in minutes
 * @param {number} endMins - End time in minutes
 * @param {boolean} [trailingMinutes=false] - Whether to include trailing minutes
 * @returns Formatted time range string
 * @example
 *   formatTimeRange(930, 1020) // "15:30–17:00"
 *   formatTimeRange(930, 1020, true) // "15:30–17:00"
 */
export function formatTimeRange(beginMins: number, endMins: number, trailingMinutes: boolean = false): string {
  return `${minutesToHoursString(beginMins, trailingMinutes)}–${minutesToHoursString(endMins, trailingMinutes)}`;
}

/**
 * Formats a date range (without time)
 * @param {Date} start - Start Date object to format
 * @param {Date} end - End Date object to format
 * @param [options] - Formatting options using FormatDateOptions
 *  @param {boolean} [options.includeWeekday=true] - Whether to include the weekday name
 *  @param {"fi" | "sv" | "en"} [options.locale="fi"] - Locale for formatting (defaults to "fi")
 * @returns Formatted date range string
 * @example
 *   formatDateRange(new Date("2023-12-25T15:30:00"), new Date("2023-12-26T15:30:00"))
 *   // "ma 25.12.2023 – ti 26.12.2023"
 *   formatDateRange(new Date("2023-12-25T15:30:00"), new Date("2023-12-26T15:30:00"), { includeWeekday: false })
 *   // "25.12.2023 – 26.12.2023"
 */
export function formatDateRange(start: Date | null, end: Date | null, options?: FormatDateOptions): string {
  if (!start || !end || !isValidDate({ date: start }) || !isValidDate({ date: end })) {
    return "";
  }

  const { includeWeekday = true, locale = "fi" } = options ?? {};

  if (isSameDay(start, end)) {
    return formatDate(start, { includeWeekday, locale }) || "";
  }

  return `${formatDate(start, { includeWeekday, locale })} – ${formatDate(end, { includeWeekday, locale })}`;
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
 * @returns Formatted datetime range string
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
  options?: FormatDateTimeRangeOptions
): string {
  if (!start || !end || !isValidDate({ date: start }) || !isValidDate({ date: end })) {
    return "";
  }

  const {
    t,
    includeWeekday = true,
    showEndDate = true,
    includeTimeSeparator = true,
    locale = "fi",
    formatString = UI_DATE_FORMAT,
  } = options ?? {};
  const shouldShowEndDate = showEndDate ?? !isSameDay(start, end);

  const startDateTime = formatDateTime(start, { t, includeWeekday, includeTimeSeparator, locale, formatString });
  const endFormat = !isSameDay(start, end) && shouldShowEndDate ? `${UI_TIME_FORMAT} ${formatString}` : UI_TIME_FORMAT;
  const endDateTime = format(end, endFormat, getFormatLocaleObject(locale));

  return `${startDateTime}–${endDateTime}`.trim();
}

/**
 * Formats a duration into hours and minutes with proper localization
 * @param params - Parameters object
 * @param {TFunction} params.t - Translation function
 * @param {duration} params.duration - Duration object with hours, minutes, and seconds (e.g. { hours: 1, minutes:
 * 30 } or { seconds: 5400 })
 * @param {boolean} [params.abbreviated=true] - Whether to use abbreviated units (e.g. "h" instead of "hours"),
 * @returns Formatted duration string
 * @example
 *  formatDuration({ t, duration: { hours: 1, minutes: 30 } }) // "1 h 30 min"
 *  formatDuration({ t, duration: { seconds: 5400 } }) // "1 h 30 min"
 */
export function formatDuration({
  t,
  duration,
  abbreviated = true,
}: {
  t: TFunction;
  duration: {
    hours?: number;
    minutes?: number;
    seconds?: number;
  };
  abbreviated?: boolean;
}): string {
  const { hours = 0, minutes = 0, seconds = 0 } = duration;
  const secs = hours * 3600 + minutes * 60 + seconds;
  if (!secs) {
    return "-";
  }

  const hour = Math.floor(secs / 60 / 60);
  const min = Math.floor((secs / 60) % 60);

  const hourKey = abbreviated ? "common:abbreviations:hour" : "common:hour";
  const minuteKey = abbreviated ? "common:abbreviations:minute" : "common:minute";

  const p = [];

  if (hour) {
    p.push(t(hourKey, { count: hour }).toLocaleLowerCase());
  }
  if (min) {
    p.push(t(minuteKey, { count: min }).toLocaleLowerCase());
  }

  return p.join(" ");
}

/**
 * Formats a duration range into hours and minutes with proper localization
 * @param params - Parameters object
 * @param {TFunction} params.t - I18next Translation function
 * @param {number} params.beginSecs - Start of duration range in seconds
 * @param {number} params.endSecs - End of duration range in seconds
 * @param {boolean} [params.abbreviated=true] - Whether to use abbreviated units (e.g. "h" instead of "hours"),
 * @returns Formatted duration range if beginSecs and endSecs are different values, otherwise single duration
 * @example formatDuration({ t, beginSecs: 5400, endSecs: 10800 }) // "1 h 30 min – 3 h"
 * @example formatDuration({ t, beginSecs: 7200, endSecs: 7200, abbreviated: false } }) // "2 hours"
 */
export function formatDurationRange({
  t,
  beginSecs,
  endSecs,
  abbreviated = true,
}: {
  t: TFunction;
  beginSecs: number;
  endSecs: number;
  abbreviated?: boolean;
}): string {
  const beginHours = formatDuration({ t, duration: { seconds: beginSecs }, abbreviated });
  const endHours = formatDuration({ t, duration: { seconds: endSecs }, abbreviated });
  return beginSecs === endSecs ? beginHours : `${beginHours} – ${endHours}`;
}
