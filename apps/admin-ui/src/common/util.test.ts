import {
  convertHMSToSeconds,
  formatTimeDistance,
  secondsToHms,
  filterData,
  formatDecimal,
  parseDurationString,
} from "./util";

jest.mock("i18next", () => ({
  t: (str: string) => str,
}));

test("secondToHms", () => {
  expect(secondsToHms(9832475)).toEqual({ h: 2731, m: 14, s: 35 });
  expect(secondsToHms(0)).toEqual({});
  expect(secondsToHms(-190)).toEqual({});
  expect(secondsToHms()).toEqual({});
  expect(secondsToHms(undefined)).toEqual({});
});

test("parseDurationString", () => {
  expect(parseDurationString("10:00")).toEqual({ h: 10, m: 0 });
  expect(parseDurationString("5:10")).toEqual({ h: 5, m: 10 });
  expect(parseDurationString("5:10")).toEqual({ h: 5, m: 10 });
  expect(parseDurationString("05:04")).toEqual({ h: 5, m: 4 });
  expect(parseDurationString("23:59")).toEqual({ h: 23, m: 59 });
  expect(parseDurationString("00:00")).toEqual({ h: 0, m: 0 });

  // partials
  expect(parseDurationString("10:")).toEqual({ h: 10, m: 0 });
  expect(parseDurationString("10:40:59")).toEqual({ h: 10, m: 40 });

  // invalid values
  expect(parseDurationString("")).toBe(undefined);
  expect(parseDurationString("24:40")).toBe(undefined);
  expect(parseDurationString("-1:40")).toBe(undefined);
  expect(parseDurationString("100")).toBe(undefined);
  expect(parseDurationString("10:75")).toBe(undefined);
  expect(parseDurationString("10:foobar")).toBe(undefined);
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
