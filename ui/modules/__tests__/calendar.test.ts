import { addDays, format } from "date-fns";
import {
  areSlotsReservable,
  doReservationsCollide,
  getDayIntervals,
  isReservationLongEnough,
  isReservationShortEnough,
  isSlotWithinTimeframe,
  isStartTimeWithinInterval,
} from "../calendar";
import {
  ReservationType,
  ReservationUnitsReservationUnitReservationStartIntervalChoices,
} from "../gql-types";
import { ApplicationRound } from "../types";

jest.mock("next/config", () => () => ({
  serverRuntimeConfig: {},
  publicRuntimeConfig: {},
}));

test("isReservationShortEnough", () => {
  expect(
    isReservationShortEnough(
      new Date(2021, 11, 10, 12, 0, 0),
      new Date(2021, 11, 10, 12, 30, 0),
      "1:30:00"
    )
  ).toBe(true);
  expect(
    isReservationShortEnough(
      new Date(2021, 11, 10, 12, 0, 0),
      new Date(2021, 11, 10, 13, 30, 0),
      "1:30:00"
    )
  ).toBe(true);
  expect(
    isReservationShortEnough(
      new Date(2021, 11, 10, 12, 0, 0),
      new Date(2021, 11, 10, 13, 31, 0),
      "1:30:00"
    )
  ).toBe(false);
});

test("isReservationLongEnough", () => {
  expect(
    isReservationLongEnough(
      new Date(2021, 11, 10, 12, 0, 0),
      new Date(2021, 11, 10, 12, 30, 0),
      "1:30:00"
    )
  ).toBe(false);
  expect(
    isReservationLongEnough(
      new Date(2021, 11, 10, 12, 0, 0),
      new Date(2021, 11, 10, 13, 30, 0),
      "1:30:00"
    )
  ).toBe(true);
  expect(
    isReservationLongEnough(
      new Date(2021, 11, 10, 12, 0, 0),
      new Date(2021, 11, 10, 13, 31, 0),
      "1:30:00"
    )
  ).toBe(true);
});

test("isSlotWithinTimeframe", () => {
  expect(isSlotWithinTimeframe(new Date(2021, 9, 9))).toBe(false);
  expect(isSlotWithinTimeframe(new Date())).toBe(false);
  expect(isSlotWithinTimeframe(new Date(), -1)).toBe(true);
});

test("areSlotsReservable", () => {
  const openingTimes = [
    {
      date: format(addDays(new Date(), 7), "yyyy-MM-dd"),
      endTime: "21:00:00",
      periods: null,
      startTime: "09:00:00",
      state: "open",
    },
    {
      date: format(addDays(new Date(), 8), "yyyy-MM-dd"),
      endTime: "21:00:00",
      periods: null,
      startTime: "09:00:00",
      state: "open",
    },
  ];

  const activeApplicationRounds = [
    {
      reservationPeriodBegin: format(addDays(new Date(), 8), "yyyy-MM-dd"),
      reservationPeriodEnd: format(addDays(new Date(), 8), "yyyy-MM-dd"),
    },
  ] as ApplicationRound[];

  expect(areSlotsReservable([addDays(new Date(), 6)], openingTimes, [])).toBe(
    false
  );
  expect(
    areSlotsReservable([addDays(new Date().setHours(6), 7)], openingTimes, [])
  ).toBe(false);
  expect(
    areSlotsReservable([addDays(new Date().setHours(9), 7)], openingTimes, [])
  ).toBe(true);
  expect(
    areSlotsReservable([addDays(new Date().setHours(9), 8)], openingTimes, [])
  ).toBe(true);
  expect(
    areSlotsReservable(
      [addDays(new Date().setHours(9), 8)],
      openingTimes,
      activeApplicationRounds
    )
  ).toBe(false);
  expect(areSlotsReservable([addDays(new Date(), 10)], openingTimes, [])).toBe(
    false
  );
});

