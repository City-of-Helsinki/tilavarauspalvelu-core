import { describe, expect, test } from "vitest";
import {
  cellRange,
  dayKeyOf,
  openRangesByDay,
  resizeRange,
  resolveVisibleHours,
  segmentEvents,
  shiftRange,
  stepDate,
  visibleDays,
} from "./engine";
import type { DatedEvent } from "./types";

// 2026-10-21 is a Wednesday. The clocks go back on Sunday 2026-10-25.
const event = (id: string, start: string, end: string): DatedEvent<{ id: string }> => ({
  id,
  title: id,
  start: new Date(start),
  end: new Date(end),
  data: { id },
});

describe("visibleDays", () => {
  test("a week runs from Monday to Sunday around the date", () => {
    const days = visibleDays(new Date("2026-10-21T10:00:00+03:00"), "week").map(dayKeyOf);
    expect(days).toEqual([
      "2026-10-19",
      "2026-10-20",
      "2026-10-21",
      "2026-10-22",
      "2026-10-23",
      "2026-10-24",
      "2026-10-25",
    ]);
  });

  test("a day view is the single date, in Helsinki time", () => {
    // 22:30 UTC on the 20th is already the 21st in Helsinki.
    expect(visibleDays(new Date("2026-10-20T22:30:00Z"), "day").map(dayKeyOf)).toEqual(["2026-10-21"]);
  });

  test("the week containing the clock change still has seven days", () => {
    const days = visibleDays(new Date("2026-10-25T12:00:00+02:00"), "week").map(dayKeyOf);
    expect(days).toHaveLength(7);
    expect(days.at(-1)).toBe("2026-10-25");
  });
});

describe("stepDate", () => {
  test("moves a day or a week", () => {
    const date = new Date("2026-10-21T10:00:00+03:00");
    expect(dayKeyOf(stepDate(date, "day", 1))).toBe("2026-10-22");
    expect(dayKeyOf(stepDate(date, "week", -1))).toBe("2026-10-14");
  });
});

describe("segmentEvents", () => {
  const days = visibleDays(new Date("2026-10-21T10:00:00+03:00"), "week");

  test("places an event on its day in wall-clock minutes", () => {
    const segments = segmentEvents([event("a", "2026-10-21T10:00:00+03:00", "2026-10-21T11:30:00+03:00")], days);
    expect(segments.get("2026-10-21")).toEqual([
      expect.objectContaining({ beginMinutes: 600, endMinutes: 690, lane: 0, lanes: 1 }),
    ]);
    expect(segments.get("2026-10-22")).toEqual([]);
  });

  test("cuts an event that crosses midnight into one segment per day", () => {
    const segments = segmentEvents([event("a", "2026-10-21T22:00:00+03:00", "2026-10-22T02:00:00+03:00")], days);
    expect(segments.get("2026-10-21")?.[0]).toMatchObject({ beginMinutes: 1320, endMinutes: 1440 });
    expect(segments.get("2026-10-22")?.[0]).toMatchObject({ beginMinutes: 0, endMinutes: 120 });
  });

  test("ignores events outside the shown days and events that end before they begin", () => {
    const segments = segmentEvents(
      [
        event("later", "2026-11-02T10:00:00+02:00", "2026-11-02T11:00:00+02:00"),
        event("backwards", "2026-10-21T12:00:00+03:00", "2026-10-21T11:00:00+03:00"),
      ],
      days
    );
    expect([...segments.values()].flat()).toEqual([]);
  });

  test("gives overlapping events a lane each and lets events that only touch share one", () => {
    const segments = segmentEvents(
      [
        event("a", "2026-10-21T10:00:00+03:00", "2026-10-21T12:00:00+03:00"),
        event("b", "2026-10-21T11:00:00+03:00", "2026-10-21T13:00:00+03:00"),
        event("c", "2026-10-21T13:00:00+03:00", "2026-10-21T14:00:00+03:00"),
      ],
      days
    );
    const byId = Object.fromEntries((segments.get("2026-10-21") ?? []).map((s) => [s.event.id, s]));
    expect(byId.a).toMatchObject({ lane: 0, lanes: 2 });
    expect(byId.b).toMatchObject({ lane: 1, lanes: 2 });
    expect(byId.c).toMatchObject({ lane: 0, lanes: 1 });
  });

  test("keeps wall-clock minutes on the day the clocks go back", () => {
    // 10:00 on 25 October is 10:00 Helsinki time (UTC+2), one hour later in UTC than the day before.
    const segments = segmentEvents([event("a", "2026-10-25T10:00:00+02:00", "2026-10-25T11:00:00+02:00")], days);
    expect(segments.get("2026-10-25")?.[0]).toMatchObject({ beginMinutes: 600, endMinutes: 660 });
  });
});

