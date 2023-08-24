import { fromUIDate } from "common/src/common/util";
import { ReservationUnitsReservationUnitReservationStartIntervalChoices } from "common/types/gql-types";
import { timeSelectionSchema } from "app/schemas";
import { toMondayFirst } from "../../../common/util";

// NOTE Custom UTC date code because taking only the date part of Date results
// in the previous date in UTC+2 timezone
const MS_IN_DAY = 24 * 60 * 60 * 1000;
const eachDayOfInterval = (start: number, end: number, stepDays = 1) => {
  if (end < start || stepDays < 1) {
    return [];
  }
  const daysWithoutCeil = (end - start) / (MS_IN_DAY * stepDays);
  const days = Math.ceil(daysWithoutCeil);
  return Array.from(Array(days)).map(
    (_, i) => i * (MS_IN_DAY * stepDays) + start
  );
};

// epoch is Thue (4)
// TODO this could be combined with monday first
type WeekDay = 0 | 1 | 2 | 3 | 4 | 5 | 6;
const dayOfWeek: (t: number) => WeekDay = (time: number) =>
  ((Math.floor(time / MS_IN_DAY) + 4) % 7) as WeekDay;

// Returning the zod validation result also for error handling
const generateReservations = (
  props: unknown,
  interval: ReservationUnitsReservationUnitReservationStartIntervalChoices
) => {
  const vals = timeSelectionSchema(interval).safeParse(props);

  if (!vals.success) {
    return {
      ...vals,
      reservations: [],
    };
  }

  if (
    !vals.data.endTime ||
    !vals.data.startTime ||
    !vals.data.startingDate ||
    !vals.data.endingDate ||
    !vals.data.repeatOnDays ||
    !vals.data.repeatPattern
  ) {
    return {
      ...vals,
      reservations: [],
    };
  }

  const {
    startingDate,
    startTime,
    endingDate,
    endTime,
    repeatPattern,
    repeatOnDays,
  } = vals.data;

  const utcDate = (d: Date) =>
    Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  try {
    const min = (a: number, b: number) => (a < b ? a : b);
    const max = (a: number, b: number) => (a > b ? a : b);
    const sDay = max(utcDate(new Date()), utcDate(fromUIDate(startingDate)));

    // end date with time 23:59:59
    const eDay = utcDate(fromUIDate(endingDate)) + (MS_IN_DAY - 1);
    const firstWeek = eachDayOfInterval(sDay, min(sDay + MS_IN_DAY * 7, eDay));

    return {
      ...vals,
      reservations: firstWeek
        .filter((time) => repeatOnDays.includes(toMondayFirst(dayOfWeek(time))))
        .map((x) =>
          eachDayOfInterval(x, eDay, repeatPattern.value === "weekly" ? 7 : 14)
        )
        .reduce((acc, x) => [...acc, ...x], [])
        .map((day) => ({
          date: new Date(day),
          startTime,
          endTime,
        }))
        .sort((a, b) => a.date.getTime() - b.date.getTime()),
    };
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("exception: ", e);
    // Date throws => don't crash
  }

  return {
    ...vals,
    reservations: [],
  };
};

export { generateReservations };
