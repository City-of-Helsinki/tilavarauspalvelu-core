import { addDays, format, addMinutes } from "date-fns";
import {
  areSlotsReservable,
  doBuffersCollide,
  doesBufferCollide,
  doReservationsCollide,
  getAvailableTimes,
  getBufferedEventTimes,
  getDayIntervals,
  getEventBuffers,
  getNormalizedReservationBeginTime,
  getOpenDays,
  getTimeslots,
  isReservationLongEnough,
  isReservationShortEnough,
  isReservationStartInFuture,
  isReservationUnitReservable,
  isSlotWithinReservationTime,
  isSlotWithinTimeframe,
  isStartTimeWithinInterval,
} from "../util";
import {
  OpeningHoursType,
  ReservationType,
  ReservationUnitByPkType,
  ReservationUnitsReservationUnitReservationStartIntervalChoices,
  ReservationUnitType,
} from "../../../types/gql-types";
import { ApplicationRound } from "../../../types/common";

jest.mock("next/config", () => () => ({
  serverRuntimeConfig: {},
  publicRuntimeConfig: {},
}));

test("isReservationShortEnough", () => {
  expect(
    isReservationShortEnough(
      new Date(2021, 11, 10, 12, 0, 0),
      new Date(2021, 11, 10, 12, 30, 0),
      5400
    )
  ).toBe(true);
  expect(
    isReservationShortEnough(
      new Date(2021, 11, 10, 12, 0, 0),
      new Date(2021, 11, 10, 13, 30, 0),
      5400
    )
  ).toBe(true);
  expect(
    isReservationShortEnough(
      new Date(2021, 11, 10, 12, 0, 0),
      new Date(2021, 11, 10, 13, 31, 0),
      5400
    )
  ).toBe(false);
});

test("isReservationLongEnough", () => {
  expect(
    isReservationLongEnough(
      new Date(2021, 11, 10, 12, 0, 0),
      new Date(2021, 11, 10, 12, 30, 0),
      5400
    )
  ).toBe(false);
  expect(
    isReservationLongEnough(
      new Date(2021, 11, 10, 12, 0, 0),
      new Date(2021, 11, 10, 13, 30, 0),
      5400
    )
  ).toBe(true);
  expect(
    isReservationLongEnough(
      new Date(2021, 11, 10, 12, 0, 0),
      new Date(2021, 11, 10, 13, 31, 0),
      5400
    )
  ).toBe(true);
});

test("isSlotWithinTimeframe", () => {
  expect(isSlotWithinTimeframe(new Date(2021, 9, 9))).toBe(false);
  expect(isSlotWithinTimeframe(new Date())).toBe(false);
  expect(isSlotWithinTimeframe(new Date(), -1)).toBe(true);
});

