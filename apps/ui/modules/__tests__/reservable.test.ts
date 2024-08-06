import {
  addDays,
  addHours,
  endOfDay,
  format,
  startOfDay,
  startOfToday,
} from "date-fns";
import {
  type ReservableMap,
  type RoundPeriod,
  generateReservableMap,
  isRangeReservable,
  isStartTimeValid,
} from "../reservable";
import {
  type IsReservableFieldsFragment,
  ReservationStartInterval,
  ReservationStateChoice,
} from "@/gql/gql-types";
import { createMockReservationUnit } from "@/test/testUtils";

describe("generateReservableMap", () => {
  beforeAll(() => {
    jest.useFakeTimers({
      now: new Date(2024, 0, 1, 9, 0, 0),
    });
  });
  afterAll(() => {
    jest.useRealTimers();
  });

  // Range format: { start: Date, end: Date }
  // the backend returns N of these ranges
  // they are always disjoint
  // they can be cross multiple days
  // there can be multiple of these per day
  // range can be in the past for example { start: 2021-01-01T00:00:00, end: 2029-01-01T01:00:00 }
  // - where today is 2024-01-01
  // - i.e. a long running range (more theoretical than an actual use case)

  function toRange({ start, end }: { start: Date; end: Date }) {
    return {
      startDatetime: start.toISOString(),
      endDatetime: end.toISOString(),
    };
  }

  // - the easy one: all ranges in the future, one week of ranges (7 days) (from today ->)
  //   all ranges are 09:00-21:00
  test("7 days single range per day", () => {
    const data = [0, 1, 2, 3, 4, 5, 6].map((i) => ({
      start: addDays(addHours(startOfToday(), 9), i),
      end: addDays(addHours(startOfToday(), 21), i),
    }));
    const times = generateReservableMap(data.map(toRange));
    expect(times.size).toBe(7);
    for (const [key, value] of times) {
      expect(value.length).toBe(1);
      const [y, m, d] = key.split("-").map(Number);
      // eslint-disable-next-line no-console
      console.assert(y > 0 && m > 0 && d > 0);
      const start = new Date(y, m - 1, d, 9, 0, 0);
      const end = new Date(y, m - 1, d, 21, 0, 0);
      expect(value[0].start).toStrictEqual(start);
      expect(value[0].end).toStrictEqual(end);
    }
  });

  // - disjointed one 7 days
  //   - multiple ranges per day
  test("7 days multiple ranges per day", () => {
    const startHour = [9, 13];
    const endHour = [12, 17];
    // eslint-disable-next-line no-console
    console.assert(startHour.length === endHour.length);
    const data: Array<{ start: Date; end: Date }> = [];
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < startHour.length; j++) {
        data.push({
          start: addDays(addHours(startOfToday(), startHour[j]), i),
          end: addDays(addHours(startOfToday(), endHour[j]), i),
        });
      }
    }
    const times = generateReservableMap(data.map(toRange));
    expect(times.size).toBe(7);
    for (const [key, value] of times) {
      expect(value.length).toBe(startHour.length);
      const [y, m, d] = key.split("-").map(Number);
      // eslint-disable-next-line no-console
      console.assert(y > 0 && m > 0 && d > 0);
      for (let i = 0; i < startHour.length; i++) {
        const start = new Date(y, m - 1, d, startHour[i], 0, 0);
        const end = new Date(y, m - 1, d, endHour[i], 0, 0);
        expect(value[i].start).toStrictEqual(start);
        expect(value[i].end).toStrictEqual(end);
      }
    }
  });

  test("day range continues to next day", () => {
    const start = addDays(addHours(startOfToday(), 9), 0);
    const end = addDays(addHours(startOfToday(), 21), 1);
    const data = [{ start, end }];
    const times = generateReservableMap(data.map(toRange));
    expect(times.size).toBe(2);
    for (const [key, value] of times) {
      expect(value.length).toBe(1);
      const [y, m, d] = key.split("-").map(Number);
      // eslint-disable-next-line no-console
      console.assert(y > 0 && m > 0 && d > 0);
      const date = new Date(y, m - 1, d, 9, 0, 0);
      const s =
        value[0].start.getDate() === start.getDate() ? date : startOfDay(date);
      const e =
        value[0].end.getDate() === start.getDate() ? endOfDay(start) : end;
      expect(value[0].start).toStrictEqual(s);
      expect(value[0].end).toStrictEqual(e);
    }
  });

  // TODO test with same time range but different days
  test("24h day range continues to next day", () => {
    const start = addDays(addHours(startOfToday(), 9), 0);
    const end = addDays(addHours(startOfToday(), 9), 1);
    const data = [{ start, end }];
    const times = generateReservableMap(data.map(toRange));
    expect(times.size).toBe(2);
    for (const [key, value] of times) {
      expect(value.length).toBe(1);
      const [y, m, d] = key.split("-").map(Number);
      // eslint-disable-next-line no-console
      console.assert(y > 0 && m > 0 && d > 0);
      const date = new Date(y, m - 1, d, 9, 0, 0);
      const s =
        value[0].start.getDate() === start.getDate() ? date : startOfDay(date);
      const e =
        value[0].end.getDate() === start.getDate() ? endOfDay(start) : end;
      expect(value[0].start).toStrictEqual(s);
      expect(value[0].end).toStrictEqual(e);
    }
  });

  test("00:00-00:00 24h day range, should be a single day", () => {
    const start = addDays(startOfToday(), 0);
    const end = addDays(startOfToday(), 1);
    const data = [{ start, end }];
    const times = generateReservableMap(data.map(toRange));
    expect(times.size).toBe(1);
    for (const [key, value] of times) {
      expect(value.length).toBe(1);
      const [y, m, d] = key.split("-").map(Number);
      // eslint-disable-next-line no-console
      console.assert(y > 0 && m > 0 && d > 0);
      const date = new Date(y, m - 1, d, 0, 0, 0);
      expect(value[0].start).toStrictEqual(date);
      expect(value[0].end).toStrictEqual(endOfDay(date));
    }
  });

  test("single range covering a full year from today", () => {
    const start = addDays(startOfToday(), 0);
    const end = addDays(startOfToday(), 365);
    const data = [{ start, end }];
    const times = generateReservableMap(data.map(toRange));
    expect(times.size).toBe(365);
    for (const [key, value] of times) {
      expect(value.length).toBe(1);
      const [y, m, d] = key.split("-").map(Number);
      // eslint-disable-next-line no-console
      console.assert(y > 0 && m > 0 && d > 0);
      const date = new Date(y, m - 1, d, 0, 0, 0);
      expect(value[0].start).toStrictEqual(date);
      expect(value[0].end).toStrictEqual(endOfDay(date));
    }
  });

  test("single range covering two years starting from a year ago has only future days", () => {
    const start = addDays(startOfToday(), -365);
    const end = addDays(startOfToday(), 365);
    const data = [{ start, end }];
    const times = generateReservableMap(data.map(toRange));
    expect(times.size).toBe(365);
    for (const [key, value] of times) {
      expect(value.length).toBe(1);
      const [y, m, d] = key.split("-").map(Number);
      // eslint-disable-next-line no-console
      console.assert(y > 0 && m > 0 && d > 0);
      const date = new Date(y, m - 1, d, 0, 0, 0);
      expect(value[0].start).toStrictEqual(date);
      expect(value[0].end).toStrictEqual(endOfDay(date));
    }
  });

  test("two days with a gap adds only two days", () => {
    const data = [
      { start: addDays(startOfToday(), 0), end: addDays(startOfToday(), 1) },
      { start: addDays(startOfToday(), 2), end: addDays(startOfToday(), 3) },
    ];
    const times = generateReservableMap(data.map(toRange));
    expect(times.size).toBe(2);
    for (const [key, value] of times) {
      expect(value.length).toBe(1);
      const [y, m, d] = key.split("-").map(Number);
      // eslint-disable-next-line no-console
      console.assert(y > 0 && m > 0 && d > 0);
      // TODO what is the logic here and is it sound?
      const date = new Date(y, m - 1, d, 0, 0, 0);
      const start = value[0].start;
      const end = value[0].end;
      if (start.getDate() === date.getDate()) {
        expect(start).toStrictEqual(date);
        expect(end).toStrictEqual(endOfDay(date));
      } else {
        expect(start).toStrictEqual(date);
        expect(end).toStrictEqual(endOfDay(date));
      }
    }
  });

  test("30 days a year from now", () => {
    const start = addDays(startOfToday(), 365);
    const end = addDays(startOfToday(), 395);
    const data = [{ start, end }];
    const times = generateReservableMap(data.map(toRange));
    expect(times.size).toBe(30);
    for (const [key, value] of times) {
      expect(value.length).toBe(1);
      const [y, m, d] = key.split("-").map(Number);
      // eslint-disable-next-line no-console
      console.assert(y > 0 && m > 0 && d > 0);
      const date = new Date(y, m - 1, d, 0, 0, 0);
      expect(value[0].start).toStrictEqual(date);
      expect(value[0].end).toStrictEqual(endOfDay(date));
    }
  });
});

