import { ApplicationEventSchedule, Cell, DAY } from "../types";
import {
  cellsToApplicationEventSchedules,
  applicationEventSchedulesToCells,
  applicationRoundState,
  getComboboxValues,
  secondsToHms,
  convertHMSToSeconds,
  formatDuration,
} from "../util";

jest.mock("next/config", () => () => ({
  serverRuntimeConfig: {},
  publicRuntimeConfig: {},
}));

jest.mock("next-i18next", () => ({
  i18n: {
    t: (str: string, options: { count: number }) => {
      const countStr = options.count > 1 ? "plural" : "singular";
      return `${options.count} ${countStr}`;
    },
  },
}));

const cell = (hour: number, state = true): Cell => ({
  label: "cell",
  key: "key",
  hour,
  state,
});
test("test that time selector ui model converts to api model", () => {
  const week = [
    [cell(7), cell(8), cell(9), cell(11)],
    [cell(12)],
    [cell(22), cell(23)],
  ];

  const result = cellsToApplicationEventSchedules(week);

  expect(result.length).toBe(4);
  expect(result[0]).toStrictEqual({ begin: "07:00", end: "10:00", day: 0 });
  expect(result[1]).toStrictEqual({ begin: "11:00", end: "12:00", day: 0 });
  expect(result[2]).toStrictEqual({ begin: "12:00", end: "13:00", day: 1 });
  expect(result[3]).toStrictEqual({ begin: "22:00", end: "00:00", day: 2 });

  const noSelections = cellsToApplicationEventSchedules([
    [cell(7, false), cell(8, false), cell(9, false)],
  ]);

  expect(noSelections.length).toBe(0);
});

const appEventSchedule = (
  begin: string,
  end: string,
  day: DAY
): ApplicationEventSchedule => ({ begin, end, day });

const cellWithHour = (cells: Cell[], hour: number) =>
  cells.find((c) => c.hour === hour);

test("test that api model converts to time selector ui model", () => {
  const result = applicationEventSchedulesToCells([
    appEventSchedule("08:00", "11:00", 0),
    appEventSchedule("07:00", "08:00", 1),
  ]);

  expect(result.length).toBe(7);
  expect(cellWithHour(result[0], 7)?.state).toBe(false);
  expect(cellWithHour(result[0], 8)?.state).toBe(true);
  expect(cellWithHour(result[0], 9)?.state).toBe(true);
  expect(cellWithHour(result[0], 10)?.state).toBe(true);
  expect(cellWithHour(result[0], 11)?.state).toBe(false);
  expect(cellWithHour(result[1], 7)?.state).toBe(true);
});

test("applicationRoundState", () => {
  jest
    // .useFakeTimers("modern")
    .useFakeTimers()
    .setSystemTime(new Date("2021-01-01T007:59:59Z").getTime());
  expect(
    applicationRoundState("2021-01-01T08:00:00Z", "2021-02-01T08:00:00Z")
  ).toBe("pending");

  jest
    // .useFakeTimers("modern")
    .useFakeTimers()
    .setSystemTime(new Date("2021-01-01T08:00:01Z").getTime());
  expect(
    applicationRoundState("2021-01-01T08:00:00Z", "2021-02-01T08:00:00Z")
  ).toBe("active");

  jest
    // .useFakeTimers("modern")
    .useFakeTimers()
    .setSystemTime(new Date("2021-02-01T08:00:01Z").getTime());

  expect(
    applicationRoundState("2021-01-01T08:00:00Z", "2021-02-01T08:00:00Z")
  ).toBe("past");
});

test("getComboboxValues", () => {
  const optionsAbc = [
    { label: "a", value: "a" },
    { label: "b", value: "b" },
    { label: "c", value: "c" },
  ];

  expect(getComboboxValues("b,c", optionsAbc)).toEqual([
    { label: "b", value: "b" },
    { label: "c", value: "c" },
  ]);

  expect(getComboboxValues("", optionsAbc)).toEqual(undefined);
  expect(getComboboxValues("b,c", [])).toEqual(undefined);
  expect(getComboboxValues("", [])).toEqual(undefined);
});

test("secondToHms", () => {
  expect(secondsToHms(9832475)).toEqual({ h: 2731, m: 14, s: 35 });
  expect(secondsToHms(0)).toEqual({});
  expect(secondsToHms(-190)).toEqual({});
  expect(secondsToHms()).toEqual({});
  expect(secondsToHms(undefined)).toEqual({});
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
