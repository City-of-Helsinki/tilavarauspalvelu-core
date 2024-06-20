import {
  addDays,
  addHours,
  endOfDay,
  format,
  startOfDay,
  startOfToday,
} from "date-fns";
import {
  ReservableMap,
  generateReservableMap,
  isRangeReservable,
} from "../reservable";
import {
  IsReservableFieldsFragment,
  ReservationStartInterval,
  ReservationStateChoice,
} from "@/gql/gql-types";

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

  test.todo("common use case: 2 years of ranges, multiple ranges per day");
});

describe("isRangeReservable", () => {
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
    reservationSet,
    interval,
    maxReservationDuration,
    minReservationDuration,
  }: {
    start: Date;
    end: Date;
    reservableTimes?: ReservableMap;
    reservationSet?: IsReservableFieldsFragment["reservationSet"];
    interval?: ReservationStartInterval;
    maxReservationDuration?: IsReservableFieldsFragment["maxReservationDuration"];
    minReservationDuration?: IsReservableFieldsFragment["minReservationDuration"];
  }) {
    const reservationUnit: Omit<
      IsReservableFieldsFragment,
      "reservableTimeSpans"
    > = {
      reservationSet: reservationSet ?? [],
      bufferTimeBefore: 0,
      bufferTimeAfter: 0,
      maxReservationDuration: maxReservationDuration ?? 0,
      minReservationDuration: minReservationDuration ?? 0,
      reservationStartInterval:
        interval ?? ReservationStartInterval.Interval_15Mins,
      reservationsMaxDaysBefore: null,
      reservationsMinDaysBefore: 0,
      reservationBegins: addDays(new Date(), -1).toISOString(),
      reservationEnds: addDays(new Date(), 180).toISOString(),
    };
    return {
      range: {
        start,
        end,
      },
      reservationUnit,
      activeApplicationRounds: [],
      reservableTimes: reservableTimes ?? mockReservableTimes(),
    };
  }

  test("YES for the base case", () => {
    const input = createInput({
      start: addHours(new Date(), 1),
      end: addHours(new Date(), 2),
    });
    expect(isRangeReservable(input)).toBe(true);
  });

  test("NO for starting in the past", () => {
    const input = createInput({
      start: addHours(new Date(), -1),
      end: addHours(new Date(), 2),
    });
    expect(isRangeReservable(input)).toBe(false);
  });

  test("NO if end < start", () => {
    const input = createInput({
      start: addHours(new Date(), 2),
      end: addHours(new Date(), 1),
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
      start: addHours(date, 9),
      end: addHours(date, 11),
      interval: ReservationStartInterval.Interval_120Mins,
    });
    expect(isRangeReservable(input)).toBe(true);
  });

  test("NO if the range is not divisible with interval", () => {
    const date = startOfDay(addDays(new Date(), 1));
    const input = createInput({
      start: addHours(date, 9),
      end: addHours(date, 12),
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

  test.todo("NO if the range is before the minimum reservation date");
  test.todo("NO if the range is after the maximum reservation date");
  test.todo("NO if the reservation unit is not reservable");

  describe("collisions with other reservations", () => {
    function createMockReservation({
      start,
      end,
      state,
      bufferTimeAfter,
      bufferTimeBefore,
    }: {
      start: Date;
      end: Date;
      state?: ReservationStateChoice;
      bufferTimeAfter?: number;
      bufferTimeBefore?: number;
    }) {
      return {
        pk: 1,
        id: "1",
        bufferTimeAfter: bufferTimeAfter ?? 0,
        bufferTimeBefore: bufferTimeBefore ?? 0,
        state: state ?? ReservationStateChoice.Confirmed,
        begin: start.toISOString(),
        end: end.toISOString(),
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
    //
    test.todo(
      "NO if there is a collision with another reservation in Created state"
    );
    test.todo(
      "NO if there is a collision with another reservation in WaitingForPayment state"
    );
    test.todo(
      "YES if there is a collision with another reservation in Cancelled state"
    );
    test.todo(
      "YES if there is a collision with another reservation in Rejected state"
    );
    test.todo(
      "NO if there is a collision with another reservation in the buffer time"
    );
    test.todo("NO if the buffer would collide with another reservation");
  });

  // TODO these have complex rules: states of the application rounds, times
  // an application round should only block within reservable times
  // an application round should only block if it's state is active (what are these states)
  // an application round that has been finalized should not block (it's converted into reservations)
  test.todo("NO if the reservation would overlap with an application round");
  test.todo("NO if the range is not within the active application rounds");
});
