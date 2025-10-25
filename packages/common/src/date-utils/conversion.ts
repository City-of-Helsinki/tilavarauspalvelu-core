import { isValid, isAfter, parse } from "date-fns";
import type { DayT } from "../modules/const";
import { formatDate, formatTime } from "./formatting";
import { UI_DATE_FORMAT, API_DATE_FORMAT } from "./";

/**
 * API/UI date format conversion utilities
 */

/**
 * Converts an API date string (yyyy-MM-dd) to Date object
 * @param date - API date string
 * @returns Date object or null if invalid
 * @example parseApiDate("2023-12-25") // Date object for Dec 25, 2023
 */
export function parseApiDate(date: string): Date | null {
  if (!date) return null;

  try {
    const parsedDate = parse(date, API_DATE_FORMAT, new Date());
    return isValidDate(parsedDate) ? parsedDate : null;
  } catch {
    return null;
  }
}

/**
 * Converts a UI date string (d.M.yyyy) to Date object
 * @param date - UI date string
 * @returns Date object or null if invalid
 * @example parseUIDate("25.12.2023") // Date object for Dec 25, 2023
 */
export function parseUIDate(date: string): Date | null {
  if (!date) return null;

  try {
    const parsedDate = parse(date, UI_DATE_FORMAT, new Date());
    return isValidDate(parsedDate) ? parsedDate : null;
  } catch {
    return null;
  }
}

/**
 * Converts a UI date string (d.M.yyyy) to Date object - throws on invalid input
 * @param date - UI date string
 * @returns Date object
 * @throws Error if date is invalid
 * @example fromUIDateUnsafe("25.12.2023") // Date object for Dec 25, 2023
 */
export function parseUIDateUnsafe(date: string): Date {
  const uiDate = parseUIDate(date);
  if (uiDate == null) {
    throw new Error("Invalid date: " + date);
  }
  return uiDate;
}

/**
 * Prepares a date value for HTML date input
 * @param date - Date object, date string, or null
 * @returns Formatted date string suitable for date input
 * @example
 *   dateForInput(new Date("2023-12-25")) // "25.12.2023"
 *   dateForInput(null) // Current date in UI format
 */
export function dateForInput(date: Date | string): string {
  if (date instanceof Date) {
    const formatted = formatDate(date, {});
    return formatted || "";
  }
  // Try to parse as API date first, then as UI date
  const apiDate = parseApiDate(date);
  if (apiDate) {
    const formatted = formatDate(apiDate, {});
    return formatted || "";
  }
  const uiDate = parseUIDate(date);
  if (uiDate) {
    const formatted = formatDate(uiDate, {});
    return formatted || "";
  }
  // Fallback to current date
  const formatted = formatDate(new Date(), {});
  return formatted || "";
}

/**
 * Prepares a time value for HTML time input
 * @param time - Date object, time string, or null
 * @returns Formatted time string suitable for time input
 * @example
 *   timeForInput(new Date("2023-12-25T15:30:00")) // "15:30"
 *   timeForInput(null) // Current time
 */
export function timeForInput(time: Date | string): string {
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
    if (isValidDate(date)) {
      const formatted = formatTime(date);
      return formatted || "";
    }
  } catch {
    // If it's already in HH:mm format, return as-is if valid
    if (time.split(":").length >= 2) {
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
 * @param date - Date to validate
 * @returns true if date is valid and reasonable
 * @description This function checks if the provided date is a valid Date object and ensures it is after January 1, 1000. This helps filter out obviously incorrect dates that may arise from parsing errors or invalid inputs.
 * @example
 *   isValidDate(new Date()) // true
 *   isValidDate(new Date("999-12-31")) // false
 *   isValidDate(new Date("invalid-date")) // false
 */
export function isValidDate(date: Date): boolean {
  return date != null && isValid(date) && isAfter(date, new Date("1000-01-01"));
}

/**
 * Converts a date to only amount of minutes (discarding date and seconds)
 * @param {Date} d - Date object
 */
export function dateToMinutes(d: Date | null): number | null {
  if (!d || !isValidDate(d)) {
    return null;
  }
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

/**
 * Convert time string "HH:MM" to minutes, removes trailing seconds if present - safe for invalid time
 * strings but not for invalid time values
 * @param time - Time string in format "HH:MM" or "HH:MM:SS"
 * @return 0 if time is invalid otherwise the time in minutes
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  if (hours != null && minutes != null && isFinite(hours) && isFinite(minutes)) {
    return hours * 60 + minutes;
  }
  return 0;
}

/**
 * Converts JS Date.getDay() (0=Sun..6=Sat) to (0=Mon..6=Sun)
 * @param {DayT} day - Day of week from Date.getDay()
 * @returns {DayT} Converted day of week
 * @example
 *   setMondayFirst(0) // 6 (Sunday)
 *   setMondayFirst(4) // 3 (Wednesday)
 *   setMondayFirst(6) // 5 (Monday)
 */
export function setMondayFirst(day: number): DayT {
  if (day < 0 || day > 6) {
    throw new Error(`Invalid day ${day}`);
  }
  return day === 0 ? 6 : ((day - 1) as DayT);
}

/**
 * Converts JS Date.getDay() (0=Mon..6=Sun) to (0=Sun..6=Sat)
 * @param {DayT} day - Day of week from Date.getDay()
 * @returns {DayT} Converted day of week
 * @example
 *   setSundayFirst(0) // 1 (Monday)
 *   setSundayFirst(3) // 4 (Wednesday)
 *   setSundayFirst(6) // 0 (Sunday)
 */
export function setSundayFirst(day: number): DayT {
  if (day < 0) {
    throw new Error(`Invalid day ${day}`);
  }
  return ((day + 1) % 7) as DayT;
}