describe("areSlotsReservable", () => {
  const tzOffset = new Date().getTimezoneOffset() / 60;
  const tzOffsetHoursStr = Math.abs(tzOffset).toString().padStart(2, "0");

  const openingTimes = [
    {
      date: format(addDays(new Date(), 7), "yyyy-MM-dd"),
      endTime: `21:00:00+${tzOffsetHoursStr}:00`,
      periods: null,
      startTime: `09:00:00+${tzOffsetHoursStr}:00`,
      state: "open",
    },
    {
      date: format(addDays(new Date(), 8), "yyyy-MM-dd"),
      endTime: `21:00:00+${tzOffsetHoursStr}:00`,
      periods: null,
      startTime: `09:00:00+${tzOffsetHoursStr}:00`,
      state: "open",
    },
  ];

  const activeApplicationRounds = [
    {
      reservationPeriodBegin: format(addDays(new Date(), 8), "yyyy-MM-dd"),
      reservationPeriodEnd: format(addDays(new Date(), 8), "yyyy-MM-dd"),
    },
  ] as ApplicationRound[];

  test("Plus 7 days 09:00", () => {
    const hours = 11 + tzOffset;
    expect(
      areSlotsReservable(
        [addDays(new Date().setUTCHours(hours), 7)],
        openingTimes,
        []
      )
    ).toBe(true);
  });

  test("Plus 7 days 10:00", () => {
    const hours = 12 + tzOffset;
    expect(
      areSlotsReservable(
        [addDays(new Date().setUTCHours(hours), 7)],
        openingTimes,
        []
      )
    ).toBe(true);
  });

  test("Plus 8 days 11:00", () => {
    const hours = 13 + tzOffset;
    expect(
      areSlotsReservable(
        [addDays(new Date().setUTCHours(hours), 8)],
        openingTimes,
        []
      )
    ).toBe(true);
  });

  test("Plus 8 days 09:00", () => {
    const hours = 11 + tzOffset;
    expect(
      areSlotsReservable(
        [addDays(new Date().setUTCHours(hours), 8)],
        openingTimes,
        activeApplicationRounds
      )
    ).toBe(false);
  });

  test("Plus 10 days", () => {
    expect(
      areSlotsReservable([addDays(new Date(), 10)], openingTimes, [])
    ).toBe(false);
  });

  test("Buffer days", () => {
    const hours = 11 + tzOffset;
    expect(
      areSlotsReservable(
        [addDays(new Date().setUTCHours(hours), 7)],
        openingTimes,
        [],
        undefined,
        undefined,
        7
      )
    ).toBe(true);
    expect(
      areSlotsReservable(
        [addDays(new Date().setUTCHours(hours), 7)],
        openingTimes,
        [],
        addDays(new Date(), 8),
        undefined,
        7
      )
    ).toBe(false);
    expect(
      areSlotsReservable(
        [addDays(new Date().setUTCHours(hours), 7)],
        openingTimes,
        [],
        undefined,
        addDays(new Date(), 6),
        7
      )
    ).toBe(false);

    expect(
      areSlotsReservable(
        [addDays(new Date().setUTCHours(hours), 7)],
        openingTimes,
        [],
        undefined,
        undefined,
        8
      )
    ).toBe(false);
  });
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
      "12:00:00",
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
      "21:00:00",
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
  const timeZoneHours = Math.abs(new Date().getTimezoneOffset() / 60)
    .toString()
    .padStart(2, "0");

  const openingTimes = [
    {
      date: "2019-09-21",
      startTime: `06:00:00+${timeZoneHours}:00`,
      endTime: `18:00:00+${timeZoneHours}:00`,
      state: "open",
      periods: [38600],
    },
    {
      date: "2019-09-22",
      startTime: `06:00:00+${timeZoneHours}:00`,
      endTime: `18:00:00+${timeZoneHours}:00`,
      state: "open",
      periods: [38600],
    },
    {
      date: "2019-09-28",
      startTime: `06:00:00+${timeZoneHours}:00`,
      endTime: `18:00:00+${timeZoneHours}:00`,
      state: "open",
      periods: [38600],
    },
  ];

  test("returns sane results", () => {
    expect(
      isStartTimeWithinInterval(
        new Date(`2019-09-22T12:15:00+${timeZoneHours}:00`),
        openingTimes,
        "INTERVAL_15_MINS" as ReservationUnitsReservationUnitReservationStartIntervalChoices
      )
    ).toBe(true);
  });

  test("returns sane results", () => {
    expect(
      isStartTimeWithinInterval(
        new Date(`2019-09-22T12:10:00+${timeZoneHours}:00`),
        openingTimes,
        "INTERVAL_15_MINS" as ReservationUnitsReservationUnitReservationStartIntervalChoices
      )
    ).toBe(false);
  });

  test("returns sane results", () => {
    expect(
      isStartTimeWithinInterval(
        new Date(`2019-09-22T11:30:00+${timeZoneHours}:00`),
        openingTimes,
        "INTERVAL_90_MINS" as ReservationUnitsReservationUnitReservationStartIntervalChoices
      )
    ).toBe(false);
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

describe("getTimeslots", () => {
  test("returns 2 for 90min interval", () => {
    expect(
      getTimeslots(
        ReservationUnitsReservationUnitReservationStartIntervalChoices.Interval_90Mins
      )
    ).toBe(2);
  });

  test("returns 2 for all rest", () => {
    expect(
      getTimeslots(
        ReservationUnitsReservationUnitReservationStartIntervalChoices.Interval_15Mins
      )
    ).toBe(2);
    expect(
      getTimeslots(
        ReservationUnitsReservationUnitReservationStartIntervalChoices.Interval_30Mins
      )
    ).toBe(2);
    expect(
      getTimeslots(
        ReservationUnitsReservationUnitReservationStartIntervalChoices.Interval_60Mins
      )
    ).toBe(2);
    expect(
      getTimeslots(
        "foo" as ReservationUnitsReservationUnitReservationStartIntervalChoices
      )
    ).toBe(2);
    expect(
      getTimeslots(
        null as unknown as ReservationUnitsReservationUnitReservationStartIntervalChoices
      )
    ).toBe(2);
  });
});

describe("getBufferedEventTimes", () => {
  const start = new Date("2019-09-22T12:00:00+00:00");
  const end = new Date("2019-09-22T13:00:00+00:00");

  test("with a buffer", () => {
    expect(getBufferedEventTimes(start, end, 1800, 3600)).toEqual({
      start: new Date("2019-09-22T11:30:00+00:00"),
      end: new Date("2019-09-22T14:00:00+00:00"),
    });
    expect(getBufferedEventTimes(start, end, undefined, 3600)).toEqual({
      start: new Date("2019-09-22T12:00:00+00:00"),
      end: new Date("2019-09-22T14:00:00+00:00"),
    });
    expect(getBufferedEventTimes(start, end, 3600)).toEqual({
      start: new Date("2019-09-22T11:00:00+00:00"),
      end: new Date("2019-09-22T13:00:00+00:00"),
    });
  });

  test("without a buffer", () => {
    expect(getBufferedEventTimes(start, end, undefined, undefined)).toEqual({
      start,
      end,
    });

    expect(getBufferedEventTimes(start, end)).toEqual({
      start,
      end,
    });
  });
});

describe("doesBuffer(s)Collide", () => {
  const reservations = [
    {
      begin: new Date("2019-09-22T12:00:00+00:00"),
      end: new Date("2019-09-22T13:00:00+00:00"),
      bufferTimeBefore: 3600,
      bufferTimeAfter: 3600,
    },
    {
      begin: new Date("2019-09-22T16:00:00+00:00"),
      end: new Date("2019-09-22T17:00:00+00:00"),
      bufferTimeBefore: 3600,
      bufferTimeAfter: 3600,
    },
  ] as ReservationType[];
  test("detects collisions", () => {
    expect(
      doesBufferCollide(reservations[0], {
        start: new Date("2019-09-22T14:00:00+00:00"),
        end: new Date("2019-09-22T15:00:00+00:00"),
        bufferTimeBefore: 5400,
      })
    ).toBe(true);

    expect(
      doesBufferCollide(reservations[0], {
        start: new Date("2019-09-22T10:00:00+00:00"),
        end: new Date("2019-09-22T10:30:00+00:00"),
        bufferTimeAfter: 5400,
      })
    ).toBe(false);

    expect(
      doesBufferCollide(reservations[0], {
        start: new Date("2019-09-22T10:00:00+00:00"),
        end: new Date("2019-09-22T10:30:00+00:00"),
        bufferTimeAfter: 5460,
      })
    ).toBe(true);

    expect(
      doBuffersCollide(reservations, {
        start: new Date("2019-09-22T14:00:00+00:00"),
        end: new Date("2019-09-22T14:15:00+00:00"),
        bufferTimeBefore: 3600,
      })
    ).toBe(false);

    expect(
      doBuffersCollide(reservations, {
        start: new Date("2019-09-22T14:00:00+00:00"),
        end: new Date("2019-09-22T14:15:00+00:00"),
        bufferTimeBefore: 3660,
      })
    ).toBe(true);

    expect(
      doBuffersCollide(reservations, {
        start: new Date("2019-09-22T14:00:00+00:00"),
        end: new Date("2019-09-22T15:00:00+00:00"),
        bufferTimeBefore: 3600,
      })
    ).toBe(false);

    expect(
      doBuffersCollide(reservations, {
        start: new Date("2019-09-22T14:00:00+00:00"),
        end: new Date("2019-09-22T15:00:00+00:00"),
        bufferTimeBefore: 3600,
        bufferTimeAfter: 3660,
      })
    ).toBe(true);
  });
});

describe("getEventBuffers", () => {
  test("outputs correct buffers", () => {
    const events = [
      {
        id: "1234",
        begin: new Date("2019-09-22T12:00:00+00:00"),
        end: new Date("2019-09-22T13:00:00+00:00"),
        bufferTimeBefore: 3600,
        bufferTimeAfter: 5400,
      },
      {
        id: "3456",
        begin: new Date("2019-09-22T15:00:00+00:00"),
        end: new Date("2019-09-22T16:00:00+00:00"),
        bufferTimeBefore: null,
        bufferTimeAfter: 9000,
      },
    ] as ReservationType[];

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

describe("isReservationUnitReservable", () => {
  const openingHours = {
    openingTimes: [
      {
        date: new Date().toISOString(),
        startTime: "04:00:00+00:00",
        endTime: "20:00:00+00:00",
        state: "open",
        periods: null,
      },
    ],
  };
  test("returns true for a unit that is reservable", () => {
    expect(
      isReservationUnitReservable({
        minReservationDuration: 3600,
        maxReservationDuration: 3600,
        reservationBegins: addMinutes(new Date(), -10),
        openingHours,
      } as ReservationUnitByPkType)
    ).toBe(true);

    expect(
      isReservationUnitReservable({
        minReservationDuration: 3600,
        maxReservationDuration: 3600,
        reservationEnds: addMinutes(new Date(), 10),
        openingHours,
      } as ReservationUnitByPkType)
    ).toBe(true);

    expect(
      isReservationUnitReservable({
        minReservationDuration: 3600,
        maxReservationDuration: 3600,
        reservationBegins: addMinutes(new Date(), -10),
        reservationEnds: addMinutes(new Date(), 10),
        openingHours,
      } as ReservationUnitByPkType)
    ).toBe(true);

    expect(
      isReservationUnitReservable({
        minReservationDuration: 3600,
        maxReservationDuration: 3600,
        openingHours,
      } as ReservationUnitByPkType)
    ).toBe(true);
  });

  test("returns false for a unit that is not reservable", () => {
    expect(
      isReservationUnitReservable({
        minReservationDuration: 3600,
        maxReservationDuration: 3600,
      } as ReservationUnitByPkType)
    ).toBe(false);

    expect(
      isReservationUnitReservable({
        reservationBegins: addMinutes(new Date(), 10),
      } as ReservationUnitByPkType)
    ).toBe(false);

    expect(
      isReservationUnitReservable({
        reservationEnds: addMinutes(new Date(), -10),
      } as ReservationUnitByPkType)
    ).toBe(false);

    expect(
      isReservationUnitReservable({
        reservationBegins: addMinutes(new Date(), -10),
        reservationEnds: addMinutes(new Date(), -1),
      } as ReservationUnitByPkType)
    ).toBe(false);
  });

  test("returns correct value with buffer days", () => {
    expect(
      isReservationUnitReservable({
        minReservationDuration: 3600,
        maxReservationDuration: 3600,
        reservationBegins: addDays(new Date(), 5),
        reservationsMaxDaysBefore: 5,
        openingHours,
      } as ReservationUnitByPkType)
    ).toBe(true);

    expect(
      isReservationUnitReservable({
        reservationBegins: addDays(new Date(), 5),
        reservationsMaxDaysBefore: 4,
      } as ReservationUnitByPkType)
    ).toBe(false);
  });
});

describe("isReservationStartInFuture", () => {
  test("returns true for a reservation that starts in the future", () => {
    expect(
      isReservationStartInFuture({
        reservationBegins: addMinutes(new Date(), 10),
      } as ReservationUnitType)
    ).toBe(true);
  });

  test("returns false for a reservation that starts in the past", () => {
    expect(
      isReservationStartInFuture({
        reservationBegins: addMinutes(new Date(), -10),
      } as ReservationUnitType)
    ).toBe(false);

    expect(
      isReservationStartInFuture({
        reservationBegins: new Date(),
      } as ReservationUnitType)
    ).toBe(false);

    expect(isReservationStartInFuture({} as ReservationUnitType)).toBe(false);
  });

  test("returns correct value with buffer days", () => {
    expect(
      isReservationStartInFuture({
        reservationBegins: addDays(new Date(), 10),
        reservationsMaxDaysBefore: 9,
      } as ReservationUnitType)
    ).toBe(true);

    expect(
      isReservationStartInFuture({
        reservationBegins: addDays(new Date(), 10),
        reservationsMaxDaysBefore: 10,
      } as ReservationUnitType)
    ).toBe(false);
  });
});

describe("isSlotWithinReservationTime", () => {
  test("with no reservation times", () => {
    expect(
      isSlotWithinReservationTime(
        new Date("2019-09-22T12:00:00+00:00"),
        undefined,
        undefined
      )
    ).toBe(true);
  });

  test("with begin time", () => {
    expect(
      isSlotWithinReservationTime(
        new Date("2019-09-22T12:00:00+00:00"),
        new Date("2019-08-22T12:00:00+00:00"),
        undefined
      )
    ).toBe(true);

    expect(
      isSlotWithinReservationTime(
        new Date("2019-09-22T12:00:00+00:00"),
        new Date("2019-09-23T12:00:00+00:00"),
        undefined
      )
    ).toBe(false);
  });

  test("with end time", () => {
    expect(
      isSlotWithinReservationTime(
        new Date("2019-09-22T12:00:00+00:00"),
        undefined,
        new Date("2019-08-22T12:00:00+00:00")
      )
    ).toBe(false);

    expect(
      isSlotWithinReservationTime(
        new Date("2019-09-22T12:00:00+00:00"),
        undefined,
        new Date("2019-09-23T13:00:00+00:00")
      )
    ).toBe(true);
  });

  test("with both times", () => {
    expect(
      isSlotWithinReservationTime(
        new Date("2019-09-22T12:00:00+00:00"),
        new Date("2019-09-22T12:00:00+00:00"),
        new Date("2019-09-22T12:00:00+00:00")
      )
    ).toBe(false);

    expect(
      isSlotWithinReservationTime(
        new Date("2019-09-22T12:00:00+00:00"),
        new Date("2019-08-22T12:00:00+00:00"),
        new Date("2019-09-22T12:00:00+00:00")
      )
    ).toBe(false);

    expect(
      isSlotWithinReservationTime(
        new Date("2019-09-22T12:00:00+00:00"),
        new Date("2019-08-22T12:00:00+00:00"),
        new Date("2019-10-22T12:00:00+00:00")
      )
    ).toBe(true);
  });
});

describe("getNormalizedReservationBeginTime", () => {
  test("get correct time", () => {
    expect(
      getNormalizedReservationBeginTime({
        reservationBegins: "2019-09-22T12:00:00+00:00",
      } as ReservationUnitType)
    ).toEqual("2019-09-22T12:00:00.000Z");

    expect(
      getNormalizedReservationBeginTime({
        reservationBegins: "2019-09-22T12:00:00+00:00",
        reservationsMaxDaysBefore: 10,
      } as ReservationUnitType)
    ).toEqual("2019-09-12T12:00:00.000Z");
  });
});

describe("getAvailableTimes", () => {
  test("get correct times", () => {
    const openingHours: OpeningHoursType = {
      openingTimePeriods: [],
      openingTimes: [
        {
          date: "2022-09-14",
          startTime: "04:00:00+00:00",
          endTime: "20:00:00+00:00",
          state: "open",
          periods: null,
        },
      ],
    };

    expect(
      getAvailableTimes(
        {
          openingHours,
          reservationStartInterval: "INTERVAL_90_MINS",
        } as ReservationUnitByPkType,
        new Date("2022-09-14T00:00:00+00:00")
      )
    ).toEqual([
      "04:00",
      "05:30",
      "07:00",
      "08:30",
      "10:00",
      "11:30",
      "13:00",
      "14:30",
      "16:00",
      "17:30",
      "19:00",
    ]);
  });

  test("get correct times", () => {
    const openingHours: OpeningHoursType = {
      openingTimePeriods: [],
      openingTimes: [
        {
          date: "2022-09-14",
          startTime: "04:00:00+00:00",
          endTime: "06:00:00+00:00",
          state: "open",
          periods: null,
        },
      ],
    };

    expect(
      getAvailableTimes(
        {
          openingHours,
          reservationStartInterval: "INTERVAL_15_MINS",
        } as ReservationUnitByPkType,
        new Date("2022-09-14T00:00:00+00:00")
      )
    ).toEqual([
      "04:00",
      "04:15",
      "04:30",
      "04:45",
      "05:00",
      "05:15",
      "05:30",
      "05:45",
      "06:00",
    ]);
  });
});

describe("getOpenDays", () => {
  test("correct output", () => {
    const openingHours: OpeningHoursType = {
      openingTimePeriods: [],
      openingTimes: [
        {
          date: "2022-09-14",
          startTime: "04:00:00+00:00",
          endTime: "06:00:00+00:00",
          state: "open",
          periods: null,
        },
        {
          date: "2022-08-14",
          startTime: "04:00:00+00:00",
          endTime: "06:00:00+00:00",
          state: "open",
          periods: null,
        },
        {
          date: "2022-08-13",
          startTime: "04:00:00+00:00",
          endTime: "06:00:00+00:00",
          state: "open",
          periods: null,
        },
        {
          date: "2022-08-12",
          startTime: "04:00:00+00:00",
          endTime: "06:00:00+00:00",
          state: "open",
          periods: null,
        },
        {
          date: "2022-08-10",
          startTime: "04:00:00+00:00",
          endTime: "06:00:00+00:00",
          state: "open",
          periods: null,
        },
      ],
    };

    expect(getOpenDays({ openingHours } as ReservationUnitByPkType)).toEqual([
      new Date("2022-08-10T00:00:00.000Z"),
      new Date("2022-08-12T00:00:00.000Z"),
      new Date("2022-08-13T00:00:00.000Z"),
      new Date("2022-08-14T00:00:00.000Z"),
      new Date("2022-09-14T00:00:00.000Z"),
    ]);
  });
});
