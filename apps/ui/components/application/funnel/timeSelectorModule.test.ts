import { describe, expect, test } from "vitest";
import {
  aesToCells,
  covertCellsToTimeRange,
  createCells,
  type DailyOpeningHours,
  type TimeSpan,
} from "./timeSelectorModule";
import type { SuitableTimeRangeFormValues } from "./form";
import { Priority, Weekday } from "@/gql/gql-types";
import type { Cell } from "common/src/components/ApplicationTimeSelector";
import { type DayT, WEEKDAYS_SORTED } from "common/src/const";
import { toApiTimeUnsafe } from "common/src/common/util";
import { transformWeekday } from "common/src/conversion";

function createDayCells(
  day: Weekday,
  openRanges: Array<{ begin: number; end: number }> = [] as const,
  selectedRange: TimeSpan[] = [] as const
): Cell[] {
  const dayStart = 7;
  const dayLength = 24 - 7;
  return Array.from({ length: dayLength }, (_, i) => i + dayStart).map((h) => {
    const selectedRangeType = selectedRange?.filter((x) => x.begin <= h && h < x.end) ?? [];
    const state = selectedRangeType[0]?.priority ?? "none";
    const openState = openRanges?.some((r) => h >= r.begin && h < r.end);
    return {
      weekday: day,
      hour: h,
      state,
      openState: openState ? "open" : "unavailable",
    };
  });
}

describe("createCells", () => {
  test.for([
    {
      begin: "08:00",
      end: "12:00",
      expectedCount: 4,
    },
    {
      begin: "09:00",
      end: "19:00",
      expectedCount: 10,
    },
    {
      begin: "09:00",
      end: "19:00",
      expectedCount: 10,
    },
    {
      begin: "11:00",
      end: "19:00",
      expectedCount: 8,
    },
  ])("open without gaps from $begin to $end is $expectedCount", ({ begin, end, expectedCount }) => {
    const openingHours: DailyOpeningHours = [
      {
        weekday: Weekday.Monday,
        isClosed: false,
        reservableTimes: [{ begin, end }],
      },
    ];
    const res = createCells(openingHours);
    expect(res).toHaveLength(7);
    const openCount = res.reduce((acc, dayCells) => {
      return acc + dayCells.filter((cell) => cell.openState === "open").length;
    }, 0);
    expect(openCount).toBe(expectedCount);
  });

  test.for([
    {
      times: [
        {
          begin: "08:00",
          end: "12:00",
        },
        {
          begin: "14:00",
          end: "18:00",
        },
      ],
      expectedOpenCount: 4 + 4,
    },
    {
      times: [
        {
          begin: "07:00",
          end: "11:00",
        },
        {
          begin: "14:00",
          end: "18:00",
        },
      ],
      expectedOpenCount: 4 + 4,
    },
    {
      times: [
        {
          begin: "09:00",
          end: "10:00",
        },
        {
          begin: "22:00",
          end: "23:00",
        },
      ],
      expectedOpenCount: 1 + 1,
    },
    {
      times: [
        {
          begin: "09:00",
          end: "10:00",
        },
        {
          begin: "22:00",
          end: "00:00",
        },
      ],
      expectedOpenCount: 1 + 2,
    },
    // one hour slots with holes
    {
      times: [7, 9, 11, 13, 15, 17].map((i) => ({
        begin: toApiTimeUnsafe({ hours: i }),
        end: toApiTimeUnsafe({ hours: i + 1 }),
      })),
      expectedOpenCount: 6,
    },
    // maximum holes: because calendar is 7:00 - 24:00 -> 8 slots
    // API allows 0:00 - 24:00, but we remove the first 7 hours
    {
      times: Array.from({ length: 12 }, (_, i) => ({
        begin: toApiTimeUnsafe({ hours: 2 * i }),
        end: toApiTimeUnsafe({ hours: 2 * i + 1 }),
      })),
      expectedOpenCount: 8,
    },
    // every hour is set as individual span -> maximum open slots (7:00 - 24:00)
    {
      times: Array.from({ length: 24 }, (_, i) => ({
        begin: toApiTimeUnsafe({ hours: i }),
        end: toApiTimeUnsafe({ hours: i + 1 }),
      })),
      expectedOpenCount: 24 - 7,
    },
  ])("open time with gaps", ({ times, expectedOpenCount }) => {
    const openTimes: DailyOpeningHours = [
      {
        // TODO fuzzy the weekday
        weekday: Weekday.Monday,
        isClosed: false,
        reservableTimes: times,
      },
    ];

    const res = createCells(openTimes);
    expect(res).toHaveLength(7);
    const openCount = res.reduce((acc, dayCells) => {
      return acc + dayCells.filter((cell) => cell.openState === "open").length;
    }, 0);
    expect(openCount).toBe(expectedOpenCount);
  });
});

