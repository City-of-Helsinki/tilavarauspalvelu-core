import { format, isValid, isAfter, parse } from "date-fns";
import { type Maybe } from "./types";

export const API_DATE_FORMAT = "yyyy-MM-dd";
export const UI_DATE_FORMAT = "d.M.yyyy";

/**
 * Converts a Date object to API date format (yyyy-MM-dd)
 * @param params - Parameters object
 * @param params.date - Date object to convert
 * @returns API date string or null if invalid
 * @example toApiDate({ date: new Date("2023-12-25") }) // "2023-12-25"
 */
export function toApiDate({ date }: { date: Maybe<Date> }): string | null {
  if (!date || !isValidDate({ date })) {
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
 * @param params - Parameters object
 * @param params.date - Date object to convert
 * @returns API date string
 * @throws Error if date is invalid
 * @example toApiDateUnsafe({ date: new Date("2023-12-25") }) // "2023-12-25"
 */
export function toApiDateUnsafe({ date }: { date: Maybe<Date> }): string {
  const apiDate = toApiDate({ date });
  if (apiDate == null) {
    throw new Error("Invalid date: " + date);
  }
  return apiDate;
}

/**
 * Converts an API date string (yyyy-MM-dd) to Date object
 * @param params - Parameters object
 * @param params.date - API date string
 * @returns Date object or null if invalid
 * @example fromApiDate({ date: "2023-12-25" }) // Date object for Dec 25, 2023
 */
export function fromApiDate({ date }: { date: Maybe<string> }): Date | null {
  if (!date) return null;

  try {
    const parsedDate = parse(date, API_DATE_FORMAT, new Date());
    return isValidDate({ date: parsedDate }) ? parsedDate : null;
  } catch {
    return null;
  }
}

/**
 * Converts a Date object to UI date format (d.M.yyyy)
 * @param params - Parameters object
 * @param params.date - Date object or ISO string to convert
 * @param params.formatStr - Custom format string (defaults to "d.M.yyyy")
 * @returns UI date string or empty string if invalid
 * @example toUIDate({ date: new Date("2023-12-25") }) // "25.12.2023"
 */
export function toUIDate({
  date,
  formatStr = UI_DATE_FORMAT,
}: {
  date: Maybe<Date> | string;
  formatStr?: string;
}): string {
  if (typeof date === "string") {
    const parsedDate = new Date(date);
    if (isValidDate({ date: parsedDate })) {
      date = parsedDate;
    } else {
      return "";
    }
  }
  if (!date || !isValidDate({ date })) {
    return "";
  }
  try {
    return format(date, formatStr);
  } catch {
    return "";
  }
}

/**
 * Converts a Date object to UI datetime format (d.M.yyyy HH:mm)
 * @param params - Parameters object
 * @param params.date - Date object or ISO string to convert
 * @param params.dayTimeSeparator - Separator between date and time (defaults to empty)
 * @returns UI datetime string or empty string if invalid
 * @example toUIDateTime({ date: new Date("2023-12-25T15:30:00"), dayTimeSeparator: " klo " }) // "25.12.2023 klo 15:30"
 */
export function toUIDateTime({
  date,
  dayTimeSeparator = "",
}: {
  date: Maybe<Date> | string;
  dayTimeSeparator?: string;
}): string {
  if (typeof date === "string") {
    const parsedDate = new Date(date);
    if (isValidDate({ date: parsedDate })) {
      date = parsedDate;
    } else {
      return "";
    }
  }
  if (!date || !isValidDate({ date })) {
    return "";
  }
  try {
    return format(date, `${UI_DATE_FORMAT} ${dayTimeSeparator} HH:mm`);
  } catch (_) {
    return "";
  }
}

/**
 * Converts a UI date string (d.M.yyyy) to Date object
 * @param params - Parameters object
 * @param params.date - UI date string
 * @returns Date object or null if invalid
 * @example fromUIDate({ date: "25.12.2023" }) // Date object for Dec 25, 2023
 */
export function fromUIDate({ date }: { date: Maybe<string> }): Date | null {
  if (!date) return null;

  try {
    const parsedDate = parse(date, UI_DATE_FORMAT, new Date());
    return isValidDate({ date: parsedDate }) ? parsedDate : null;
  } catch {
    return null;
  }
}

/**
 * Converts a UI date string (d.M.yyyy) to Date object - throws on invalid input
 * @param params - Parameters object
 * @param params.date - UI date string
 * @returns Date object
 * @throws Error if date is invalid
 * @example fromUIDateUnsafe({ date: "25.12.2023" }) // Date object for Dec 25, 2023
 */
export function fromUIDateUnsafe({ date }: { date: Maybe<string> }): Date {
  const uiDate = fromUIDate({ date });
  if (uiDate == null) {
    throw new Error("Invalid date: " + date);
  }
  return uiDate;
}

/**
 * Converts time struct to API time format (HH:mm)
 * @param params - Parameters object
 * @param params.hours - Hours (0-23)
 * @param params.minutes - Minutes (0-59, defaults to 0)
 * @returns API time string or null if invalid
 * @example toApiTime({ hours: 15, minutes: 30 }) // "15:30"
 */
export function toApiTime({ hours, minutes = 0 }: { hours: number; minutes?: number }): string | null {
  if ((hours === 24 && minutes !== 0) || hours < 0 || hours > 24 || minutes < 0 || minutes > 59) {
    return null;
  }
  const normalizedHours = hours === 24 ? 0 : hours;
  return `${String(normalizedHours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/**
 * Converts time struct to API time format (HH:mm) - throws on invalid input
 * @param params - Parameters object
 * @param params.hours - Hours (0-23)
 * @param params.minutes - Minutes (0-59, defaults to 0)
 * @returns API time string
 * @throws Error if time is invalid
 * @example toApiTimeUnsafe({ hours: 15, minutes: 30 }) // "15:30"
 */
export function toApiTimeUnsafe({ hours, minutes = 0 }: { hours: number; minutes?: number }): string {
  const time = toApiTime({ hours, minutes });
  if (time == null) {
    throw new Error("Invalid time: " + JSON.stringify({ hours, minutes }));
  }
  return time;
}

/**
 * Prepares a date value for HTML date input
 * @param params - Parameters object
 * @param params.date - Date object, date string, or null
 * @returns Formatted date string suitable for date input
 * @example dateForInput({ date: new Date("2023-12-25") }) // "25.12.2023"
 * @example dateForInput({ date: null }) // Current date in UI format
 */
export function dateForInput({ date }: { date: Maybe<Date | string> }): string {
  if (date instanceof Date) {
    return toUIDate({ date });
  }
  if (typeof date === "string") {
    // Try to parse as API date first, then as UI date
    const apiDate = fromApiDate({ date });
    if (apiDate) {
      return toUIDate({ date: apiDate });
    }
    const uiDate = fromUIDate({ date });
    if (uiDate) {
      return toUIDate({ date: uiDate });
    }
  }
  // Fallback to current date
  return toUIDate({ date: new Date() });
}

/**
 * Prepares a time value for HTML time input
 * @param params - Parameters object
 * @param params.time - Date object, time string, or null
 * @returns Formatted time string suitable for time input
 * @example timeForInput({ time: new Date("2023-12-25T15:30:00") }) // "15:30"
 * @example timeForInput({ time: null }) // Current time
 */
export function timeForInput({ time }: { time: Maybe<Date | string> }): string {
  if (time instanceof Date) {
    try {
      return format(time, "HH:mm");
    } catch {
      return format(new Date(), "HH:mm");
    }
  }
  if (typeof time === "string") {
    // Try to parse as ISO string first
    try {
      const date = new Date(time);
      if (isValidDate({ date })) {
        return format(date, "HH:mm");
      }
    } catch {
      // If it's already in HH:mm format, return as-is if valid
      if (/^\d{1,2}:\d{2}$/.test(time)) {
        const timeParts = time.split(":").map(Number);
        const hours = timeParts[0];
        const minutes = timeParts[1];
        if (hours != null && minutes != null && hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
          return time.padStart(5, "0");
        }
      }
    }
  }
  // Fallback to current time
  return format(new Date(), "HH:mm");
}

/**
 * Checks if a date is valid and after year 1000
 * @param params - Parameters object
 * @param params.date - Date to validate
 * @returns True if date is valid and reasonable
 * @example isValidDate({ date: new Date() }) // true
 */
export function isValidDate({ date }: { date: Maybe<Date> }): boolean {
  return date != null && isValid(date) && isAfter(date, new Date("1000-01-01"));
}
