import { parse, set } from "date-fns";
import { fromUIDate, fromApiDate, isValidDate } from "./conversion";
import { UI_DATE_FORMAT, UI_TIME_FORMAT } from "./index";
import type { TimeStruct } from "./types";

/**
 * DateTime construction utilities
 */

/**
 * Constructs a Date object from UI date and time strings
 * @param date - Date string in UI format (d.M.yyyy)
 * @param time - Time string in HH:mm format
 * @returns Date object or null if invalid
 * @example
 *   fromUIDateTime("25.12.2023", "15:30") // Date for Dec 25, 2023 at 3:30 PM
 *   fromUIDateTime("invalid", "values") // null
 */
export function fromUIDateTime(date: string, time: string): Date | null {
  if (!date || !time) {
    return null;
  }

  try {
    const baseDate = fromUIDate(date);
    if (!baseDate) {
      return null;
    }

    const timeComponents = parseTimeString(time);
    if (!timeComponents) {
      return null;
    }

    return setTimeOnDate(baseDate, { hours: timeComponents.hours, minutes: timeComponents.minutes });
  } catch {
    return null;
  }
}

/**
 * Constructs a Date object from UI date and time strings - throws on invalid input
 * @param date - Date string in UI format (d.M.yyyy)
 * @param time - Time string in HH:mm format
 * @returns Date object
 * @throws Error if date or time is invalid
 * @example
 *   fromUIDateTimeUnsafe("25.12.2023", "15:30" }) // Date for Dec 25, 2023 at 3:30 PM
 *   fromUIDateTimeUnsafe("invalid", "values" }) // Throws error
 */
export function fromUIDateTimeUnsafe(date: string, time: string): Date {
  const uiDateTime = fromUIDateTime(date, time);
  if (uiDateTime == null) {
    throw new Error("Invalid date or time: " + date + " " + time);
  }
  return uiDateTime;
}

/**
 * Constructs a Date object from API date and time strings
 * @param date - Date string in API format (yyyy-MM-dd)
 * @param time - Time string in HH:mm format
 * @returns Date object or null if invalid
 * @example
 *   fromApiDateTime("2023-12-25", "15:30" }) // Date for Dec 25, 2023 at 3:30 PM
 *   fromApiDateTime("invalid", "values" }) // null
 */
export function fromApiDateTime(date: string | null | undefined, time: string | null | undefined): Date | null {
  if (!date || !time) {
    return null;
  }

  try {
    const baseDate = fromApiDate(date);
    if (!baseDate) {
      return null;
    }

    const timeComponents = parseTimeString(time);
    if (!timeComponents) {
      return null;
    }

    return setTimeOnDate(baseDate, { hours: timeComponents.hours, minutes: timeComponents.minutes });
  } catch {
    return null;
  }
}

/**
 * Constructs a datetime ISO string from UI date and time strings
 * @param date - Date string in UI format (d.M.yyyy)
 * @param time - Time string in HH:mm format
 * @returns ISO string or null if invalid
 * @example
 *   dateTimeToISOString("25.12.2023", "15:30") // "2023-12-25T15:30:00.000Z"
 *   dateTimeToISOString("invalid"", "values" }) // null
 */
export function dateTimeToISOString(date: string, time: string): string | null {
  const dateTime = fromUIDateTime(date, time);
  return dateTime ? dateTime.toISOString() : null;
}

/**
 * Sets time on an existing Date object
 * @param date - Base date object
 * @param {string | TimeStruct} time - Time in HH:mm format or TimeStruct
 * @returns New Date object with time set
 * @example setTimeOnDate({ date: new Date("2023-12-25"), hours: 15, minutes: 30 }) // Dec 25, 2023 at 3:30 PM
 */
export function setTimeOnDate(date: Date, time: string | TimeStruct): Date {
  if (typeof time === "string") {
    const timeComponents = parseTimeString(time);
    if (!timeComponents) {
      return date;
    }
    return set(date, {
      hours: timeComponents.hours,
      minutes: timeComponents.minutes ?? 0,
      seconds: 0,
      milliseconds: 0,
    });
  }
  return set(date, { hours: time.hours, minutes: time.minutes ?? 0, seconds: 0, milliseconds: 0 });
}

/**
 * Constructs a Date from combined date and time string in UI format
 * @param dateTime - Combined string in format "dd.MM.yyyy HH:mm"
 * @returns Date object or null if invalid
 * @example parseCombinedUIDateTime("25.12.2023 15:30") // Date for Dec 25, 2023 at 3:30 PM
 */
export function parseCombinedUIDateTime(dateTime: string): Date | null {
  if (!dateTime) {
    return null;
  }

  try {
    const parsedDate = parse(dateTime, `${UI_DATE_FORMAT} ${UI_TIME_FORMAT}`, new Date());
    return isValidDate(parsedDate) ? parsedDate : null;
  } catch {
    return null;
  }
}

/**
 * Extracts TimeStruct from a Date object
 * @param {Date} date - Date object
 * @returns {TimeStruct} - Time components object
 * @example timeStructFromDate(new Date("2023-12-25T15:30:00")) // { hours: 15, minutes: 30 }
 */
export function timeStructFromDate(date: Date): TimeStruct {
  return {
    hours: date.getHours(),
    minutes: date.getMinutes(),
  };
}

/**
 * Parses a time string into TimeStruct
 * @param timeString - Time in HH:mm or H:mm format
 * @returns Time components or null if invalid
 * @example parseTimeString("15:30") // { hours: 15, minutes: 30 }
 * @example parseTimeString("9:05") // { hours: 9, minutes: 5 }
 */
function parseTimeString(timeString: string): TimeStruct | null {
  const timeRegex = /^(\d{1,2}):(\d{2})$/;
  const match = timeString.match(timeRegex);

  if (!match || !match[1] || !match[2]) {
    return null;
  }

  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }

  return { hours, minutes };
}
