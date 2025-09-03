import { describe, expect, it, test } from "vitest";
import {
  toApiDate,
  toApiDateUnsafe,
  fromApiDate,
  fromUIDate,
  fromUIDateUnsafe,
  toApiTime,
  toApiTimeUnsafe,
  dateForInput,
  timeForInput,
  isValidDate,
  dateToMinutes,
  minutesToHoursString,
  timeToMinutes,
  toMondayFirst,
  fromMondayFirst,
} from "./conversion";

describe("conversion", () => {
  describe("toApiDate", () => {
    it("converts valid Date to API format", () => {
      const date = new Date("2023-12-25T15:30:00");
      expect(toApiDate(date)).toBe("2023-12-25");
    });

    it("handles null date", () => {
      expect(toApiDate(null as unknown as Date)).toBeNull();
    });

    it("handles invalid date", () => {
      const invalidDate = new Date("invalid");
      expect(toApiDate(invalidDate)).toBeNull();
    });

    it("handles very old dates", () => {
      const oldDate = new Date("999-01-01");
      expect(toApiDate(oldDate)).toBeNull();
    });
  });

  describe("toApiDateUnsafe", () => {
    it("converts valid Date to API format", () => {
      const date = new Date("2023-12-25T15:30:00");
      expect(toApiDateUnsafe(date)).toBe("2023-12-25");
    });

    it("throws on invalid date", () => {
      const invalidDate = new Date("invalid");
      expect(() => toApiDateUnsafe(invalidDate)).toThrow("Invalid date:");
    });
  });

  describe("fromApiDate", () => {
    it("parses valid API date string", () => {
      const result = fromApiDate("2023-12-25");
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2023);
      expect(result?.getMonth()).toBe(11); // December is month 11
      expect(result?.getDate()).toBe(25);
    });

    it("handles empty string", () => {
      expect(fromApiDate("")).toBeNull();
    });

    it("handles invalid date string", () => {
      expect(fromApiDate("invalid-date")).toBeNull();
    });

    it("handles malformed date string", () => {
      expect(fromApiDate("2023-13-45")).toBeNull();
    });
  });

  describe("fromUIDate", () => {
    it("parses valid UI date string", () => {
      const result = fromUIDate("25.12.2023");
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2023);
      expect(result?.getMonth()).toBe(11);
      expect(result?.getDate()).toBe(25);
    });

    it("handles empty string", () => {
      expect(fromUIDate("")).toBeNull();
    });

    it("handles invalid date string", () => {
      expect(fromUIDate("invalid-date")).toBeNull();
    });

    it("handles malformed date string", () => {
      expect(fromUIDate("45.13.2023")).toBeNull();
    });
  });

  describe("fromUIDateUnsafe", () => {
    it("parses valid UI date string", () => {
      const result = fromUIDateUnsafe("25.12.2023");
      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(2023);
    });

    it("throws on invalid date", () => {
      expect(() => fromUIDateUnsafe("invalid")).toThrow("Invalid date:");
    });
  });

  describe("toApiTime", () => {
    it("converts valid time to API format", () => {
      expect(toApiTime(15, 30)).toBe("15:30");
    });

    it("pads single digits", () => {
      expect(toApiTime(9, 5)).toBe("09:05");
    });

    it("defaults minutes to 0", () => {
      expect(toApiTime(15)).toBe("15:00");
    });

    it("handles 24:00 as 00:00", () => {
      expect(toApiTime(24, 0)).toBe("00:00");
    });

    it("rejects invalid hours", () => {
      expect(toApiTime(-1)).toBeNull();
      expect(toApiTime(25)).toBeNull();
    });

    it("rejects invalid minutes", () => {
      expect(toApiTime(15, -1)).toBeNull();
      expect(toApiTime(15, 60)).toBeNull();
    });

    it("rejects 24:xx with minutes", () => {
      expect(toApiTime(24, 30)).toBeNull();
    });
  });

  describe("toApiTimeUnsafe", () => {
    it("converts valid time to API format", () => {
      expect(toApiTimeUnsafe(15, 30)).toBe("15:30");
    });

    it("throws on invalid time", () => {
      expect(() => toApiTimeUnsafe(-1)).toThrow("Invalid time:");
    });
  });

  describe("dateForInput", () => {
    it("handles Date object", () => {
      const date = new Date("2023-12-25T15:30:00");
      expect(dateForInput(date)).toBe("25.12.2023");
    });

    it("handles API date string", () => {
      expect(dateForInput("2023-12-25")).toBe("25.12.2023");
    });

    it("handles UI date string", () => {
      expect(dateForInput("25.12.2023")).toBe("25.12.2023");
    });

    it("falls back to current date on invalid input", () => {
      const result = dateForInput("invalid");
      expect(result).toMatch(/^\d{1,2}\.\d{1,2}\.\d{4}$/);
    });
  });

  describe("timeForInput", () => {
    it("handles Date object", () => {
      const date = new Date("2023-12-25T15:30:00");
      const result = timeForInput(date);
      expect(result).toMatch(/\d{2}:\d{2}/); // Check format but not exact time due to timezone
    });

    it("handles valid time string", () => {
      const result = timeForInput("15:30");
      expect(result).toMatch(/\d{2}:\d{2}/); // Format check
    });

    it("handles single digit hours", () => {
      const result = timeForInput("9:30");
      expect(result).toMatch(/@ \d{2}:\d{2}/); // Should pad to 09:30
    });

    it("handles ISO string", () => {
      const result = timeForInput("2023-12-25T15:30:00.000Z");
      expect(result).toMatch(/\d{2}:\d{2}/); // Check format
    });

    it("falls back to current time on invalid input", () => {
      const result = timeForInput("invalid");
      expect(result).toMatch(/@ \d{2}:\d{2}/); // Should still be time format
    });
  });

  describe("isValidDate", () => {
    it("accepts valid recent date", () => {
      const date = new Date("2023-12-25");
      expect(isValidDate(date)).toBe(true);
    });

    it("rejects very old dates", () => {
      const oldDate = new Date("999-12-31");
      expect(isValidDate(oldDate)).toBe(false);
    });

    it("rejects invalid dates", () => {
      const invalidDate = new Date("invalid");
      expect(isValidDate(invalidDate)).toBe(false);
    });

    it("rejects null dates", () => {
      expect(isValidDate(null as unknown as Date)).toBe(false);
    });

    it("accepts year 1000", () => {
      const date = new Date("1000-01-02");
      expect(isValidDate(date)).toBe(true);
    });
  });

  describe("dateToMinutes", () => {
    it("converts date to minutes", () => {
      const date = new Date("2023-12-25T15:30:00");
      expect(dateToMinutes(date)).toBe(15 * 60 + 30); // 930 minutes
    });

    it("handles midnight", () => {
      const date = new Date("2023-12-25T00:00:00");
      expect(dateToMinutes(date)).toBe(0);
    });

    it("handles late evening", () => {
      const date = new Date("2023-12-25T23:59:00");
      expect(dateToMinutes(date)).toBe(23 * 60 + 59); // 1439 minutes
    });
  });

  describe("minutesToHoursString", () => {
    test("should return 0:00 when given 0 when trailingMinutes is true", () => {
      expect(minutesToHoursString(0, true)).toBe("0:00");
    });

    test("should return 0 when given 0 when trailingMinutes is false", () => {
      expect(minutesToHoursString(0, false)).toBe("0");
    });

    it("converts minutes to hours string", () => {
      expect(minutesToHoursString(930)).toBe("15:30");
    });

    it("handles whole hours without trailing minutes", () => {
      expect(minutesToHoursString(900)).toBe("15"); // 15 * 60 = 900
    });

    it("shows trailing minutes when requested", () => {
      expect(minutesToHoursString(900, true)).toBe("15:00");
    });

    it("always shows minutes when non-zero", () => {
      expect(minutesToHoursString(930)).toBe("15:30");
      expect(minutesToHoursString(930, true)).toBe("15:30");
    });

    it("pads single digit minutes", () => {
      expect(minutesToHoursString(905)).toBe("15:05");
    });
  });

  describe("timeToMinutes", () => {
    it("converts time string to minutes", () => {
      expect(timeToMinutes("15:30")).toBe(930);
    });

    it("handles midnight", () => {
      expect(timeToMinutes("00:00")).toBe(0);
    });

    it("handles single digit hours", () => {
      expect(timeToMinutes("9:30")).toBe(570);
    });

    it("handles invalid time strings", () => {
      expect(timeToMinutes("invalid")).toBe(0);
      expect(timeToMinutes("")).toBe(0);
      expect(timeToMinutes("25:00")).toBe(25 * 60); // Function doesn't validate, just calculates
    });

    it("handles malformed strings", () => {
      expect(timeToMinutes("abc:def")).toBe(0);
    });
  });

  describe("Start of week conversions", () => {
    it("handles input 0 correctly to Monday first", () => {
      expect(toMondayFirst(0)).toBe(6);
    });
    it("handles input 0 correctly to Sunday first", () => {
      expect(fromMondayFirst(0)).toBe(1);
    });

    it("handles input 3 correctly to Monday first", () => {
      expect(toMondayFirst(3)).toBe(2);
    });
    it("handles input 0 correctly to Sunday first", () => {
      expect(fromMondayFirst(3)).toBe(4);
    });

    it("handles input 6 correctly to Monday first", () => {
      expect(toMondayFirst(6)).toBe(5);
    });

    it("handles input 0 correctly to Sunday first", () => {
      expect(fromMondayFirst(6)).toBe(0);
    });
  });
});
