import { describe, expect, test } from "vitest";
import { Priority, Weekday } from "../../gql/gql-types";
import { fromPattern, priorityKey, toAvailability, toPattern } from "./suitableTimes";
import type { ReservableTimeSlots, SuitableTimeRangeValues } from "./suitableTimes";

function range(
  dayOfTheWeek: Weekday,
  beginTime: string,
  endTime: string,
  priority: Priority = Priority.Primary
): SuitableTimeRangeValues {
  return { dayOfTheWeek, beginTime, endTime, priority };
}

describe("toAvailability", () => {
  test("is empty without opening hours", () => {
    expect(toAvailability([])).toEqual([]);
  });

  test("keeps every reservable range of a day, without rounding", () => {
    const openingHours: ReservableTimeSlots = [
      {
        weekday: Weekday.Thursday,
        isClosed: false,
        reservableTimes: [
          { begin: "08:30:00", end: "11:00:00" },
          { begin: "14:15:00", end: "17:45:00" },
        ],
      },
    ];

    expect(toAvailability(openingHours)).toEqual([
      { weekday: Weekday.Thursday, beginMinutes: 510, endMinutes: 660 },
      { weekday: Weekday.Thursday, beginMinutes: 855, endMinutes: 1065 },
    ]);
  });

  test("reads an end time of midnight as the end of the day", () => {
    const openingHours: ReservableTimeSlots = [
      { weekday: Weekday.Monday, isClosed: false, reservableTimes: [{ begin: "07:00:00", end: "00:00:00" }] },
    ];

    expect(toAvailability(openingHours)).toEqual([{ weekday: Weekday.Monday, beginMinutes: 420, endMinutes: 1440 }]);
  });

  test("drops closed days and null ranges", () => {
    const openingHours: ReservableTimeSlots = [
      { weekday: Weekday.Sunday, isClosed: true, reservableTimes: [{ begin: "10:00:00", end: "12:00:00" }] },
      { weekday: Weekday.Saturday, isClosed: false, reservableTimes: [null, { begin: "10:00:00", end: "12:00:00" }] },
      { weekday: Weekday.Friday, isClosed: false, reservableTimes: [] },
    ];
    expect(toAvailability(openingHours)).toEqual([{ weekday: Weekday.Saturday, beginMinutes: 600, endMinutes: 720 }]);
  });
});

describe("toPattern and fromPattern", () => {
  test("map every weekday in both directions", () => {
    for (const apiDay of Object.values(Weekday)) {
      const pattern = toPattern([range(apiDay, "08:00", "09:00")]);

      expect(pattern[0]?.weekday).toBe(apiDay);
      expect(fromPattern(pattern)[0]?.dayOfTheWeek).toBe(apiDay);
    }
  });

  test("convert times to minutes and back as HH:MM", () => {
    const pattern = toPattern([range(Weekday.Monday, "08:15:00", "17:45:00", Priority.Secondary)]);

    expect(pattern).toEqual([
      { weekday: Weekday.Monday, beginMinutes: 495, endMinutes: 1065, data: { priority: Priority.Secondary } },
    ]);
    expect(fromPattern(pattern)).toEqual([range(Weekday.Monday, "08:15", "17:45", Priority.Secondary)]);
  });

  test("write the end of the day as 00:00 and read it back as the end of the day", () => {
    const pattern = toPattern([range(Weekday.Tuesday, "23:00", "00:00")]);

    expect(pattern[0]?.endMinutes).toBe(1440);
    expect(fromPattern(pattern)).toEqual([range(Weekday.Tuesday, "23:00", "00:00")]);
  });

  test("do not carry the primary key of a stored range", () => {
    const stored = [{ ...range(Weekday.Monday, "08:00", "09:00"), pk: 12 }];

    expect(fromPattern(toPattern(stored))).toEqual([range(Weekday.Monday, "08:00", "09:00")]);
  });

  test("an empty list round-trips", () => {
    expect(fromPattern(toPattern([]))).toEqual([]);
  });
});

describe("priorityKey", () => {
  test("gives the translation key of a priority", () => {
    expect(priorityKey(Priority.Primary)).toBe("primary");
    expect(priorityKey(Priority.Secondary)).toBe("secondary");
  });
});
