import {
  addDays,
  addHours,
  endOfDay,
  startOfDay,
  startOfToday,
} from "date-fns";
import { generateReservableMap } from "../reservable";

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

  // TODO
  // - normal case: 2 years of ranges (from today -> 2 years in the future)
  //   - multiple ranges per day
  test.todo("30 days with gaps");
  test.todo("30 days a year from now");
  test.todo("common use case: 2 years of ranges, multiple ranges per day");
});

describe("isRangeReservable", () => {
  test.todo("isRangeReservable");
});
