import { parse, set } from "date-fns";
import { formatDate } from "../common/util";
import { fromUIDate } from "common/src/common/util";

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

export const parseDateTimeSafe = (
  date: string,
  time: string
): Date | undefined => {
  try {
    const d = parse(`${date} ${time}`, "dd.MM.yyyy HH:mm", new Date());
    if (Number.isNaN(d.getTime())) {
      return undefined;
    }
    return d;
  } catch (e) {
    return undefined;
  }
};

// TODO this requires a bit of thought, why are we prefering ISO strings over Date objects?
// we should have valid Date object for all the checks
// convert it to ISO string only in mutations after the validation
export function constructApiDate(date: string, time: string): string | null {
  if (date === "" || time === "") {
    return null;
  }
  const d = fromUIDate(date);
  if (!d || Number.isNaN(d.getTime())) {
    return null;
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
  const dindex = time.indexOf(":");
  if (dindex > 0) {
    const hours = Number(time.substring(0, dindex) ?? "0");
    const minutes = Number(time.substring(dindex + 1) ?? "0");
    return { hours, minutes };
  }
  return null;
}
