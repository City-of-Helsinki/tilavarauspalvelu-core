import { addDays, format, set } from "date-fns";
import { getLastPossibleReservationDate, getNextAvailableTime } from "./utils";
import {
  ReservationKind,
  ReservationStartInterval,
} from "common/gql/gql-types";
import { ReservationUnitPageQuery } from "@/gql/gql-types";
import { ReservableMap } from "@/modules/reservable";

describe("getLastPossibleReservationDate", () => {
  test("returns null if no reservationUnit is given", () => {
    expect(getLastPossibleReservationDate()).toBeNull();
  });
  test("returns null if no reservableTimeSpans are given in the reservationUnit", () => {
    const input = {
      reservationsMaxDaysBefore: 1,
      // reservableTimeSpans: null,
      reservationEnds: addDays(new Date(), 10).toISOString(),
    };
    expect(getLastPossibleReservationDate(input)).toBeNull();
  });
  test("if 'reservationsMaxDaysBefore' is set to 1 returns tomorrow", () => {
    // TODO mock system clock so this doesn't flake
    const input = {
      reservationsMaxDaysBefore: 1,
      reservableTimeSpans: [
        {
          startDatetime: addDays(new Date(), -10).toISOString(),
          endDatetime: addDays(new Date(), 10).toISOString(),
        },
      ],
      reservationEnds: addDays(new Date(), 10).toISOString(),
    };
    const expected = addDays(new Date(), 1);
    expect(getLastPossibleReservationDate(input)).toEqual(expected);
  });
  test("if 'reservationEnds' is set for tomorrow returns tomorrow", () => {
    const input = {
      reservationsMaxDaysBefore: 1,
      reservableTimeSpans: [
        {
          startDatetime: addDays(new Date(), -10).toISOString(),
          endDatetime: addDays(new Date(), 10).toISOString(),
        },
      ],
      reservationEnds: addDays(new Date(), 1).toISOString(),
    };
    const expected = addDays(new Date(), 1);
    expect(getLastPossibleReservationDate(input)).toEqual(expected);
  });
  test("if 'reservableTimeSpans' contains a range that ends tomorrow returns tomorrow", () => {
    const input = {
      reservationsMaxDaysBefore: null,
      reservableTimeSpans: [
        {
          startDatetime: addDays(new Date(), -10).toISOString(),
          endDatetime: addDays(new Date(), 1).toISOString(),
        },
      ],
      reservationEnds: null,
    };
    const expected = addDays(new Date(), 1);
    expect(getLastPossibleReservationDate(input)).toEqual(expected);
  });
  test("returns the minimum of the above", () => {
    const input = {
      reservationsMaxDaysBefore: 5,
      reservableTimeSpans: [
        {
          startDatetime: addDays(new Date(), -10).toISOString(),
          endDatetime: addDays(new Date(), 10).toISOString(),
        },
      ],
      reservationEnds: addDays(new Date(), 3).toISOString(),
    };
    const expected = addDays(new Date(), 3);
    expect(getLastPossibleReservationDate(input)).toEqual(expected);
  });
});

