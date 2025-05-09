import { expect, describe, test } from "vitest";
import {
  aesToCells,
  type Cell,
  covertCellsToTimeRange,
  type DailyOpeningHours,
} from "./timeSelectorModule";
import { type CellType, type SuitableTimeRangeFormValues } from "./form";
import { Priority, Weekday } from "@/gql/gql-types";

function createDayCells(
  day: number,
  openRanges?: { begin: number; end: number }[],
  selectedRange?: { begin: number; end: number; type: CellType }[]
): Cell[] {
  const dayStart = 7;
  const dayLength = 24 - 7;
  return Array.from({ length: dayLength }, (_, i) => i + dayStart).map((h) => {
    const selectedRangeType =
      selectedRange?.filter((x) => x.begin <= h && h < x.end) ?? [];
    return {
      key: `${day}-${h}`,
      hour: h,
      label: `${h} - ${h + 1}`,
      state:
        selectedRangeType[0] != null
          ? selectedRangeType[0].type
          : openRanges?.some((r) => h >= r.begin && h < r.end)
            ? "open"
            : "unavailable",
    };
  });
}

describe("aesToCells", () => {
  function createInputDay({
    weekday,
    closed = false,
  }: {
    weekday: number;
    closed?: boolean;
  }) {
    return {
      weekday,
      closed,
      reservableTimes: [
        { begin: "08:00", end: "12:00" },
        { begin: "13:00", end: "17:00" },
      ],
    };
  }
  function createInput({
    openDays = [0, 1, 2, 3, 4, 5, 6],
  }: {
    openDays?: number[];
  }): DailyOpeningHours {
    return openDays.map((day) => createInputDay({ weekday: day }));
  }

  test("no opening hours or selections", () => {
    const schedule = [] as const;
    const openingHours = [] as const;
    const res = aesToCells(schedule, openingHours);
    expect(res).toHaveLength(7);
    for (const [i, cell] of res.entries()) {
      expect(cell).toHaveLength(17);
      const expected = createDayCells(i);
      expect(cell).toEqual(expected);
    }
  });

  test("with opening hours on monday", () => {
    const schedule = [] as const;
    const openingHours = createInput({ openDays: [0] });
    const res = aesToCells(schedule, openingHours);
    expect(res).toHaveLength(7);
    const expected = [
      createDayCells(0, [
        { begin: 8, end: 12 },
        { begin: 13, end: 17 },
      ]),
      ...Array.from({ length: 6 }, (_, i) => createDayCells(i + 1)),
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
      createDayCells(i, [
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
    const openingHours = createInput({ openDays: [4] });
    const res = aesToCells(schedule, openingHours);
    expect(res).toHaveLength(7);
    const expected = [
      ...Array.from({ length: 4 }, (_, i) => createDayCells(i)),
      createDayCells(4, [
        { begin: 8, end: 12 },
        { begin: 13, end: 17 },
      ]),
      ...Array.from({ length: 2 }, (_, i) => createDayCells(i + 5)),
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
        i,
        [
          { begin: 8, end: 12 },
          { begin: 13, end: 17 },
        ],
        i === 1 ? [{ begin: 8, end: 11, type: "primary" }] : undefined
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
        i,
        [
          { begin: 8, end: 12 },
          { begin: 13, end: 17 },
        ],
        i === 1 ? [{ begin: 18, end: 22, type: "primary" }] : undefined
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
      createDayCells(0, [
        { begin: 8, end: 12 },
        { begin: 13, end: 17 },
      ]),
      createDayCells(1),
    ];
    const res = covertCellsToTimeRange(cells);
    expect(res).toEqual([]);
  });

  test("primary contiguous selection", () => {
    const cells: Cell[][] = [
      createDayCells(0, [], [{ begin: 8, end: 12, type: "primary" }]),
    ];
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
        0,
        [],
        [
          { begin: 8, end: 9, type: "primary" },
          { begin: 11, end: 12, type: "primary" },
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
    const cells: Cell[][] = [
      createDayCells(0, [], [{ begin: 8, end: 12, type: "secondary" }]),
    ];
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
        0,
        [],
        [
          { begin: 8, end: 10, type: "primary" },
          { begin: 10, end: 12, type: "secondary" },
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
});
