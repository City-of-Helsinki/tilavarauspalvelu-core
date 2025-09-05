import { describe, expect, it } from "vitest";
import {
  toValidDateObject,
  formatTime,
  formatDate,
  formatDateTime,
  formatDateTimeStrings,
  formatTimeRange,
  formatDateRange,
  formatDateTimeRange,
  formatDuration,
  formatDurationRange,
} from "./formatting";
import type { TFunction } from "next-i18next";

// Mock translation function
const mockT = ((key: string) => key) as TFunction;

describe("formatting", () => {
  describe("toValidDateObject", () => {
    it("validates and returns valid Date object", () => {
      const date = new Date("2023-12-25");
      const result = toValidDateObject(date);
      expect(result).toBe(date);
    });

    it("returns null for invalid Date object", () => {
      const invalidDate = new Date("invalid");
      const result = toValidDateObject(invalidDate);
      expect(result).toBeNull();
    });

    it("parses and validates string input", () => {
      const result = toValidDateObject("2023-12-25");
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2023);
    });

    it("returns null for invalid string", () => {
      const result = toValidDateObject("invalid");
      expect(result).toBeNull();
    });
  });

  describe("formatTime", () => {
    it("formats time with valid date", () => {
      const date = new Date("2023-12-25T15:30:00");
      const result = formatTime(date);
      expect(result).toMatch("15:30");
    });

    it("handles null date", () => {
      const result = formatTime(null);
      expect(result).toBe("");
    });

    it("handles invalid date", () => {
      const invalidDate = new Date("invalid");
      const result = formatTime(invalidDate);
      expect(result).toBe("");
    });

    it("formats with different locales", () => {
      const date = new Date("2023-12-25T15:30:00");
      const result = formatTime(date, "en");
      expect(result).toMatch("15:30");
    });
  });

  describe("formatDate", () => {
    it("formats date without weekday", () => {
      const date = new Date("2023-12-25T15:30:00");
      const result = formatDate(date);
      expect(result).toBe("25.12.2023");
    });

    it("includes weekday when requested", () => {
      const date = new Date("2023-12-25T15:30:00"); // Monday
      const result = formatDate(date, { includeWeekday: true });
      expect(result).toContain("ma"); // Finnish weekday abbreviation
      expect(result).toContain("25.12.2023");
    });

    it("handles null date", () => {
      const result = formatDate(null);
      expect(result).toBe("");
    });

    it("handles invalid date", () => {
      const invalidDate = new Date("invalid");
      const result = formatDate(invalidDate);
      expect(result).toBe("");
    });

    it("formats with different locales", () => {
      const date = new Date("2023-12-25T15:30:00");
      const result = formatDate(date, { locale: "en" });
      expect(result).toBe("25.12.2023");
    });
  });

  describe("formatDateTime", () => {
    it("formats datetime with weekday and separator", () => {
      const date = new Date("2023-12-25T15:30:00");
      const result = formatDateTime(date, { t: mockT });
      expect(result).toContain("common:dayShort.0");
      expect(result).toContain("25.12.2023");
      expect(result).toContain("common:dayTimeSeparator");
      expect(result).toMatch("common:dayShort.0 25.12.2023common:dayTimeSeparator 15:30");
    });

    it("formats without weekday", () => {
      const date = new Date("2023-12-25T15:30:00");
      const result = formatDateTime(date, { includeWeekday: false });
      expect(result).toContain("25.12.2023");
      expect(result).toContain("@");
      expect(result).toMatch("25.12.2023 @ 15:30");
    });

    it("formats without time separator", () => {
      const date = new Date("2023-12-25T15:30:00");
      const result = formatDateTime(date, { includeTimeSeparator: false });
      expect(result).toContain("25.12.2023");
      expect(result).toMatch("ma 25.12.2023 15:30");
    });

    it("handles null date", () => {
      const result = formatDateTime(null);
      expect(result).toBe("");
    });

    it("uses default values when no options provided", () => {
      const date = new Date("2023-12-25T15:30:00");
      const result = formatDateTime(date);
      expect(result).toContain("ma");
      expect(result).toContain("25.12.2023");
      expect(result).toContain("@");
      expect(result).toMatch("ma 25.12.2023 @ 15:30");
    });
  });

  describe("formatDateTimeStrings", () => {
    it("formats reservation date time strings", () => {
      const reservation = {
        beginsAt: "2023-12-25T15:30:00.000Z",
        endsAt: "2023-12-25T17:00:00.000Z",
      };

      const result = formatDateTimeStrings({
        t: mockT,
        reservation,
        trailingMinutes: false,
      });

      expect(result.date).toBeInstanceOf(Date);
      expect(result.time).toMatch(/\d{1,2}:\d{2} - \d{1,2}(:\d{2})?/); // Account for timezone differences
      expect(result.dayOfWeek).toBe("weekDayLong.1");
      expect(result.isModified).toBe(false);
    });

    it("detects modifications from original", () => {
      const reservation = {
        beginsAt: "2023-12-25T15:30:00.000Z",
        endsAt: "2023-12-25T17:00:00.000Z",
      };
      const orig = {
        beginTime: "14:00",
        endTime: "16:00",
      };

      const result = formatDateTimeStrings({
        t: mockT,
        reservation,
        orig,
        trailingMinutes: false,
      });

      expect(result.isModified).toBe(true);
    });

    it("shows trailing minutes when requested", () => {
      const reservation = {
        beginsAt: "2023-12-25T15:00:00.000Z",
        endsAt: "2023-12-25T17:00:00.000Z",
      };

      const result = formatDateTimeStrings({
        t: mockT,
        reservation,
        trailingMinutes: true,
      });

      expect(result.time).toMatch(/\d{1,2}:\d{2} - \d{1,2}:\d{2}/);
    });
  });

  describe("formatTimeRange", () => {
    it("formats time range with minutes", () => {
      const result = formatTimeRange(930, 1020); // 15:30 to 17:00
      expect(result).toContain("15:30");
      expect(result).toContain("–");
      expect(result).toMatch(/17(:00)?/); // May or may not show :00
    });

    it("formats time range without trailing minutes", () => {
      const result = formatTimeRange(900, 1020); // 15:00 to 17:00
      expect(result).toContain("15");
      expect(result).toContain("–");
      expect(result).toContain("17");
    });

    it("shows trailing minutes when requested", () => {
      const result = formatTimeRange(900, 1020, true);
      expect(result).toBe("15:00–17:00");
    });

    it("handles zero minutes", () => {
      const result = formatTimeRange(0, 60); // 00:00 to 01:00
      expect(result).toBe("0–1");
    });
  });

  describe("formatDateRange", () => {
    it("formats same day range", () => {
      const start = new Date("2023-12-25T10:00:00");
      const end = new Date("2023-12-25T15:00:00");
      const result = formatDateRange(start, end);
      expect(result).toContain("25.12.2023");
      expect(result).not.toContain("–"); // Should not have range separator for same day
    });

    it("formats multi-day range", () => {
      const start = new Date("2023-12-25T10:00:00");
      const end = new Date("2023-12-26T15:00:00");
      const result = formatDateRange(start, end);
      expect(result).toContain("ma 25.12.2023");
      expect(result).toContain("ti 26.12.2023");
      expect(result).toContain("–");
    });

    it("includes weekday by default", () => {
      const start = new Date("2023-12-25T10:00:00"); // Monday
      const end = new Date("2023-12-26T15:00:00"); // Tuesday
      const result = formatDateRange(start, end);
      expect(result).toContain("ma");
      expect(result).toContain("ti");
    });

    it("excludes weekday when requested", () => {
      const start = new Date("2023-12-25T10:00:00");
      const end = new Date("2023-12-26T15:00:00");
      const result = formatDateRange(start, end, { includeWeekday: false });
      expect(result).not.toContain("ma");
      expect(result).not.toContain("ti");
      expect(result).toBe("25.12.2023–26.12.2023");
    });

    it("handles null dates", () => {
      const result = formatDateRange(null, null);
      expect(result).toBe("");
    });

    it("handles invalid dates", () => {
      const invalidDate = new Date("invalid");
      const result = formatDateRange(invalidDate, invalidDate);
      expect(result).toBe("");
    });
  });

  describe("formatDateTimeRange", () => {
    it("formats same day datetime range", () => {
      const start = new Date("2023-12-25T15:30:00");
      const end = new Date("2023-12-25T17:00:00");
      const result = formatDateTimeRange(start, end, { t: mockT });
      expect(result).toContain("25.12.2023");
      expect(result).toContain("common:dayTimeSeparator");
      expect(result).toMatch(/\d{2}:\d{2}/);
      expect(result).toContain("17:00");
    });

    it("formats multi-day datetime range", () => {
      const start = new Date("2023-12-25T15:30:00");
      const end = new Date("2023-12-26T17:00:00");
      const result = formatDateTimeRange(start, end, { t: mockT });
      expect(result).toContain("25.12.2023");
      expect(result).toContain("common:dayTimeSeparator");
      expect(result).toMatch(/\d{2}:\d{2}/);
      expect(result).toContain("17:00 26.12.2023");
    });

    it("excludes weekday when requested", () => {
      const start = new Date("2023-12-25T15:30:00");
      const end = new Date("2023-12-25T17:00:00");
      const result = formatDateTimeRange(start, end, {
        t: mockT,
        includeWeekday: false,
      });
      expect(result).not.toContain("ma");
    });

    it("excludes time separator when requested", () => {
      const start = new Date("2023-12-25T15:30:00");
      const end = new Date("2023-12-25T17:00:00");
      const result = formatDateTimeRange(start, end, {
        includeTimeSeparator: false,
      });
      expect(result).not.toContain("klo");
      expect(result).not.toContain("@");
    });

    it("handles null dates", () => {
      const result = formatDateTimeRange(null, null);
      expect(result).toBe("");
    });
  });

  describe("formatDuration", () => {
    it("formats hours and minutes", () => {
      const result = formatDuration(mockT, { hours: 2, minutes: 30 });
      expect(result).toBe("common:abbreviations:hour common:abbreviations:minute");
    });

    it("formats only hours", () => {
      const result = formatDuration(mockT, { hours: 2 });
      expect(result).toBe("common:abbreviations:hour");
    });

    it("formats only minutes", () => {
      const result = formatDuration(mockT, { minutes: 30 });
      expect(result).toBe("common:abbreviations:minute");
    });

    it("converts seconds to hours and minutes", () => {
      const result = formatDuration(mockT, { seconds: 9000 });
      expect(result).toBe("common:abbreviations:hour common:abbreviations:minute");
    });

    it("handles zero duration", () => {
      const result = formatDuration(mockT, {});
      expect(result).toBe("-");
    });

    it("uses unabbreviated format", () => {
      const result = formatDuration(mockT, { hours: 1, minutes: 30 }, false);
      expect(result).toBe("common:hour common:minute");
    });
  });

  describe("formatDurationRange", () => {
    it("formats different duration range", () => {
      const result = formatDurationRange({
        t: mockT,
        beginSecs: 3600, // 1 hour
        endSecs: 7200, // 2 hours
      });
      expect(result).toBe("common:abbreviations:hour – common:abbreviations:hour");
    });

    it("formats same duration as single value", () => {
      const result = formatDurationRange({
        t: mockT,
        beginSecs: 3600,
        endSecs: 3600,
      });
      expect(result).toBe("common:abbreviations:hour");
    });

    it("uses unabbreviated format", () => {
      const result = formatDurationRange({
        t: mockT,
        beginSecs: 3600,
        endSecs: 7200,
        abbreviated: false,
      });
      expect(result).toBe("common:hour – common:hour");
    });
  });
});