describe("aesToCells", () => {
  function createInputDay({ weekday, isClosed = false }: { weekday: Weekday; isClosed?: boolean }) {
    return {
      weekday,
      isClosed,
      reservableTimes: [
        { begin: "08:00", end: "12:00" },
        { begin: "13:00", end: "17:00" },
      ],
    };
  }

  function createInput({ openDays = WEEKDAYS_SORTED }: { openDays?: Weekday[] }): DailyOpeningHours {
    return openDays.map((day) => createInputDay({ weekday: day }));
  }

  test("no opening hours or selections", () => {
    const schedule = [] as const;
    const openingHours = [] as const;
    const res = aesToCells(schedule, openingHours);
    expect(res).toHaveLength(7);
    for (const [i, cell] of res.entries()) {
      expect(cell).toHaveLength(17);
      const expected = createDayCells(transformWeekday(i as DayT));
      expect(cell).toEqual(expected);
    }
  });

  test("with opening hours on monday", () => {
    const schedule = [] as const;
    const openingHours = createInput({ openDays: [Weekday.Monday] });
    const res = aesToCells(schedule, openingHours);
    expect(res).toHaveLength(7);
    const expected = [
      createDayCells(Weekday.Monday, [
        { begin: 8, end: 12 },
        { begin: 13, end: 17 },
      ]),
      ...Array.from({ length: 6 }, (_, i) => createDayCells(transformWeekday((1 + i) as DayT))),
    ];
    for (const [i, day] of res.entries()) {
      expect(day).toHaveLength(17);
      expect(day).toEqual(expected[i]);
    }
  });

  test("opening hours on all days", () => {
    const schedule = [] as const;
    const openingHours = createInput({});
    const res = aesToCells(schedule, openingHours);
    expect(res).toHaveLength(7);
    const expected = Array.from({ length: 7 }, (_, i) =>
      createDayCells(transformWeekday(i as DayT), [
        { begin: 8, end: 12 },
        { begin: 13, end: 17 },
      ])
    );
    for (const [i, day] of res.entries()) {
      expect(day).toHaveLength(17);
      expect(day).toEqual(expected[i]);
    }
  });

  test("opening hours only on friday", () => {
    const schedule = [] as const;
    const openingHours = createInput({ openDays: [Weekday.Friday] });
    const res = aesToCells(schedule, openingHours);
    expect(res).toHaveLength(7);
    const expected = [
      createDayCells(Weekday.Monday),
      createDayCells(Weekday.Tuesday),
      createDayCells(Weekday.Wednesday),
      createDayCells(Weekday.Thursday),
      createDayCells(Weekday.Friday, [
        { begin: 8, end: 12 },
        { begin: 13, end: 17 },
      ]),
      createDayCells(Weekday.Saturday),
      createDayCells(Weekday.Sunday),
    ];
    for (const [i, day] of res.entries()) {
      expect(day).toHaveLength(17);
      expect(day).toEqual(expected[i]);
    }
  });

  test("test primary selection inside opening hours", () => {
    const schedule: SuitableTimeRangeFormValues[] = [
      {
        priority: Priority.Primary,
        dayOfTheWeek: Weekday.Tuesday,
        beginTime: "8:00",
        endTime: "11:00",
      },
    ] as const;
    const openingHours = createInput({});
    const res = aesToCells(schedule, openingHours);
    expect(res).toHaveLength(7);
    const expected = Array.from({ length: 7 }, (_, i) =>
      createDayCells(
        transformWeekday(i as DayT),
        [
          { begin: 8, end: 12 },
          { begin: 13, end: 17 },
        ],
        i === 1 ? [{ begin: 8, end: 11, priority: "primary" }] : undefined
      )
    );
    for (const [i, day] of res.entries()) {
      expect(day).toHaveLength(17);
      expect(day).toEqual(expected[i]);
    }
  });

  test("primary selection outside opening hours", () => {
    const schedule: SuitableTimeRangeFormValues[] = [
      {
        priority: Priority.Primary,
        dayOfTheWeek: Weekday.Tuesday,
        beginTime: "18:00",
        endTime: "22:00",
      },
    ] as const;
    const openingHours = createInput({});
    const res = aesToCells(schedule, openingHours);
    expect(res).toHaveLength(7);
    const expected = Array.from({ length: 7 }, (_, i) =>
      createDayCells(
        transformWeekday(i as DayT),
        [
          { begin: 8, end: 12 },
          { begin: 13, end: 17 },
        ],
        i === 1 ? [{ begin: 18, end: 22, priority: "primary" }] : undefined
      )
    );
    for (const [i, day] of res.entries()) {
      expect(day).toHaveLength(17);
      expect(day).toEqual(expected[i]);
    }
  });

  test.todo("test secondary selected schedule");
  test.todo("test a mix with opening hours");
});

