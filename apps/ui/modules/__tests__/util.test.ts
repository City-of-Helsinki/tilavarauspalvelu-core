import { ApolloError } from "@apollo/client";
import {
  ApplicationEventSchedulePriority,
  Cell,
} from "common";
import {
  cellsToApplicationEventSchedules,
  applicationRoundState,
  getComboboxValues,
  getReadableList,
  printErrorMessages,
} from "../util";

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

const cell = (
  hour: number,
  state: ApplicationEventSchedulePriority | false
): Cell => ({
  label: "cell",
  key: "key",
  hour,
  state,
});
test("test that time selector ui model converts to api model", () => {
  const week = [
    [cell(7, 300), cell(8, 300), cell(9, 300), cell(11, 300)],
    [cell(12, 300), cell(13, 200)],
    [cell(22, 200), cell(23, 200)],
  ];

  const result = cellsToApplicationEventSchedules(week);

  expect(result.length).toBe(5);
  expect(result[0]).toStrictEqual({
    begin: "07:00",
    end: "10:00",
    day: 0,
    priority: 300,
  });
  expect(result[1]).toStrictEqual({
    begin: "11:00",
    end: "12:00",
    day: 0,
    priority: 300,
  });
  expect(result[2]).toStrictEqual({
    begin: "12:00",
    end: "13:00",
    day: 1,
    priority: 300,
  });
  expect(result[3]).toStrictEqual({
    begin: "13:00",
    end: "14:00",
    day: 1,
    priority: 200,
  });
  expect(result[4]).toStrictEqual({
    begin: "22:00",
    end: "00:00",
    day: 2,
    priority: 200,
  });

  const noSelections = cellsToApplicationEventSchedules([
    [cell(7, false), cell(8, false), cell(9, false)],
  ]);

  expect(noSelections.length).toBe(0);
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

  expect(getComboboxValues("", optionsAbc)).toEqual([]);
  expect(getComboboxValues("b,c", [])).toEqual([]);
  expect(getComboboxValues("", [])).toEqual([]);
});

test("getReadableList", () => {
  expect(getReadableList(["a"])).toEqual("a");
  expect(getReadableList(["a", "b"])).toEqual("a common:and b");
  expect(getReadableList(["a", "b", "c"])).toEqual("a, b common:and c");
  expect(getReadableList([])).toEqual("");
});

test("printErrorMessages", () => {
  expect(
    printErrorMessages({
      graphQLErrors: [
        {
          extensions: { error_code: "RESERVATION_UNITS_MAX_DURATION_EXCEEDED" },
        },
      ],
    } as unknown as ApolloError)
  ).toEqual("errors:RESERVATION_UNITS_MAX_DURATION_EXCEEDED");

  expect(
    printErrorMessages({
      graphQLErrors: [
        {
          extensions: { error_code: "SOMETHING" },
        },
        {
          extensions: { error_code: "SOMETHING_ELSE" },
        },
      ],
    } as unknown as ApolloError)
  ).toEqual("errors:SOMETHING\nerrors:SOMETHING_ELSE");
});
