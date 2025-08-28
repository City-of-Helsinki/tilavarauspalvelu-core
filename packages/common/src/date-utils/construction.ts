import { parse, set } from "date-fns";
import { fromUIDate, fromApiDate, isValidDate } from "./conversion";
import { type Maybe } from "./types";

/**
 * Constructs a Date object from UI date and time strings
 * @param params - Parameters object
 * @param params.date - Date string in UI format (d.M.yyyy)
 * @param params.time - Time string in HH:mm format
 * @returns Date object or null if invalid
 * @example fromUIDateTime({ date: "25.12.2023", time: "15:30" }) // Date for Dec 25, 2023 at 3:30 PM
 */
export function fromUIDateTime({ date, time }: { date: string; time: string }): Date | null {
  if (!date || !time) {
    return null;
  }

  try {
    const baseDate = fromUIDate({ date });
    if (!baseDate) {
      return null;
    }

    const timeComponents = parseTimeString(time);
    if (!timeComponents) {
      return null;
    }

    return setTimeOnDate({ date: baseDate, hours: timeComponents.hours, minutes: timeComponents.minutes });
  } catch {
    return null;
  }
}

/**
 * Constructs a Date object from UI date and time strings - throws on invalid input
 * @param params - Parameters object
 * @param params.date - Date string in UI format (d.M.yyyy)
 * @param params.time - Time string in HH:mm format
 * @returns Date object
 * @throws Error if date or time is invalid
 * @example fromUIDateTimeUnsafe({ date: "25.12.2023", time: "15:30" }) // Date for Dec 25, 2023 at 3:30 PM
 */
export function fromUIDateTimeUnsafe({ date, time }: { date: string; time: string }): Date {
  const uiDateTime = fromUIDateTime({ date, time });
  if (uiDateTime == null) {
    throw new Error("Invalid date or time: " + date + " " + time);
  }
  return uiDateTime;
}

/**
 * Constructs a Date object from API date and time strings
 * @param params - Parameters object
 * @param params.date - Date string in API format (yyyy-MM-dd)
 * @param params.time - Time string in HH:mm format
 * @returns Date object or null if invalid
 * @example fromApiDateTime({ date: "2023-12-25", time: "15:30" }) // Date for Dec 25, 2023 at 3:30 PM
 */
export function fromApiDateTime({ date, time }: { date: Maybe<string>; time: Maybe<string> }): Date | null {
  if (!date || !time) {
    return null;
  }

  try {
    const baseDate = fromApiDate({ date });
    if (!baseDate) {
      return null;
    }

    const timeComponents = parseTimeString(time);
    if (!timeComponents) {
      return null;
    }

    return setTimeOnDate({ date: baseDate, hours: timeComponents.hours, minutes: timeComponents.minutes });
  } catch {
    return null;
  }
}

/**
 * Constructs a datetime ISO string from UI date and time strings
 * @param params - Parameters object
 * @param params.date - Date string in UI format (d.M.yyyy)
 * @param params.time - Time string in HH:mm format
 * @returns ISO string or null if invalid
 * @example dateTimeToISOString({ date: "25.12.2023", time: "15:30" }) // "2023-12-25T15:30:00.000Z"
 */
export function dateTimeToISOString({ date, time }: { date: string; time: string }): string | null {
  const dateTime = fromUIDateTime({ date, time });
  return dateTime ? dateTime.toISOString() : null;
}

/**
 * Legacy compatibility function for dateTime
 * @param params - Parameters object
 * @param params.date - Date string
 * @param params.time - Time string
 * @returns Date object or null if invalid
 * @deprecated Use fromUIDateTime instead
 */
export function dateTime({ date, time }: { date: Maybe<string>; time: Maybe<string> }): Date | null {
  return fromUIDateTime({ date: date ?? "", time: time ?? "" });
}

/**
 * Sets time on an existing Date object
 * @param params - Parameters object
 * @param params.date - Base date object
 * @param params.hours - Hours (0-23)
 * @param params.minutes - Minutes (0-59, defaults to 0)
 * @returns New Date object with time set
 * @example setTimeOnDate({ date: new Date("2023-12-25"), hours: 15, minutes: 30 }) // Dec 25, 2023 at 3:30 PM
 */
export function setTimeOnDate({ date, hours, minutes = 0 }: { date: Date; hours: number; minutes?: number }): Date {
  return set(date, { hours, minutes, seconds: 0, milliseconds: 0 });
}

/**
 * Alternative function that accepts time string
 * @param params - Parameters object
 * @param params.date - Base date object
 * @param params.timeString - Time in HH:mm format
 * @returns New Date object with time set or original date if time invalid
 * @example setTimeOnDateString({ date: new Date("2023-12-25"), timeString: "15:30" }) // Dec 25, 2023 at 3:30 PM
 */
export function setTimeOnDateString({ date, timeString }: { date: Date; timeString: string }): Date {
  const timeComponents = parseTimeString(timeString);
  if (!timeComponents) {
    return date;
  }
  return setTimeOnDate({ date, hours: timeComponents.hours, minutes: timeComponents.minutes });
}

/**
 * Constructs a Date from combined date and time string in UI format
 * @param params - Parameters object
 * @param params.dateTime - Combined string in format "dd.MM.yyyy HH:mm"
 * @returns Date object or null if invalid
 * @example parseCombinedUIDateTime({ dateTime: "25.12.2023 15:30" }) // Date for Dec 25, 2023 at 3:30 PM
 */
export function parseCombinedUIDateTime({ dateTime }: { dateTime: string }): Date | null {
  if (!dateTime) {
    return null;
  }

  try {
    const parsedDate = parse(dateTime, "dd.MM.yyyy HH:mm", new Date());
    return isValidDate({ date: parsedDate }) ? parsedDate : null;
  } catch {
    return null;
  }
}

/**
 * Extracts time components from a Date object
 * @param params - Parameters object
 * @param params.date - Date object
 * @returns Time components object
 * @example extractTimeComponents({ date: new Date("2023-12-25T15:30:00") }) // { hours: 15, minutes: 30 }
 */
export function extractTimeComponents({ date }: { date: Date }): { hours: number; minutes: number } {
  return {
    hours: date.getHours(),
    minutes: date.getMinutes(),
  };
}

/**
 * Parses a time string into hours and minutes
 * @param timeString - Time in HH:mm or H:mm format
 * @returns Time components or null if invalid
 * @example parseTimeString("15:30") // { hours: 15, minutes: 30 }
 * @example parseTimeString("9:05") // { hours: 9, minutes: 5 }
 */
function parseTimeString(timeString: string): { hours: number; minutes: number } | null {
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
