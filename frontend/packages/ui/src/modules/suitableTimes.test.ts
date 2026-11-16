import { describe, expect, test } from "vitest";
import { Priority, Weekday } from "../../gql/gql-types";
import {
  countFittingReservations,
  findTooShortReasons,
  findTooShortRuns,
  fromPattern,
  hasTooShortTimes,
  isInsideOpeningHours,
  listSuitableTimes,
  priorityKey,
  toAvailability,
  toPattern,
} from "./suitableTimes";
import type { ReservableTimeSlots, SuitableTimeRangeValues } from "./suitableTimes";

function range(
  dayOfTheWeek: Weekday,
  beginTime: string,
  endTime: string,
  priority: Priority = Priority.Primary
): SuitableTimeRangeValues {
  return { dayOfTheWeek, beginTime, endTime, priority };
}

describe("toAvailability", () => {
  test("is empty without opening hours", () => {
    expect(toAvailability([])).toEqual([]);
  });

  test("keeps every reservable range of a day, without rounding", () => {
    const openingHours: ReservableTimeSlots = [
      {
        weekday: Weekday.Thursday,
        isClosed: false,
        reservableTimes: [
          { begin: "08:30:00", end: "11:00:00" },
          { begin: "14:15:00", end: "17:45:00" },
        ],
      },
    ];

    expect(toAvailability(openingHours)).toEqual([
      { weekday: Weekday.Thursday, beginMinutes: 510, endMinutes: 660 },
      { weekday: Weekday.Thursday, beginMinutes: 855, endMinutes: 1065 },
    ]);
  });

  test("reads an end time of midnight as the end of the day", () => {
    const openingHours: ReservableTimeSlots = [
      { weekday: Weekday.Monday, isClosed: false, reservableTimes: [{ begin: "07:00:00", end: "00:00:00" }] },
    ];

    expect(toAvailability(openingHours)).toEqual([{ weekday: Weekday.Monday, beginMinutes: 420, endMinutes: 1440 }]);
  });

  test("drops closed days and null ranges", () => {
    const openingHours: ReservableTimeSlots = [
      { weekday: Weekday.Sunday, isClosed: true, reservableTimes: [{ begin: "10:00:00", end: "12:00:00" }] },
      { weekday: Weekday.Saturday, isClosed: false, reservableTimes: [null, { begin: "10:00:00", end: "12:00:00" }] },
      { weekday: Weekday.Friday, isClosed: false, reservableTimes: [] },
    ];
    expect(toAvailability(openingHours)).toEqual([{ weekday: Weekday.Saturday, beginMinutes: 600, endMinutes: 720 }]);
  });
});

describe("toPattern and fromPattern", () => {
  test("map every weekday in both directions", () => {
    for (const apiDay of Object.values(Weekday)) {
      const pattern = toPattern([range(apiDay, "08:00", "09:00")]);

      expect(pattern[0]?.weekday).toBe(apiDay);
      expect(fromPattern(pattern)[0]?.dayOfTheWeek).toBe(apiDay);
    }
  });

  test("convert times to minutes and back as HH:MM", () => {
    const pattern = toPattern([range(Weekday.Monday, "08:15:00", "17:45:00", Priority.Secondary)]);

    expect(pattern).toEqual([
      { weekday: Weekday.Monday, beginMinutes: 495, endMinutes: 1065, data: { priority: Priority.Secondary } },
    ]);
    expect(fromPattern(pattern)).toEqual([range(Weekday.Monday, "08:15", "17:45", Priority.Secondary)]);
  });

  test("write the end of the day as 00:00 and read it back as the end of the day", () => {
    const pattern = toPattern([range(Weekday.Tuesday, "23:00", "00:00")]);

    expect(pattern[0]?.endMinutes).toBe(1440);
    expect(fromPattern(pattern)).toEqual([range(Weekday.Tuesday, "23:00", "00:00")]);
  });

  test("do not carry the primary key of a stored range", () => {
    const stored = [{ ...range(Weekday.Monday, "08:00", "09:00"), pk: 12 }];

    expect(fromPattern(toPattern(stored))).toEqual([range(Weekday.Monday, "08:00", "09:00")]);
  });

  test("an empty list round-trips", () => {
    expect(fromPattern(toPattern([]))).toEqual([]);
  });
});

