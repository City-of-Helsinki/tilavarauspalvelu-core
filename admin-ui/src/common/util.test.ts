import {
  convertHMSToSeconds,
  formatTimeDistance,
  parseDuration,
  secondsToHms,
  filterData,
  formatDecimal,
} from "./util";

test("secondToHms", () => {
  expect(secondsToHms(9832475)).toEqual({ h: 2731, m: 14, s: 35 });
  expect(secondsToHms(0)).toEqual({});
  expect(secondsToHms(-190)).toEqual({});
  expect(secondsToHms()).toEqual({});
  expect(secondsToHms(undefined)).toEqual({});
});

test("parseDuration", () => {
  expect(parseDuration(7834)).toBe("undefined undefined");
  expect(parseDuration(0)).toBe("");
  expect(parseDuration(-30)).toBe("");
  expect(parseDuration(undefined)).toBe("");
});

test("formatTimeDistance", () => {
  expect(formatTimeDistance("10:00:00", "14:00:00")).toBe(4 * 3600);
  expect(formatTimeDistance("10:00:00", "foo")).toBe(undefined);
  expect(formatTimeDistance("00:00:00", "12:00:00")).toBe(12 * 3600);
  expect(formatTimeDistance("00:00:00", "12:00:01")).toBe(12 * 3600 + 1);
});

test("convertHMSToSeconds", () => {
  expect(convertHMSToSeconds("01:15:01")).toBe(60 * 60 + 15 * 60 + 1);
  expect(convertHMSToSeconds("13:23:01")).toBe(48181);
  expect(convertHMSToSeconds("13gr01")).toBe(null);
  expect(convertHMSToSeconds("")).toBe(null);
});

test("filterData", () => {
  expect(filterData([], [])).toEqual([]);
  expect(filterData([], [{ title: "", key: "name", value: "bar" }])).toEqual(
    []
  );
  expect(filterData([{ name: "foo" }, { name: "bar" }], [])).toEqual([
    { name: "foo" },
    { name: "bar" },
  ]);
  expect(
    filterData(
      [{ name: "foo" }, { name: "bar" }],
      [{ title: "", key: "name", value: "bar" }]
    )
  ).toEqual([{ name: "bar" }]);
  expect(
    filterData(
      [
        { name: "bar", size: 4 },
        { name: "bar", size: 5 },
      ],
      [
        { title: "", key: "name", value: "bar" },
        { title: "", key: "size", value: 5 },
      ]
    )
  ).toEqual([{ name: "bar", size: 5 }]);
});

test("formatDecimal", () => {
  expect(formatDecimal({ input: undefined, fallbackValue: 1 })).toEqual(1);
  expect(formatDecimal({ input: undefined })).toEqual(0);

  expect(formatDecimal({ input: "12.123456789" })).toEqual(12.123457);
  expect(formatDecimal({ input: "12.123456789", decimals: 3 })).toEqual(12.123);
  expect(formatDecimal({ input: "12.123456789", decimals: 0 })).toEqual(12);

  expect(formatDecimal({ input: 12.123456789 })).toEqual(12.123457);
  expect(formatDecimal({ input: 12.123456789, decimals: 3 })).toEqual(12.123);
  expect(formatDecimal({ input: 12.123456789, decimals: 0 })).toEqual(12);
});