test("doReservationsCollide", () => {
  const reservations = [
    {
      begin: "2021-10-31T09:30:00+00:00",
      end: "2021-10-31T10:30:00+00:00",
    },
  ] as ReservationType[];

  expect(
    doReservationsCollide(reservations, {
      start: new Date("2021-10-31T09:00:00+00:00"),
      end: new Date("2021-10-31T09:30:00+00:00"),
    })
  ).toBe(false);
  expect(
    doReservationsCollide(reservations, {
      start: new Date("2021-10-31T09:00:00+00:00"),
      end: new Date("2021-10-31T09:31:00+00:00"),
    })
  ).toBe(true);
  expect(
    doReservationsCollide(reservations, {
      start: new Date("2021-10-31T10:30:00+00:00"),
      end: new Date("2021-10-31T11:30:00+00:00"),
    })
  ).toBe(false);
  expect(
    doReservationsCollide(reservations, {
      start: new Date("2021-10-31T10:30:00+00:00"),
      end: new Date("2021-10-31T11:30:00+00:00"),
    })
  ).toBe(false);
});

describe("getDayIntervals", () => {
  test("outputs sane results with 15min interval ", () => {
    const result = getDayIntervals(
      "09:00:00",
      "12:00:00",
      "INTERVAL_15_MINS" as ReservationUnitsReservationUnitReservationStartIntervalChoices
    );

    expect(result).toEqual([
      "09:00:00",
      "09:15:00",
      "09:30:00",
      "09:45:00",
      "10:00:00",
      "10:15:00",
      "10:30:00",
      "10:45:00",
      "11:00:00",
      "11:15:00",
      "11:30:00",
      "11:45:00",
    ]);
  });
  test("outputs sane results with 90min interval", () => {
    const result = getDayIntervals(
      "09:00:00",
      "21:00:00",
      "INTERVAL_90_MINS" as ReservationUnitsReservationUnitReservationStartIntervalChoices
    );

    expect(result).toEqual([
      "09:00:00",
      "10:30:00",
      "12:00:00",
      "13:30:00",
      "15:00:00",
      "16:30:00",
      "18:00:00",
      "19:30:00",
    ]);
  });

  test("outputs empty result", () => {
    const result = getDayIntervals(
      "09:00:00",
      "09:00:00",
      "INTERVAL_15_MINS" as ReservationUnitsReservationUnitReservationStartIntervalChoices
    );

    expect(result).toEqual([]);
  });

  test("outputs empty result", () => {
    const result = getDayIntervals(
      "09:00:00",
      "21:00:00",
      "INVALID_INTERVAL" as ReservationUnitsReservationUnitReservationStartIntervalChoices
    );

    expect(result).toEqual([]);
  });
});

describe("isStartTimeWithinInterval", () => {
  const openingTimes = [
    {
      date: "2019-09-21",
      startTime: "06:00:00+00:00",
      endTime: "18:00:00+00:00",
      state: "open",
      periods: [38600],
    },
    {
      date: "2019-09-22",
      startTime: "06:00:00+00:00",
      endTime: "18:00:00+00:00",
      state: "open",
      periods: [38600],
    },
    {
      date: "2019-09-28",
      startTime: "06:00:00+00:00",
      endTime: "18:00:00+00:00",
      state: "open",
      periods: [38600],
    },
  ];

  test("returns sane results", () => {
    expect(
      isStartTimeWithinInterval(
        new Date("2019-09-22T12:15:00+00:00"),
        openingTimes,
        "INTERVAL_15_MINS" as ReservationUnitsReservationUnitReservationStartIntervalChoices
      )
    ).toBe(true);
  });

  test("returns sane results", () => {
    expect(
      isStartTimeWithinInterval(
        new Date("2019-09-22T12:10:00+00:00"),
        openingTimes,
        "INTERVAL_15_MINS" as ReservationUnitsReservationUnitReservationStartIntervalChoices
      )
    ).toBe(false);
  });

  test("returns sane results", () => {
    expect(
      isStartTimeWithinInterval(
        new Date("2019-09-22T13:30:00+00:00"),
        openingTimes,
        "INTERVAL_90_MINS" as ReservationUnitsReservationUnitReservationStartIntervalChoices
      )
    ).toBe(true);
  });

  test("returns true without interval", () => {
    expect(isStartTimeWithinInterval(new Date(), openingTimes)).toBe(true);
  });

  test("returns false without opening times", () => {
    expect(
      isStartTimeWithinInterval(
        new Date(),
        [],
        "INTERVAL_15_MINS" as ReservationUnitsReservationUnitReservationStartIntervalChoices
      )
    ).toBe(false);
  });
});
