import { addDays, subDays } from "date-fns";
import { formatApiTimeUnsafe, formatDate } from "../modules/date-utils";
import { describe, test, expect } from "vitest";
import { ReservationStartInterval } from "../../gql/gql-types";
import { getCreateStaffReservationFormSchema } from "./reservation";
import type { TimeStruct } from "../modules/date-utils/types";

function createInput({
  date,
  start = { hours: 9 },
  end = { hours: 12 },
}: {
  date: Date;
  start?: TimeStruct;
  end?: TimeStruct;
}) {
  return {
    type: "BLOCKED",
    date: formatDate(date),
    startTime: formatApiTimeUnsafe(start.hours ?? 0, start.minutes ?? 0),
    endTime: formatApiTimeUnsafe(end.hours ?? 0, end.minutes ?? 0),
    enableBufferTimeAfter: false,
    enableBufferTimeBefore: false,
  };
}

describe("CreateStaffReservation schema", () => {
  test(`date tomorrow is valid`, () => {
    const tomorrow = addDays(new Date(), 1);
    const input = createInput({ date: tomorrow });
    const res = getCreateStaffReservationFormSchema(ReservationStartInterval.Interval_15Mins).safeParse(input);
    expect(res.success).toBeTruthy();
  });

  // TODO should mock time to avoid timezone issues
  test("can make a past reservation for today", () => {
    const today = new Date();
    const input = createInput({ date: today, start: { hours: 0 }, end: { hours: 5 } });
    const res = getCreateStaffReservationFormSchema(ReservationStartInterval.Interval_15Mins).safeParse(input);
    expect(res.success).toBeTruthy();
  });

  const yesterday = subDays(new Date(), 1);

  test("cant make reservation to a day past", () => {
    const input = createInput({ date: yesterday });

    const res = getCreateStaffReservationFormSchema(ReservationStartInterval.Interval_15Mins).safeParse(input);
    expect(res.success).toBeFalsy();
    if (!res.success) {
      expect(res.error.issues.filter((x) => x.path.includes("date"))).toHaveLength(1);
      // TODO check error message
    }
  });

  test.todo("can't make a reservation with invalid time");
  test.todo("can make a reservation ending at midnight");

  test.todo("end time < start time => error");
  test.todo("end time | start time not a time => error");

  describe("15 min interval", () => {
    const possibleMinutes = [0, 15, 30, 45] as const;
    const schema = getCreateStaffReservationFormSchema(ReservationStartInterval.Interval_15Mins);
    // TODO could pick an end interval on random
    test.for(possibleMinutes)(`valid interval for %s minutes`, (start) => {
      const tomorrow = addDays(new Date(), 1);
      const input = createInput({
        date: tomorrow,
        start: { hours: 9, minutes: start },
        end: { hours: 10, minutes: start },
      });
      const res = schema.safeParse(input);
      expect(res.success).toBeTruthy();
    });

    test.for(generateFuzzyIntegers(20, 0, 59, possibleMinutes))("%d is invalid for 15 min interval", (minutes) => {
      const tomorrow = addDays(new Date(), 1);
      const input = createInput({
        date: tomorrow,
        start: { hours: 9, minutes },
      });

      const res = schema.safeParse(input);
      expect(res.success).toBeFalsy();
      if (!res.success) {
        expect(res.error.issues.filter((x) => x.path.includes("startTime"))).toHaveLength(1);
        // TODO check error message
      }
    });
  });

  describe("half an hour interval", () => {
    const possibleMinutes = [0, 30] as const;

    const schema = getCreateStaffReservationFormSchema(ReservationStartInterval.Interval_30Mins);
    test.for(possibleMinutes)(`valid interval for %d minutes`, (start) => {
      const tomorrow = addDays(new Date(), 1);
      const input = createInput({
        date: tomorrow,
        start: { hours: 9, minutes: start },
        end: { hours: 10, minutes: start },
      });
      const res = schema.safeParse(input);
      expect(res.success).toBeTruthy();
    });

    test.for(generateFuzzyIntegers(20, 0, 59, possibleMinutes))("%d is invalid for 30 min interval", (minutes) => {
      const tomorrow = addDays(new Date(), 1);
      const input = createInput({
        date: tomorrow,
        start: { hours: 9, minutes },
      });

      const res = schema.safeParse(input);
      expect(res.success).toBeFalsy();
      if (!res.success) {
        expect(res.error.issues.filter((x) => x.path.includes("startTime"))).toHaveLength(1);
        // TODO check error message
      }
    });
  });
});

function generateFuzzyIntegers(count: number, start: number, end: number, exclusionList: readonly number[]): number[] {
  const set = new Set(exclusionList);
  return [...Array(count)].map((_) => getRandomInt(start, end)).filter((x) => !set.has(x));
}

function getRandomInt(min: number, max: number): number {
  const minCeiled = Math.ceil(min);
  const maxFloored = Math.floor(max);
  return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled);
}