describe("isStartTimeValid", () => {
  function mockReservableTimes(): ReservableMap {
    const map: ReservableMap = new Map();
    for (let i = 0; i < 30; i++) {
      const date = addDays(startOfToday(), i);
      const key = format(date, "yyyy-MM-dd");
      // TODO need to have holes in this
      const value = [{ start: startOfDay(date), end: endOfDay(date) }];
      map.set(key, value);
    }
    return map;
  }
  // TODO fuzzy this
  test("YES for 15 min intervals", () => {
    const date = startOfDay(addDays(new Date(), 1));
    const start = addHours(date, 9);
    const interval = ReservationStartInterval.Interval_15Mins;
    const reservableTimes = mockReservableTimes();
    expect(isStartTimeValid(start, reservableTimes, interval)).toBe(true);
  });
  // TODO fuzzy
  test("YES for 30 min intervals", () => {
    const date = startOfDay(addDays(new Date(), 1));
    const start = addHours(date, 9);
    const interval = ReservationStartInterval.Interval_30Mins;
    const reservableTimes = mockReservableTimes();
    expect(isStartTimeValid(start, reservableTimes, interval)).toBe(true);
  });
  test("YES for 60 min intervals", () => {
    const date = startOfDay(addDays(new Date(), 1));
    const start = addHours(date, 9);
    const interval = ReservationStartInterval.Interval_60Mins;
    const reservableTimes = mockReservableTimes();
    expect(isStartTimeValid(start, reservableTimes, interval)).toBe(true);
  });
  test("NO for 60 min intervals", () => {
    const date = startOfDay(addDays(new Date(), 1));
    const start = addHours(date, 9.5);
    const interval = ReservationStartInterval.Interval_60Mins;
    const reservableTimes = mockReservableTimes();
    expect(isStartTimeValid(start, reservableTimes, interval)).toBe(false);
  });
  test("YES for 120 min intervals", () => {
    const date = startOfDay(addDays(new Date(), 1));
    const start = addHours(date, 10);
    const interval = ReservationStartInterval.Interval_120Mins;
    const reservableTimes = mockReservableTimes();
    expect(isStartTimeValid(start, reservableTimes, interval)).toBe(true);
  });
  test("NO for 120 min intervals", () => {
    const date = startOfDay(addDays(new Date(), 1));
    const start = addHours(date, 9);
    const interval = ReservationStartInterval.Interval_120Mins;
    const reservableTimes = mockReservableTimes();
    expect(isStartTimeValid(start, reservableTimes, interval)).toBe(false);
  });
});