describe("priorityKey", () => {
  test("gives the translation key of a priority", () => {
    expect(priorityKey(Priority.Primary)).toBe("primary");
    expect(priorityKey(Priority.Secondary)).toBe("secondary");
  });
});

describe("findTooShortRuns", () => {
  const HOUR = 3600;
  const P = Priority.Primary;
  const S = Priority.Secondary;
  // Runs in order, as [priority, begin, end] in minutes.
  const runs = (...list: Array<[Priority, number, number]>) =>
    list.map(([priority, beginMinutes, endMinutes]) => ({ priority, beginMinutes, endMinutes }));

  test("a primary run must reach the minimum by itself", () => {
    expect(findTooShortRuns(runs([P, 600, 630]), HOUR)).toEqual([true]);
    expect(findTooShortRuns(runs([P, 600, 660]), HOUR)).toEqual([false]);
  });

  test("a secondary buffer before or after a long enough primary run is fine", () => {
    expect(findTooShortRuns(runs([P, 600, 660], [S, 660, 690]), HOUR)).toEqual([false, false]);
    expect(findTooShortRuns(runs([S, 570, 600], [P, 600, 660]), HOUR)).toEqual([false, false]);
  });

  test("a secondary buffer next to a too short primary run is too short too", () => {
    expect(findTooShortRuns(runs([P, 600, 630], [S, 630, 660]), HOUR)).toEqual([true, true]);
    // Even when the block would be long enough.
    expect(findTooShortRuns(runs([S, 555, 600], [P, 600, 630]), HOUR)).toEqual([true, true]);
  });

  test("a secondary run long enough by itself is fine, even next to a too short primary run", () => {
    expect(findTooShortRuns(runs([S, 540, 600], [P, 600, 630]), HOUR)).toEqual([false, true]);
    expect(findTooShortRuns(runs([P, 600, 630], [S, 630, 720]), HOUR)).toEqual([true, false]);
  });

  test("only the buffers touching a too short primary run are marked", () => {
    expect(findTooShortRuns(runs([P, 600, 660], [S, 660, 690], [P, 690, 705]), HOUR)).toEqual([false, true, true]);
    expect(findTooShortRuns(runs([S, 540, 570], [P, 570, 630], [S, 630, 660], [P, 700, 715]), HOUR)).toEqual([
      false,
      false,
      false,
      true,
    ]);
  });

  test("a secondary run with nothing touching it must reach the minimum by itself", () => {
    expect(findTooShortRuns(runs([P, 600, 660], [S, 675, 705]), HOUR)).toEqual([false, true]);
    expect(findTooShortRuns(runs([S, 600, 660]), HOUR)).toEqual([false]);
  });
});

describe("findTooShortReasons", () => {
  const HOUR = 3600;
  const P = Priority.Primary;
  const S = Priority.Secondary;

  test("tells a buffer next to a too short primary run from a run that is too short by itself", () => {
    const runs = [
      { priority: P, beginMinutes: 600, endMinutes: 630 },
      { priority: S, beginMinutes: 630, endMinutes: 660 },
      { priority: S, beginMinutes: 700, endMinutes: 730 },
      { priority: P, beginMinutes: 800, endMinutes: 860 },
    ];
    expect(findTooShortReasons(runs, HOUR)).toEqual(["tooShort", "nextToShortPrimary", "tooShort", null]);
  });
});

