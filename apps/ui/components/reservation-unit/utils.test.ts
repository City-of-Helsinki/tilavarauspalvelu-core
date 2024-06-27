import { addDays, format, set } from "date-fns";
import { getLastPossibleReservationDate, getNextAvailableTime } from "./utils";
import {
  ReservationKind,
  ReservationStartInterval,
} from "common/gql/gql-types";
import { ReservationUnitPageQuery } from "@/gql/gql-types";
import { ReservableMap, RoundPeriod, dateToKey } from "@/modules/reservable";

describe("getLastPossibleReservationDate", () => {
  beforeAll(() => {
    jest.useFakeTimers({
      now: new Date(2024, 0, 1, 9, 0, 0),
    });
  });
  afterAll(() => {
    jest.useRealTimers();
  });

  function createInput({
    reservationsMaxDaysBefore,
    reservableTimeSpans,
    reservationEnds,
  }: {
    reservationsMaxDaysBefore?: number;
    reservableTimeSpans?: {
      begin: Date;
      end: Date;
    }[];
    reservationEnds?: Date;
  }) {
    return {
      reservationsMaxDaysBefore,
      reservableTimeSpans: reservableTimeSpans?.map(({ begin, end }) => ({
        startDatetime: begin.toISOString(),
        endDatetime: end.toISOString(),
      })),
      reservationEnds: reservationEnds?.toISOString(),
    };
  }

  test("returns null if no reservationUnit is given", () => {
    expect(getLastPossibleReservationDate()).toBeNull();
  });

  test("returns null without reservableTimeSpans", () => {
    const input = createInput({
      reservationsMaxDaysBefore: 1,
      reservationEnds: addDays(new Date(), 10),
    });
    expect(getLastPossibleReservationDate(input)).toBeNull();
  });

  test("if 'reservationsMaxDaysBefore' is set to 1 returns tomorrow", () => {
    const today = new Date();
    const input = createInput({
      reservationsMaxDaysBefore: 1,
      reservableTimeSpans: [
        {
          begin: addDays(today, -10),
          end: addDays(today, 10),
        },
      ],
      reservationEnds: addDays(today, 10),
    });
    const tommorow = addDays(today, 1);
    expect(getLastPossibleReservationDate(input)).toEqual(tommorow);
  });

  test("if 'reservationEnds' is set for tomorrow returns tomorrow", () => {
    const tomorrow = addDays(new Date(), 1);
    const input = createInput({
      reservationsMaxDaysBefore: 1,
      reservableTimeSpans: [
        {
          begin: addDays(new Date(), -10),
          end: addDays(new Date(), 10),
        },
      ],
      reservationEnds: tomorrow,
    });
    expect(getLastPossibleReservationDate(input)).toEqual(tomorrow);
  });

  test("if 'reservableTimeSpans' contains a range that ends tomorrow returns tomorrow", () => {
    const tomorrow = addDays(new Date(), 1);
    const input = createInput({
      reservableTimeSpans: [
        {
          begin: addDays(new Date(), -10),
          end: tomorrow,
        },
      ],
    });
    expect(getLastPossibleReservationDate(input)).toEqual(tomorrow);
  });

  test("returns the minimum of the above", () => {
    const input = createInput({
      reservationsMaxDaysBefore: 5,
      reservableTimeSpans: [
        {
          begin: addDays(new Date(), -10),
          end: addDays(new Date(), 10),
        },
      ],
      reservationEnds: addDays(new Date(), 3),
    });
    const expected = addDays(new Date(), 3);
    expect(getLastPossibleReservationDate(input)).toEqual(expected);
  });
});