describe("isRangeReservable", () => {
  // TODO mock time

  // one month of reservable times
  function mockReservableTimes(): ReservableMap {
    const map: ReservableMap = new Map();
    for (let i = 0; i < 30; i++) {
      const date = addDays(startOfToday(), i);
      const key = format(date, "yyyy-MM-dd");
      const value = [{ start: startOfDay(date), end: endOfDay(date) }];
      map.set(key, value);
    }
    return map;
  }

  function createInput({
    start,
    end,
    reservableTimes,
    activeApplicationRounds,
    ...rest
  }: {
    start: Date;
    end: Date;
    bufferTimeBefore?: number;
    bufferTimeAfter?: number;
    reservableTimes?: ReservableMap;
    reservationSet?: IsReservableFieldsFragment["reservationSet"];
    interval?: ReservationStartInterval;
    maxReservationDuration?: IsReservableFieldsFragment["maxReservationDuration"];
    minReservationDuration?: IsReservableFieldsFragment["minReservationDuration"];
    activeApplicationRounds?: RoundPeriod[];
    reservationsMinDaysBefore?: number;
    reservationsMaxDaysBefore?: number;
  }) {
    return {
      range: {
        start,
        end,
      },
      reservationUnit: createMockReservationUnit(rest),
      activeApplicationRounds: activeApplicationRounds ?? [],
      reservableTimes: reservableTimes ?? mockReservableTimes(),
    };
  }

  test("YES for the base case", () => {
    const start = addHours(startOfDay(addDays(new Date(), 1)), 10);
    const input = createInput({
      start,
      end: addHours(start, 2),
    });
    expect(isRangeReservable(input)).toBe(true);
  });

  test("NO for starting in the past", () => {
    const now = new Date();
    const start = addHours(startOfDay(now), now.getHours() - 1);
    const input = createInput({
      start,
      end: addHours(start, 2),
    });
    expect(isRangeReservable(input)).toBe(false);
  });

  test("NO if end < start", () => {
    const start = addHours(startOfDay(Date.now()), 10);
    const input = createInput({
      start,
      end: addHours(start, -1),
    });
    expect(isRangeReservable(input)).toBe(false);
  });

  test("YES for a 12h case", () => {
    const date = startOfDay(addDays(new Date(), 1));
    const input = createInput({
      start: addHours(date, 9),
      end: addHours(date, 21),
    });
    expect(isRangeReservable(input)).toBe(true);
  });

  test("NO if the range is shorter than interval", () => {
    const date = startOfDay(addDays(new Date(), 1));
    const input = createInput({
      start: addHours(date, 9),
      end: addHours(date, 10),
      interval: ReservationStartInterval.Interval_120Mins,
    });
    expect(isRangeReservable(input)).toBe(false);
  });

  test("YES if the range is exactly an interval", () => {
    const date = startOfDay(addDays(new Date(), 1));
    const input = createInput({
      start: addHours(date, 10),
      end: addHours(date, 12),
      interval: ReservationStartInterval.Interval_120Mins,
    });
    expect(isRangeReservable(input)).toBe(true);
  });

  test("NO if the range start time doesn't match interval", () => {
    const date = startOfDay(addDays(new Date(), 1));
    const input = createInput({
      start: addHours(date, 11),
      end: addHours(date, 13),
      interval: ReservationStartInterval.Interval_120Mins,
    });
    expect(isRangeReservable(input)).toBe(false);
  });

  test("NO if the range is not divisible with interval", () => {
    const date = startOfDay(addDays(new Date(), 1));
    const input = createInput({
      start: addHours(date, 10),
      end: addHours(date, 13),
      interval: ReservationStartInterval.Interval_120Mins,
    });
    expect(isRangeReservable(input)).toBe(false);
  });

  test("NO if the range is longer than maximum reservation length", () => {
    const date = startOfDay(addDays(new Date(), 1));
    const input = createInput({
      start: addHours(date, 9),
      end: addHours(date, 21),
      maxReservationDuration: 60,
    });
    expect(isRangeReservable(input)).toBe(false);
  });

  test("NO if the range is shorter than minimum reservation length", () => {
    const date = startOfDay(addDays(new Date(), 1));
    const input = createInput({
      start: addHours(date, 9),
      end: addHours(date, 21),
      maxReservationDuration: 60,
    });
    expect(isRangeReservable(input)).toBe(false);
  });

  test("NO if the range is not within the reservable times", () => {
    const date = startOfDay(addDays(new Date(), 31));
    const input = createInput({
      start: addHours(date, 9),
      end: addHours(date, 11),
    });
    expect(isRangeReservable(input)).toBe(false);
  });

  test("NO if the range is before the minimum reservation date", () => {
    const date = startOfDay(addDays(new Date(), 1));
    const input = createInput({
      start: addHours(date, 9),
      end: addHours(date, 11),
      reservationsMinDaysBefore: 2,
    });
    expect(isRangeReservable(input)).toBe(false);
  });

  test("NO if the range is after the maximum reservation date", () => {
    const date = startOfDay(addDays(new Date(), 10));
    const input = createInput({
      start: addHours(date, 9),
      end: addHours(date, 11),
      reservationsMaxDaysBefore: 9,
    });
    expect(isRangeReservable(input)).toBe(false);
  });

  describe("collisions with other reservations", () => {
    function createMockReservation({
      start,
      end,
      state,
      bufferTimeAfter,
      bufferTimeBefore,
      isBlocked,
    }: {
      start: Date;
      end: Date;
      state?: ReservationStateChoice;
      bufferTimeAfter?: number;
      bufferTimeBefore?: number;
      isBlocked?: boolean;
    }) {
      return {
        pk: 1,
        id: "1",
        bufferTimeAfter: 60 * 60 * (bufferTimeAfter ?? 0),
        bufferTimeBefore: 60 * 60 * (bufferTimeBefore ?? 0),
        state: state ?? ReservationStateChoice.Confirmed,
        begin: start.toISOString(),
        end: end.toISOString(),
        isBlocked: isBlocked ?? false,
      };
    }

    test("NO if there is a collision with another reservation", () => {
      const date = startOfDay(addDays(new Date(), 1));
      const input = createInput({
        start: addHours(date, 9),
        end: addHours(date, 11),
        reservationSet: [
          createMockReservation({
            start: addHours(date, 8),
            end: addHours(date, 12),
          }),
        ],
      });
      expect(isRangeReservable(input)).toBe(false);
    });

    test("NO if colliding to Created state", () => {
      const date = startOfDay(addDays(new Date(), 1));
      const input = createInput({
        start: addHours(date, 9),
        end: addHours(date, 11),
        reservationSet: [
          createMockReservation({
            start: addHours(date, 8),
            end: addHours(date, 12),
            state: ReservationStateChoice.Created,
          }),
        ],
      });
      expect(isRangeReservable(input)).toBe(false);
    });

    test("NO if colliding to WaitingForPayment state", () => {
      const date = startOfDay(addDays(new Date(), 1));
      const input = createInput({
        start: addHours(date, 9),
        end: addHours(date, 11),
        reservationSet: [
          createMockReservation({
            start: addHours(date, 8),
            end: addHours(date, 12),
            state: ReservationStateChoice.WaitingForPayment,
          }),
        ],
      });
      expect(isRangeReservable(input)).toBe(false);
    });

    test("YES if colliding to Cancelled state", () => {
      const date = startOfDay(addDays(new Date(), 1));
      const input = createInput({
        start: addHours(date, 9),
        end: addHours(date, 11),
        reservationSet: [
          createMockReservation({
            start: addHours(date, 8),
            end: addHours(date, 12),
            state: ReservationStateChoice.Cancelled,
          }),
        ],
      });
      expect(isRangeReservable(input)).toBe(true);
    });

    test("YES if colliding to Denied state", () => {
      const date = startOfDay(addDays(new Date(), 1));
      const input = createInput({
        start: addHours(date, 9),
        end: addHours(date, 11),
        reservationSet: [
          createMockReservation({
            start: addHours(date, 8),
            end: addHours(date, 12),
            state: ReservationStateChoice.Denied,
          }),
        ],
      });
      expect(isRangeReservable(input)).toBe(true);
    });

    test("YES if buffer time is after the other reservation", () => {
      const date = startOfDay(addDays(new Date(), 1));
      const input = createInput({
        start: addHours(date, 10),
        end: addHours(date, 11),
        reservationSet: [
          createMockReservation({
            start: addHours(date, 8),
            end: addHours(date, 9),
            bufferTimeAfter: 1,
            bufferTimeBefore: 1,
          }),
        ],
      });
      expect(isRangeReservable(input)).toBe(true);
    });

    test("YES if buffer time is before the other reservation", () => {
      const date = startOfDay(addDays(new Date(), 1));
      const input = createInput({
        start: addHours(date, 8),
        end: addHours(date, 9),
        reservationSet: [
          createMockReservation({
            start: addHours(date, 10),
            end: addHours(date, 11),
            bufferTimeAfter: 1,
            bufferTimeBefore: 1,
          }),
        ],
      });
      expect(isRangeReservable(input)).toBe(true);
    });

    test("NO colliding to anothers before buffer time", () => {
      const date = startOfDay(addDays(new Date(), 1));
      const input = createInput({
        start: addHours(date, 8),
        end: addHours(date, 10),
        reservationSet: [
          createMockReservation({
            start: addHours(date, 10),
            end: addHours(date, 11),
            bufferTimeAfter: 1,
            bufferTimeBefore: 1,
          }),
        ],
      });
      expect(isRangeReservable(input)).toBe(false);
    });

    test("NO our buffer time would collide with another", () => {
      const date = startOfDay(addDays(new Date(), 1));
      const input = createInput({
        start: addHours(date, 9),
        end: addHours(date, 11),
        bufferTimeAfter: 1,
        bufferTimeBefore: 1,
        reservationSet: [
          createMockReservation({
            start: addHours(date, 8),
            end: addHours(date, 12),
          }),
        ],
      });
      expect(isRangeReservable(input)).toBe(false);
    });

    test("should pick the larger buffer time of the two", () => {
      const date = startOfDay(addDays(new Date(), 1));
      const input = createInput({
        start: addHours(date, 9),
        end: addHours(date, 11),
        bufferTimeAfter: 1,
        bufferTimeBefore: 1,
        reservationSet: [
          createMockReservation({
            start: addHours(date, 12),
            end: addHours(date, 13),
            bufferTimeBefore: 2,
          }),
        ],
      });
      expect(isRangeReservable(input)).toBe(false);
    });

    test("YES if colliding to Blocked reservations buffer time", () => {
      const date = startOfDay(addDays(new Date(), 1));
      const input = createInput({
        start: addHours(date, 9),
        end: addHours(date, 11),
        bufferTimeAfter: 1,
        bufferTimeBefore: 1,
        reservationSet: [
          createMockReservation({
            start: addHours(date, 12),
            end: addHours(date, 13),
            bufferTimeBefore: 2,
            isBlocked: true,
          }),
        ],
      });
      expect(isRangeReservable(input)).toBe(true);
    });

    test("YES if buffers would collide with each other (new before)", () => {
      const date = startOfDay(addDays(new Date(), 1));
      const input = createInput({
        start: addHours(date, 9),
        end: addHours(date, 11),
        bufferTimeAfter: 1,
        bufferTimeBefore: 1,
        reservationSet: [
          createMockReservation({
            start: addHours(date, 12),
            end: addHours(date, 13),
            bufferTimeAfter: 1,
            bufferTimeBefore: 1,
          }),
        ],
      });
      expect(isRangeReservable(input)).toBe(true);
    });
    test("YES if buffers would collide with each other (new after)", () => {
      const date = startOfDay(addDays(new Date(), 1));
      const input = createInput({
        start: addHours(date, 14),
        end: addHours(date, 15),
        bufferTimeAfter: 1,
        bufferTimeBefore: 1,
        reservationSet: [
          createMockReservation({
            start: addHours(date, 12),
            end: addHours(date, 13),
            bufferTimeAfter: 1,
            bufferTimeBefore: 1,
          }),
        ],
      });
      expect(isRangeReservable(input)).toBe(true);
    });
  });

  // TODO these have complex rules: states of the application rounds, times
  // an application round should only block within reservable times
  // an application round should only block if it's state is active (what are these states)
  // an application round that has been finalized should not block (it's converted into reservations)
  // But they can't be checked here because the state of the application rounds is not known.
  test("NO if the reservation would overlap with an application round", () => {
    const date = startOfDay(addDays(new Date(), 1));
    const input = createInput({
      start: addHours(date, 9),
      end: addHours(date, 11),
      activeApplicationRounds: [
        {
          reservationPeriodBegin: addDays(date, -10).toISOString(),
          reservationPeriodEnd: addDays(date, 10).toISOString(),
        },
      ],
    });
    expect(isRangeReservable(input)).toBe(false);
  });
  test("YES if not overlapping with an application round", () => {
    const date = startOfDay(addDays(new Date(), 1));
    const input = createInput({
      start: addHours(date, 9),
      end: addHours(date, 11),
      activeApplicationRounds: [
        {
          reservationPeriodBegin: addDays(date, 2).toISOString(),
          reservationPeriodEnd: addDays(date, 20).toISOString(),
        },
      ],
    });
    expect(isRangeReservable(input)).toBe(true);
  });
});