describe("hasTooShortTimes", () => {
  const HOUR = 3600;
  const range = (dayOfTheWeek: Weekday, beginTime: string, endTime: string, priority: Priority) => ({
    dayOfTheWeek,
    beginTime,
    endTime,
    priority,
  });

  test("applies findTooShortRuns per day", () => {
    const longPrimary = range(Weekday.Monday, "10:00", "11:00", Priority.Primary);
    expect(hasTooShortTimes([longPrimary, range(Weekday.Monday, "11:00", "11:30", Priority.Secondary)], HOUR)).toBe(
      false
    );
    // The same time on another day does not touch it.
    expect(hasTooShortTimes([longPrimary, range(Weekday.Tuesday, "11:00", "11:30", Priority.Secondary)], HOUR)).toBe(
      true
    );
  });

  test("touching primary ranges count as one run, in any order", () => {
    expect(
      hasTooShortTimes(
        [
          range(Weekday.Monday, "10:30", "11:00", Priority.Primary),
          range(Weekday.Monday, "10:00", "10:30", Priority.Primary),
        ],
        HOUR
      )
    ).toBe(false);
  });

  test("an end of 00:00 is the end of the day", () => {
    expect(hasTooShortTimes([range(Weekday.Sunday, "23:00", "00:00", Priority.Primary)], HOUR)).toBe(false);
  });

  // Overlapping ranges are judged as the calendar and the time list show them: a later range replaces an earlier one.
  test("a later range that cuts an earlier one short makes it too short", () => {
    const ranges = [
      range(Weekday.Monday, "10:00", "11:00", Priority.Primary),
      range(Weekday.Monday, "09:00", "10:30", Priority.Secondary),
    ];
    // Shown as secondary 09:00–10:30 and primary 10:30–11:00.
    expect(listSuitableTimes(ranges).map(({ beginMinutes, endMinutes }) => [beginMinutes, endMinutes])).toEqual([
      [540, 630],
      [630, 660],
    ]);
    expect(hasTooShortTimes(ranges, HOUR)).toBe(true);
  });

  test("a too short range hidden under a later one doesn't count", () => {
    const ranges = [
      range(Weekday.Monday, "10:00", "10:30", Priority.Primary),
      range(Weekday.Monday, "09:00", "11:00", Priority.Secondary),
    ];
    expect(listSuitableTimes(ranges)).toHaveLength(1);
    expect(hasTooShortTimes(ranges, HOUR)).toBe(false);
  });
});

describe("isInsideOpeningHours", () => {
  const openMonday: ReservableTimeSlots = [
    { weekday: Weekday.Monday, isClosed: false, reservableTimes: [{ begin: "08:00:00", end: "18:00:00" }] },
  ];

  test("is true when every range is inside the opening hours", () => {
    expect(isInsideOpeningHours([], openMonday)).toBe(true);
    expect(isInsideOpeningHours([range(Weekday.Monday, "08:00", "18:00")], openMonday)).toBe(true);
  });

  test("is false when a range reaches past the opening hours, or is on a closed day", () => {
    expect(isInsideOpeningHours([range(Weekday.Monday, "17:00", "19:00")], openMonday)).toBe(false);
    expect(
      isInsideOpeningHours(
        [range(Weekday.Monday, "10:00", "11:00"), range(Weekday.Tuesday, "10:00", "11:00")],
        openMonday
      )
    ).toBe(false);
  });

  test("an end of 00:00 is the end of the day", () => {
    const openAllDay: ReservableTimeSlots = [
      { weekday: Weekday.Sunday, isClosed: false, reservableTimes: [{ begin: "07:00:00", end: "00:00:00" }] },
    ];
    expect(isInsideOpeningHours([range(Weekday.Sunday, "23:00", "00:00")], openAllDay)).toBe(true);
  });
});

describe("countFittingReservations", () => {
  const HOUR = 3600;
  const range = (dayOfTheWeek: Weekday, beginTime: string, endTime: string, priority = Priority.Primary) => ({
    dayOfTheWeek,
    beginTime,
    endTime,
    priority,
  });

  test("a long enough time fits several reservations side by side", () => {
    expect(countFittingReservations([range(Weekday.Monday, "10:00", "13:00")], HOUR)).toBe(3);
    expect(countFittingReservations([range(Weekday.Monday, "10:00", "12:30")], HOUR)).toBe(2);
  });

  test("separate times on the same day each fit their own", () => {
    expect(
      countFittingReservations(
        [
          range(Weekday.Monday, "10:00", "11:00"),
          range(Weekday.Monday, "12:00", "13:00"),
          range(Weekday.Monday, "14:00", "15:00"),
        ],
        HOUR
      )
    ).toBe(3);
  });

  test("touching times of any priority fit together, as one time", () => {
    expect(
      countFittingReservations(
        [
          range(Weekday.Monday, "10:00", "11:30", Priority.Primary),
          range(Weekday.Monday, "11:30", "12:00", Priority.Secondary),
        ],
        HOUR
      )
    ).toBe(2);
  });

  test("days are counted together", () => {
    expect(
      countFittingReservations([range(Weekday.Monday, "10:00", "11:00"), range(Weekday.Friday, "23:00", "00:00")], HOUR)
    ).toBe(2);
  });
});