function constructDate(d: Date, hours: number, minutes: number) {
  return set(d, { hours, minutes, seconds: 0, milliseconds: 0 });
}
// Rules for writing tests:
// 1. default data for happy path, progressively modify it for other cases
// 2. only modify one thing at a time
// 3. never cast inputs for any reason
// These avoid errors (false positives) due to incorrect mocks.
// More important when testing error cases.
// Alternative would be to refactor and reduce inputs to the function.
// e.g. this is not necessary for a function that takes 2 - 3 parameters.
/* eslint-disable @typescript-eslint/no-non-null-assertion -- expect breaks on null */
describe("getNextAvailableTime", () => {
  beforeAll(() => {
    jest.useFakeTimers({
      doNotFake: ['performance'],
      // There is some weird time zone issues (this seems to work)
      now: new Date(2024, 0, 1, 9, 0, 0),
    });
  });
  afterAll(() => {
    jest.useRealTimers();
  });

  let reservableTimes: ReservableMap;
  beforeEach(() => {
    const today = new Date();
    reservableTimes = new Map();
    reservableTimes.set(format(today, "yyyy-MM-dd"), [
      { start: constructDate(today, 11, 0), end: constructDate(today, 12, 0) },
      { start: constructDate(today, 13, 0), end: constructDate(today, 15, 0) },
      { start: constructDate(today, 16, 0), end: constructDate(today, 17, 0) },
      { start: constructDate(today, 18, 0), end: constructDate(today, 20, 0) },
    ]);
    reservableTimes.set(format(addDays(today, 1), "yyyy-MM-dd"), [
      {
        start: constructDate(addDays(today, 1), 10, 0),
        end: constructDate(addDays(today, 1), 15, 0),
      },
    ]);
  });

  function mockOpenTimes(start: Date, days: number, data?: Array<{ start: Date; end: Date }>) {
    for (let i = 0; i < days; i++) {
      reservableTimes.set(dateToKey(addDays(start, i)), data ?? [
        {
          start: constructDate(addDays(start, i), 10, 0),
          end: constructDate(addDays(start, i), 15, 0),
        },
      ]);
    }
  }

  function createInput({
    start,
    duration,
    reservationsMinDaysBefore,
    reservationsMaxDaysBefore,
    activeApplicationRounds
  }: {
    start: Date;
    duration: number;
    reservationsMinDaysBefore?: number;
    reservationsMaxDaysBefore?: number;
    activeApplicationRounds?: RoundPeriod[];
  }) {
    const reservationUnit: NonNullable<
      ReservationUnitPageQuery["reservationUnit"]
    > = {
      id: "123",
      pk: 123,
      isDraft: false,
      reservationKind: ReservationKind.Direct,
      bufferTimeBefore: 0,
      bufferTimeAfter: 0,
      requireReservationHandling: false,
      canApplyFreeOfCharge: false,
      reservationStartInterval: ReservationStartInterval.Interval_30Mins,
      uuid: "123",
      images: [],
      applicationRoundTimeSlots: [],
      equipments: [],
      pricings: [],
    };
    return {
      start,
      duration,
      reservationUnit: {
        ...reservationUnit,
        reservationsMinDaysBefore,
        reservationsMaxDaysBefore,
      },
      reservableTimes,
      activeApplicationRounds: activeApplicationRounds ?? [],
    };
  }

  test("finds the next available time for today", () => {
    const today = new Date();
    const input = createInput({
      start: today,
      duration: 60,
    });
    const val = getNextAvailableTime(input);
    expect(val).toBeInstanceOf(Date);
    expect(val!.getDate()).toBe(today.getDate());
    expect(val!.getHours()).toBe(11);
  });

  // there is earlier times available but they are too short
  test("finds the first long enough time today", () => {
    const today = new Date();
    const input = createInput({
      start: today,
      duration: 90,
    });
    const val = getNextAvailableTime(input);
    expect(val).toBeInstanceOf(Date);
    expect(val!.getHours()).toBe(13);
    expect(val!.getDate()).toBe(today.getDate());
  });

  // today is reservable, has available times but they are too short
  test("looking for tomorrow finds the correct length time", () => {
    const start = addDays(new Date(), 1);
    const input = createInput({
      start,
      duration: 90,
    });
    const val = getNextAvailableTime(input);
    expect(val).toBeInstanceOf(Date);
    expect(val!.getHours()).toBe(10);
    expect(val!.getDate()).toBe(start.getDate());
  });

  test("finds the next available time tomorrow when today has too short times", () => {
    const start = new Date();
    const input = createInput({
      start,
      duration: 300,
    });
    const val = getNextAvailableTime(input);
    expect(val).toBeInstanceOf(Date);
    expect(val!.getHours()).toBe(10);
    expect(val!.getDate()).toBe(addDays(new Date(), 1).getDate());
  });

  test("finds no available times if the duration is too long", () => {
    const today = new Date();
    const shortTimes = reservableTimes.get(format(today, "yyyy-MM-dd"));
    if (!shortTimes) {
      throw new Error("Mock data broken");
    }
    mockOpenTimes(today, 5, shortTimes);
    const input = createInput({
      start: today,
      duration: 160,
    });
    const val = getNextAvailableTime(input);
    expect(val).toBeNull();
  });

  test("Finds a date even if there are empty ranges before it", () => {
    const today = new Date();
    mockOpenTimes(today, 7, []);
    const date = addDays(today, 7);
    reservableTimes.set(format(date, "yyyy-MM-dd"), [
      {
        start: constructDate(date, 10, 0),
        end: constructDate(date, 15, 0),
      },
    ]);
    const input = createInput({
      start: today,
      duration: 30,
    });
    const val = getNextAvailableTime(input);
    expect(val).toBeInstanceOf(Date);
    expect(val!.getDate()).toBe(date.getDate());
    expect(val!.getHours()).toBe(10);
  });

  describe("reservationsMinDaysBefore check", () => {
    test("finds the next available time a week from now", () => {
      const today = new Date();
      mockOpenTimes(today, 2*7);
      const input = createInput({
        start: today,
        duration: 60,
        reservationsMinDaysBefore: 7,
      });
      const val = getNextAvailableTime(input);
      expect(val).toBeInstanceOf(Date);
      expect(val!.getDate()).toBe(addDays(today, 7).getDate());
      expect(val!.getHours()).toBe(10);
    });

    test("NO times if times are only available before reservationsMinDaysBefore", () => {
      const today = new Date();
      mockOpenTimes(today, 7);
      const input = createInput({
        start: today,
        duration: 60,
        reservationsMinDaysBefore: 7,
      });
      const val = getNextAvailableTime(input);
      expect(val).toBeNull();
    });
  });

  describe("reservationsMaxDaysBefore check", () => {
    test("NO times if times are only available after reservationsMaxDaysBefore", () => {
      const today = new Date();
      reservableTimes.set(format(today, "yyyy-MM-dd"), []);
      const input = createInput({
        start: today,
        duration: 30,
        reservationsMaxDaysBefore: 1,
      });
      const val = getNextAvailableTime(input);
      expect(val).toBeNull();
    });
  });

  describe("activeApplicationRounds", () => {
    test("finds the next available time after activeApplicationRounds", () => {
      const today = new Date();
      mockOpenTimes(today, 30);
      const end = addDays(today, 7);
      const activeApplicationRounds: RoundPeriod[] = [{
        reservationPeriodBegin: addDays(today, -7).toISOString(),
        reservationPeriodEnd: end.toISOString(),
      }];
      const input = createInput({
        start: today,
        duration: 60,
        activeApplicationRounds,
      });
      const val = getNextAvailableTime(input);
      expect(val).toBeInstanceOf(Date);
      expect(val!.getDate()).toBe(addDays(end, 1).getDate());
      expect(val!.getHours()).toBe(10);
    })

    test("multiple overlapping activeApplicationRounds", () => {
      const today = new Date();
      mockOpenTimes(today, 30);
      const end = addDays(today, 7);
      const activeApplicationRounds: RoundPeriod[] = [
        {
          reservationPeriodBegin: addDays(today, -7).toISOString(),
          reservationPeriodEnd: end.toISOString(),
        },
        {
          reservationPeriodBegin: addDays(today, -5).toISOString(),
          reservationPeriodEnd: addDays(end, 2).toISOString(),
        },
      ];
      const input = createInput({
        start: today,
        duration: 60,
        activeApplicationRounds,
      });
      const val = getNextAvailableTime(input);
      expect(val).toBeInstanceOf(Date);
      expect(val!.getDate()).toBe(addDays(end, 3).getDate());
      expect(val!.getHours()).toBe(10);
    })

    test("finds a time between non-overlapping activeApplicationRounds", () => {
      const today = new Date();
      mockOpenTimes(today, 60);
      const middle = addDays(today, 7);
      const activeApplicationRounds: RoundPeriod[] = [
        {
          reservationPeriodBegin: addDays(today, -7).toISOString(),
          reservationPeriodEnd: middle.toISOString(),
        },
        {
          reservationPeriodBegin: addDays(middle, 2).toISOString(),
          reservationPeriodEnd: addDays(middle, 10).toISOString(),
        },
      ];
      const input = createInput({
        start: today,
        duration: 60,
        activeApplicationRounds,
      });
      const val = getNextAvailableTime(input);
      expect(val).toBeInstanceOf(Date);
      expect(val!.getDate()).toBe(addDays(middle, 1).getDate());
      expect(val!.getHours()).toBe(10);
    });

    test("no times available after activeApplicationRound", () => {
      const today = new Date();
      mockOpenTimes(today, 30);
      const end = addDays(today, 31);
      const activeApplicationRounds: RoundPeriod[] = [{
        reservationPeriodBegin: addDays(today, -7).toISOString(),
        reservationPeriodEnd: end.toISOString(),
      }];
      const input = createInput({
        start: addDays(end, 1),
        duration: 60,
        activeApplicationRounds,
      });
      const val = getNextAvailableTime(input);
      expect(val).toBeNull();
    })

    // TODO add more tests for application round
    // block 12 months using activeApplicationRounds, measure the time it takes
    test("performance: finds the next available time after a long application round", () => {
      mockOpenTimes(new Date(), 2 * 365);
      const activeApplicationRounds: RoundPeriod[] = [{
        reservationPeriodBegin: new Date().toISOString(),
        reservationPeriodEnd: addDays(new Date(), 365).toISOString(),
      }];
      const today = new Date();
      const input = createInput({
        start: today,
        duration: 60,
        activeApplicationRounds,
      });
      const perfStart = performance.now();
      const val = getNextAvailableTime(input);
      const perfEnd = performance.now();
      const perfTime = perfEnd - perfStart;
      expect(val).toBeInstanceOf(Date);
      expect(perfTime).toBeLessThan(100);
    })
  });
});
/* eslint-enable @typescript-eslint/no-non-null-assertion */
