import {
  type ReservationNode,
  ReservationStartInterval,
} from "../../../gql/gql-types";
import { getEventBuffers } from "../../calendar/util";
import { getIntervalMinutes } from "../../helpers";

const tfunction = (str: string, options: { count: number }) => {
  const countStr = options?.count > 1 ? "plural" : "singular";
  return options?.count ? `${options.count} ${countStr}` : str;
};

jest.mock("next-i18next", () => ({
  i18n: {
    t: (str: string, options: { count: number }) => tfunction(str, options),
  },
}));

test("getIntervalMinutes", () => {
  expect(getIntervalMinutes(ReservationStartInterval.Interval_15Mins)).toBe(15);
  expect(getIntervalMinutes(ReservationStartInterval.Interval_30Mins)).toBe(30);
  expect(getIntervalMinutes(ReservationStartInterval.Interval_60Mins)).toBe(60);
  expect(getIntervalMinutes(ReservationStartInterval.Interval_90Mins)).toBe(90);
});

describe("getEventBuffers", () => {
  test("outputs correct buffers", () => {
    const events = [
      {
        id: "1234",
        begin: new Date("2019-09-22T12:00:00+00:00").toString(),
        end: new Date("2019-09-22T13:00:00+00:00").toString(),
        bufferTimeBefore: 3600,
        bufferTimeAfter: 5400,
      },
      {
        id: "3456",
        begin: new Date("2019-09-22T15:00:00+00:00").toString(),
        end: new Date("2019-09-22T16:00:00+00:00").toString(),
        bufferTimeBefore: null,
        bufferTimeAfter: 9000,
      },
    ] as ReservationNode[];

    expect(getEventBuffers([])).toEqual([]);
    expect(getEventBuffers(events)).toEqual([
      {
        start: new Date("2019-09-22T11:00:00+00:00"),
        end: new Date("2019-09-22T12:00:00+00:00"),
        event: {
          ...events[0],
          state: "BUFFER",
        },
      },
      {
        start: new Date("2019-09-22T13:00:00+00:00"),
        end: new Date("2019-09-22T14:30:00+00:00"),
        event: {
          ...events[0],
          state: "BUFFER",
        },
      },
      {
        start: new Date("2019-09-22T16:00:00+00:00"),
        end: new Date("2019-09-22T18:30:00+00:00"),
        event: {
          ...events[1],
          state: "BUFFER",
        },
      },
    ]);
  });
});
