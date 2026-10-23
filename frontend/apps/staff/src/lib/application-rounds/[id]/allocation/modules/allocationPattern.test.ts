import { describe, expect, it } from "vitest";
import type { WeekdayInterval, WeeklyPatternValue } from "@ui/components/WeeklyPatternCalendar/types";
import { timeToMinutes } from "ui/src/modules/date-utils";
import { endTimeToMinutes } from "ui/src/modules/suitableTimes";
import { Priority, Weekday } from "@gql/gql-types";
import {
  ALLOCATION_STEP_MINUTES,
  findBlockingAffecting,
  fitsSection,
  toAllocationPattern,
  toHighlightRanges,
  wantsInterval,
} from "./allocationPattern";
import type { AllocationCellData, AllocationRange, AllocationSection, AllocationSlot } from "./allocationPattern";

const MINIMUM_EXTENT = { beginMinutes: 7 * 60, endMinutes: 24 * 60 };

function range(
  beginTime: string,
  endTime: string,
  priority: Priority = Priority.Primary,
  dayOfTheWeek: Weekday = Weekday.Monday
): AllocationRange {
  return { dayOfTheWeek, beginTime, endTime, priority };
}

function slot(beginTime: string, endTime: string, pk?: number, dayOfTheWeek: Weekday = Weekday.Monday): AllocationSlot {
  return { dayOfTheWeek, beginTime, endTime, pk };
}

function section({
  pk = 1,
  ranges = [],
  allocations = [],
}: {
  pk?: number;
  ranges?: AllocationRange[];
  allocations?: AllocationSlot[];
} = {}): AllocationSection {
  return { pk, suitableTimeRanges: ranges, reservationUnitOptions: [{ allocatedTimeSlots: allocations }] };
}

// The expected spans read better as times than as minute counts.
function span(beginTime: string, endTime: string, data: AllocationCellData, weekday: Weekday = Weekday.Monday) {
  return { weekday, beginMinutes: timeToMinutes(beginTime), endMinutes: endTimeToMinutes(endTime), data };
}

function demand(count: number): AllocationCellData {
  return { state: "demand", count };
}

const allocated: AllocationCellData = { state: "allocated" };
const affectingCell: AllocationCellData = { state: "affecting" };

function cellCount(pattern: WeeklyPatternValue<AllocationCellData>): number {
  return pattern.reduce((total, s) => total + (s.endMinutes - s.beginMinutes) / ALLOCATION_STEP_MINUTES, 0);
}

function selection(beginTime: string, endTime: string, weekday: Weekday = Weekday.Monday): WeekdayInterval {
  return { weekday, beginMinutes: timeToMinutes(beginTime), endMinutes: endTimeToMinutes(endTime) };
}

