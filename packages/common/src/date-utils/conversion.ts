import { format, isValid, isAfter, parse } from "date-fns";
import { formatDate, formatTime } from "./formatting";
import { UI_DATE_FORMAT, API_DATE_FORMAT } from "./";

/**
 * Converts a Date object to API date format (yyyy-MM-dd)
 * @param params - Parameters object
 * @param params.date - Date object to convert
 * @returns API date string or null if invalid
 * @example toApiDate({ date: new Date("2023-12-25") }) // "2023-12-25"
 */
export function toApiDate({ date }: { date: Date }): string | null {
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
export function toApiDateUnsafe({ date }: { date: Date }): string {
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
export function fromApiDate({ date }: { date: string }): Date | null {
  if (!date) return null;

  try {
    const parsedDate = parse(date, API_DATE_FORMAT, new Date());
    return isValidDate({ date: parsedDate }) ? parsedDate : null;
  } catch {
    return null;
  }
}

/**
 * Converts a UI date string (d.M.yyyy) to Date object
 * @param params - Parameters object
 * @param params.date - UI date string
 * @returns Date object or null if invalid
 * @example fromUIDate({ date: "25.12.2023" }) // Date object for Dec 25, 2023
 */
export function fromUIDate({ date }: { date: string }): Date | null {
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
export function fromUIDateUnsafe({ date }: { date: string }): Date {
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
export function dateForInput({ date }: { date: Date | string }): string {
  if (date instanceof Date) {
    const formatted = formatDate(date);
    return formatted || "";
  }
  // Try to parse as API date first, then as UI date
  const apiDate = fromApiDate({ date });
  if (apiDate) {
    const formatted = formatDate(apiDate);
    return formatted || "";
  }
  const uiDate = fromUIDate({ date });
  if (uiDate) {
    const formatted = formatDate(uiDate);
    return formatted || "";
  }
  // Fallback to current date
  const formatted = formatDate(new Date());
  return formatted || "";
}

/**
 * Prepares a time value for HTML time input
 * @param params - Parameters object
 * @param params.time - Date object, time string, or null
 * @returns Formatted time string suitable for time input
 * @example timeForInput({ time: new Date("2023-12-25T15:30:00") }) // "15:30"
 * @example timeForInput({ time: null }) // Current time
 */
export function timeForInput({ time }: { time: Date | string }): string {
  if (time instanceof Date) {
    const formatted = formatTime(time);
    if (formatted) {
      return formatted;
    }
    const fallback = formatTime(new Date());
    return fallback || "00:00";
  }
  // Try to parse as ISO string first
  try {
    const date = new Date(time);
    if (isValidDate({ date })) {
      const formatted = formatTime(date);
      return formatted || "";
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
  // Fallback to current time
  const fallback = formatTime(new Date());
  return fallback || "00:00";
}

/**
 * Checks if a date is valid and after year 1000
 * @param params - Parameters object
 * @param {Date} params.date - Date to validate
 * @returns True if date is valid and reasonable
 * @example
 *   isValidDate({ date: new Date() }) // true
 *   isValidDate({ date: new Date("999-12-31") }) // false
 *   isValidDate({ date: new Date("invalid-date") }) // false
 */
export function isValidDate({ date }: { date: Date }): boolean {
  return date != null && isValid(date) && isAfter(date, new Date("1000-01-01"));
}

/// Converts a date to minutes discarding date and seconds
export function dateToMinutes(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

export function minutesToHoursString(minutes: number, trailingMinutes = false): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const showMins = trailingMinutes || mins > 0;
  if (showMins) {
    return `${hours}:${mins < 10 ? `0${mins}` : mins}`;
  }
  return `${hours}`;
}

/// @description Convert time string "HH:MM" to minutes
/// safe for invalid time strings but not for invalid time values
/// removes trailing seconds if present
/// @return 0 if time is invalid otherwise the time in minutes
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  if (hours != null && minutes != null && isFinite(hours) && isFinite(minutes)) {
    return hours * 60 + minutes;
  }
  return 0;
}
