import { type CellType, type SuitableTimeRangeFormValues } from "./form";
import { type ApplicationRoundTimeSlotNode, Priority } from "@/gql/gql-types";
import { convertWeekday, Day, transformWeekday } from "common/src/conversion";
import {
  filterNonNullable,
  formatTimeStruct,
  timeToMinutes,
} from "common/src/helpers";

export type Cell = {
  hour: number;
  label: string;
  state: CellType;
  key: string;
};

type Timespan = {
  begin: number;
  end: number;
  priority: CellType;
};

export function aesToCells(
  schedule: Readonly<SuitableTimeRangeFormValues[]>,
  openingHours: DailyOpeningHours
): Cell[][] {
  const firstSlotStart = 7;
  const lastSlotStart = 23;

  const cells: Cell[][] = [];

  for (let day = 0; day < 7; day += 1) {
    const cell: Cell[] = [];
    const dayOpeningHours = filterNonNullable(
      getOpeningHours(day, openingHours)
    ).map((t) => {
      const beginMins = timeToMinutes(t.begin);
      const endMins = timeToMinutes(t.end);
      return {
        begin: Math.round(beginMins / 60),
        end: endMins === 0 ? 24 : Math.round(endMins / 60),
      };
    });
    // state is 50 if the cell is outside the opening hours, 100 if it's inside
    for (let i = firstSlotStart; i <= lastSlotStart; i += 1) {
      const isAvailable = dayOpeningHours.some(
        (t) => t.begin != null && t.end != null && t?.begin <= i && t?.end > i
      );
      cell.push({
        key: `${day}-${i}`,
        hour: i,
        label: cellLabel(i),
        state: isAvailable ? "open" : "unavailable",
      });
    }
    cells.push(cell);
  }

  for (const aes of schedule) {
    const { dayOfTheWeek, priority } = aes;
    const hourBegin = timeToMinutes(aes.beginTime) / 60 - firstSlotStart;
    const hourEnd = (timeToMinutes(aes.endTime) / 60 || 24) - firstSlotStart;
    const p = priority === Priority.Primary ? "primary" : "secondary";
    const day = convertWeekday(dayOfTheWeek);
    for (let h = hourBegin; h < hourEnd; h += 1) {
      const cell = cells[day]?.[h];
      if (cell) {
        cell.state = p;
      }
    }
  }

  return cells;
}

export type DailyOpeningHours = Readonly<
  Pick<ApplicationRoundTimeSlotNode, "weekday" | "closed" | "reservableTimes">[]
>;

function getOpeningHours(
  day: number,
  openingHours?: DailyOpeningHours
): Readonly<OpeningHourPeriod[]> | null {
  if (!openingHours) {
    return null;
  }
  const dayOpeningHours = openingHours.find((oh) => oh.weekday === day);
  if (!dayOpeningHours) {
    return null;
  }
  if (dayOpeningHours.closed) {
    return null;
  }
  return dayOpeningHours.reservableTimes ?? null;
}

type OpeningHourPeriod = {
  begin: string;
  end: string;
} | null;

function cellLabel(row: number): string {
  return `${row} - ${row + 1}`;
}

export function covertCellsToTimeRange(
  cells: Cell[][]
): SuitableTimeRangeFormValues[] {
  return cellsToApplicationEventSchedules(cells).map((aes) => {
    const { day, begin, end, priority } = aes;
    return {
      beginTime: formatTimeStruct({ hour: begin, minute: 0 }),
      endTime: formatTimeStruct({ hour: end, minute: 0 }),
      priority: transformCellType(priority),
      dayOfTheWeek: transformWeekday(day),
    };
  });
}

export function isSelected(cellType: CellType): boolean {
  return cellType === "primary" || cellType === "secondary";
}

function transformCellType(cellType: CellType): Priority {
  switch (cellType) {
    case "primary":
      return Priority.Primary;
    case "secondary":
      return Priority.Secondary;
    default:
      throw new Error(`Unknown cell type: ${cellType}`);
  }
}

type AesType = {
  day: Day;
  begin: number;
  end: number;
  priority: CellType;
};

function combineTimespans(
  prev: Timespan[],
  current: {
    begin: number;
    end: number;
    priority: CellType;
  }
): Timespan[] {
  if (!prev.length) {
    return [current];
  }
  const prevCell = prev[prev.length - 1];
  if (prevCell == null) {
    throw new Error("prevCell is null");
  }
  if (
    prevCell.end === current.begin &&
    prevCell.priority === current.priority
  ) {
    return [
      ...prev.slice(0, prev.length - 1),
      {
        begin: prevCell.begin,
        end: prevCell.end + 1,
        priority: prevCell.priority,
      },
    ];
  }
  return [...prev, current];
}

function cellsToApplicationEventSchedules(cells: Cell[][]): AesType[] {
  const daySchedules: AesType[] = [];
  if (cells.length > 7) {
    throw new Error("Too many days");
  }
  const range = [0, 1, 2, 3, 4, 5, 6] as const;
  for (const day of range) {
    const dayCells = cells[day] ?? [];
    const transformedDayCells = dayCells
      .filter((cell) => cell.state !== "unavailable" && cell.state !== "open")
      .map((cell) => ({
        begin: cell.hour,
        end: cell.hour + 1,
        priority: cell.state,
      }))
      .reduce<Timespan[]>(combineTimespans, [])
      .map((span) => ({
        ...span,
        day,
      }));
    daySchedules.push(...transformedDayCells);
  }
  return daySchedules;
}
