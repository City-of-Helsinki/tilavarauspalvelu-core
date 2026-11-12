import { describe, expect, test } from "vitest";
import type { ReservableTimeSlots } from "@ui/modules/suitableTimes";
import { Priority, Weekday } from "@gql/gql-types";
import type { SuitableTimeRangeFormValues } from "./form";
import { addTimeRange, findTooShortListed, listTimeRanges, removeTimeRange } from "./timeSelectorModule";

function range(
  dayOfTheWeek: Weekday,
  beginTime: string,
  endTime: string,
  priority: Priority = Priority.Primary
): SuitableTimeRangeFormValues {
  return { dayOfTheWeek, beginTime, endTime, priority };
}

const weekdayOpen: ReservableTimeSlots = [
  { weekday: Weekday.Monday, isClosed: false, reservableTimes: [{ begin: "08:00:00", end: "18:00:00" }] },
];

describe("addTimeRange", () => {
  const input = { weekday: Weekday.Monday, beginMinutes: 600, endMinutes: 660, priority: Priority.Primary };

  test("adds a range to an empty list", () => {
    expect(addTimeRange([], input, weekdayOpen)).toEqual([range(Weekday.Monday, "10:00", "11:00")]);
  });

  test("joins a range that touches a saved range with the same priority", () => {
    const saved = [range(Weekday.Monday, "09:00", "10:00")];
    expect(addTimeRange(saved, input, weekdayOpen)).toEqual([range(Weekday.Monday, "09:00", "11:00")]);
  });

  test("paints over a saved range with another priority", () => {
    const saved = [range(Weekday.Monday, "09:30", "10:30", Priority.Secondary)];
    expect(addTimeRange(saved, input, weekdayOpen)).toEqual([
      range(Weekday.Monday, "09:30", "10:00", Priority.Secondary),
      range(Weekday.Monday, "10:00", "11:00", Priority.Primary),
    ]);
  });

  test("refuses a range that is not fully inside the times that can be booked", () => {
    expect(addTimeRange([], { ...input, beginMinutes: 420, endMinutes: 540 }, weekdayOpen)).toBeNull();
    expect(addTimeRange([], { ...input, weekday: Weekday.Tuesday }, weekdayOpen)).toBeNull();
  });
});

describe("listTimeRanges and removeTimeRange", () => {
  const saved = [
    range(Weekday.Tuesday, "12:00", "13:00"),
    range(Weekday.Monday, "08:00", "09:00"),
    range(Weekday.Monday, "09:00", "10:00"),
  ];

  test("lists ranges by weekday and time, joining neighbours", () => {
    expect(
      listTimeRanges(saved).map(({ weekday, beginMinutes, endMinutes }) => [weekday, beginMinutes, endMinutes])
    ).toEqual([
      [Weekday.Monday, 480, 600],
      [Weekday.Tuesday, 720, 780],
    ]);
  });

  test("removes the range at a position in that list", () => {
    expect(removeTimeRange(saved, 0)).toEqual([range(Weekday.Tuesday, "12:00", "13:00")]);
    expect(removeTimeRange(saved, 1)).toEqual([range(Weekday.Monday, "08:00", "10:00")]);
  });
});

describe("findTooShortListed", () => {
  test("marks the listed times the minimum duration rejects, per day", () => {
    const listed = listTimeRanges([
      range(Weekday.Tuesday, "10:00", "10:30"),
      range(Weekday.Monday, "10:00", "11:00"),
      range(Weekday.Monday, "11:00", "11:30", Priority.Secondary),
      range(Weekday.Monday, "14:00", "14:30", Priority.Secondary),
    ]);
    // Listed by day and time: Monday's long primary, its buffer, a lone short secondary, then Tuesday's short primary.
    expect(findTooShortListed(listed, 3600)).toEqual([false, false, true, true]);
  });
});
