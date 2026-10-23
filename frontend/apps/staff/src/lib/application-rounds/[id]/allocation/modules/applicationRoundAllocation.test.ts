import { describe, expect, it } from "vitest";
import type { TFunction } from "next-i18next/pages";
import type { VisibleHours } from "@ui/components/WeeklyPatternCalendar/types";
import { Priority, Weekday } from "@gql/gql-types";
import {
  convertPriorityFilter,
  createDurationString,
  formatSuitableTimeRange,
  formatTimeRangeList,
  getBeginTimeOptions,
  getEndTimeOptions,
} from "./applicationRoundAllocation";

const t = ((key: string) => key) as unknown as TFunction;

describe("getBeginTimeOptions", () => {
  const extent: VisibleHours = { beginMinutes: 10 * 60, endMinutes: 11 * 60 };

  it("lists every quarter hour of the extent, and leaves out its last step", () => {
    expect(getBeginTimeOptions(extent)).toEqual([
      { label: "10:00", value: 600 },
      { label: "10:15", value: 615 },
      { label: "10:30", value: 630 },
      { label: "10:45", value: 645 },
    ]);
  });

  it("offers one time when the extent is two steps long", () => {
    expect(getBeginTimeOptions({ beginMinutes: 600, endMinutes: 630 })).toEqual([
      { label: "10:00", value: 600 },
      { label: "10:15", value: 615 },
    ]);
  });
});

describe("getEndTimeOptions", () => {
  it("starts one step after the extent, because an end time is exclusive", () => {
    expect(getEndTimeOptions({ beginMinutes: 10 * 60, endMinutes: 11 * 60 })).toEqual([
      { label: "10:15", value: 615 },
      { label: "10:30", value: 630 },
      { label: "10:45", value: 645 },
      { label: "11:00", value: 660 },
    ]);
  });

  it("reads the end of the day as 24:00", () => {
    const options = getEndTimeOptions({ beginMinutes: 23 * 60, endMinutes: 24 * 60 });
    expect(options[options.length - 1]).toEqual({ label: "24:00", value: 1440 });
    expect(options.map((option) => option.label)).toEqual(["23:15", "23:30", "23:45", "24:00"]);
  });
});

describe("formatSuitableTimeRange", () => {
  it("formats the weekday and time range", () => {
    const result = formatSuitableTimeRange(t, {
      dayOfTheWeek: Weekday.Tuesday,
      beginTime: "10:00:00",
      endTime: "11:30:00",
    });
    expect(result).toBe("translation:dayShort.1 10:00–11:30");
  });
});

describe("formatTimeRangeList", () => {
  const ranges = [
    { dayOfTheWeek: Weekday.Wednesday, beginTime: "12:00:00", endTime: "13:00:00", priority: Priority.Primary },
    { dayOfTheWeek: Weekday.Monday, beginTime: "10:00:00", endTime: "11:00:00", priority: Priority.Primary },
    { dayOfTheWeek: Weekday.Monday, beginTime: "08:00:00", endTime: "09:00:00", priority: Priority.Secondary },
  ];

  it("filters by priority and sorts by weekday then start time", () => {
    const result = formatTimeRangeList(t, ranges, Priority.Primary);
    expect(result).toBe("translation:dayShort.0 10:00–11:00, translation:dayShort.2 12:00–13:00");
  });

  it("filters by Secondary priority", () => {
    expect(formatTimeRangeList(t, ranges, Priority.Secondary)).toBe("translation:dayShort.0 8:00–9:00");
  });

  it("returns an empty string when nothing matches the priority", () => {
    expect(formatTimeRangeList(t, [], Priority.Primary)).toBe("");
  });
});

describe("createDurationString", () => {
  it("shows a single duration when min and max are equal", () => {
    expect(createDurationString({ reservationMinDuration: 3600, reservationMaxDuration: 3600 }, t)).toBe(
      "common:abbreviations:hour"
    );
  });

  it("shows a range when min and max differ", () => {
    expect(createDurationString({ reservationMinDuration: 1800, reservationMaxDuration: 3600 }, t)).toBe(
      "common:abbreviations:minute - common:abbreviations:hour"
    );
  });
});

describe("convertPriorityFilter", () => {
  it("maps known numeric priorities to Priority enum values", () => {
    expect(convertPriorityFilter([300, 200])).toEqual([Priority.Primary, Priority.Secondary]);
  });

  it("drops unknown values", () => {
    expect(convertPriorityFilter([100, 300])).toEqual([Priority.Primary]);
  });

  it("returns an empty array for no input", () => {
    expect(convertPriorityFilter([])).toEqual([]);
  });
});
