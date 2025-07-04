import { timeToMinutes, toMondayFirst } from "common/src/helpers";
import { fromUIDateUnsafe } from "common/src/common/util";
import { TimeSelectionForm } from "@/schemas";
import { Weekday } from "@gql/gql-types";
import { transformWeekday } from "common/src/conversion";
import { DayT } from "common/src/const";

// NOTE Custom UTC date code because taking only the date part of Date results
// in the previous date in UTC+2 timezone
const MILLISECONDS_IN_DAY = 24 * 60 * 60 * 1000;

function eachDayOfInterval(start: number, end: number, stepDays = 1) {
  if (end < start || stepDays < 1) {
    return [];
  }
  const daysWithoutCeil = (end - start) / (MILLISECONDS_IN_DAY * stepDays);
  const days = Math.ceil(daysWithoutCeil);
  return Array.from(Array(days)).map((_, i) => i * (MILLISECONDS_IN_DAY * stepDays) + start);
}

// epoch is Thue (4)
function dayOfWeek(time: number): Weekday {
  const weekdayNumber = ((Math.floor(time / MILLISECONDS_IN_DAY) + 4) % 7) as DayT;
  return transformWeekday(toMondayFirst(weekdayNumber));
}

export function generateReservations(props: TimeSelectionForm) {
  const vals = props;

  if (
    !vals.endTime ||
    !vals.startTime ||
    !vals.startingDate ||
    !vals.endingDate ||
    !vals.repeatOnDays ||
    !vals.repeatPattern
  ) {
    return [];
  }

  const { startingDate, startTime, endingDate, endTime, repeatPattern, repeatOnDays } = vals;

  if (repeatOnDays.length === 0) {
    return [];
  }

  const utcDate = (d: Date) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const min = (a: number, b: number) => (a < b ? a : b);
  const max = (a: number, b: number) => (a > b ? a : b);

  try {
    const rawStartingDate = fromUIDateUnsafe(startingDate);
    const rawEndingDate = fromUIDateUnsafe(endingDate);
    if (Number.isNaN(rawStartingDate) || Number.isNaN(rawEndingDate)) {
      return [];
    }
    if (rawStartingDate > rawEndingDate) {
      return [];
    }
    const tStart = timeToMinutes(startTime);
    const tEnd = timeToMinutes(endTime);
    if (tStart >= tEnd) {
      return [];
    }

    const sDay = max(utcDate(new Date()), utcDate(fromUIDateUnsafe(startingDate)));

    // end date with time 23:59:59
    const eDay = utcDate(fromUIDateUnsafe(endingDate)) + (MILLISECONDS_IN_DAY - 1);
    const firstWeek = eachDayOfInterval(sDay, min(sDay + MILLISECONDS_IN_DAY * 7, eDay));

    return firstWeek
      .filter((time) => repeatOnDays.includes(dayOfWeek(time)))
      .map((x) => eachDayOfInterval(x, eDay, repeatPattern === "weekly" ? 7 : 14))
      .reduce((acc, x) => [...acc, ...x], [])
      .map((day) => ({
        date: new Date(day),
        startTime,
        endTime,
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("exception: ", e);
    // Date throws => don't crash
  }

  return [];
}