describe("openRangesByDay", () => {
  const days = visibleDays(new Date("2026-10-21T10:00:00+03:00"), "week");

  test("is null when no ranges are given, meaning everything is open", () => {
    expect(openRangesByDay(undefined, days)).toBeNull();
  });

  test("turns ranges into minutes per day and merges them", () => {
    const open = openRangesByDay(
      [
        { start: new Date("2026-10-21T08:00:00+03:00"), end: new Date("2026-10-21T12:00:00+03:00") },
        { start: new Date("2026-10-21T12:00:00+03:00"), end: new Date("2026-10-21T16:00:00+03:00") },
      ],
      days
    );
    expect(open?.get("2026-10-21")).toEqual([{ beginMinutes: 480, endMinutes: 960 }]);
    expect(open?.get("2026-10-22")).toEqual([]);
  });
});

describe("resolveVisibleHours", () => {
  test("falls back to 06:00-24:00 when nothing says otherwise", () => {
    expect(resolveVisibleHours(undefined, null, [], 30)).toEqual({ beginMinutes: 360, endMinutes: 1440 });
  });

  test("follows the open ranges and snaps outward to the step", () => {
    const open = new Map([["2026-10-21", [{ beginMinutes: 500, endMinutes: 1000 }]]]);
    expect(resolveVisibleHours(undefined, open, [], 60)).toEqual({ beginMinutes: 480, endMinutes: 1020 });
  });

  test("events outside the hours extend the grid so nothing is hidden", () => {
    const hours = { beginMinutes: 480, endMinutes: 1020 };
    expect(resolveVisibleHours(hours, null, [{ beginMinutes: 60, endMinutes: 120 }], 30)).toEqual({
      beginMinutes: 60,
      endMinutes: 1020,
    });
  });
});

describe("cellRange", () => {
  test("is the real time of a cell in Helsinki", () => {
    expect(cellRange("2026-10-21", 20, 30)).toEqual({
      start: new Date("2026-10-21T10:00:00+03:00"),
      end: new Date("2026-10-21T10:30:00+03:00"),
    });
  });

  test("follows the clock after the clocks go back", () => {
    expect(cellRange("2026-10-25", 20, 30).start).toEqual(new Date("2026-10-25T10:00:00+02:00"));
  });
});

describe("shiftRange", () => {
  const range = {
    start: new Date("2026-10-23T10:00:00+03:00"),
    end: new Date("2026-10-23T11:30:00+03:00"),
  };

  test("moves by minutes", () => {
    expect(shiftRange(range, { minutes: 30 })).toEqual({
      start: new Date("2026-10-23T10:30:00+03:00"),
      end: new Date("2026-10-23T12:00:00+03:00"),
    });
  });

  test("moves by days and keeps the clock time across the change to winter time", () => {
    // 10:00 on Friday 23 October is UTC+3. Two days later the clocks have gone back, so 10:00 is UTC+2.
    expect(shiftRange(range, { days: 2 })).toEqual({
      start: new Date("2026-10-25T10:00:00+02:00"),
      end: new Date("2026-10-25T11:30:00+02:00"),
    });
  });
});

describe("resizeRange", () => {
  const range = {
    start: new Date("2026-10-21T10:00:00+03:00"),
    end: new Date("2026-10-21T11:00:00+03:00"),
  };

  test("moves only the end", () => {
    expect(resizeRange(range, 30, 30)).toEqual({ start: range.start, end: new Date("2026-10-21T11:30:00+03:00") });
  });

  test("never makes the range shorter than the minimum", () => {
    expect(resizeRange(range, -90, 30)).toEqual({ start: range.start, end: new Date("2026-10-21T10:30:00+03:00") });
  });
});
