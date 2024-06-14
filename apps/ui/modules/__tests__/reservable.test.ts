import { addDays, addHours, startOfToday } from "date-fns";
import { generateReservableMap } from "../reservable";

describe("generateReservableMap", () => {
  // Range format: { start: Date, end: Date }
  // the backend returns N of these ranges
  // they are always disjoint
  // they can be cross multiple days
  // there can be multiple of these per day
  // range can be in the past for example { start: 2021-01-01T00:00:00, end: 2029-01-01T01:00:00 }
  // - where today is 2024-01-01
  // - i.e. a long running range (more theoretical than an actual use case)

  // Test cases:
  // - the easy one: all ranges in the future, one week of ranges (7 days) (from today ->)
  //   all ranges are 09:00-21:00
  // - disjointed one 7 days
  //   - multiple ranges per day
  // - outlier 1: 7 days of ranges (from today ->)
  //   - range starts on the same day but ends on the next day (i.e. 23:00-01:00)
  // - outlier 2: 7 days of ranges (from today ->)
  //
  // - normal case: 2 years of ranges (from today -> 2 years in the future)
  //   - multiple ranges per day
  // - long running range (a year in the past -> a year in the future)
  test("generateReservableMap: 7 days single range per day", () => {
    const d = [0, 1, 2, 3, 4, 5, 6]
      .map((i) => ({
        start: addDays(addHours(startOfToday(), 9), i),
        end: addDays(addHours(startOfToday(), 21), i),
      }))
      .map(({ start, end }) => ({
        startDatetime: start.toISOString(),
        endDatetime: end.toISOString(),
      }));
    const times = generateReservableMap(d);
    expect(times.size).toBe(7);
    for (const [_key, value] of times) {
      expect(value.length).toBe(1);
      // TODO write a check for this
      // expect(value[0].start).toBe(key.start);
      // expect(value[0].end).toBe(key.end);
    }
  });
});

describe("isRangeReservable", () => {
  test.todo("isRangeReservable");
});
