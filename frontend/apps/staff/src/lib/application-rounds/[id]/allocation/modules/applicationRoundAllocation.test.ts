import { describe, expect, it } from "vitest";
import {
  decodeTimeSlot,
  encodeTimeSlot,
  getTimeSeries,
  timeSlotKeyToScheduleTime,
  timeSlotKeyToTime,
} from "./applicationRoundAllocation";

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
  it("lists every half hour slot between the ends, excluding the end", () => {
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
