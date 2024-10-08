import { formatApiTimeInterval, formatMinutes } from "./helpers";

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