describe("covertCellsToTimeRange", () => {
  test("empty", () => {
    expect(covertCellsToTimeRange([])).toEqual([]);
  });

  test("openining hours are ignored", () => {
    const cells: Cell[][] = [
      createDayCells(Weekday.Monday, [
        { begin: 8, end: 12 },
        { begin: 13, end: 17 },
      ]),
      createDayCells(Weekday.Tuesday),
    ];
    const res = covertCellsToTimeRange(cells);
    expect(res).toEqual([]);
  });

  test("primary contiguous selection", () => {
    const cells: Cell[][] = [createDayCells(Weekday.Monday, [], [{ begin: 8, end: 12, priority: "primary" }])];
    const res = covertCellsToTimeRange(cells);
    const expected: SuitableTimeRangeFormValues[] = [
      {
        beginTime: "08:00",
        endTime: "12:00",
        dayOfTheWeek: Weekday.Monday,
        priority: Priority.Primary,
      },
    ] as const;
    expect(res).toEqual(expected);
  });

  test("non contiguous primary selection is not merged", () => {
    const cells: Cell[][] = [
      createDayCells(
        Weekday.Monday,
        [],
        [
          { begin: 8, end: 9, priority: "primary" },
          { begin: 11, end: 12, priority: "primary" },
        ]
      ),
    ];
    const res = covertCellsToTimeRange(cells);
    const expected: SuitableTimeRangeFormValues[] = [
      {
        beginTime: "08:00",
        endTime: "09:00",
        dayOfTheWeek: Weekday.Monday,
        priority: Priority.Primary,
      },
      {
        beginTime: "11:00",
        endTime: "12:00",
        dayOfTheWeek: Weekday.Monday,
        priority: Priority.Primary,
      },
    ] as const;
    expect(res).toEqual(expected);
  });

  test.todo("merging primary contiguous selection");

  test("secondary selection", () => {
    const cells: Cell[][] = [createDayCells(Weekday.Monday, [], [{ begin: 8, end: 12, priority: "secondary" }])];
    const res = covertCellsToTimeRange(cells);
    const expected: SuitableTimeRangeFormValues[] = [
      {
        beginTime: "08:00",
        endTime: "12:00",
        dayOfTheWeek: Weekday.Monday,
        priority: Priority.Secondary,
      },
    ] as const;
    expect(res).toEqual(expected);
  });

  test("mixed selection", () => {
    const cells: Cell[][] = [
      createDayCells(
        Weekday.Monday,
        [],
        [
          { begin: 8, end: 10, priority: "primary" },
          { begin: 10, end: 12, priority: "secondary" },
        ]
      ),
    ];
    const res = covertCellsToTimeRange(cells);
    const expected: SuitableTimeRangeFormValues[] = [
      {
        beginTime: "08:00",
        endTime: "10:00",
        dayOfTheWeek: Weekday.Monday,
        priority: Priority.Primary,
      },
      {
        beginTime: "10:00",
        endTime: "12:00",
        dayOfTheWeek: Weekday.Monday,
        priority: Priority.Secondary,
      },
    ] as const;
    expect(res).toEqual(expected);
  });

  test("24:00 should be converted to 0:00", () => {
    const cells: Cell[][] = [createDayCells(Weekday.Monday, [], [{ begin: 23, end: 24, priority: "secondary" }])];
    const res = covertCellsToTimeRange(cells);
    const expected: SuitableTimeRangeFormValues[] = [
      {
        beginTime: "23:00",
        endTime: "00:00",
        dayOfTheWeek: Weekday.Monday,
        priority: Priority.Secondary,
      },
    ] as const;
    expect(res).toEqual(expected);
  });

  // NOTE implicit expectation that the first selectable slot is 7:00
  // the UI calendar only shows 7 - 24 so it's limitation has bled into logic
  test("full day range -> 07:00 - 0:00", () => {
    const cells: Cell[][] = [createDayCells(Weekday.Monday, [], [{ begin: 0, end: 24, priority: "primary" }])];
    const res = covertCellsToTimeRange(cells);
    const expected: SuitableTimeRangeFormValues[] = [
      {
        beginTime: "07:00",
        endTime: "00:00",
        dayOfTheWeek: Weekday.Monday,
        priority: Priority.Primary,
      },
    ] as const;
    expect(res).toEqual(expected);
  });
});
