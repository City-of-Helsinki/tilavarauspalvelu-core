import { isValid, parse, set } from "date-fns";
import { formatDate } from "../common/util";
import { fromApiDate, fromUIDate } from "common/src/common/util";
import { type Maybe } from "@gql/gql-types";

/* Convert api datetime to date required by date input, defaults to current date */
export const valueForDateInput = (from: string): string => {
  return formatDate(from || new Date().toISOString(), "d.M.yyyy") as string;
};

/* Convert api datetime to time required by time input,m defaults to current time */
export const valueForTimeInput = (from: string): string => {
  return formatDate(from || new Date().toISOString(), "HH:mm") as string;
};

/* Construct date from dateinput + timeinput */
export const dateTime = (date: string, time: string): string => {
  return parse(`${date} ${time}`, "dd.MM.yyyy HH:mm", new Date()).toISOString();
};

export function constructDateTimeUnsafe(date: string, time: string): Date {
  const d = parse(`${date} ${time}`, "dd.MM.yyyy HH:mm", new Date());
  if (!isValid(d)) {
    throw new Error("Invalid date");
  }
  return d;
}

export function constructDateTimeSafe(date: string, time: string): Date | null {
  try {
    return constructDateTimeUnsafe(date, time);
  } catch (_) {
    return null;
  }
}

export function fromAPIDateTime(
  d: Maybe<string> | undefined,
  time: Maybe<string> | undefined
): Date | null {
  if (!d || !time) {
    return null;
  }
  try {
    const date = fromApiDate(d);
    const duration = timeToDuration(time);
    if (!isValid(date) || duration == null) {
      return null;
    }
    return set(d, duration);
  } catch (_) {
    return null;
  }
}

// TODO this requires a bit of thought, why are we prefering ISO strings over Date objects?
// we should have valid Date object for all the checks
// convert it to ISO string only in mutations after the validation
export function constructApiDateTime(
  date: string,
  time: string
): string | null {
  try {
    return constructApiDateTimeUnsafe(date, time);
  } catch (_) {
    return null;
  }
}

export function constructApiDateTimeUnsafe(date: string, time: string): string {
  if (date === "" || time === "") {
    throw new Error("Invalid date or time");
  }
  const d = fromUIDate(date);
  if (d == null || isValid(d)) {
    throw new Error("Invalid date");
  }
  const d2 = setTimeOnDate(d, time);
  return d2.toISOString();
}

export function setTimeOnDate(date: Date, time: string): Date {
  const duration = timeToDuration(time);
  if (duration) {
    return set(date, duration);
  }
  return date;
}

function timeToDuration(time: string) {
  // NOTE arrays are incorrectly typed
  const [h, m]: Array<number | undefined> = time
    .split(":")
    .map(Number)
    .filter((x) => Number.isFinite(x));
  return { hours: h ?? 0, minutes: m ?? 0 };
}
