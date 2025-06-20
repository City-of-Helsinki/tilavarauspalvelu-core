import {
  parseISO,
  startOfWeek as dateFnsStartOfWeek,
  endOfWeek as dateFnsEndOfWeek,
  format,
  isValid,
  isAfter,
  parse,
} from "date-fns";
import { fi } from "date-fns/locale";
import { type TFunction } from "next-i18next";
import { capitalize } from "../helpers";

export const parseDate = (date: string): Date => parseISO(date);

export const startOfWeek = (d: Date): Date => dateFnsStartOfWeek(d, { weekStartsOn: 1 });

export const endOfWeek = (d: Date): Date => dateFnsEndOfWeek(d, { weekStartsOn: 1 });

export function formatDuration(
  t: TFunction,
  duration: {
    hours?: number;
    minutes?: number;
    seconds?: number;
  },
  abbreviated = true
): string {
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
  return formatDuration(t, { seconds }, true);
}

export function formatDurationRange(t: TFunction, beginSecs: number, endSecs: number): string {
  const beginHours = formatDurationSeconds(beginSecs, t);
  const endHours = formatDurationSeconds(endSecs, t);
  return beginSecs === endSecs ? beginHours : `${beginHours} – ${endHours}`;
}

export function addYears(date: Date, years: number): Date {
  const newDate = new Date(date);
  newDate.setFullYear(newDate.getFullYear() + years);
  return newDate;
}

type TimeStruct = {
  hours: number;
  minutes?: number;
};

export function toApiTime({ hours, minutes = 0 }: TimeStruct): string | null {
  if ((hours === 24 && minutes !== 0) || hours < 0 || hours > 24 || minutes < 0 || minutes > 59) {
    return null;
  }
  const hNormalized = hours === 24 ? 0 : hours;
  const timeStr = `${String(hNormalized).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  return timeStr;
}

export function toApiTimeUnsafe({ hours, minutes = 0 }: TimeStruct): string {
  const time = toApiTime({ hours, minutes });
  if (time == null) {
    throw new Error("Invalid time: " + JSON.stringify({ hours, minutes }));
  }
  return time;
}

// Returns a string in specified format (default: "yyyy-MM-dd") from a Date object,
// pass a format string as a second parameter to change the format
// TODO rename to API
export function toApiDate(date: Date): string | null {
  const formatStr = "yyyy-MM-dd";
  if (!date || Number.isNaN(date.getTime())) {
    return null;
  }
  try {
    return format(date, formatStr);
  } catch (_) {
    return null;
  }
}

// May crash on invalid dates
// TODO rename to API
export function toApiDateUnsafe(date: Date) {
  const formatStr = "yyyy-MM-dd";
  return format(date, formatStr);
}

// Returns a Date from a string in format "yyyy-MM-dd"
// TODO rename to API
export function fromApiDate(date: string): Date | null {
  try {
    const d = parse(date, "yyyy-MM-dd", new Date());
    if (Number.isNaN(d.getTime())) {
      return null;
    }
    return d;
  } catch (_) {
    return null;
  }
}

export function fromUIDateUnsafe(date: string): Date {
  return parse(date, "d.M.yyyy", new Date());
}

// Returns a Date object from a string in format "d.M.yyyy"
// Returns null if the date is invalid (the string is in invalid format or the date is before year 1000)
export function fromUIDate(date: string): Date | null {
  try {
    const d = parse(date, "d.M.yyyy", new Date());
    return isValidDate(d) ? d : null;
  } catch (_) {
    return null;
  }
}

// Returns true if the date is not NaN and after year 1000
// this is used to check date after string conversion
// another option: combine it to the date conversion functions (return null on invalid dates) => better with TS
export const isValidDate = (date: Date): boolean => isValid(date) && isAfter(date, new Date("1000-01-01"));

// Returns a string in "d.M.yyyy" format from a Date object
// TODO returning undefined would be preferably (specificity) but breaks the users of this function
export function toUIDate(date: Date | null, formatStr = "d.M.yyyy"): string {
  if (!date || !isValidDate(date)) {
    return "";
  }
  try {
    return format(date, formatStr, { locale: fi });
  } catch (_) {
    return "";
  }
}

// Returns a string in "d.M.yyyy klo hh:mm" format from a Date object
// TODO returning undefined would be preferably (specificity) but breaks the users of this function
export function toUIDateTime(date: Date | null, formatStr = "d.M.yyyy"): string {
  if (!date || !isValidDate(date)) {
    return "";
  }
  try {
    return `${format(date, formatStr, { locale: fi })} klo ${format(date, "hh:mm", { locale: fi })}`;
  } catch (_) {
    return "";
  }
}

export const chunkArray = <T>(array: T[], size: number): T[][] => {
  const result = [];
  let index = 0;

  while (index < array.length) {
    result.push(array.slice(index, size + index));
    index += size;
  }

  return result;
};

/// Find a translation from a gql query result
/// @param lang - language to use, use useTranslation hook in get the current language inside a component
// TODO rename to getTranslation when the other one is removed
// TODO Records are bad, use a query result type instead?
// TODO key should not be a string (so we don't accidentially pass "nameFi" here)
// gather all used keys and make a string literal for them (typically it's just name)
export function getTranslationSafe(parent: Record<string, unknown>, key: string, lang: "fi" | "sv" | "en"): string {
  const keyString = `${key}${capitalize(lang)}`;
  if (parent && parent[keyString]) {
    if (typeof parent[keyString] === "string") {
      return String(parent[keyString]);
    }
  }
  const fallback = "fi";
  const fallbackKeyString = `${key}${capitalize(fallback)}`;
  if (parent && parent[fallbackKeyString]) {
    if (typeof parent[fallbackKeyString] === "string") {
      return String(parent[fallbackKeyString]);
    }
  }

  return "";
}

export function convertLanguageCode(lang: string): "fi" | "sv" | "en" {
  if (lang === "sv" || lang === "en" || lang === "fi") {
    return lang;
  }
  return "fi";
}
