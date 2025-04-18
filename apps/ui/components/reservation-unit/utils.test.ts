import {
  addDays,
  addHours,
  addMonths,
  format,
  set,
  startOfDay,
} from "date-fns";
import {
  type AvailableTimesProps,
  getLastPossibleReservationDate,
  getNextAvailableTime,
  type LastPossibleReservationDateProps,
} from "./utils";
import { ReservationStartInterval } from "common/gql/gql-types";
import {
  dateToKey,
  ReservableMap,
  type RoundPeriod,
} from "@/modules/reservable";
import {
  vi,
  describe,
  test,
  expect,
  beforeAll,
  beforeEach,
  afterAll,
} from "vitest";
import { TIMERS_TO_FAKE } from "@/test/test.utils";
import { base64encode } from "common/src/helpers";

describe("getLastPossibleReservationDate", () => {
  beforeAll(() => {
    vi.useFakeTimers({
      now: new Date(2024, 0, 1, 9, 0, 0),
    });
  });
  afterAll(() => {
    vi.useRealTimers();
  });

  function createInput({
    reservationsMaxDaysBefore = null,
    reservableTimeSpans = [],
    reservationEnds,
  }: {
    reservationsMaxDaysBefore?: number | null;
    reservableTimeSpans?: {
      begin: Date;
      end: Date;
    }[];
    reservationEnds?: Date;
  }): LastPossibleReservationDateProps {
    return {
      reservationsMaxDaysBefore,
      reservableTimeSpans: reservableTimeSpans?.map(({ begin, end }) => ({
        startDatetime: begin.toISOString(),
        endDatetime: end.toISOString(),
      })),
      reservationEnds: reservationEnds?.toISOString() ?? null,
    };
  }

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

describe("getNextAvailableTime", () => {
  beforeAll(() => {
    vi.useFakeTimers({
      toFake: [...TIMERS_TO_FAKE],
      // There is some weird time zone issues (this seems to work)
      now: new Date(2024, 0, 1, 9, 0, 0),
    });
  });
  afterAll(() => {
    vi.useRealTimers();
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

  function mockOpenTimes(
    start: Date,
    days: number,
    data?: Array<{ start: Date; end: Date }>
  ) {
    for (let i = 0; i < days; i++) {
      reservableTimes.set(
        dateToKey(addDays(start, i)),
        data ?? [
          {
            start: constructDate(addDays(start, i), 10, 0),
            end: constructDate(addDays(start, i), 15, 0),
          },
        ]
      );
    }
  }

  function createInput({
    start,
    duration,
    reservationsMinDaysBefore = null,
    reservationsMaxDaysBefore = null,
    activeApplicationRounds = [],
  }: {
    start: Date;
    duration: number;
    reservationsMinDaysBefore?: number | null;
    reservationsMaxDaysBefore?: number | null;
    activeApplicationRounds?: RoundPeriod[];
  }): Readonly<AvailableTimesProps> {
    return {
      start,
      duration,
      reservationUnit: {
        id: base64encode("ReservationUnit:1"),
        reservationsMinDaysBefore,
        reservationsMaxDaysBefore,
        bufferTimeBefore: 0,
        bufferTimeAfter: 0,
        reservationStartInterval: ReservationStartInterval.Interval_30Mins,
        maxReservationDuration: null,
        minReservationDuration: null,
        reservationBegins: null,
        reservationEnds: null,
        reservableTimeSpans: [],
      },
      activeApplicationRounds,
      blockingReservations: [],
      reservableTimes,
    } as const;
  }

  test("finds the next available time for today", () => {
    const today = new Date();
    const input = createInput({
      start: today,
      duration: 60,
    });
    const val = getNextAvailableTime(input);
    const d = startOfDay(today);
    expect(val).toEqual(addHours(d, 11));
  });

  // there is earlier times available but they are too short
  test("finds the first long enough time today", () => {
    const today = new Date();
    const input = createInput({
      start: today,
      duration: 90,
    });
    const val = getNextAvailableTime(input);
    const d = startOfDay(today);
    expect(val).toEqual(addHours(d, 13));
  });

  // today is reservable, has available times but they are too short
  test("looking for tomorrow finds the correct length time", () => {
    const start = addDays(new Date(), 1);
    const input = createInput({
      start,
      duration: 90,
    });
    const val = getNextAvailableTime(input);
    const d = startOfDay(start);
    expect(val).toEqual(addHours(d, 10));
  });

  test("finds the next available time tomorrow when today has too short times", () => {
    const start = new Date();
    const input = createInput({
      start,
      duration: 300,
    });
    const val = getNextAvailableTime(input);
    const d = startOfDay(addDays(new Date(), 1));
    expect(val).toEqual(addHours(d, 10));
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
    expect(val).toEqual(addHours(startOfDay(date), 10));
  });

  test("Finds a single date after two months", () => {
    const today = new Date();
    mockOpenTimes(today, 7, []);
    const date = addMonths(today, 2);
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
    expect(val).toEqual(addHours(startOfDay(date), 10));
  });

  test("Finds a date after a requested date", () => {
    const today = new Date();
    const date1 = addMonths(today, 1);
    const date2 = addMonths(today, 6);
    mockOpenTimes(today, 7, []);
    reservableTimes.set(format(date1, "yyyy-MM-dd"), [
      {
        start: constructDate(date1, 10, 0),
        end: constructDate(date1, 15, 0),
      },
    ]);
    reservableTimes.set(format(date2, "yyyy-MM-dd"), [
      {
        start: constructDate(date2, 10, 0),
        end: constructDate(date2, 15, 0),
      },
    ]);
    const input = createInput({
      start: addDays(date1, 1),
      duration: 30,
    });
    const val = getNextAvailableTime(input);
    expect(val).toEqual(addHours(startOfDay(date2), 10));
  });

  describe("reservationsMinDaysBefore check", () => {
    test("Min days before 0, should find today", () => {
      const today = new Date();
      mockOpenTimes(today, 2 * 7);
      const input = createInput({
        start: today,
        duration: 60,
        reservationsMinDaysBefore: 0,
      });
      const val = getNextAvailableTime(input);
      const d = startOfDay(today);
      expect(val).toEqual(addHours(d, 10));
    });

    test("Min days before 1, should find tomorrow", () => {
      const today = new Date();
      mockOpenTimes(today, 2 * 7);
      const input = createInput({
        start: today,
        duration: 60,
        reservationsMinDaysBefore: 1,
      });
      const val = getNextAvailableTime(input);
      const d = startOfDay(addDays(today, 1));
      expect(val).toEqual(addHours(d, 10));
    });

    test("finds the next available time a week from now", () => {
      const today = new Date();
      mockOpenTimes(today, 2 * 7);
      const input = createInput({
        start: today,
        duration: 60,
        reservationsMinDaysBefore: 7,
      });
      const val = getNextAvailableTime(input);
      const d = startOfDay(addDays(today, 7));
      expect(val).toEqual(addHours(d, 10));
    });

    test("NO times if times are only available before reservationsMinDaysBefore", () => {
      const today = new Date();
      const cpy = new Date(today);
      mockOpenTimes(today, 7);
      const input = createInput({
        start: today,
        duration: 60,
        reservationsMinDaysBefore: 7,
      });
      const val = getNextAvailableTime(input);
      expect(val).toBeNull();
      // date should not be modified
      expect(today).toEqual(cpy);
    });
  });

  describe("reservationsMaxDaysBefore check", () => {
    test("Max days before 0, should find a week from now", () => {
      const today = new Date();
      mockOpenTimes(today, 2 * 7);
      const input = createInput({
        start: addDays(today, 7),
        duration: 60,
        reservationsMaxDaysBefore: 0,
      });
      const val = getNextAvailableTime(input);
      const d = startOfDay(addDays(today, 7));
      expect(val).toEqual(addHours(d, 10));
    });

    test("Max days before undefined is equal to 0", () => {
      const today = new Date();
      mockOpenTimes(today, 2 * 7);
      const input = createInput({
        start: addDays(today, 7),
        duration: 60,
        reservationsMaxDaysBefore: undefined,
      });
      const val = getNextAvailableTime(input);
      const d = startOfDay(addDays(today, 7));
      expect(val).toEqual(addHours(d, 10));
    });

    test("Max days before 6, should not find a week from now", () => {
      const today = new Date();
      mockOpenTimes(today, 2 * 7);
      const input = createInput({
        start: addDays(today, 7),
        duration: 60,
        reservationsMaxDaysBefore: 6,
      });
      const val = getNextAvailableTime(input);
      expect(val).toBeNull();
    });

    test("NO times if times are only available after reservationsMaxDaysBefore", () => {
      const today = new Date();
      const cpy = new Date(today);
      reservableTimes.set(format(today, "yyyy-MM-dd"), []);
      const input = createInput({
        start: today,
        duration: 30,
        reservationsMaxDaysBefore: 1,
      });
      const val = getNextAvailableTime(input);
      expect(val).toBeNull();
      // date should not be modified
      expect(today).toEqual(cpy);
    });
  });

  describe("activeApplicationRounds", () => {
    test("finds the next available time after activeApplicationRounds", () => {
      const today = new Date();
      mockOpenTimes(today, 30);
      const end = addDays(today, 7);
      const activeApplicationRounds: RoundPeriod[] = [
        {
          reservationPeriodBegin: addDays(today, -7).toISOString(),
          reservationPeriodEnd: end.toISOString(),
        },
      ];
      const input = createInput({
        start: today,
        duration: 60,
        activeApplicationRounds,
      });
      const val = getNextAvailableTime(input);
      const d = startOfDay(addDays(end, 1));
      expect(val).toEqual(addHours(d, 10));
    });

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
      const d = startOfDay(addDays(end, 3));
      expect(val).toEqual(addHours(d, 10));
    });

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
      const d = startOfDay(addDays(middle, 1));
      expect(val).toEqual(addHours(d, 10));
    });

    test("no times available after activeApplicationRound", () => {
      const today = new Date();
      mockOpenTimes(today, 30);
      const end = addDays(today, 31);
      const activeApplicationRounds: RoundPeriod[] = [
        {
          reservationPeriodBegin: addDays(today, -7).toISOString(),
          reservationPeriodEnd: end.toISOString(),
        },
      ];
      const input = createInput({
        start: addDays(end, 1),
        duration: 60,
        activeApplicationRounds,
      });
      const val = getNextAvailableTime(input);
      expect(val).toBeNull();
    });

    // TODO add more tests for application round
    // block 12 months using activeApplicationRounds, measure the time it takes
    test("performance: finds the next available time after a long application round", () => {
      mockOpenTimes(new Date(), 2 * 365);
      const activeApplicationRounds: RoundPeriod[] = [
        {
          reservationPeriodBegin: new Date().toISOString(),
          reservationPeriodEnd: addDays(new Date(), 365).toISOString(),
        },
      ];
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
    });
  });
});