const reservationUnit: ReservationUnitPageQuery["reservationUnit"] = {
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

  test("finds the next available time for today", () => {
    const today = new Date();
    const input = {
      start: new Date(),
      duration: 60,
      reservationUnit: {
        ...reservationUnit,
      },
      reservableTimes,
      activeApplicationRounds: [],
    };
    const val = getNextAvailableTime(input);
    expect(val).toBeInstanceOf(Date);
    expect(val!.getDate()).toBe(today.getDate());
    expect(val!.getHours()).toBe(11);
  });

  // there is earlier times available but they are too short
  test("finds the first long enough time today", () => {
    const today = new Date();
    const input = {
      start: new Date(),
      duration: 90,
      reservationUnit: {
        ...reservationUnit,
      },
      reservableTimes,
      activeApplicationRounds: [],
    };
    const val = getNextAvailableTime(input);
    expect(val).toBeInstanceOf(Date);
    expect(val!.getHours()).toBe(13);
    expect(val!.getDate()).toBe(today.getDate());
  });

  // today is reservable, has available times but they are too short
  test("looking for tomorrow finds the correct length time", () => {
    const input = {
      start: addDays(new Date(), 1),
      duration: 90,
      reservationUnit: {
        ...reservationUnit,
      },
      reservableTimes,
      activeApplicationRounds: [],
    };
    const val = getNextAvailableTime(input);
    expect(val).toBeInstanceOf(Date);
    expect(val!.getHours()).toBe(10);
    expect(val!.getDate()).toBe(addDays(new Date(), 1).getDate());
  });

  test("finds the next available time tomorrow when today has too short times", () => {
    const input = {
      start: new Date(),
      duration: 300,
      reservationUnit: {
        ...reservationUnit,
      },
      reservableTimes,
      activeApplicationRounds: [],
    };
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
    for (const i of [0, 1, 2, 3, 4, 5]) {
      reservableTimes.set(
        format(addDays(new Date(), i), "yyyy-MM-dd"),
        shortTimes
      );
    }
    const input = {
      start: new Date(),
      duration: 160,
      reservationUnit: {
        ...reservationUnit,
      },
      reservableTimes,
      activeApplicationRounds: [],
    };
    const val = getNextAvailableTime(input);
    expect(val).toBeNull();
  });

  test("Finds a date even if there are empty ranges before it", () => {
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      reservableTimes.set(format(addDays(today, i), "yyyy-MM-dd"), []);
    }
    reservableTimes.set(format(addDays(today, 7), "yyyy-MM-dd"), [
      {
        start: constructDate(addDays(today, 7), 10, 0),
        end: constructDate(addDays(today, 7), 15, 0),
      },
    ]);
    const input = {
      start: new Date(),
      duration: 30,
      reservationUnit: {
        ...reservationUnit,
      },
      reservableTimes,
      activeApplicationRounds: [],
    };
    const val = getNextAvailableTime(input);
    expect(val).toBeInstanceOf(Date);
    expect(val!.getDate()).toBe(addDays(today, 7).getDate());
    expect(val!.getHours()).toBe(10);
  });

  describe("reservationsMinDaysBefore check", () => {
    test("finds the next available time a week from now", () => {
      const today = new Date();
      for (let i = 0; i < 2 * 7; i++) {
        reservableTimes.set(format(addDays(today, i), "yyyy-MM-dd"), [
          {
            start: constructDate(addDays(today, i), 10, 0),
            end: constructDate(addDays(today, i), 15, 0),
          },
        ]);
      }
      const input = {
        start: new Date(),
        duration: 60,
        reservationUnit: {
          ...reservationUnit,
          reservationsMinDaysBefore: 7,
        },
        reservableTimes,
        activeApplicationRounds: [],
      };
      const val = getNextAvailableTime(input);
      expect(val).toBeInstanceOf(Date);
      expect(val!.getDate()).toBe(addDays(today, 7).getDate());
      expect(val!.getHours()).toBe(10);
    });

    test("NO times if times are only available before reservationsMinDaysBefore", () => {
      const today = new Date();
      for (let i = 0; i < 7; i++) {
        reservableTimes.set(format(addDays(today, i), "yyyy-MM-dd"), [
          {
            start: constructDate(addDays(today, i), 10, 0),
            end: constructDate(addDays(today, i), 15, 0),
          },
        ]);
      }
      const input = {
        start: new Date(),
        duration: 60,
        reservationUnit: {
          ...reservationUnit,
          reservationsMinDaysBefore: 7,
        },
        reservableTimes,
        activeApplicationRounds: [],
      };
      const val = getNextAvailableTime(input);
      expect(val).toBeNull();
    });
  });

  describe("reservationsMaxDaysBefore check", () => {
    test("NO times if times are only available after reservationsMaxDaysBefore", () => {
      const today = new Date();
      reservableTimes.set(format(today, "yyyy-MM-dd"), []);
      const input = {
        start: new Date(),
        duration: 30,
        reservationUnit: {
          ...reservationUnit,
          reservationsMaxDaysBefore: 1,
        },
        reservableTimes,
        activeApplicationRounds: [],
      };
      const val = getNextAvailableTime(input);
      expect(val).toBeNull();
    });
  });
});
/* eslint-enable @typescript-eslint/no-non-null-assertion */
