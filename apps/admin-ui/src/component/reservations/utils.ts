import { set } from "date-fns";

const timeToDuration = (time: string) => {
  const dindex = time.indexOf(":");
  if (dindex > 0) {
    const hours = Number(time.substring(0, dindex) ?? "0");
    const minutes = Number(time.substring(dindex + 1) ?? "0");
    return { hours, minutes };
  }
  return undefined;
};

export const setTimeOnDate = (date: Date, time: string): Date => {
  const duration = timeToDuration(time);
  if (duration) {
    return set(date, duration);
  }
  return date;
};
