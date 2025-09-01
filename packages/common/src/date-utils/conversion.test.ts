import { describe, expect, test } from "vitest";
import { minutesToHoursString } from "./conversion";

describe("minutesToHours", () => {
  test("should return 0:00 when given 0 when trailingMinutes is true", () => {
    expect(minutesToHoursString(0, true)).toBe("0:00");
  });
  test("should return 0 when given 0 when trailingMinutes is false", () => {
    expect(minutesToHoursString(0, false)).toBe("0");
  });
});
