import { Parameter } from "../../../types/common";
import {
  OpeningTimesType,
  ReservationUnitsReservationUnitReservationStartIntervalChoices,
} from "../../../types/gql-types";
import {
  areOpeningTimesAvailable,
  getIntervalMinutes,
  getMinReservation,
  getValidEndingTime,
} from "../../calendar/util";
import {
  convertHMSToSeconds,
  formatDuration,
  secondsToHms,
  sortAgeGroups,
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

test("sortAgeGroups", () => {
  const ageGroups: Parameter[] = [
    { id: 12, minimum: 3 },
    { id: 3, minimum: 10, maximum: 20 },
    { id: 1, minimum: 1, maximum: 99 },
    { id: 2, minimum: 1, maximum: 3 },
  ];
  expect(sortAgeGroups(ageGroups)).toEqual([
    { id: 2, minimum: 1, maximum: 3 },
    { id: 12, minimum: 3 },
    { id: 3, minimum: 10, maximum: 20 },
    { id: 1, minimum: 1, maximum: 99 },
  ]);
});

test("getIntervalMinutes", () => {
  expect(
    getIntervalMinutes(
      0 as unknown as ReservationUnitsReservationUnitReservationStartIntervalChoices
    )
  ).toBe(0);

  expect(
    getIntervalMinutes(
      undefined as unknown as ReservationUnitsReservationUnitReservationStartIntervalChoices
    )
  ).toBe(0);

  expect(
    getIntervalMinutes(
      ReservationUnitsReservationUnitReservationStartIntervalChoices.Interval_15Mins
    )
  ).toBe(15);

  expect(
    getIntervalMinutes(
      ReservationUnitsReservationUnitReservationStartIntervalChoices.Interval_30Mins
    )
  ).toBe(30);

  expect(
    getIntervalMinutes(
      ReservationUnitsReservationUnitReservationStartIntervalChoices.Interval_60Mins
    )
  ).toBe(60);

  expect(
    getIntervalMinutes(
      ReservationUnitsReservationUnitReservationStartIntervalChoices.Interval_90Mins
    )
  ).toBe(90);
});

describe("getMinReservation", () => {
  test("should return correct times", () => {
    const begin = new Date("2021-01-01T10:00:00.000Z");
    const minReservationDuration = 3600;
    const reservationStartInterval =
      ReservationUnitsReservationUnitReservationStartIntervalChoices.Interval_90Mins;

    expect(
      getMinReservation({
        begin,
        minReservationDuration,
        reservationStartInterval,
      })
    ).toEqual({
      begin: new Date("2021-01-01T10:00:00.000Z"),
      end: new Date("2021-01-01T11:30:00.000Z"),
    });
  });

  test("should return correct times", () => {
    const begin = new Date("2021-01-01T10:00:00.000Z");
    const minReservationDuration = 3600;
    const reservationStartInterval =
      ReservationUnitsReservationUnitReservationStartIntervalChoices.Interval_30Mins;

    expect(
      getMinReservation({
        begin,
        minReservationDuration,
        reservationStartInterval,
      })
    ).toEqual({
      begin: new Date("2021-01-01T10:00:00.000Z"),
      end: new Date("2021-01-01T11:00:00.000Z"),
    });
  });
});

describe("getValidEndingTime", () => {
  test("should return original end time", () => {
    const start = new Date("2021-01-01T10:00:00.000Z");
    const end = new Date("2021-01-01T12:00:00.000Z");
    const reservationStartInterval =
      ReservationUnitsReservationUnitReservationStartIntervalChoices.Interval_60Mins;

    expect(
      getValidEndingTime({ start, end, reservationStartInterval })
    ).toEqual(end);
  });

  test("should return previous fitting end time", () => {
    const start = new Date("2021-01-01T10:00:00.000Z");
    const end = new Date("2021-01-01T12:00:00.000Z");
    const reservationStartInterval =
      ReservationUnitsReservationUnitReservationStartIntervalChoices.Interval_90Mins;

    expect(
      getValidEndingTime({ start, end, reservationStartInterval })
    ).toEqual(new Date("2021-01-01T11:30:00.000Z"));
  });

  test("should return previous fitting end time", () => {
    const start = new Date("2021-01-01T10:00:00.000Z");
    const end = new Date("2021-01-01T14:00:00.000Z");
    const reservationStartInterval =
      ReservationUnitsReservationUnitReservationStartIntervalChoices.Interval_90Mins;

    expect(
      getValidEndingTime({
        start,
        end,
        reservationStartInterval,
      })
    ).toEqual(new Date("2021-01-01T13:00:00.000Z"));
  });

  test("should return previous fitting end time", () => {
    const start = new Date("2021-01-01T10:00:00.000Z");
    const end = new Date("2021-01-01T12:00:00.000Z");
    const reservationStartInterval =
      ReservationUnitsReservationUnitReservationStartIntervalChoices.Interval_90Mins;

    expect(
      getValidEndingTime({
        start,
        end,
        reservationStartInterval,
      })
    ).toEqual(new Date("2021-01-01T11:30:00.000Z"));
  });
});

describe("areOpeningTimesAvailable", () => {
  test("should return true if opening times are available", () => {
    const openingHours: OpeningTimesType[] = [
      {
        startTime: "2022-02-02T10:00:00+00:00",
        endTime: "2022-02-02T12:00:00+00:00",
        isReservable: true,
      },
    ];

    expect(
      areOpeningTimesAvailable(
        openingHours,
        new Date("2022-02-02T10:00:00+00:00")
      )
    ).toBe(true);
  });

  test("should return true if opening times are available", () => {
    const openingHours: OpeningTimesType[] = [
      {
        startTime: "2022-02-02T10:00:00+00:00",
        endTime: "2022-02-02T12:00:00+00:00",
        isReservable: true,
      },
    ];

    expect(
      areOpeningTimesAvailable(
        openingHours,
        new Date("2022-02-02T12:00:00+00:00")
      )
    ).toBe(false);
  });

  test("should return true if opening times are available", () => {
    const openingHours: OpeningTimesType[] = [
      {
        startTime: "2022-02-02T10:00:00+00:00",
        endTime: "2022-02-02T12:00:00+00:00",
        isReservable: true,
      },
    ];

    expect(
      areOpeningTimesAvailable(
        openingHours,
        new Date("2022-02-02T12:00:00+00:00"),
        true
      )
    ).toBe(true);
  });

  test("should work for multiday ", () => {
    const openingHours: OpeningTimesType[] = [
      {
        startTime: "2022-02-02T20:00:00+00:00",
        endTime: "2022-02-02T22:00:00+00:00",
        isReservable: true,
      },
      {
        startTime: "2022-02-03T07:00:00+00:00",
        endTime: "2022-02-03T22:00:00+00:00",
        isReservable: true,
      },
    ];

    expect(
      areOpeningTimesAvailable(
        openingHours,
        new Date("2022-02-02T22:00:00+00:00"),
        true
      )
    ).toBe(true);

    expect(
      areOpeningTimesAvailable(
        openingHours,
        new Date("2022-02-02T22:30:00+00:00"),
        true
      )
    ).toBe(false);

    expect(
      areOpeningTimesAvailable(
        openingHours,
        new Date("2022-02-03T06:30:00+00:00"),
        true
      )
    ).toBe(false);

    expect(
      areOpeningTimesAvailable(
        openingHours,
        new Date("2022-02-03T07:00:00+00:00"),
        true
      )
    ).toBe(true);
  });
});
