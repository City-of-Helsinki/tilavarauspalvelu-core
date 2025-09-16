import { addDays, addHours, setMinutes, subDays } from "date-fns";
import { formatDate, formatTime } from "../modules/date-utils";
import { describe, test, expect } from "vitest";
import { ReservationStartInterval } from "../../gql/gql-types";
import { getCreateStaffReservationFormSchema } from "./reservation";

describe("with schema", () => {
  const futureEndTime = formatTime(setMinutes(addHours(new Date(), 3), 0));
  const tomorrow = addDays(new Date(), 1);

  // FIXME broken
  test.skip(`date ${tomorrow} is valid`, () => {
    const futureStartTime = formatTime(setMinutes(addHours(new Date(), 1), 0));

    const reservation = {
      type: "BLOCKED",
      date: formatDate(tomorrow),
      startTime: futureStartTime,
      endTime: futureEndTime,
    };

    const res = getCreateStaffReservationFormSchema(ReservationStartInterval.Interval_15Mins).safeParse(reservation);
    expect(res.success).toBeTruthy();
  });

  const yesterday = subDays(new Date(), 1);

  test(`yesterdays date ${yesterday} is not valid`, () => {
    const futureStartTime = formatTime(addHours(new Date(), 1));

    const reservation = {
      type: "BLOCKED",
      date: formatDate(yesterday),
      startTime: futureStartTime,
      endTime: futureEndTime,
    };

    const res = getCreateStaffReservationFormSchema(ReservationStartInterval.Interval_15Mins).safeParse(reservation);
    expect(res.success).toBeFalsy();
    if (!res.success) {
      expect(res.error.issues.filter((x) => x.path.includes("date"))).toHaveLength(1);
      // TODO check error message
    }
  });

  // FIXME broken
  test.skip(`date ${tomorrow},  with correct interval is valid`, () => {
    const futureStartTime = formatTime(setMinutes(addHours(new Date(), 2), 30));

    const reservation = {
      type: "BLOCKED",
      date: formatDate(tomorrow),
      startTime: futureStartTime,
      endTime: futureEndTime,
    };

    const res = getCreateStaffReservationFormSchema(ReservationStartInterval.Interval_30Mins).safeParse(reservation);
    expect(res.success).toBeTruthy();
  });

  test(`date ${tomorrow} with incorrect interval is invalid`, () => {
    const futureStartTime = formatTime(setMinutes(addHours(new Date(), 2), 3));

    const reservation = {
      type: "BLOCKED",
      date: formatDate(tomorrow),
      startTime: futureStartTime,
      endTime: futureEndTime,
    };

    const res = getCreateStaffReservationFormSchema(ReservationStartInterval.Interval_30Mins).safeParse(reservation);
    expect(res.success).toBeFalsy();
    if (!res.success) {
      expect(res.error.issues.filter((x) => x.path.includes("startTime"))).toHaveLength(1);
      // TODO check error message
    }
  });
});

test.todo("validate date < today => error");
test.todo("end time < start time => error");
test.todo("end time | start time not a time => error");
