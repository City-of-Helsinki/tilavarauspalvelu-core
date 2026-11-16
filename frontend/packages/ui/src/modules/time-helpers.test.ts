import { describe, expect, test } from "vitest";
import { formatClock, formatClockRange } from "./time-helpers";

describe("formatClock", () => {
  test("zero pads hours and minutes", () => {
    expect(formatClock(0)).toBe("00:00");
    expect(formatClock(545)).toBe("09:05");
  });

  test("the end of the day reads as 24:00", () => {
    expect(formatClock(24 * 60)).toBe("24:00");
  });
});

describe("formatClockRange", () => {
  test("joins the times with an en dash", () => {
    expect(formatClockRange(540, 630)).toBe("09:00–10:30");
  });
});
