import { describe, expect, it } from "vitest";
import {
  fromUIDateTime,
  fromUIDateTimeUnsafe,
  fromApiDateTime,
  dateTimeToISOString,
  setTimeOnDate,
  parseCombinedUIDateTime,
  parseDateTimeStruct,
  parseStringTimeStruct,
} from "./construction";

function testDateWithContents(
  result: Date | null,
  year: number,
  month: number,
  day: number,
  hours: number,
  minutes: number
) {
  expect(result).toBeInstanceOf(Date);
  expect(result?.getFullYear()).toBe(year);
  expect(result?.getMonth()).toBe(month);
  expect(result?.getDate()).toBe(day);
  expect(result?.getHours()).toBe(hours);
  expect(result?.getMinutes()).toBe(minutes);
  expect(result?.getSeconds()).toBe(0);
  expect(result?.getMilliseconds()).toBe(0);
}

describe("construction", () => {
  describe("fromUIDateTime", () => {
    it("constructs datetime from UI date and time strings", () => {
      const result = fromUIDateTime("25.12.2023", "15:30");
      testDateWithContents(result, 2023, 11, 25, 15, 30);
    });

    it("handles single digit date components", () => {
      const result = fromUIDateTime("5.1.2023", "9:05");
      testDateWithContents(result, 2023, 0, 5, 9, 5);
    });

    it("returns null for empty date", () => {
      const result = fromUIDateTime("", "15:30");
      expect(result).toBeNull();
    });

    it("returns null for empty time", () => {
      const result = fromUIDateTime("25.12.2023", "");
      expect(result).toBeNull();
    });

    it("returns null for invalid date string", () => {
      const result = fromUIDateTime("invalid", "15:30");
      expect(result).toBeNull();
    });

    it("returns null for invalid time string", () => {
      const result = fromUIDateTime("25.12.2023", "invalid");
      expect(result).toBeNull();
    });

    it("returns null for out-of-range time", () => {
      const result = fromUIDateTime("25.12.2023", "25:70");
      expect(result).toBeNull();
    });

    it("handles edge cases like midnight", () => {
      const result = fromUIDateTime("25.12.2023", "00:00");
      expect(result).toBeInstanceOf(Date);
      expect(result?.getHours()).toBe(0);
      expect(result?.getMinutes()).toBe(0);
    });

    it("handles edge cases like 23:59", () => {
      const result = fromUIDateTime("25.12.2023", "23:59");
      expect(result).toBeInstanceOf(Date);
      expect(result?.getHours()).toBe(23);
      expect(result?.getMinutes()).toBe(59);
    });
  });

  describe("fromUIDateTimeUnsafe", () => {
    it("constructs datetime from valid inputs", () => {
      const result = fromUIDateTimeUnsafe("25.12.2023", "15:30");
      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(2023);
    });

    it("throws on invalid inputs", () => {
      expect(() => fromUIDateTimeUnsafe("invalid", "15:30")).toThrow("Invalid date or time:");
    });

    it("throws with both date and time in error message", () => {
      expect(() => fromUIDateTimeUnsafe("invalid", "bad:time")).toThrow("invalid bad:time");
    });
  });

  describe("fromApiDateTime", () => {
    it("constructs datetime from API date and time strings", () => {
      const result = fromApiDateTime("2023-12-25", "15:30");
      testDateWithContents(result, 2023, 11, 25, 15, 30);
    });

    it("returns null for null date", () => {
      const result = fromApiDateTime(null, "15:30");
      expect(result).toBeNull();
    });

    it("returns null for null time", () => {
      const result = fromApiDateTime("2023-12-25", null);
      expect(result).toBeNull();
    });

    it("returns null for undefined date", () => {
      const result = fromApiDateTime(undefined, "15:30");
      expect(result).toBeNull();
    });

    it("returns null for undefined time", () => {
      const result = fromApiDateTime("2023-12-25", undefined);
      expect(result).toBeNull();
    });

    it("returns null for invalid date string", () => {
      const result = fromApiDateTime("invalid-date", "15:30");
      expect(result).toBeNull();
    });

    it("returns null for invalid time string", () => {
      const result = fromApiDateTime("2023-12-25", "invalid");
      expect(result).toBeNull();
    });
  });

  describe("dateTimeToISOString", () => {
    it("converts to ISO string", () => {
      const result = dateTimeToISOString("25.12.2023", "15:30");
      expect(result).toBeTruthy();
      expect(result).toMatch(/2023-12-25T\d{2}:30:00\.000Z/); // Account for timezone conversion
    });

    it("returns null for invalid inputs", () => {
      const result = dateTimeToISOString("invalid", "15:30");
      expect(result).toBeNull();
    });

    it("handles different timezone properly", () => {
      const result = dateTimeToISOString("25.12.2023", "00:00");
      expect(result).toBeTruthy();
      expect(result).toContain("2023-12-2"); // Allow for date change due to timezone
    });
  });

  describe("setTimeOnDate", () => {
    it("sets time on existing date", () => {
      const baseDate = new Date("2023-12-25T10:00:00");
      const result = setTimeOnDate(baseDate, { hours: 15, minutes: 30 });
      testDateWithContents(result, 2023, 11, 25, 15, 30);
    });

    it("creates new date object (immutable)", () => {
      const baseDate = new Date("2023-12-25T10:00:00");
      const result = setTimeOnDate(baseDate, { hours: 15, minutes: 30 });

      expect(result).not.toBe(baseDate);
      expect(baseDate.getHours()).toBe(10); // Original unchanged
      expect(result.getHours()).toBe(15);
    });

    it("handles edge cases", () => {
      const baseDate = new Date("2023-12-25");
      const result = setTimeOnDate(baseDate, { hours: 0, minutes: 0 });

      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
    });

    it("sets time from string on existing date", () => {
      const baseDate = new Date("2023-12-25T10:00:00");
      const result = setTimeOnDate(baseDate, "15:30");

      expect(result.getHours()).toBe(15);
      expect(result.getMinutes()).toBe(30);
    });

    it("returns original date for invalid time string", () => {
      const baseDate = new Date("2023-12-25T10:00:00");
      const result = setTimeOnDate(baseDate, "invalid");

      expect(result).toBe(baseDate);
    });

    it("returns original date for empty time string", () => {
      const baseDate = new Date("2023-12-25T10:00:00");
      const result = setTimeOnDate(baseDate, "");

      expect(result).toBe(baseDate);
    });

    it("handles single digit hours", () => {
      const baseDate = new Date("2023-12-25T10:00:00");
      const result = setTimeOnDate(baseDate, "9:05");

      expect(result.getHours()).toBe(9);
      expect(result.getMinutes()).toBe(5);
    });

    it("handles out-of-range time", () => {
      const baseDate = new Date("2023-12-25T10:00:00");
      const result = setTimeOnDate(baseDate, "25:70");

      expect(result).toBe(baseDate);
    });
  });

  describe("parseCombinedUIDateTime", () => {
    it("parses combined datetime string", () => {
      const result = parseCombinedUIDateTime("25.12.2023 15:30");
      testDateWithContents(result, 2023, 11, 25, 15, 30);
    });

    it("returns null for empty string", () => {
      const result = parseCombinedUIDateTime("");
      expect(result).toBeNull();
    });

    it("returns null for invalid format", () => {
      const result = parseCombinedUIDateTime("invalid format");
      expect(result).toBeNull();
    });

    it("returns null for partial datetime", () => {
      const result = parseCombinedUIDateTime("25.12.2023");
      expect(result).toBeNull();
    });

    it("returns null for invalid date components", () => {
      const result = parseCombinedUIDateTime("45.13.2023 15:30");
      expect(result).toBeNull();
    });

    it("handles single digit components", () => {
      const result = parseCombinedUIDateTime("5.1.2023 9:05");
      testDateWithContents(result, 2023, 0, 5, 9, 5);
    });
  });

  describe("parseDateTimeStruct", () => {
    it("extracts hours and minutes from date", () => {
      const date = new Date("2023-12-25T15:30:45");
      const result = parseDateTimeStruct(date);

      expect(result).toEqual({
        hours: 15,
        minutes: 30,
        seconds: 0,
      });
    });

    it("handles midnight", () => {
      const date = new Date("2023-12-25T00:00:00");
      const result = parseDateTimeStruct(date);

      expect(result).toEqual({
        hours: 0,
        minutes: 0,
        seconds: 0,
      });
    });

    it("handles late evening", () => {
      const date = new Date("2023-12-25T23:59:59");
      const result = parseDateTimeStruct(date);

      expect(result).toEqual({
        hours: 23,
        minutes: 59,
        seconds: 0,
      });
    });

    it("ignores seconds and milliseconds", () => {
      const date = new Date("2023-12-25T15:30:45.123");
      const result = parseDateTimeStruct(date);

      expect(result).toEqual({
        hours: 15,
        minutes: 30,
        seconds: 0,
      });
    });
  });

  describe("parseStringTimeStruct", () => {
    it("parses valid time string with double digits", () => {
      const result = parseStringTimeStruct("15:30");

      expect(result).toEqual({
        hours: 15,
        minutes: 30,
        seconds: 0,
      });
    });

    it("parses valid time string with single digit hours", () => {
      const result = parseStringTimeStruct("9:30");

      expect(result).toEqual({
        hours: 9,
        minutes: 30,
        seconds: 0,
      });
    });

    it("parses valid time string with single digit minutes", () => {
      const result = parseStringTimeStruct("15:05");

      expect(result).toEqual({
        hours: 15,
        minutes: 5,
        seconds: 0,
      });
    });

    it("parses valid time string with single digits for both", () => {
      const result = parseStringTimeStruct("9:05");

      expect(result).toEqual({
        hours: 9,
        minutes: 5,
        seconds: 0,
      });
    });

    it("handles midnight", () => {
      const result = parseStringTimeStruct("00:00");

      expect(result).toEqual({
        hours: 0,
        minutes: 0,
        seconds: 0,
      });
    });

    it("handles end of day", () => {
      const result = parseStringTimeStruct("23:59");

      expect(result).toEqual({
        hours: 23,
        minutes: 59,
        seconds: 0,
      });
    });

    it("returns null for empty string", () => {
      const result = parseStringTimeStruct("");
      expect(result).toBeNull();
    });

    it("returns null for string without colon", () => {
      const result = parseStringTimeStruct("1530");
      expect(result).toBeNull();
    });

    it("returns null for string with only hours", () => {
      const result = parseStringTimeStruct("15:");
      expect(result).toBeNull();
    });

    it("returns null for string with only minutes", () => {
      const result = parseStringTimeStruct(":30");
      expect(result).toBeNull();
    });

    it("returns null for hours out of range (too high)", () => {
      const result = parseStringTimeStruct("25:30");
      expect(result).toBeNull();
    });

    it("returns null for hours out of range (negative)", () => {
      const result = parseStringTimeStruct("-1:30");
      expect(result).toBeNull();
    });

    it("returns null for minutes out of range (too high)", () => {
      const result = parseStringTimeStruct("15:60");
      expect(result).toBeNull();
    });

    it("returns null for minutes out of range (negative)", () => {
      const result = parseStringTimeStruct("15:-1");
      expect(result).toBeNull();
    });

    it("handles non-numeric hours by setting hours to null", () => {
      const result = parseStringTimeStruct("abc:30");
      expect(result).toEqual({
        hours: null,
        minutes: 30,
        seconds: 0,
      });
    });

    it("handles non-numeric minutes by setting minutes to null", () => {
      const result = parseStringTimeStruct("15:abc");
      expect(result).toEqual({
        hours: 15,
        minutes: null,
        seconds: 0,
      });
    });

    it("returns null for completely invalid format", () => {
      const result = parseStringTimeStruct("invalid");
      expect(result).toBeNull();
    });

    it("ignores extra parts with multiple colons", () => {
      const result = parseStringTimeStruct("15:30:45");
      expect(result).toEqual({
        hours: 15,
        minutes: 30,
        seconds: 0,
      });
    });

    it("handles edge case: hour 24 should be invalid", () => {
      const result = parseStringTimeStruct("24:00");
      expect(result).toBeNull();
    });

    it("handles leading zeros correctly", () => {
      const result = parseStringTimeStruct("08:09");

      expect(result).toEqual({
        hours: 8,
        minutes: 9,
        seconds: 0,
      });
    });
  });
});