describe("toAllocationPattern", () => {
  it("counts the sections that want a time", () => {
    const { pattern } = toAllocationPattern({
      sections: [
        section({ pk: 1, ranges: [range("10:00", "11:00")] }),
        section({ pk: 2, ranges: [range("10:30", "11:00")] }),
      ],
      affecting: [],
    });

    expect(pattern).toEqual([span("10:00", "10:30", demand(1)), span("10:30", "11:00", demand(2))]);
  });

  it("keeps the weekdays apart", () => {
    const { pattern } = toAllocationPattern({
      sections: [section({ ranges: [range("10:00", "11:00", Priority.Primary, Weekday.Tuesday)] })],
      affecting: [],
    });

    expect(pattern).toEqual([span("10:00", "11:00", demand(1), Weekday.Tuesday)]);
  });

  it("counts a section once when two of its own ranges reach the same cell", () => {
    const { pattern } = toAllocationPattern({
      sections: [section({ ranges: [range("10:00", "11:00"), range("10:30", "11:30")] })],
      affecting: [],
    });

    expect(pattern).toEqual([span("10:00", "11:30", demand(1))]);
  });

  it("reads an end time of 00:00 as the end of the day", () => {
    const { pattern } = toAllocationPattern({
      sections: [section({ ranges: [range("23:00", "00:00")] })],
      affecting: [],
    });

    expect(pattern).toEqual([span("23:00", "00:00", demand(1))]);
    expect(cellCount(pattern)).toBe(4);
  });

  it("draws an Affecting Allocation that ends at midnight", () => {
    const { pattern } = toAllocationPattern({
      sections: [],
      affecting: [slot("23:30", "00:00")],
    });

    expect(pattern).toEqual([span("23:30", "00:00", affectingCell)]);
  });

  it("puts a 10:15 to 10:45 request on exactly two cells", () => {
    const { pattern } = toAllocationPattern({
      sections: [section({ ranges: [range("10:15", "10:45")] })],
      affecting: [],
    });

    expect(pattern).toEqual([span("10:15", "10:45", demand(1))]);
    expect(cellCount(pattern)).toBe(2);
  });

  it("puts an Allocation of 10:00 to 10:45 on exactly three cells", () => {
    const { pattern } = toAllocationPattern({
      sections: [section({ allocations: [slot("10:00", "10:45")] })],
      affecting: [],
    });

    expect(pattern).toEqual([span("10:00", "10:45", allocated)]);
    expect(cellCount(pattern)).toBe(3);
  });

  it("counts only the priorities the filter asks for", () => {
    const sections = [
      section({ pk: 1, ranges: [range("10:00", "11:00", Priority.Primary)] }),
      section({ pk: 2, ranges: [range("10:00", "11:00", Priority.Secondary)] }),
    ];

    expect(toAllocationPattern({ sections, affecting: [] }).pattern).toEqual([span("10:00", "11:00", demand(2))]);
    expect(toAllocationPattern({ sections, affecting: [], priorityFilter: [Priority.Primary] }).pattern).toEqual([
      span("10:00", "11:00", demand(1)),
    ]);
    expect(toAllocationPattern({ sections, affecting: [], priorityFilter: [Priority.Secondary] }).pattern).toEqual([
      span("10:00", "11:00", demand(1)),
    ]);
  });

  it("counts every priority when the filter is empty", () => {
    const sections = [section({ ranges: [range("10:00", "11:00", Priority.Secondary)] })];

    expect(toAllocationPattern({ sections, affecting: [], priorityFilter: [] }).pattern).toEqual([
      span("10:00", "11:00", demand(1)),
    ]);
  });

  it("drops a range the priority filter hides", () => {
    const sections = [
      section({ ranges: [range("10:00", "11:00", Priority.Primary), range("12:00", "13:00", Priority.Secondary)] }),
    ];

    expect(toAllocationPattern({ sections, affecting: [], priorityFilter: [Priority.Primary] }).pattern).toEqual([
      span("10:00", "11:00", demand(1)),
    ]);
  });

  it("lets an Allocation win over an Affecting Allocation", () => {
    const { pattern } = toAllocationPattern({
      sections: [section({ allocations: [slot("10:00", "11:00")] })],
      affecting: [slot("10:00", "11:00")],
    });

    expect(pattern).toEqual([span("10:00", "11:00", allocated)]);
  });

  it("lets an Allocation win over Demand", () => {
    const { pattern } = toAllocationPattern({
      sections: [section({ ranges: [range("10:00", "11:00")], allocations: [slot("10:00", "11:00")] })],
      affecting: [],
    });

    expect(pattern).toEqual([span("10:00", "11:00", allocated)]);
  });

  it("lets an Affecting Allocation win over Demand", () => {
    const { pattern } = toAllocationPattern({
      sections: [section({ ranges: [range("10:00", "11:00")] })],
      affecting: [slot("10:00", "11:00")],
    });

    expect(pattern).toEqual([span("10:00", "11:00", affectingCell)]);
  });

  it("marks a time an Affecting Allocation on this same unit takes, even when no shown section holds it", () => {
    const { pattern } = toAllocationPattern({
      sections: [section({ ranges: [range("10:00", "11:00")] })],
      // The query returns the shown unit's own Allocations too, including ones the text search hides.
      affecting: [slot("10:30", "11:30")],
    });

    expect(pattern).toEqual([span("10:00", "10:30", demand(1)), span("10:30", "11:30", affectingCell)]);
  });

  it("shows 07:00 to 24:00 when there is nothing to draw", () => {
    const { pattern, extent } = toAllocationPattern({ sections: [], affecting: [] });

    expect(pattern).toEqual([]);
    expect(extent).toEqual(MINIMUM_EXTENT);
  });

  it("grows the extent past 07:00 for a span that begins earlier", () => {
    const { extent } = toAllocationPattern({
      sections: [section({ ranges: [range("06:00", "08:00")] })],
      affecting: [],
    });

    expect(extent).toEqual({ beginMinutes: timeToMinutes("06:00"), endMinutes: 24 * 60 });
  });

  it("keeps the end of the day as the end of the extent", () => {
    const { extent } = toAllocationPattern({
      sections: [section({ allocations: [slot("23:00", "00:00")] })],
      affecting: [],
    });

    expect(extent).toEqual(MINIMUM_EXTENT);
  });

  it("keeps the Selection inside the extent", () => {
    const { extent } = toAllocationPattern({
      sections: [],
      affecting: [],
      selection: selection("05:30", "06:00"),
    });

    expect(extent).toEqual({ beginMinutes: timeToMinutes("05:30"), endMinutes: 24 * 60 });
  });

  it("gives a cell the number of sections that want it", () => {
    const sections = [
      section({ pk: 1, ranges: [range("10:00", "10:15")] }),
      section({ pk: 2, ranges: [range("09:00", "11:00")] }),
      section({ pk: 3, ranges: [range("11:00", "12:00")] }),
    ];
    const cell = selection("10:00", "10:15");

    const { pattern } = toAllocationPattern({ sections, affecting: [] });
    const wanting = sections.filter((s) => wantsInterval(cell, s));

    expect(pattern).toContainEqual(span("10:00", "10:15", demand(wanting.length)));
    expect(wanting).toHaveLength(2);
  });
});

