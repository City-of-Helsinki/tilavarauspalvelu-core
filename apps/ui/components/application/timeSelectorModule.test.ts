import { expect, describe, test } from "vitest";
import {
  aesToCells,
  covertCellsToTimeRange,
  type DailyOpeningHours,
} from "./timeSelectorModule";

describe("aesToCells", () => {
  test("empty", () => {
    const schedule = [] as const;
    const openingHours = [] as const;
    const res = aesToCells(schedule, openingHours);
    expect(res).toHaveLength(7);
    for (const cell of res) {
      expect(cell).toHaveLength(17);
      for (const c of cell) {
        expect(c.state).toEqual("unavailable");
      }
    }
  });
  test("with opening hours", () => {
    const schedule = [] as const;
    const openingHours: DailyOpeningHours = [
      {
        weekday: 0,
        closed: false,
        reservableTimes: [
          { begin: "08:00", end: "12:00" },
          { begin: "13:00", end: "17:00" },
        ],
      },
    ] as const;
    const res = aesToCells(schedule, openingHours);
    expect(res).toHaveLength(7);
    for (const cell of res) {
      expect(cell).toHaveLength(17);
      for (const c of cell) {
        expect(c.state).toEqual("unavailable");
      }
    }
  });
  test.todo("test primary selected schedule");
  test.todo("test secondary selected schedule");
  test.todo("test a mix with opening hours");
});

describe("covertCellsToTimeRange", () => {
  test("empty", () => {
    expect(covertCellsToTimeRange([])).toEqual([]);
  });
});
