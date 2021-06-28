import {
  convertHMSToSeconds,
  formatTimeDistance,
  parseDuration,
  secondsToHms,
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
