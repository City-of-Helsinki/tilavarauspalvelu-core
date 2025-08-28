import { format, isSameDay, parseISO } from "date-fns";
import { fi } from "date-fns/locale";
import { type TFunction } from "next-i18next";
import { formatMinutes, timeToMinutes, toMinutes } from "../helpers";
import { isValidDate } from "./conversion";
import type { DateFormatOptions, DateTimeRangeFormatOptions, Maybe } from "./types";

export function formatDate({
  date,
  outputFormat = "d.M.yyyy",
}: {
  date: string | Date | null | undefined;
  outputFormat?: string;
}): string | null {
  if (date instanceof Date) {
    return isValidDate({ date }) ? format(date, outputFormat) : null;
  }
  return date ? format(parseISO(date), outputFormat) : null;
}

/**
 * Formats a date and time with localized weekday and separators
 * @param params - Parameters object
 * @param params.t - Translation function
 * @param params.date - Date object or ISO string to format
 * @param params.options - Formatting options
 * @returns Formatted datetime string
 * @example formatDateTime({ t, date: new Date("2023-12-25T15:30:00") }) // "ma 25.12.2023 klo 15:30"
 * @example formatDateTime({ t, date: "2023-12-25T15:30:00", options: { includeWeekday: false }}) // "25.12.2023 klo
 * 15:30"
 */
export function formatDateTime({
  t,
  date,
  options = {},
}: {
  t: TFunction;
  date: Maybe<Date | string>;
  options?: DateFormatOptions;
}): string {
  if (typeof date === "string") {
    const parsedDate = new Date(date);
    if (isValidDate({ date: parsedDate })) {
      date = parsedDate;
    } else {
      return "";
    }
  }

  if (!date || !isValidDate({ date: date })) {
    return "";
  }

  const { includeWeekday = true } = options;

  try {
    const dateStr = formatDate({ date });

    const timeStr = formatTime({ t, date });

    const weekdayStr = includeWeekday ? t(`common:weekday.${date.getDay()}`) : "";

    const separator = t("common:dayTimeSeparator");

    return `${weekdayStr} ${dateStr}${separator} ${timeStr}`.trim();
  } catch {
    // Fallback to basic formatting if i18n fails
    const weekday = includeWeekday ? format(date, "cccccc", { locale: fi }) + " " : "";
    const dateStr = format(date, "d.M.yyyy", { locale: fi });
    const timeStr = format(date, "HH:mm", { locale: fi });
    return `${weekday}${dateStr} klo ${timeStr}`.trim();
  }
}

/**
 * Creates time and date strings for reservations
 * @param params - Parameters object
 * @param params.t - Translation function
 * @param params.reservation - Reservation object
 * @param params.orig - Original reservation object (use undefined if not possible to modify)
 * @param params.trailingMinutes - Whether to include trailing minutes
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

  const beginMins = toMinutes(start);
  const endMins = toMinutes(end);
  const isModified = orig != null && (originalBeginMins !== beginMins || originalEndMins !== endMins);
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

/**
 * Formats a date and time range with proper localization
 * @param params - Parameters object
 * @param params.t - Translation function
 * @param params.start - Start date
 * @param params.end - End date
 * @param params.options - Formatting options
 * @returns Formatted datetime range string
 * @example formatDateTimeRange({ t, start: startDate, end: endDate }) // "ma 25.12.2023 klo 15:30–17:00"
 */
export function formatDateTimeRange({
  t,
  start,
  end,
  options = {},
}: {
  t: TFunction;
  start: Maybe<Date>;
  end: Maybe<Date>;
  options?: DateTimeRangeFormatOptions;
}): string {
  if (!start || !end || !isValidDate({ date: start }) || !isValidDate({ date: end })) {
    return "";
  }

  const { includeWeekday = true, showEndDate } = options;
  const shouldShowEndDate = showEndDate ?? !isSameDay(start, end);

  try {
    const startDateStr = formatDate({ date: start });

    const startTimeStr = formatTime({ t, date: start });

    const endTimeStr = formatTime({ t, date: end });

    const weekdayStr = includeWeekday ? t(`common:weekday.${start.getDay()}`) : "";

    const separator = t("common:dayTimeSeparator");

    if (shouldShowEndDate) {
      const endDateStr = formatDate({ date: end });

      return `${weekdayStr} ${startDateStr}${separator} ${startTimeStr}–${endTimeStr} ${endDateStr}`.trim();
    }

    return `${weekdayStr} ${startDateStr}${separator} ${startTimeStr}–${endTimeStr}`.trim();
  } catch {
    // Fallback formatting
    return formatDateTimeRangeFallback(start, end, { includeWeekday, showEndDate: shouldShowEndDate });
  }
}

/**
 * Formats a date range (without time)
 * @param params - Parameters object
 * @param params.t - Translation function
 * @param params.start - Start date
 * @param params.end - End date
 * @param params.options - Formatting options
 * @returns Formatted date range string
 * @example formatDateRange({ t, start: startDate, end: endDate }) // "ma 25.12.2023–26.12.2023"
 */
