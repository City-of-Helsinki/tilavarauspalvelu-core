import { parse } from "date-fns";
import { formatDate } from "../common/util";

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
