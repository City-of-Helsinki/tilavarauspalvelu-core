// @ts-nocheck
import { addDays, format, addMinutes } from "date-fns";
import { getEventBuffers, } from "../util";
import {
  ReservableTimeSpanType,
  ReservationNode,
  ReservationStartInterval,
  ReservationUnitNode,
  Authentication,
  ReservationKind,
  ReservationState,
} from "../../../gql/gql-types";

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

describe("areSlotsReservable", () => {
  const tzOffset = new Date().getTimezoneOffset() / 60;
  const tzOffsetHoursStr = Math.abs(tzOffset).toString().padStart(2, "0");

  const date1 = format(addDays(new Date(), 7), "yyyy-MM-dd");
  const date2 = format(addDays(new Date(), 8), "yyyy-MM-dd");

  const reservableTimeSpans = [
    {
      startDatetime: `${date1}T09:00:00+${tzOffsetHoursStr}:00`,
      endDatetime: `${date1}T21:00:00+${tzOffsetHoursStr}:00`,
    },
    {
      startDatetime: `${date2}T09:00:00+${tzOffsetHoursStr}:00`,
      endDatetime: `${date2}T21:00:00+${tzOffsetHoursStr}:00`,
    },
  ];

  const activeApplicationRounds = [
    {
      reservationPeriodBegin: format(addDays(new Date(), 8), "yyyy-MM-dd"),
      reservationPeriodEnd: format(addDays(new Date(), 8), "yyyy-MM-dd"),
    },
  ];

  test("Plus 7 days 09:00", () => {
    const hours = 11 + tzOffset;
    expect(
      areSlotsReservable(
        [addDays(new Date().setUTCHours(hours), 7)],
        reservableTimeSpans,
        undefined,
        undefined,
        undefined,
        []
      )
    ).toBe(true);
  });

  test("Plus 7 days 10:00", () => {
    const hours = 12 + tzOffset;
    expect(
      areSlotsReservable(
        [addDays(new Date().setUTCHours(hours), 7)],
        reservableTimeSpans,
        undefined,
        undefined,
        undefined,
        []
      )
    ).toBe(true);
  });

  test("Plus 8 days 11:00", () => {
    const hours = 13 + tzOffset;
    expect(
      areSlotsReservable(
        [addDays(new Date().setUTCHours(hours), 8)],
        reservableTimeSpans,
        undefined,
        undefined,
        undefined,
        []
      )
    ).toBe(true);
  });

  test("Plus 8 days 09:00", () => {
    const hours = 11 + tzOffset;
    expect(
      areSlotsReservable(
        [addDays(new Date().setUTCHours(hours), 8)],
        reservableTimeSpans,
        undefined,
        undefined,
        undefined,
        activeApplicationRounds
      )
    ).toBe(false);
  });

  test("Plus 10 days", () => {
    expect(
      areSlotsReservable(
        [addDays(new Date(), 10)],
        reservableTimeSpans,
        undefined,
        undefined,
        undefined,
        []
      )
    ).toBe(false);
  });

  test("Buffer days", () => {
    const hours = 11 + tzOffset;
    expect(
      areSlotsReservable(
        [addDays(new Date().setUTCHours(hours), 7)],
        reservableTimeSpans,
        undefined,
        undefined,
        7,
        []
      )
    ).toBe(true);

    expect(
      areSlotsReservable(
        [addDays(new Date().setUTCHours(hours), 7)],
        reservableTimeSpans,
        addDays(new Date(), 8),
        undefined,
        7,
        []
      )
    ).toBe(false);
    expect(
      areSlotsReservable(
        [addDays(new Date().setUTCHours(hours), 7)],
        reservableTimeSpans,
        undefined,
        addDays(new Date(), 6),
        7,
        []
      )
    ).toBe(false);

    expect(
      areSlotsReservable(
        [addDays(new Date().setUTCHours(hours), 7)],
        reservableTimeSpans,
        undefined,
        undefined,
        8,
        []
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
  ] as ReservationNode[];

  expect(
    doReservationsCollide(
      {
        start: new Date("2021-10-31T09:00:00+00:00"),
        end: new Date("2021-10-31T09:30:00+00:00"),
      },
      reservations
    )
  ).toBe(false);
  expect(
    doReservationsCollide(
      {
        start: new Date("2021-10-31T09:00:00+00:00"),
        end: new Date("2021-10-31T09:31:00+00:00"),
      },
      reservations
    )
  ).toBe(true);
  expect(
    doReservationsCollide(
      {
        start: new Date("2021-10-31T10:30:00+00:00"),
        end: new Date("2021-10-31T11:30:00+00:00"),
      },
      reservations
    )
  ).toBe(false);
  expect(
    doReservationsCollide(
      {
        start: new Date("2021-10-31T10:30:00+00:00"),
        end: new Date("2021-10-31T11:30:00+00:00"),
      },
      reservations
    )
  ).toBe(false);
});

describe("isStartTimeWithinInterval", () => {
  const timeZoneHours = Math.abs(
    new Date("2019-09-21").getTimezoneOffset() / 60
  )
    .toString()
    .padStart(2, "0");

  const reservableTimeSpans = [
    {
      startDatetime: `2019-09-21T06:00:00+${timeZoneHours}:00`,
      endDatetime: `2019-09-21T18:00:00+${timeZoneHours}:00`,
    },
    {
      startDatetime: `2019-09-22T06:00:00+${timeZoneHours}:00`,
      endDatetime: `2019-09-22T18:00:00+${timeZoneHours}:00`,
    },
    {
      date: "2019-09-28",
      startDatetime: `2019-09-28T06:00:00+${timeZoneHours}:00`,
      endDatetime: `2019-09-28T18:00:00+${timeZoneHours}:00`,
    },
  ];

  test("returns sane results", () => {
    expect(
      isStartTimeWithinInterval(
        new Date(`2019-09-22T12:15:00+${timeZoneHours}:00`),
        reservableTimeSpans,
        ReservationStartInterval.Interval_15Mins
      )
    ).toBe(true);

    expect(
      isStartTimeWithinInterval(
        new Date(`2019-09-22T12:15:00+${timeZoneHours}:00`),
        reservableTimeSpans,
        ReservationStartInterval.Interval_15Mins
      )
    ).toBe(true);

    expect(
      isStartTimeWithinInterval(
        new Date(`2019-09-24T12:15:00+${timeZoneHours}:00`),
        reservableTimeSpans,
        ReservationStartInterval.Interval_15Mins
      )
    ).toBe(false);
  });

  test("returns sane results", () => {
    expect(
      isStartTimeWithinInterval(
        new Date(`2019-09-22T12:10:00+${timeZoneHours}:00`),
        reservableTimeSpans,
        ReservationStartInterval.Interval_15Mins
      )
    ).toBe(false);
  });

  test("returns sane results", () => {
    const tz = Math.abs(
      new Date(`2019-09-22T11:30:00+${timeZoneHours}:00`).getTimezoneOffset() /
        60
    )
      .toString()
      .padStart(2, "0");

    expect(
      isStartTimeWithinInterval(
        new Date(`2019-09-22T11:30:00+${tz}:00`),
        reservableTimeSpans,
        ReservationStartInterval.Interval_90Mins
      )
    ).toBe(false);
  });

  test("returns true without interval", () => {
    expect(isStartTimeWithinInterval(new Date(), reservableTimeSpans)).toBe(
      true
    );
  });

  test("returns false without reservable times", () => {
    expect(
      isStartTimeWithinInterval(
        new Date(),
        [],
        ReservationStartInterval.Interval_15Mins
      )
    ).toBe(false);
  });

  test("with multiple slots in one day", () => {
    reservableTimeSpans.push({
      startDatetme: `2019-09-28T19:15:00+${timeZoneHours}:00`,
      endDatetime: `2019-09-28T21:00:00+${timeZoneHours}:00`,
    });

    expect(
      isStartTimeWithinInterval(
        new Date(`2019-09-28T11:00:00+${timeZoneHours}:00`),
        reservableTimeSpans,
        ReservationStartInterval.Interval_60Mins
      )
    ).toBe(true);

    expect(
      isStartTimeWithinInterval(
        new Date(`2019-09-28T19:20:00+${timeZoneHours}:00`),
        reservableTimeSpans,
        ReservationStartInterval.Interval_15Mins
      )
    ).toBe(false);

    expect(
      isStartTimeWithinInterval(
        new Date(`2019-09-28T19:15:00+${timeZoneHours}:00`),
        reservableTimeSpans,
        ReservationStartInterval.Interval_15Mins
      )
    ).toBe(true);

    expect(
      isStartTimeWithinInterval(
        new Date(`2019-09-28T21:00:00+${timeZoneHours}:00`),
        reservableTimeSpans,
        ReservationStartInterval.Interval_15Mins
      )
    ).toBe(false);
  });
});

describe("getTimeslots", () => {
  test("returns 2 for 90min interval", () => {
    expect(getTimeslots(ReservationStartInterval.Interval_90Mins)).toBe(2);
  });

  test("returns 2 for all rest", () => {
    expect(getTimeslots(ReservationStartInterval.Interval_15Mins)).toBe(2);
    expect(getTimeslots(ReservationStartInterval.Interval_30Mins)).toBe(2);
    expect(getTimeslots(ReservationStartInterval.Interval_60Mins)).toBe(2);
    expect(getTimeslots("foo" as ReservationStartInterval)).toBe(2);
    expect(getTimeslots(null as unknown as ReservationStartInterval)).toBe(2);
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
      id: "1111",
      begin: new Date("2019-09-22T12:00:00+00:00").toString(),
      end: new Date("2019-09-22T13:00:00+00:00").toString(),
      bufferTimeBefore: 3600,
      bufferTimeAfter: 3600,
    },
    {
      id: "2222",
      begin: new Date("2019-09-22T16:00:00+00:00").toString(),
      end: new Date("2019-09-22T17:00:00+00:00").toString(),
      bufferTimeBefore: 3600,
      bufferTimeAfter: 3600,
    },
  ] as ReservationNode[];

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
      doBuffersCollide(
        {
          start: new Date("2019-09-22T14:00:00+00:00"),
          end: new Date("2019-09-22T14:15:00+00:00"),
          bufferTimeBefore: 3600,
        },
        reservations
      )
    ).toBe(false);

    expect(
      doBuffersCollide(
        {
          start: new Date("2019-09-22T14:00:00+00:00"),
          end: new Date("2019-09-22T14:15:00+00:00"),
          bufferTimeBefore: 3660,
        },
        reservations
      )
    ).toBe(true);

    expect(
      doBuffersCollide(
        {
          start: new Date("2019-09-22T14:00:00+00:00"),
          end: new Date("2019-09-22T15:00:00+00:00"),
          bufferTimeBefore: 3600,
        },
        reservations
      )
    ).toBe(false);

    expect(
      doBuffersCollide(
        {
          start: new Date("2019-09-22T14:00:00+00:00"),
          end: new Date("2019-09-22T15:00:00+00:00"),
          bufferTimeBefore: 3600,
          bufferTimeAfter: 3660,
        },
        reservations
      )
    ).toBe(true);

    expect(
      doBuffersCollide(
        {
          start: new Date("2019-09-22T13:00:00+00:00"),
          end: new Date("2019-09-22T15:00:00+00:00"),
          bufferTimeBefore: 3600,
          bufferTimeAfter: 3660,
          isBlocked: true,
        },
        reservations
      )
    ).toBe(false);

    expect(
      doBuffersCollide(
        {
          start: new Date("2019-09-22T11:00:00+00:00"),
          end: new Date("2019-09-22T12:00:00+00:00"),
          bufferTimeBefore: 3600,
          bufferTimeAfter: 3660,
          isBlocked: true,
        },
        reservations
      )
    ).toBe(false);
  });
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

describe("isReservationUnitReservable", () => {
  const date = new Date().toISOString().split("T")[0];
  const reservationUnit: ReservationUnitNode = {
    id: "1234",
    allowReservationsWithoutOpeningHours: false,
    authentication: Authentication.Strong,
    canApplyFreeOfCharge: false,
    contactInformation: "",
    isArchived: false,
    isDraft: false,
    requireIntroduction: false,
    requireReservationHandling: false,
    ReservationKind: ReservationKind.Direct,
    reservationStartInterval: ReservationStartInterval.Interval_15Mins,
    uuid: "1234",
    images: [],
    reservableTimeSpans: [
      {
        startDatetime: `${date}T04:00:00+00:00`,
        endDatetime: `${date}T20:00:00+00:00`,
      },
    ],
  } as unknown as ReservationUnitNode;

  test("returns true for a unit that is reservable", () => {
    const [res1] = isReservationUnitReservable({
      ...reservationUnit,
      minReservationDuration: 3600,
      maxReservationDuration: 3600,
      metadataSet: {
        id: "1234",
        name: "Test",
        supportedFields: ["name"],
      },
      reservationState: ReservationState.Reservable,
    });
    expect(res1).toBe(true);

    const [res2] = isReservationUnitReservable({
      ...reservationUnit,
      minReservationDuration: 3600,
      maxReservationDuration: 3600,
      metadataSet: {
        id: "1234",
        name: "Test",
        supportedFields: ["name"],
      },
      reservationState: ReservationState.ScheduledClosing,
    });
    expect(res2).toBe(true);
  });

  test("returns false for a unit that is not reservable", () => {
    const [res1] = isReservationUnitReservable({
      ...reservationUnit,
      minReservationDuration: 3600,
      maxReservationDuration: 3600,
      reservableTimeSpans: undefined,
      metadataSet: {
        id: "1234",
        name: "Test",
        supportedFields: ["name"],
      },
      reservationState: ReservationState.ReservationClosed,
    });
    expect(res1).toBe(false);

    const [res2] = isReservationUnitReservable({
      ...reservationUnit,
      metadataSet: {
        id: "1234",
        name: "Test",
        supportedFields: ["name"],
      },
      reservationState: ReservationState.ReservationClosed,
    });
    expect(res2).toBe(false);

    const [res3] = isReservationUnitReservable({
      ...reservationUnit,
      minReservationDuration: 3600,
      metadataSet: {
        id: "1234",
        name: "Test",
        supportedFields: ["name"],
      },
      reservationState: ReservationState.Reservable,
    });
    expect(res3).toBe(false);

    const [res4] = isReservationUnitReservable({
      ...reservationUnit,
      maxReservationDuration: 3600,
      metadataSet: {
        id: "1234",
        name: "Test",
        supportedFields: ["name"],
      },
      reservationState: ReservationState.Reservable,
    });
    expect(res4).toBe(false);

    const [res5] = isReservationUnitReservable({
      ...reservationUnit,
      minReservationDuration: 3600,
      maxReservationDuration: 3600,
      metadataSet: {
        id: "1234",
        name: "Test",
        supportedFields: ["name"],
      },
      reservationState: ReservationState.ScheduledReservation,
    });
    expect(res5).toBe(false);

    const [res6] = isReservationUnitReservable({
      ...reservationUnit,
      minReservationDuration: 3600,
      maxReservationDuration: 3600,
      metadataSet: {
        id: "1234",
        name: "Test",
        supportedFields: ["name"],
      },
      reservationState: ReservationState.ScheduledPeriod,
    });
    expect(res6).toBe(false);
  });

  test("returns correct value with buffer days", () => {
    const [res1] = isReservationUnitReservable({
      ...reservationUnit,
      minReservationDuration: 3600,
      maxReservationDuration: 3600,
      reservationBegins: addDays(new Date(), 5).toISOString(),
      reservationsMaxDaysBefore: 5,
      metadataSet: {
        id: "1234",
        name: "Test",
        supportedFields: ["name"],
      },
    });
    expect(res1).toBe(false);

    const [res2] = isReservationUnitReservable({
      ...reservationUnit,
      reservationBegins: addDays(new Date(), 5).toISOString(),
      reservationsMaxDaysBefore: 4,
      reservableTimeSpans: undefined,
      metadataSet: {
        id: "1234",
        name: "Test",
        supportedFields: ["name"],
      },
    });
    expect(res2).toBe(false);
  });
});

describe("isReservationStartInFuture", () => {
  test("returns true for a reservation that starts in the future", () => {
    expect(
      isReservationStartInFuture({
        reservationBegins: addMinutes(new Date(), 10),
      } as unknown as ReservationUnitNode)
    ).toBe(true);
  });

  test("returns false for a reservation that starts in the past", () => {
    expect(
      isReservationStartInFuture({
        reservationBegins: addMinutes(new Date(), -10),
      } as unknown as ReservationUnitNode)
    ).toBe(false);

    expect(
      isReservationStartInFuture({
        reservationBegins: new Date(),
      } as unknown as ReservationUnitNode)
    ).toBe(false);

    expect(
      isReservationStartInFuture({} as unknown as ReservationUnitNode)
    ).toBe(false);
  });

  test("returns correct value with buffer days", () => {
    expect(
      isReservationStartInFuture({
        reservationBegins: addDays(new Date(), 10),
        reservationsMaxDaysBefore: 9,
      } as unknown as ReservationUnitNode)
    ).toBe(true);

    expect(
      isReservationStartInFuture({
        reservationBegins: addDays(new Date(), 10),
        reservationsMaxDaysBefore: 10,
      } as unknown as ReservationUnitNode)
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
      } as ReservationUnitNode)
    ).toEqual("2019-09-22T12:00:00.000Z");

    expect(
      getNormalizedReservationBeginTime({
        reservationBegins: "2019-09-22T12:00:00+00:00",
        reservationsMaxDaysBefore: 10,
      } as ReservationUnitNode)
    ).toEqual("2019-09-12T12:00:00.000Z");
  });
});

describe("getOpenDays", () => {
  test("correct output", () => {
    const reservableTimeSpans = [
      {
        startDatetime: "2022-09-14T04:00:00+00:00",
        endDatetime: "2022-09-14T06:00:00+00:00",
      },
      {
        startDatetime: "2022-08-14T04:00:00+00:00",
        endDatetime: "2022-08-14T06:00:00+00:00",
      },
      {
        startDatetime: "2022-08-12T04:00:00+00:00",
        endDatetime: "2022-08-12T06:00:00+00:00",
      },
      {
        startDatetime: "2022-08-10T04:00:00+00:00",
        endDatetime: "2022-08-10T06:00:00+00:00",
      },
    ] as ReservableTimeSpanType[];

    expect(getOpenDays({ reservableTimeSpans } as ReservationUnitNode)).toEqual(
      [
        new Date("2022-08-10T00:00:00.000Z"),
        new Date("2022-08-12T00:00:00.000Z"),
        new Date("2022-08-14T00:00:00.000Z"),
        new Date("2022-09-14T00:00:00.000Z"),
      ]
    );
  });
});
