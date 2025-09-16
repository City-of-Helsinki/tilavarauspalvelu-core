import type { SuitableTimeRangeFormValues } from "./form";
import { type ApplicationRoundTimeSlotNode, Priority, SuitableTimeFieldsFragment, Weekday } from "@/gql/gql-types";
import type { Cell, CellState } from "common/src/components/ApplicationTimeSelector";
import { DayT, WEEKDAYS, WEEKDAYS_SORTED } from "common/src/const";
import { convertWeekday, transformWeekday } from "common/src/conversion";
import { filterNonNullable, formatTimeStruct, timeToMinutes } from "common/src/helpers";

export type DailyOpeningHours = Readonly<
  Array<Pick<ApplicationRoundTimeSlotNode, "weekday" | "isClosed" | "reservableTimes">>
>;

type SchedulesT = Omit<SuitableTimeFieldsFragment, "pk" | "id">;

type DayCells = ReadonlyArray<Cell>;
type WeekCells = ReadonlyArray<DayCells>;

const FIRST_SLOT_START = 7;
const LAST_SLOT_START = 23;

export function createCells(openingHours: DailyOpeningHours): WeekCells {
  const cells: Cell[][] = [];

  for (const weekday of WEEKDAYS_SORTED) {
    const dayOpeningHours = getOpeningHours(weekday, openingHours).map((t) => {
      const beginMins = timeToMinutes(t.begin);
      const endMins = timeToMinutes(t.end);
      return {
        begin: Math.round(beginMins / 60),
        end: endMins === 0 ? 24 : Math.round(endMins / 60),
      };
    });

    const cell: Cell[] = [];
    for (let i = FIRST_SLOT_START; i <= LAST_SLOT_START; i += 1) {
      const isAvailable = dayOpeningHours.some((t) => t.begin != null && t.end != null && t?.begin <= i && t?.end > i);
      cell.push({
        weekday: weekday,
        hour: i,
        state: "none",
        openState: isAvailable ? "open" : "unavailable",
      });
    }
    cells.push(cell);
  }

  return cells;
}

export function aesToCells(schedule: ReadonlyArray<SchedulesT>, openingHours: DailyOpeningHours): WeekCells {
  const cells = createCells(openingHours);

  for (const aes of schedule) {
    const { dayOfTheWeek, priority } = aes;
    const hourBegin = timeToMinutes(aes.beginTime) / 60 - FIRST_SLOT_START;
    const hourEnd = (timeToMinutes(aes.endTime) / 60 || 24) - FIRST_SLOT_START;
    const p = priority === Priority.Primary ? "primary" : "secondary";
    const weekdayNumber = convertWeekday(dayOfTheWeek);

    for (let h = hourBegin; h < hourEnd; h += 1) {
      const cell = cells[weekdayNumber]?.[h];
      if (cell) {
        cell.state = p;
      }
    }
  }
  return cells;
}

type OpeningHourPeriod = {
  begin: string;
  end: string;
};

function getOpeningHours(day: Weekday, openingHours?: DailyOpeningHours): ReadonlyArray<OpeningHourPeriod> {
  if (!openingHours) {
    return [];
  }
  const dayOpeningHours = openingHours.find((oh) => oh.weekday === day);
  if (!dayOpeningHours) {
    return [];
  }
  if (dayOpeningHours.isClosed) {
    return [];
  }
  return filterNonNullable(dayOpeningHours.reservableTimes);
}

export function covertCellsToTimeRange(cells: WeekCells): SuitableTimeRangeFormValues[] {
  return cellsToSections(cells).map((aes) => {
    const { day, begin, end, priority } = aes;
    return {
      beginTime: formatTimeStruct({ hour: begin, minute: 0 }),
      endTime: formatTimeStruct({ hour: end, minute: 0 }),
      priority: transformCellType(priority),
      dayOfTheWeek: transformWeekday(day),
    };
  });
}

function transformCellType(cellType: CellState): Priority {
  switch (cellType) {
    case "primary":
      return Priority.Primary;
    case "secondary":
      return Priority.Secondary;
    case "none":
      throw new Error(`Unknown cell type: ${cellType}`);
  }
}

export type TimeSpan = {
  begin: number;
  end: number;
  priority: CellState;
};

interface AesType extends TimeSpan {
  day: DayT;
}

function combineTimespans(prev: TimeSpan[], current: TimeSpan): TimeSpan[] {
  if (prev.length === 0) {
    return [current];
  }
  const prevCell = prev[prev.length - 1];
  if (prevCell == null) {
    throw new Error("prevCell is null");
  }
  if (prevCell.end === current.begin && prevCell.priority === current.priority) {
    return [
      ...prev.slice(0, -1),
      {
        begin: prevCell.begin,
        end: prevCell.end + 1,
        priority: prevCell.priority,
      },
    ];
  }
  return [...prev, current];
}

function cellsToSections(cells: WeekCells): AesType[] {
  const daySchedules: AesType[] = [];
  if (cells.length > 7) {
    throw new Error("Too many days");
  }
  for (const day of WEEKDAYS) {
    const dayCells = cells[day] ?? [];
    const transformedDayCells = dayCells
      .filter((cell) => cell.state !== "none")
      .map((cell) => ({
        begin: cell.hour,
        end: cell.hour + 1,
        priority: cell.state,
      }))
      .reduce<TimeSpan[]>(combineTimespans, [])
      .map(({ end, ...span }) => ({
        ...span,
        end: end % 24,
        day,
      }));

    daySchedules.push(...transformedDayCells);
  }
  return daySchedules;
}