describe("toHighlightRanges", () => {
  const highlighted = section({
    pk: 7,
    ranges: [range("10:00", "11:00"), range("12:00", "13:00", Priority.Secondary)],
    allocations: [slot("10:00", "11:00", 42)],
  });

  it("outlines the Suitable Time Ranges and the Allocations of one Application Section", () => {
    const result = toHighlightRanges({ sections: [highlighted], sectionPk: 7 });

    expect(result).toEqual([
      { ...selection("10:00", "11:00"), kind: "range" },
      { ...selection("12:00", "13:00"), kind: "range" },
      { ...selection("10:00", "11:00"), kind: "allocation" },
    ]);
  });

  it("leaves out a range the priority filter hides", () => {
    const result = toHighlightRanges({
      sections: [highlighted],
      sectionPk: 7,
      priorityFilter: [Priority.Primary],
    });

    expect(result).toEqual([
      { ...selection("10:00", "11:00"), kind: "range" },
      { ...selection("10:00", "11:00"), kind: "allocation" },
    ]);
  });

  it("outlines one Allocation alone, not the others on the same weekday", () => {
    const many = section({ pk: 7, allocations: [slot("10:00", "11:00", 42), slot("14:00", "15:00", 43)] });

    expect(toHighlightRanges({ sections: [many], allocationPk: 43 })).toEqual([
      { ...selection("14:00", "15:00"), kind: "allocation" },
    ]);
  });

  it("outlines the Allocation when both are asked for", () => {
    const result = toHighlightRanges({ sections: [highlighted], sectionPk: 7, allocationPk: 42 });

    expect(result).toEqual([{ ...selection("10:00", "11:00"), kind: "allocation" }]);
  });

  it("outlines nothing when neither is asked for, or when the pk is unknown", () => {
    expect(toHighlightRanges({ sections: [highlighted] })).toEqual([]);
    expect(toHighlightRanges({ sections: [highlighted], sectionPk: 8 })).toEqual([]);
    expect(toHighlightRanges({ sections: [highlighted], allocationPk: 99 })).toEqual([]);
  });
});