export function formatDateRange({
  t,
  start,
  end,
  options = {},
}: {
  t: TFunction;
  start: Maybe<Date>;
  end: Maybe<Date>;
  options?: DateFormatOptions;
}): string {
  if (!start || !end || !isValidDate({ date: start }) || !isValidDate({ date: end })) {
    return "";
  }

  const { includeWeekday = true } = options;

  try {
    const startDateStr = formatDate({ date: start });

    const weekdayStr = includeWeekday ? t(`common:weekday.${start.getDay()}`) : "";

    if (isSameDay(start, end)) {
      return `${weekdayStr} ${startDateStr}`.trim();
    }

    const endDateStr = formatDate({ date: end });

    return `${weekdayStr} ${startDateStr} – ${endDateStr}`.trim();
  } catch {
    // Fallback formatting
    return formatDateRangeFallback(start, end, includeWeekday);
  }
}

/**
 * Simple date range formatter without i18n dependency
 * @param params - Parameters object
 * @param params.start - Start date
 * @param params.end - End date
 * @returns Formatted date range string
 * @example formatSimpleDateRange({ start: startDate, end: endDate }) // "25.12.2023 – 26.12.2023"
 */
export function formatSimpleDateRange({ start, end }: { start: Maybe<Date>; end: Maybe<Date> }): string {
  if (!start || !end || !isValidDate({ date: start }) || !isValidDate({ date: end })) {
    return "";
  }

  try {
    const startStr = format(start, "d.M.yyyy", { locale: fi });

    if (isSameDay(start, end)) {
      return startStr;
    }

    const endStr = format(end, "d.M.yyyy", { locale: fi });
    return `${startStr} – ${endStr}`;
  } catch {
    return "";
  }
}

/**
 * Formats just the time portion of a date
 * @param params - Parameters object
 * @param params.t - Translation function
 * @param params.date - Date object or ISO date string
 * @param params.includeTimeSeparator - Whether to include time separator from i18n
 * @returns Formatted time string
 * @example formatTime({ t, date: new Date("2023-12-25T15:30:00") }) // "15:30"
 * @example formatTime({ t, date: "2023-12-25T15:30:00" }) // "15:30"
 */
export function formatTime({
  t,
  date,
  includeTimeSeparator = false,
}: {
  t: TFunction;
  date: Maybe<Date> | string;
  includeTimeSeparator?: boolean;
}): string {
  if (typeof date === "string") {
    const parsedDate = new Date(date);
    if (isValidDate({ date: parsedDate })) {
      date = parsedDate;
    } else {
      return "";
    }
  }

  if (!date || !isValidDate({ date: date })) {
    return "";
  }

  try {
    const separator = includeTimeSeparator ? t("common:dayTimeSeparator") : "";
    return `${format(date, `${separator}HH:mm`, { locale: fi })}`.trim();
  } catch {
    // Fallback
    return format(date, "HH:mm", { locale: fi });
  }
}

/**
 * Fallback datetime range formatter when i18n is not available
 */
function formatDateTimeRangeFallback(
  start: Date,
  end: Date,
  options: { includeWeekday?: boolean; showEndDate?: boolean } = {}
): string {
  const { includeWeekday = true, showEndDate = false } = options;

  try {
    const weekday = includeWeekday ? format(start, "cccccc", { locale: fi }) + " " : "";
    const startDate = format(start, "d.M.yyyy", { locale: fi });
    const startTime = format(start, "HH:mm", { locale: fi });
    const endTime = format(end, "HH:mm", { locale: fi });

    if (showEndDate) {
      const endDate = format(end, "d.M.yyyy", { locale: fi });
      return `${weekday}${startDate} ${startTime}–${endTime} ${endDate}`.trim();
    }

    return `${weekday}${startDate} ${startTime}–${endTime}`.trim();
  } catch {
    return "";
  }
}

/**
 * Fallback date range formatter when i18n is not available
 */
function formatDateRangeFallback(start: Date, end: Date, includeWeekday = true): string {
  try {
    const weekday = includeWeekday ? format(start, "cccccc", { locale: fi }) + " " : "";
    const startDate = format(start, "d.M.yyyy", { locale: fi });

    if (isSameDay(start, end)) {
      return `${weekday}${startDate}`.trim();
    }

    const endDate = format(end, "d.M.yyyy", { locale: fi });
    return `${weekday}${startDate}–${endDate}`.trim();
  } catch {
    return "";
  }
}

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

function formatDurationSeconds(seconds: number, t: TFunction): string {
  return formatDuration({ t, duration: { seconds }, abbreviated: true });
}

export function formatDurationRange({
  t,
  beginSecs,
  endSecs,
}: {
  t: TFunction;
  beginSecs: number;
  endSecs: number;
}): string {
  const beginHours = formatDurationSeconds(beginSecs, t);
  const endHours = formatDurationSeconds(endSecs, t);
  return beginSecs === endSecs ? beginHours : `${beginHours} – ${endHours}`;
}
