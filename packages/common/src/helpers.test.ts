import type { TFunction } from "i18next";
import { formatApiTimeInterval, formatListToCSV, formatMinutes } from "./helpers";
import { describe, test, expect } from "vitest";

describe("formatMinutes", () => {
  test("should return 0:00 when given 0 when trailingMinutes is true", () => {
    expect(formatMinutes(0, true)).toBe("0:00");
  });
  test("should return 0 when given 0 when trailingMinutes is false", () => {
    expect(formatMinutes(0, false)).toBe("0");
  });
});

describe("formatApiTimeInterval", () => {
  test("should properly format api time interval", () => {
    const t1 = "12:30:00";
    const t2 = "13:30:00";
    const result = formatApiTimeInterval({ beginTime: t1, endTime: t2 });
    expect(result).toBe("12:30–13:30");
  });

  test("should properly format api time interval without trailing minutes", () => {
    const t1 = "12:00:00";
    const t2 = "14:00:00";
    const result = formatApiTimeInterval({ beginTime: t1, endTime: t2 });
    expect(result).toBe("12–14");
  });

  test("should properly format api time interval without trailing minutes", () => {
    const t1 = "12:00:00";
    const t2 = "14:30:00";
    const result = formatApiTimeInterval({ beginTime: t1, endTime: t2 });
    expect(result).toBe("12–14:30");
  });

  test("should properly format api time interval without trailing minutes", () => {
    const t1 = "12:30:00";
    const t2 = "14:00:00";
    const result = formatApiTimeInterval({ beginTime: t1, endTime: t2 });
    expect(result).toBe("12:30–14");
  });

  test("should properly format api time interval without trailing minutes", () => {
    const t1 = "12:30:00";
    const t2 = "14:30:00";
    const result = formatApiTimeInterval({ beginTime: t1, endTime: t2 });
    expect(result).toBe("12:30–14:30");
  });

  test("should show ending 00:00 as 24:00", () => {
    const t1 = "00:00:00";
    const t2 = "00:00:00";
    const result = formatApiTimeInterval({ beginTime: t1, endTime: t2 });
    expect(result).toBe("0–24");
  });

  test("should properly format api time interval with trailing minutes", () => {
    const t1 = "12:00:00";
    const t2 = "14:00:00";
    const result = formatApiTimeInterval({
      beginTime: t1,
      endTime: t2,
      trailingMinutes: true,
    });
    expect(result).toBe("12:00–14:00");
  });
});

describe("formatListToCSV", () => {
  const mockT: TFunction = ((text: string) => text) as TFunction;
  test("should return empty string when given empty array", () => {
    const result = formatListToCSV(mockT, []);
    expect(result).toBe("");
  });
  test("should return single item when given single item array", () => {
    const result = formatListToCSV(mockT, ["item"]);
    expect(result).toBe("item");
  });
  test("should return and seperated when given two items", () => {
    const result = formatListToCSV(mockT, ["item1", "item2"]);
    expect(result).toBe("item1 common:and item2");
  });
  test("should return comma seperated when given three items", () => {
    const result = formatListToCSV(mockT, ["item1", "item2", "item3"]);
    expect(result).toBe("item1, item2 common:and item3");
  });
  test("should return comma seperated when given ten items", () => {
    const list = Array.from({ length: 10 }, (_, i) => `item${i + 1}`);
    const result = formatListToCSV(mockT, list);
    const res = list.slice(0, 9).join(", ") + ` common:and item10`;
    expect(result).toBe(res);
  });
});
