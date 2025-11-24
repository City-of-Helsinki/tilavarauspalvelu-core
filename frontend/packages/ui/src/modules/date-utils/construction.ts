import { parse, set } from "date-fns";
import { parseUIDate, parseApiDate, isValidDate } from "@ui/modules/date-utils/conversion";
import { UI_DATE_FORMAT, UI_TIME_FORMAT } from "@ui/modules/date-utils/formatting";
import { toNumber } from "@ui/modules/helpers";
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
    const baseDate = parseUIDate(date);

    if (!baseDate || !parseStringTimeStruct(time)) {
      return null;
    }

    return setTimeOnDate(baseDate, { ...parseStringTimeStruct(time) });
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
    const baseDate = parseApiDate(date);

    if (!baseDate || !parseStringTimeStruct(time)) {
      return null;
    }

    return setTimeOnDate(baseDate, { ...parseStringTimeStruct(time) });
  } catch {
    return null;
  }
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
    const timeComponents = parseStringTimeStruct(time);
    if (!timeComponents) {
      return date;
    }
    return set(date, {
      hours: timeComponents.hours ?? 0,
      minutes: timeComponents.minutes ?? 0,
      seconds: 0,
      milliseconds: 0,
    });
  }
  return set(date, {
    hours: time.hours ?? 0,
    minutes: time.minutes ?? 0,
    seconds: 0,
    milliseconds: 0,
  });
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
 * Parses a time string into TimeStruct
 * @param timeString - Time in HH:mm or H:mm format
 * @returns Time components or null if invalid
 * @example parseStringTimeStruct("15:30") // { hours: 15, minutes: 30 }
 * @example parseStringTimeStruct("9:05") // { hours: 9, minutes: 5 }
 */
export function parseStringTimeStruct(timeString: string): TimeStruct | null {
  const timeUnits = timeString.split(":");

  if (!timeUnits || !timeUnits[0] || !timeUnits[1]) {
    return null;
  }

  const hours = toNumber(timeUnits[0]);
  const minutes = toNumber(timeUnits[1]);

  if ((hours && (hours < 0 || hours > 23)) || (minutes && (minutes < 0 || minutes > 59))) {
    return null;
  }

  return { hours, minutes, seconds: 0 };
}

/**
 * Parses a Date to TimeStruct
 * @param {Date} date - Date object
 * @returns {TimeStruct} - Time components object
 * @example parseDateTimeStruct(new Date("2023-12-25T15:30:00")) // { hours: 15, minutes: 30 }
 */
export function parseDateTimeStruct(date: Date | null | undefined): TimeStruct | null {
  if (!date) {
    return null;
  }
  const secs = date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();
  if (!secs && secs !== 0) {
    return null;
  }

  const hours = Math.floor(secs / 60 / 60);
  const minutes = Math.floor((secs / 60) % 60);
  return {
    hours,
    minutes,
    seconds: 0,
  };
}
