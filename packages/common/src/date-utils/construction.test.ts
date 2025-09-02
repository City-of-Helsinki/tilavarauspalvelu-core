import { describe, expect, it } from "vitest";
import {
  fromUIDateTime,
  fromUIDateTimeUnsafe,
  fromApiDateTime,
  dateTimeToISOString,
  dateTime,
  setTimeOnDate,
  setTimeOnDateString,
  parseCombinedUIDateTime,
  extractTimeComponents,
} from "./construction";

describe("construction", () => {
  describe("fromUIDateTime", () => {
    it("constructs datetime from UI date and time strings", () => {
      const result = fromUIDateTime({ date: "25.12.2023", time: "15:30" });
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2023);
      expect(result?.getMonth()).toBe(11); // December
      expect(result?.getDate()).toBe(25);
      expect(result?.getHours()).toBe(15);
      expect(result?.getMinutes()).toBe(30);
    });

    it("handles single digit date components", () => {
      const result = fromUIDateTime({ date: "5.1.2023", time: "9:05" });
      expect(result).toBeInstanceOf(Date);
      expect(result?.getMonth()).toBe(0); // January
      expect(result?.getDate()).toBe(5);
      expect(result?.getHours()).toBe(9);
      expect(result?.getMinutes()).toBe(5);
    });

    it("returns null for empty date", () => {
      const result = fromUIDateTime({ date: "", time: "15:30" });
      expect(result).toBeNull();
    });

    it("returns null for empty time", () => {
      const result = fromUIDateTime({ date: "25.12.2023", time: "" });
      expect(result).toBeNull();
    });

    it("returns null for invalid date string", () => {
      const result = fromUIDateTime({ date: "invalid", time: "15:30" });
      expect(result).toBeNull();
    });

    it("returns null for invalid time string", () => {
      const result = fromUIDateTime({ date: "25.12.2023", time: "invalid" });
      expect(result).toBeNull();
    });

    it("returns null for out-of-range time", () => {
      const result = fromUIDateTime({ date: "25.12.2023", time: "25:70" });
      expect(result).toBeNull();
    });

    it("handles edge cases like midnight", () => {
      const result = fromUIDateTime({ date: "25.12.2023", time: "00:00" });
      expect(result).toBeInstanceOf(Date);
      expect(result?.getHours()).toBe(0);
      expect(result?.getMinutes()).toBe(0);
    });

    it("handles edge cases like 23:59", () => {
      const result = fromUIDateTime({ date: "25.12.2023", time: "23:59" });
      expect(result).toBeInstanceOf(Date);
      expect(result?.getHours()).toBe(23);
      expect(result?.getMinutes()).toBe(59);
    });
  });

  describe("fromUIDateTimeUnsafe", () => {
    it("constructs datetime from valid inputs", () => {
      const result = fromUIDateTimeUnsafe({ date: "25.12.2023", time: "15:30" });
      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(2023);
    });

    it("throws on invalid inputs", () => {
      expect(() => fromUIDateTimeUnsafe({ date: "invalid", time: "15:30" })).toThrow("Invalid date or time:");
    });

    it("throws with both date and time in error message", () => {
      expect(() => fromUIDateTimeUnsafe({ date: "invalid", time: "bad:time" })).toThrow("invalid bad:time");
    });
  });

  describe("fromApiDateTime", () => {
    it("constructs datetime from API date and time strings", () => {
      const result = fromApiDateTime({ date: "2023-12-25", time: "15:30" });
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2023);
      expect(result?.getMonth()).toBe(11);
      expect(result?.getDate()).toBe(25);
      expect(result?.getHours()).toBe(15);
      expect(result?.getMinutes()).toBe(30);
    });

    it("returns null for null date", () => {
      const result = fromApiDateTime({ date: null, time: "15:30" });
      expect(result).toBeNull();
    });

    it("returns null for null time", () => {
      const result = fromApiDateTime({ date: "2023-12-25", time: null });
      expect(result).toBeNull();
    });

    it("returns null for undefined date", () => {
      const result = fromApiDateTime({ date: undefined, time: "15:30" });
      expect(result).toBeNull();
    });

    it("returns null for undefined time", () => {
      const result = fromApiDateTime({ date: "2023-12-25", time: undefined });
      expect(result).toBeNull();
    });

    it("returns null for invalid date string", () => {
      const result = fromApiDateTime({ date: "invalid-date", time: "15:30" });
      expect(result).toBeNull();
    });

    it("returns null for invalid time string", () => {
      const result = fromApiDateTime({ date: "2023-12-25", time: "invalid" });
      expect(result).toBeNull();
    });
  });

  describe("dateTimeToISOString", () => {
    it("converts to ISO string", () => {
      const result = dateTimeToISOString({ date: "25.12.2023", time: "15:30" });
      expect(result).toBeTruthy();
      expect(result).toMatch(/2023-12-25T\d{2}:30:00\.000Z/); // Account for timezone conversion
    });

    it("returns null for invalid inputs", () => {
      const result = dateTimeToISOString({ date: "invalid", time: "15:30" });
      expect(result).toBeNull();
    });

    it("handles different timezone properly", () => {
      const result = dateTimeToISOString({ date: "25.12.2023", time: "00:00" });
      expect(result).toBeTruthy();
      expect(result).toContain("2023-12-2"); // Allow for date change due to timezone
    });
  });

  describe("dateTime (legacy)", () => {
    it("works like fromUIDateTime", () => {
      const result = dateTime({ date: "25.12.2023", time: "15:30" });
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2023);
    });

    it("handles null inputs", () => {
      const result = dateTime({ date: null, time: "15:30" });
      expect(result).toBeNull();
    });

    it("handles undefined inputs", () => {
      const result = dateTime({ date: undefined, time: undefined });
      expect(result).toBeNull();
    });

    it("converts null to empty string internally", () => {
      const result = dateTime({ date: null, time: null });
      expect(result).toBeNull();
    });
  });

  describe("setTimeOnDate", () => {
    it("sets time on existing date", () => {
      const baseDate = new Date("2023-12-25T10:00:00");
      const result = setTimeOnDate({ date: baseDate, hours: 15, minutes: 30 });

      expect(result.getFullYear()).toBe(2023);
      expect(result.getMonth()).toBe(11);
      expect(result.getDate()).toBe(25);
      expect(result.getHours()).toBe(15);
      expect(result.getMinutes()).toBe(30);
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
    });

    it("defaults minutes to 0", () => {
      const baseDate = new Date("2023-12-25T10:30:45");
      const result = setTimeOnDate({ date: baseDate, hours: 15 });

      expect(result.getHours()).toBe(15);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
    });

    it("creates new date object (immutable)", () => {
      const baseDate = new Date("2023-12-25T10:00:00");
      const result = setTimeOnDate({ date: baseDate, hours: 15, minutes: 30 });

      expect(result).not.toBe(baseDate);
      expect(baseDate.getHours()).toBe(10); // Original unchanged
      expect(result.getHours()).toBe(15);
    });

    it("handles edge cases", () => {
      const baseDate = new Date("2023-12-25");
      const result = setTimeOnDate({ date: baseDate, hours: 0, minutes: 0 });

      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
    });
  });

  describe("setTimeOnDateString", () => {
    it("sets time from string on existing date", () => {
      const baseDate = new Date("2023-12-25T10:00:00");
      const result = setTimeOnDateString({ date: baseDate, timeString: "15:30" });

      expect(result.getHours()).toBe(15);
      expect(result.getMinutes()).toBe(30);
    });

    it("returns original date for invalid time string", () => {
      const baseDate = new Date("2023-12-25T10:00:00");
      const result = setTimeOnDateString({ date: baseDate, timeString: "invalid" });

      expect(result).toBe(baseDate);
    });

    it("returns original date for empty time string", () => {
      const baseDate = new Date("2023-12-25T10:00:00");
      const result = setTimeOnDateString({ date: baseDate, timeString: "" });

      expect(result).toBe(baseDate);
    });

    it("handles single digit hours", () => {
      const baseDate = new Date("2023-12-25T10:00:00");
      const result = setTimeOnDateString({ date: baseDate, timeString: "9:05" });

      expect(result.getHours()).toBe(9);
      expect(result.getMinutes()).toBe(5);
    });

    it("handles out-of-range time", () => {
      const baseDate = new Date("2023-12-25T10:00:00");
      const result = setTimeOnDateString({ date: baseDate, timeString: "25:70" });

      expect(result).toBe(baseDate);
    });
  });

  describe("parseCombinedUIDateTime", () => {
    it("parses combined datetime string", () => {
      const result = parseCombinedUIDateTime({ dateTime: "25.12.2023 15:30" });
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2023);
      expect(result?.getMonth()).toBe(11);
      expect(result?.getDate()).toBe(25);
      expect(result?.getHours()).toBe(15);
      expect(result?.getMinutes()).toBe(30);
    });

    it("returns null for empty string", () => {
      const result = parseCombinedUIDateTime({ dateTime: "" });
      expect(result).toBeNull();
    });

    it("returns null for invalid format", () => {
      const result = parseCombinedUIDateTime({ dateTime: "invalid format" });
      expect(result).toBeNull();
    });

    it("returns null for partial datetime", () => {
      const result = parseCombinedUIDateTime({ dateTime: "25.12.2023" });
      expect(result).toBeNull();
    });

    it("returns null for invalid date components", () => {
      const result = parseCombinedUIDateTime({ dateTime: "45.13.2023 15:30" });
      expect(result).toBeNull();
    });

    it("handles single digit components", () => {
      const result = parseCombinedUIDateTime({ dateTime: "5.1.2023 9:05" });
      expect(result).toBeInstanceOf(Date);
      expect(result?.getMonth()).toBe(0);
      expect(result?.getDate()).toBe(5);
      expect(result?.getHours()).toBe(9);
      expect(result?.getMinutes()).toBe(5);
    });
  });

  describe("extractTimeComponents", () => {
    it("extracts hours and minutes from date", () => {
      const date = new Date("2023-12-25T15:30:45");
      const result = extractTimeComponents({ date });

      expect(result).toEqual({
        hours: 15,
        minutes: 30,
      });
    });

    it("handles midnight", () => {
      const date = new Date("2023-12-25T00:00:00");
      const result = extractTimeComponents({ date });

      expect(result).toEqual({
        hours: 0,
        minutes: 0,
      });
    });

    it("handles late evening", () => {
      const date = new Date("2023-12-25T23:59:59");
      const result = extractTimeComponents({ date });

      expect(result).toEqual({
        hours: 23,
        minutes: 59,
      });
    });

    it("ignores seconds and milliseconds", () => {
      const date = new Date("2023-12-25T15:30:45.123");
      const result = extractTimeComponents({ date });

      expect(result).toEqual({
        hours: 15,
        minutes: 30,
      });
    });
  });

  // Test the private parseTimeString function through public methods
  describe("parseTimeString (via public methods)", () => {
    it("parses valid time formats", () => {
      // Test through fromUIDateTime since it uses parseTimeString internally
      expect(fromUIDateTime({ date: "1.1.2023", time: "09:30" })).toBeTruthy();
      expect(fromUIDateTime({ date: "1.1.2023", time: "9:30" })).toBeTruthy();
      expect(fromUIDateTime({ date: "1.1.2023", time: "00:00" })).toBeTruthy();
      expect(fromUIDateTime({ date: "1.1.2023", time: "23:59" })).toBeTruthy();
    });

    it("rejects invalid time formats", () => {
      expect(fromUIDateTime({ date: "1.1.2023", time: "9:5" })).toBeNull(); // Missing leading zero
      expect(fromUIDateTime({ date: "1.1.2023", time: "9" })).toBeNull(); // No minutes
      expect(fromUIDateTime({ date: "1.1.2023", time: "9:30:00" })).toBeNull(); // Has seconds
      expect(fromUIDateTime({ date: "1.1.2023", time: "24:00" })).toBeNull(); // Invalid hour
      expect(fromUIDateTime({ date: "1.1.2023", time: "12:60" })).toBeNull(); // Invalid minute
    });

    it("rejects negative values", () => {
      expect(fromUIDateTime({ date: "1.1.2023", time: "-1:30" })).toBeNull();
      expect(fromUIDateTime({ date: "1.1.2023", time: "12:-5" })).toBeNull();
    });

    it("handles boundary values", () => {
      expect(fromUIDateTime({ date: "1.1.2023", time: "00:00" })).toBeTruthy();
      expect(fromUIDateTime({ date: "1.1.2023", time: "23:59" })).toBeTruthy();
    });
  });
});
