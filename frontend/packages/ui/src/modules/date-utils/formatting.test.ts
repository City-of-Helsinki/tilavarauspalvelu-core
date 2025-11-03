import type { TFunction } from "next-i18next";
import { describe, expect, it } from "vitest";
import {
  parseValidDateObject,
  formatTime,
  formatDate,
  formatDateTime,
  applicationReservationDateTime,
  formatTimeRange,
  formatDateRange,
  formatDateTimeRange,
  formatDuration,
  formatDurationRange,
  formatApiDate,
  formatApiDateUnsafe,
  formatApiTime,
  formatApiTimeUnsafe,
} from "./formatting";

// Mock translation function
const mockT = ((key: string) => key) as TFunction;

describe("formatting", () => {
  describe("parseValidDateObject", () => {
    it("validates and returns valid Date object", () => {
      const date = new Date("2023-12-25");
      const result = parseValidDateObject(date);
      expect(result).toBe(date);
    });

    it("returns null for invalid Date object", () => {
      const invalidDate = new Date("invalid");
      const result = parseValidDateObject(invalidDate);
      expect(result).toBeNull();
    });

    it("parses and validates string input", () => {
      const result = parseValidDateObject("2023-12-25");
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2023);
    });

    it("returns null for invalid string", () => {
      const result = parseValidDateObject("invalid");
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
      const result = formatDate(date, {});
      expect(result).toBe("25.12.2023");
    });

    it("includes weekday when requested", () => {
      const date = new Date("2023-12-25T15:30:00"); // Monday
      const result = formatDate(date, { includeWeekday: true });
      expect(result).toContain("ma"); // Finnish weekday abbreviation
      expect(result).toContain("25.12.2023");
    });

    it("handles null date", () => {
      const result = formatDate(null, {});
      expect(result).toBe("");
    });

    it("handles invalid date", () => {
      const invalidDate = new Date("invalid");
      const result = formatDate(invalidDate, {});
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
      expect(result).toContain("common:weekdayShortEnum.MONDAY");
      expect(result).toContain("25.12.2023");
      expect(result).toContain("klo");
      expect(result).toMatch("common:weekdayShortEnum.MONDAY 25.12.2023 klo 15:30");
    });

    it("formats without weekday", () => {
      const date = new Date("2023-12-25T15:30:00");
      const result = formatDateTime(date, { includeWeekday: false });
      expect(result).toContain("25.12.2023");
      expect(result).toContain("klo 15:30");
      expect(result).toMatch("25.12.2023 klo 15:30");
    });

    it("formats without time separator", () => {
      const date = new Date("2023-12-25T15:30:00");
      const result = formatDateTime(date, { includeTimeSeparator: false });
      expect(result).toContain("25.12.2023");
      expect(result).toMatch("ma 25.12.2023 15:30");
    });

    it("handles null date", () => {
      const result = formatDateTime(null, {});
      expect(result).toBe("");
    });

    it("uses default values when no options provided", () => {
      const date = new Date("2023-12-25T15:30:00");
      const result = formatDateTime(date, {});
      expect(result).toContain("ma");
      expect(result).toContain("25.12.2023");
      expect(result).toContain("klo 15:30");
      expect(result).toMatch("ma 25.12.2023 klo 15:30");
    });
  });

  describe("formatDateTimeStrings", () => {
    it("formats reservation date time strings", () => {
      const reservation = {
        beginsAt: "2023-12-25T15:30:00.000Z",
        endsAt: "2023-12-25T17:00:00.000Z",
      };

      const result = applicationReservationDateTime({
        t: mockT,
        reservation,
        trailingMinutes: true,
      });

      expect(result.date).toBeInstanceOf(Date);
      expect(result.time).toMatch("17:30–19:00");
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

      const result = applicationReservationDateTime({
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

      const result = applicationReservationDateTime({
        t: mockT,
        reservation,
        trailingMinutes: true,
      });

      expect(result.time).toMatch("17:00–19:00");
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
      expect(result).toBe("0:00–1:00");
    });
  });

  describe("formatDateRange", () => {
    it("formats same day range", () => {
      const start = new Date("2023-12-25T10:00:00");
      const end = new Date("2023-12-25T15:00:00");
      const result = formatDateRange(start, end, {});
      expect(result).toContain("25.12.2023");
      expect(result).not.toContain("–"); // Should not have range separator for same day
    });

    it("formats multi-day range", () => {
      const start = new Date("2023-12-25T10:00:00");
      const end = new Date("2023-12-26T15:00:00");
      const result = formatDateRange(start, end, {});
      expect(result).toContain("ma 25.12.2023");
      expect(result).toContain("ti 26.12.2023");
      expect(result).toContain("–");
    });

    it("includes weekday by default", () => {
      const start = new Date("2023-12-25T10:00:00"); // Monday
      const end = new Date("2023-12-26T15:00:00"); // Tuesday
      const result = formatDateRange(start, end, {});
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
      const result = formatDateRange(null, null, {});
      expect(result).toBe("");
    });

    it("handles invalid dates", () => {
      const invalidDate = new Date("invalid");
      const result = formatDateRange(invalidDate, invalidDate, {});
      expect(result).toBe("");
    });
  });

  describe("formatDateTimeRange", () => {
    it("formats same day datetime range", () => {
      const start = new Date("2023-12-25T15:30:00");
      const end = new Date("2023-12-25T17:00:00");
      const result = formatDateTimeRange(start, end, { t: mockT });
      expect(result).toContain("25.12.2023");
      expect(result).toContain("klo");
      expect(result).toMatch(/\d{2}:\d{2}/);
      expect(result).toContain("17:00");
    });

    it("formats multi-day datetime range", () => {
      const start = new Date("2023-12-25T15:30:00");
      const end = new Date("2023-12-26T17:00:00");
      const result = formatDateTimeRange(start, end, { t: mockT });
      expect(result).toContain("25.12.2023");
      expect(result).toContain("klo");
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
    });

    it("handles null dates", () => {
      const result = formatDateTimeRange(null, null, {});
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
      expect(result).toBe("common:abbreviations:minute"); // 0 min
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
        minDuration: { seconds: 3600 }, // 1 hour
        maxDuration: { seconds: 7200 }, // 2 hours
      });
      expect(result).toBe("common:abbreviations:hour–common:abbreviations:hour");
    });

    it("formats same duration as single value", () => {
      const result = formatDurationRange({
        t: mockT,
        minDuration: { minutes: 60 },
        maxDuration: { hours: 1 },
      });
      expect(result).toBe("common:abbreviations:hour");
    });

    it("uses unabbreviated format", () => {
      const result = formatDurationRange({
        t: mockT,
        minDuration: { seconds: 3600 },
        maxDuration: { minutes: 120 },
        abbreviated: false,
      });
      expect(result).toBe("common:hour–common:hour");
    });
  });

  describe("formatApiDate", () => {
    it("converts valid Date to API format", () => {
      const date = new Date("2023-12-25T15:30:00");
      expect(formatApiDate(date)).toBe("2023-12-25");
    });

    it("handles null date", () => {
      expect(formatApiDate(null as unknown as Date)).toBeNull();
    });

    it("handles invalid date", () => {
      const invalidDate = new Date("invalid");
      expect(formatApiDate(invalidDate)).toBeNull();
    });

    it("handles very old dates", () => {
      const oldDate = new Date("999-01-01");
      expect(formatApiDate(oldDate)).toBeNull();
    });
  });

  describe("formatApiDateUnsafe", () => {
    it("converts valid Date to API format", () => {
      const date = new Date("2023-12-25T15:30:00");
      expect(formatApiDateUnsafe(date)).toBe("2023-12-25");
    });

    it("throws on invalid date", () => {
      const invalidDate = new Date("invalid");
      expect(() => formatApiDateUnsafe(invalidDate)).toThrow("Invalid date:");
    });
  });

  describe("formatApiTime", () => {
    it("converts valid time to API format", () => {
      expect(formatApiTime(15, 30)).toBe("15:30");
    });

    it("pads single digits", () => {
      expect(formatApiTime(9, 5)).toBe("09:05");
    });

    it("defaults minutes to 0", () => {
      expect(formatApiTime(15)).toBe("15:00");
    });

    it("handles 24:00 as 00:00", () => {
      expect(formatApiTime(24, 0)).toBe("00:00");
    });

    it("rejects invalid hours", () => {
      expect(formatApiTime(-1)).toBeNull();
      expect(formatApiTime(25)).toBeNull();
    });

    it("rejects invalid minutes", () => {
      expect(formatApiTime(15, -1)).toBeNull();
      expect(formatApiTime(15, 60)).toBeNull();
    });

    it("rejects 24:xx with minutes", () => {
      expect(formatApiTime(24, 30)).toBeNull();
    });
  });

  describe("formatApiTimeUnsafe", () => {
    it("converts valid time to API format", () => {
      expect(formatApiTimeUnsafe(15, 30)).toBe("15:30");
    });

    it("throws on invalid time", () => {
      expect(() => formatApiTimeUnsafe(-1)).toThrow("Invalid time:");
    });
  });
});
