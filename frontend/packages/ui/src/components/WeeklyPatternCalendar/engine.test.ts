import { describe, expect, test } from "vitest";
import { Weekday } from "../../../gql/gql-types";
import {
  assertValidStep,
  gridToPattern,
  groupAvailability,
  isEditableFor,
  isRangeOpen,
  mergeRanges,
  paintModeFor,
  paintRange,
  patternToGrid,
  resolveVisibleHours,
  shallowEqual,
} from "./engine";
import type { WeeklyPatternValue } from "./types";

type Data = { priority: string };
const primary: Data = { priority: "primary" };
const secondary: Data = { priority: "secondary" };

describe("shallowEqual", () => {
  test("compares contents, not references", () => {
    expect(shallowEqual({ priority: "a" }, { priority: "a" })).toBe(true);
    expect(shallowEqual({ priority: "a" }, { priority: "b" })).toBe(false);
    expect(shallowEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    expect(shallowEqual({ a: undefined }, { b: undefined })).toBe(false);
  });
});

describe("assertValidStep", () => {
  test.each([5, 15, 30, 60, 120, 180])("accepts %i", (step) => {
    expect(() => assertValidStep(step)).not.toThrow();
  });
  test.each([0, -15, 7, 90, 45.5])("rejects %f", (step) => {
    expect(() => assertValidStep(step)).toThrow(RangeError);
  });
});

describe("mergeRanges / isRangeOpen", () => {
  test("merges overlapping and adjacent ranges and drops empty ones", () => {
    expect(
      mergeRanges([
        { beginMinutes: 600, endMinutes: 660 },
        { beginMinutes: 660, endMinutes: 720 },
        { beginMinutes: 900, endMinutes: 900 },
      ])
    ).toEqual([{ beginMinutes: 600, endMinutes: 720 }]);
  });
  test("a span is open only when fully inside one range", () => {
    const ranges = [{ beginMinutes: 600, endMinutes: 720 }];
    expect(isRangeOpen(ranges, 600, 615)).toBe(true);
    expect(isRangeOpen(ranges, 705, 735)).toBe(false);
  });
});

describe("patternToGrid / gridToPattern", () => {
  const value: WeeklyPatternValue<Data> = [
    { weekday: Weekday.Monday, beginMinutes: 600, endMinutes: 660, data: primary },
    { weekday: Weekday.Monday, beginMinutes: 660, endMinutes: 720, data: { priority: "primary" } },
    { weekday: Weekday.Monday, beginMinutes: 720, endMinutes: 780, data: secondary },
  ];

  test("adjacent spans with equal data in different objects merge back into one span", () => {
    const grid = patternToGrid(value, 15);
    expect(gridToPattern(grid, 15, shallowEqual)).toEqual([
      { weekday: Weekday.Monday, beginMinutes: 600, endMinutes: 720, data: primary },
      { weekday: Weekday.Monday, beginMinutes: 720, endMinutes: 780, data: secondary },
    ]);
  });

  test("with reference equality the same input stays split", () => {
    const grid = patternToGrid(value, 15);
    expect(gridToPattern(grid, 15, Object.is)).toHaveLength(3);
  });

  test("a span reaching the end of the day round-trips", () => {
    const end: WeeklyPatternValue<Data> = [
      { weekday: Weekday.Sunday, beginMinutes: 1380, endMinutes: 1440, data: primary },
    ];
    expect(gridToPattern(patternToGrid(end, 60), 60, shallowEqual)).toEqual(end);
  });
});

describe("paintModeFor", () => {
  test("open cell: paint, or erase when it already holds the brush", () => {
    expect(paintModeFor(undefined, primary, true, shallowEqual)).toEqual({ kind: "paint", data: primary });
    expect(paintModeFor(secondary, primary, true, shallowEqual)).toEqual({ kind: "paint", data: primary });
    expect(paintModeFor({ priority: "primary" }, primary, true, shallowEqual)).toEqual({ kind: "erase" });
  });
  test("no brush means nothing can be painted", () => {
    expect(paintModeFor(undefined, undefined, true, shallowEqual)).toBeNull();
  });
  test("closed cell can only be erased, even without a brush", () => {
    expect(paintModeFor(undefined, primary, false, shallowEqual)).toBeNull();
    expect(paintModeFor(secondary, primary, false, shallowEqual)).toEqual({ kind: "erase" });
    expect(paintModeFor(secondary, undefined, false, shallowEqual)).toEqual({ kind: "erase" });
  });
});

describe("paintRange", () => {
  const empty = patternToGrid<Data>([], 60);
  const open = (index: number) => index >= 8 && index < 12;

  test("paints only editable cells, in either drag direction", () => {
    const mode = { kind: "paint", data: primary } as const;
    const grid = paintRange(empty, Weekday.Monday, 13, 7, mode, isEditableFor(mode, open), shallowEqual);
    expect(grid[Weekday.Monday].map((cell) => cell !== undefined).indexOf(true)).toBe(8);
    expect(grid[Weekday.Monday].filter((cell) => cell !== undefined)).toHaveLength(4);
  });

  test("erase works on closed cells", () => {
    const painted = patternToGrid<Data>(
      [{ weekday: Weekday.Monday, beginMinutes: 300, endMinutes: 420, data: primary }],
      60
    );
    const mode = { kind: "erase" } as const;
    const grid = paintRange(painted, Weekday.Monday, 5, 6, mode, isEditableFor(mode, open), shallowEqual);
    expect(grid[Weekday.Monday].filter((cell) => cell !== undefined)).toHaveLength(0);
  });

  test("returns the same grid when nothing changes, even for equal but distinct data objects", () => {
    const painted = patternToGrid<Data>(
      [{ weekday: Weekday.Monday, beginMinutes: 480, endMinutes: 540, data: primary }],
      60
    );
    const mode = { kind: "paint", data: { priority: "primary" } } as const;
    expect(paintRange(painted, Weekday.Monday, 8, 8, mode, isEditableFor(mode, open), shallowEqual)).toBe(painted);
  });
});

describe("resolveVisibleHours", () => {
  const byDay = groupAvailability([
    { weekday: Weekday.Monday, beginMinutes: 600, endMinutes: 1200 },
    { weekday: Weekday.Tuesday, beginMinutes: 540, endMinutes: 1080 },
  ]);

  test("derives the extent from availability, snapped outward", () => {
    expect(resolveVisibleHours(undefined, byDay, [], 60)).toEqual({ beginMinutes: 540, endMinutes: 1200 });
    expect(
      resolveVisibleHours(
        undefined,
        groupAvailability([{ weekday: Weekday.Monday, beginMinutes: 510, endMinutes: 1000 }]),
        [],
        60
      )
    ).toEqual({ beginMinutes: 480, endMinutes: 1020 });
  });

  test("an override replaces the derived extent", () => {
    expect(resolveVisibleHours({ beginMinutes: 420, endMinutes: 1440 }, byDay, [], 15)).toEqual({
      beginMinutes: 420,
      endMinutes: 1440,
    });
  });

  test("painted spans outside the extent still extend it", () => {
    expect(
      resolveVisibleHours({ beginMinutes: 420, endMinutes: 1440 }, byDay, [{ beginMinutes: 300, endMinutes: 360 }], 60)
    ).toEqual({ beginMinutes: 300, endMinutes: 1440 });
  });

  test("returns null when there is nothing to show", () => {
    expect(resolveVisibleHours(undefined, groupAvailability([]), [], 15)).toBeNull();
  });
});