describe("fitsSection", () => {
  it("accepts a Selection inside one range", () => {
    const target = section({ ranges: [range("10:00", "12:00")] });

    expect(fitsSection(selection("10:30", "11:00"), target)).toBe(true);
    expect(fitsSection(selection("10:00", "12:00"), target)).toBe(true);
  });

  it("accepts a Selection spanning two touching ranges", () => {
    const target = section({
      ranges: [range("10:00", "11:00", Priority.Primary), range("11:00", "12:00", Priority.Secondary)],
    });

    expect(fitsSection(selection("10:30", "11:30"), target)).toBe(true);
  });

  it("refuses a Selection crossing a gap between two ranges", () => {
    const target = section({ ranges: [range("10:00", "11:00"), range("11:15", "12:00")] });

    expect(fitsSection(selection("10:30", "11:30"), target)).toBe(false);
  });

  it("refuses a Selection that reaches past the end of a range", () => {
    const target = section({ ranges: [range("10:00", "11:00")] });

    expect(fitsSection(selection("10:30", "11:15"), target)).toBe(false);
  });

  it("refuses a Selection on another weekday", () => {
    const target = section({ ranges: [range("10:00", "12:00")] });

    expect(fitsSection(selection("10:30", "11:00", Weekday.Tuesday), target)).toBe(false);
  });

  it("accepts a Selection that ends at midnight inside a range that ends at 00:00", () => {
    const target = section({ ranges: [range("22:00", "00:00")] });

    expect(fitsSection(selection("23:00", "00:00"), target)).toBe(true);
  });

  it("ignores the priority of a range", () => {
    const target = section({ ranges: [range("10:00", "11:00", Priority.Secondary)] });

    expect(fitsSection(selection("10:00", "11:00"), target)).toBe(true);
  });
});

describe("wantsInterval", () => {
  const target = section({
    ranges: [range("10:00", "11:00", Priority.Primary), range("14:00", "15:00", Priority.Secondary)],
  });

  it("is true when a range overlaps the span", () => {
    expect(wantsInterval(selection("10:45", "11:15"), target)).toBe(true);
  });

  it("is false when no range overlaps the span", () => {
    expect(wantsInterval(selection("11:00", "12:00"), target)).toBe(false);
  });

  it("reads the priority filter", () => {
    expect(wantsInterval(selection("14:00", "15:00"), target, [Priority.Primary])).toBe(false);
    expect(wantsInterval(selection("14:00", "15:00"), target, [Priority.Secondary])).toBe(true);
  });
});

describe("findBlockingAffecting", () => {
  it("finds an Affecting Allocation that starts inside the Selection", () => {
    const affecting = [slot("10:30", "11:30")];

    expect(findBlockingAffecting(selection("10:00", "11:00"), affecting)).toEqual(affecting[0]);
  });

  it("finds an Affecting Allocation that ends at midnight", () => {
    const affecting = [slot("23:00", "00:00")];

    expect(findBlockingAffecting(selection("23:30", "00:00"), affecting)).toEqual(affecting[0]);
  });

  it("finds nothing when the Affecting Allocation only touches the end of the Selection", () => {
    expect(findBlockingAffecting(selection("10:00", "11:00"), [slot("11:00", "12:00")])).toBeNull();
  });

  it("finds nothing on another weekday", () => {
    const affecting = [slot("10:00", "11:00", undefined, Weekday.Tuesday)];

    expect(findBlockingAffecting(selection("10:00", "11:00"), affecting)).toBeNull();
  });

  it("finds nothing in an empty list", () => {
    expect(findBlockingAffecting(selection("10:00", "11:00"), [])).toBeNull();
  });
});
