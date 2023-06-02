import { parse } from "date-fns";

export type DateRange = {
  begin: Date;
  end: Date;
};

// Assumes that 08:00 - 09:00 and 09:00 - 10:00 do not overlap
// Assumes that begin <= end
export const isOverlapping = (a: DateRange, b: DateRange) => {
  if (a.begin >= b.end || b.begin >= a.end) {
    return false;
  }
  return true;
};

// no exception wrapping because parse only throws on invalid format strings (not on invalid inputs)
export const convertToDate = (d: Date, time: string) => {
  if (!d || Number.isNaN(d.getTime())) {
    return undefined;
  }
  const res = parse(time, "HH:mm", d);
  return !Number.isNaN(res.getTime()) ? res : undefined;
};
