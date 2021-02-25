import { parseDuration, secondsToHms } from "./util";

test("secondToHms", () => {
  expect(secondsToHms(9832475)).toEqual({ h: 2731, m: 14, s: 35 });
  expect(secondsToHms(0)).toEqual({});
  expect(secondsToHms(-190)).toEqual({});
  expect(secondsToHms()).toEqual({});
  expect(secondsToHms(undefined)).toEqual({});
});

test("parseDuration", () => {
  expect(parseDuration(7834)).toBe("2 undefined 10 undefined");
  expect(parseDuration(0)).toBe("");
  expect(parseDuration(-30)).toBe("");
  expect(parseDuration()).toBe("");
  expect(parseDuration(undefined)).toBe("");
});
