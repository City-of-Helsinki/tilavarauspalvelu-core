import { convertHMSToSeconds, formatDuration, secondsToHms } from "../util";

jest.mock("next/config", () => () => ({
  serverRuntimeConfig: {},
  publicRuntimeConfig: {},
}));

jest.mock("next-i18next", () => ({
  i18n: {
    t: (str: string, options: { count: number }) => {
      const countStr = options?.count > 1 ? "plural" : "singular";
      return options?.count ? `${options.count} ${countStr}` : str;
    },
  },
}));

test("secondToHms", () => {
  expect(secondsToHms(9832475)).toEqual({ h: 2731, m: 14, s: 35 });
  expect(secondsToHms(0)).toEqual({ h: 0, m: 0, s: 0 });
  expect(secondsToHms(-190)).toEqual({});
  expect(secondsToHms(null)).toEqual({});
});

test("convertHMSToSeconds", () => {
  expect(convertHMSToSeconds("01:15:01")).toBe(60 * 60 + 15 * 60 + 1);
  expect(convertHMSToSeconds("13:23:01")).toBe(48181);
  expect(convertHMSToSeconds("13gr01")).toBe(null);
  expect(convertHMSToSeconds("")).toBe(null);
});

test("formatDuration", () => {
  expect(formatDuration("1:30:00")).toEqual("1 singular 30 plural");
  expect(formatDuration("2:00:00")).toEqual("2 plural");
  expect(formatDuration("foo")).toEqual("-");
  expect(formatDuration("")).toEqual("-");
});
