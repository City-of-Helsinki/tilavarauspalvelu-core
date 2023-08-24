import { set } from "date-fns";
import { convertToDate, isOverlapping } from "./utils";

describe("isOverlapping", () => {
  test("21:00 - 22:15 and 22:00 - 23:00 on the same day overlap", () => {
    const d = new Date(2024, 1, 1);
    const r1 = {
      begin: set(d, { hours: 21, minutes: 0 }),
      end: set(d, { hours: 22, minutes: 15 }),
    };
    const r2 = {
      begin: set(d, { hours: 22, minutes: 0 }),
      end: set(d, { hours: 23, minutes: 0 }),
    };
    expect(isOverlapping(r1, r2)).toBeTruthy();
    expect(isOverlapping(r2, r1)).toBeTruthy();
  });

  test("9:15 - 10:15 and 9:00 - 10:00 on the same day overlap", () => {
    const d = new Date(2024, 1, 1);
    const r1 = {
      begin: set(d, { hours: 9, minutes: 15 }),
      end: set(d, { hours: 10, minutes: 15 }),
    };
    const r2 = {
      begin: set(d, { hours: 10, minutes: 0 }),
      end: set(d, { hours: 11, minutes: 0 }),
    };
    expect(isOverlapping(r1, r2)).toBeTruthy();
    expect(isOverlapping(r2, r1)).toBeTruthy();
  });

  test("same range 9:00 - 10:00 on the same day overlap", () => {
    const d = new Date(2024, 1, 1);
    const r1 = {
      begin: set(d, { hours: 9, minutes: 0 }),
      end: set(d, { hours: 10, minutes: 0 }),
    };
    expect(isOverlapping(r1, r1)).toBeTruthy();
  });

  test("two ranges on different days have no overlap", () => {
    const r1 = { begin: new Date(2024, 1, 1), end: new Date(2024, 1, 2) };
    const r2 = { begin: new Date(2024, 1, 3), end: new Date(2024, 1, 4) };
    expect(isOverlapping(r1, r2)).toBeFalsy();
    expect(isOverlapping(r2, r1)).toBeFalsy();
  });

  test("ranges 9:00 - 10:00 and 10:00 - 11:00 on the same day have no overlap", () => {
    const d = new Date(2024, 1, 1);
    const r1 = {
      begin: set(d, { hours: 9, minutes: 0 }),
      end: set(d, { hours: 10, minutes: 0 }),
    };
    const r2 = {
      begin: set(d, { hours: 10, minutes: 0 }),
      end: set(d, { hours: 11, minutes: 0 }),
    };
    expect(isOverlapping(r1, r2)).toBeFalsy();
    expect(isOverlapping(r2, r1)).toBeFalsy();
  });
});

describe("convertToDate", () => {
  test("return undefined, don't throw on invalid date", () => {
    const invalidDate: Date = new Date(undefined as unknown as number);
    expect(() => convertToDate(invalidDate, "10:00")).not.toThrow();
    expect(convertToDate(invalidDate, "10:00")).toBe(undefined);
  });

  test("return undefined, don't throw on invalid string", () => {
    const validDate = new Date();
    expect(validDate).not.toBe(Number.NaN);
    expect(() =>
      convertToDate(validDate, "random stuff here")
    ).not.toThrowError();
    expect(convertToDate(validDate, "random stuff here")).toBe(undefined);
  });

  test("return undefined, don't throw on empty string", () => {
    const validDate = new Date();
    expect(validDate).not.toBe(Number.NaN);
    expect(() => convertToDate(validDate, "")).not.toThrowError();
    expect(convertToDate(validDate, "")).toBe(undefined);
  });

  test("partial matches return undefined, don't throw", () => {
    const d = new Date(2023, 9, 1, 23, 11);
    expect(d).not.toBe(Number.NaN);
    expect(() => convertToDate(d, "10:")).not.toThrowError();
    expect(convertToDate(d, "10:")).toBe(undefined);

    expect(() => convertToDate(d, "10:99")).not.toThrowError();
    expect(convertToDate(d, "10:99")).toBe(undefined);
  });

  test("sets time properly", () => {
    const d = new Date(2023, 9, 1, 23, 11);
    expect(convertToDate(d, "10:00")).toStrictEqual(
      new Date(2023, 9, 1, 10, 0)
    );
    expect(convertToDate(d, "10:15")).toStrictEqual(
      new Date(2023, 9, 1, 10, 15)
    );
  });
});
