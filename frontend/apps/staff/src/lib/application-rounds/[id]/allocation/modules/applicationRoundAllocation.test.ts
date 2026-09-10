import type { TFunction } from "next-i18next";
import { describe, expect, it } from "vitest";
import { Priority, Weekday } from "@gql/gql-types";
import {
  applicationEventSchedulesToCells,
  convertPriorityFilter,
  createDurationString,
  decodeTimeSlot,
  encodeTimeSlot,
  formatSuitableTimeRange,
  formatTimeRangeList,
  getRelatedTimeSlots,
  getTimeSeries,
  getTimeSlotOptions,
  isInsideCell,
  isInsideSelection,
  timeSlotKeyToScheduleTime,
  timeSlotKeyToTime,
} from "./applicationRoundAllocation";

const t = ((key: string) => key) as unknown as TFunction;

// Time slot keys are "<day>-<hour>-<minute>" strings, e.g. "1-10-30" for Tuesday at 10:30

describe("timeSlotKeyToTime", () => {
  it("returns today at the hour and minute of the slot", () => {
    const date = new Date(timeSlotKeyToTime("1-10-30"));
    expect(date.getHours()).toBe(10);
    expect(date.getMinutes()).toBe(30);
  });

  it("returns 0 for a slot that is missing the minutes", () => {
    expect(timeSlotKeyToTime("1-10")).toBe(0);
  });
});

describe("decodeTimeSlot", () => {
  it("converts the minutes into a fraction of an hour", () => {
    expect(decodeTimeSlot("2-14-30")).toEqual({ day: 2, hour: 14.5 });
    expect(decodeTimeSlot("2-14-00")).toEqual({ day: 2, hour: 14 });
  });

  it("falls back to the first slot of the week for an unparseable key", () => {
    expect(decodeTimeSlot("")).toEqual({ day: 0, hour: 0 });
  });

  it("round trips with encodeTimeSlot", () => {
    expect(decodeTimeSlot(encodeTimeSlot(3, 9.5))).toEqual({ day: 3, hour: 9.5 });
  });
});

describe("getTimeSeries", () => {
  it("lists every half hour slot from the beginning to the end, end included", () => {
    expect(getTimeSeries("1", "1-10-00", "1-12-00")).toEqual(["1-10-00", "1-10-30", "1-11-00", "1-11-30", "1-12-00"]);
  });

  it("starts at the half hour when the beginning is not on the hour", () => {
    expect(getTimeSeries("1", "1-10-30", "1-12-30")).toEqual(["1-10-30", "1-11-00", "1-11-30", "1-12-00", "1-12-30"]);
  });

  it("returns nothing when the beginning cannot be parsed", () => {
    expect(getTimeSeries("1", "1-10", "1-12-00")).toEqual([]);
  });
});

describe("timeSlotKeyToScheduleTime", () => {
  it("formats the slot as a zero padded time", () => {
    expect(timeSlotKeyToScheduleTime("1-10-30")).toBe("10:30:00");
    expect(timeSlotKeyToScheduleTime("1-09-00")).toBe("09:00:00");
  });

  it("pads a half hour slot to the end of the slot", () => {
    expect(timeSlotKeyToScheduleTime("1-10-00", true)).toBe("10:30:00");
    expect(timeSlotKeyToScheduleTime("1-10-30", true)).toBe("11:00:00");
  });

  it("wraps around midnight when padding the last slot of the day", () => {
    expect(timeSlotKeyToScheduleTime("1-23-30", true)).toBe("00:00:00");
  });

  it("returns an empty string when there is no slot", () => {
    expect(timeSlotKeyToScheduleTime(undefined)).toBe("");
    expect(timeSlotKeyToScheduleTime("1-10")).toBe("");
  });
});

describe("applicationEventSchedulesToCells", () => {
  it("builds 7 days, each with a half-hour cell for every hour in the range", () => {
    const cells = applicationEventSchedulesToCells(10, 11);
    expect(cells).toHaveLength(7);
    for (const day of cells) {
      expect(day).toEqual([
        { key: expect.stringMatching(/-10-00$/), hour: 10, minute: 0 },
        { key: expect.stringMatching(/-10-30$/), hour: 10, minute: 30 },
        { key: expect.stringMatching(/-11-00$/), hour: 11, minute: 0 },
        { key: expect.stringMatching(/-11-30$/), hour: 11, minute: 30 },
      ]);
    }
    // keys are prefixed with the day index
    expect(cells[0]?.[0]?.key).toBe("0-10-00");
    expect(cells[6]?.[0]?.key).toBe("6-10-00");
  });

  it("returns an empty array when the range is missing", () => {
    expect(applicationEventSchedulesToCells(undefined, 11)).toEqual([]);
    expect(applicationEventSchedulesToCells(10, undefined)).toEqual([]);
  });
});

describe("getTimeSlotOptions", () => {
  it("lists start options on the hour and half hour", () => {
    expect(getTimeSlotOptions(1, 10, 0, 11)).toEqual([
      { label: "10:00", value: "1-10-00" },
      { label: "10:30", value: "1-10-30" },
      { label: "11:00", value: "1-11-00" },
      { label: "11:30", value: "1-11-30" },
    ]);
  });

  it("drops the leading slot when starting on the half hour", () => {
    expect(getTimeSlotOptions(1, 10, 30, 11)).toEqual([
      { label: "10:30", value: "1-10-30" },
      { label: "11:00", value: "1-11-00" },
      { label: "11:30", value: "1-11-30" },
    ]);
  });

  it("shifts the labels to the next slot when listing end options", () => {
    expect(getTimeSlotOptions(1, 10, 0, 11, true)).toEqual([
      { label: "10:30", value: "1-10-00" },
      { label: "11:00", value: "1-10-30" },
      { label: "11:30", value: "1-11-00" },
      { label: "12:00", value: "1-11-30" },
    ]);
  });

  it("wraps the end label at midnight", () => {
    const options = getTimeSlotOptions(1, 23, 0, 23, true);
    expect(options).toEqual([
      { label: "23:30", value: "1-23-00" },
      { label: "0:00", value: "1-23-30" },
    ]);
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

describe("getRelatedTimeSlots", () => {
  it("groups allocations into 7 day buckets converted to minutes", () => {
    const result = getRelatedTimeSlots([
      { dayOfTheWeek: Weekday.Monday, beginTime: "10:00:00", endTime: "11:00:00" },
      { dayOfTheWeek: Weekday.Tuesday, beginTime: "08:00:00", endTime: "09:30:00" },
    ]);
    expect(result).toHaveLength(7);
    expect(result[0]).toEqual([{ day: 0, beginTime: 600, endTime: 660 }]);
    expect(result[1]).toEqual([{ day: 1, beginTime: 480, endTime: 570 }]);
    expect(result[2]).toEqual([]);
  });

  it("returns 7 empty day buckets for no allocations", () => {
    expect(getRelatedTimeSlots([])).toEqual(Array.from({ length: 7 }, () => []));
  });
});

describe("isInsideSelection", () => {
  const tr = { dayOfTheWeek: Weekday.Monday, beginTime: "10:00:00", endTime: "12:00:00" };

  it("is true when the range overlaps the selection on the same day", () => {
    expect(isInsideSelection({ day: 0, start: 10, end: 12 }, tr)).toBe(true);
  });

  it("is false on a different day", () => {
    expect(isInsideSelection({ day: 1, start: 10, end: 12 }, tr)).toBe(false);
  });

  it("is false when the selection ends before the range starts", () => {
    expect(isInsideSelection({ day: 0, start: 5, end: 9 }, tr)).toBe(false);
  });

  it("is false when the selection starts after the range ends", () => {
    expect(isInsideSelection({ day: 0, start: 13, end: 14 }, tr)).toBe(false);
  });

  it("treats midnight end time as 24:00", () => {
    const midnightRange = { dayOfTheWeek: Weekday.Monday, beginTime: "22:00:00", endTime: "00:00:00" };
    expect(isInsideSelection({ day: 0, start: 22, end: 23 }, midnightRange)).toBe(true);
  });
});

describe("isInsideCell", () => {
  const ts = { dayOfTheWeek: Weekday.Monday, beginTime: "10:00:00", endTime: "11:00:00" };

  it("is true for a cell inside the time slot", () => {
    expect(isInsideCell(0, { hour: 10, minute: 30, key: "0-10-30" }, ts)).toBe(true);
  });

  it("is false for a cell outside the time slot", () => {
    expect(isInsideCell(0, { hour: 11, minute: 30, key: "0-11-30" }, ts)).toBe(false);
  });

  it("is false on a different day", () => {
    expect(isInsideCell(1, { hour: 10, minute: 30, key: "1-10-30" }, ts)).toBe(false);
  });

  it("treats a midnight end time as the end of the day", () => {
    const midnightSlot = { dayOfTheWeek: Weekday.Monday, beginTime: "22:00:00", endTime: "00:00:00" };
    expect(isInsideCell(0, { hour: 23, minute: 30, key: "0-23-30" }, midnightSlot)).toBe(true);
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
