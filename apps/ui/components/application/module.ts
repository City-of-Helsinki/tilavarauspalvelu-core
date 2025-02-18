import { type SuitableTimeRangeFormValues } from "./form";
import { ApplicationRoundTimeSlotNode, Priority } from "@/gql/gql-types";
import { convertWeekday, Day, transformWeekday } from "common/src/conversion";
import {
  filterNonNullable,
  formatApiTimeInterval,
  timeToMinutes,
} from "common/src/helpers";

export type ApplicationEventSchedulePriority = 50 | 100 | 200 | 300;

export type Cell = {
  hour: number;
  label: string;
  state: ApplicationEventSchedulePriority;
  key: string;
};

type ApplicationEventScheduleType = {
  day: Day;
  begin: string;
  end: string;
  priority: number;
};

type Timespan = {
  begin: number;
  end: number;
  priority: ApplicationEventSchedulePriority;
};

export function aesToCells(
  schedule: SuitableTimeRangeFormValues[],
  openingHours?: DailyOpeningHours
): Cell[][] {
  const firstSlotStart = 7;
  const lastSlotStart = 23;

  const cells: Cell[][] = [];

  for (let j = 0; j < 7; j += 1) {
    const day: Cell[] = [];
    const openingHoursForADay = getOpeningHours(j, openingHours);
    const dayOpeningHours = filterNonNullable(openingHoursForADay).map((t) => ({
      begin: t && +t.begin.split(":")[0],
      end: t && +t.end.split(":")[0] === 0 ? 24 : t && +t.end.split(":")[0],
    }));
    // state is 50 if the cell is outside the opening hours, 100 if it's inside
    for (let i = firstSlotStart; i <= lastSlotStart; i += 1) {
      const isAvailable = dayOpeningHours.some(
        (t) => t.begin != null && t.end != null && t?.begin <= i && t?.end > i
      );
      day.push({
        key: `${i}-${j}`,
        hour: i,
        label: cellLabel(i),
        state: isAvailable ? 100 : 50,
      });
    }
    cells.push(day);
  }

  for (const aes of schedule) {
    const { dayOfTheWeek, priority } = aes;
    const hourBegin = timeToMinutes(aes.beginTime) / 60 - firstSlotStart;
    const hourEnd = (timeToMinutes(aes.endTime) / 60 || 24) - firstSlotStart;
    const p = priority === Priority.Primary ? 300 : (200 as const);
    const day = convertWeekday(dayOfTheWeek);
    for (let h = hourBegin; h < hourEnd; h += 1) {
      const cell = cells[day][h];
      if (cell) {
        cell.state = p;
      }
    }
  }

  return cells;
}

type DailyOpeningHours = Pick<
  ApplicationRoundTimeSlotNode,
  "weekday" | "closed" | "reservableTimes"
>[];

function getOpeningHours(
  day: number,
  openingHours?: DailyOpeningHours
): OpeningHourPeriod[] | null {
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
  cells: Cell[][][]
): SuitableTimeRangeFormValues[][] {
  // So this returns them as:
  // applicationSections (N)
  // - ApplicationEventSchedule[][]: Array(7) (i is the day)
  // - ApplicationEventSchedule[]: Array(M) (j is the continuous block)
  // priority: 200 | 300 (200 is secondary, 300 is primary)
  // priority: 100 (? assuming it's not selected)
  const selectedAppEvents = cells
    .map((cell) => cellsToApplicationEventSchedules(cell))
    .map((aes) =>
      aes.filter((ae) => ae.priority === 300 || ae.priority === 200)
    );
  // this seems to work except
  // TODO: day is incorrect (empty days at the start are missing, and 200 / 300 priority on the same day gets split into two days)
  // TODO refactor the Cell -> ApplicationEventSchedule conversion to use FormTypes
  return selectedAppEvents.map((appEventSchedule) => {
    const val: SuitableTimeRangeFormValues[] = appEventSchedule.map(
      (appEvent) => {
        const { day } = appEvent;
        return {
          beginTime: appEvent.begin,
          endTime: appEvent.end,
          // The default will never happen (it's already filtered)
          // TODO type this better
          priority:
            appEvent.priority === 300 ? Priority.Primary : Priority.Secondary,
          dayOfTheWeek: transformWeekday(day),
        };
      }
    );
    return val;
  });
}

export function cellsToApplicationEventSchedules(
  cells: Cell[][]
): ApplicationEventScheduleType[] {
  const daySchedules: ApplicationEventScheduleType[] = [];
  if (cells.length > 7) {
    throw new Error("Too many days");
  }
  const range = [0, 1, 2, 3, 4, 5, 6] as const;
  for (const day of range) {
    const dayCells = cells[day];
    const transformedDayCells = dayCells
      .filter((cell) => cell.state)
      .map((cell) => ({
        begin: cell.hour,
        end: cell.hour + 1,
        priority: cell.state,
      }))
      .reduce<Timespan[]>((prev, current) => {
        if (!prev.length) {
          return [current];
        }
        if (
          prev[prev.length - 1].end === current.begin &&
          prev[prev.length - 1].priority === current.priority
        ) {
          return [
            ...prev.slice(0, prev.length - 1),
            {
              begin: prev[prev.length - 1].begin,
              end: prev[prev.length - 1].end + 1,
              priority: prev[prev.length - 1].priority,
            },
          ];
        }
        return [...prev, current];
      }, [])
      .map((cell) => ({
        day,
        begin: `${formatNumber(cell.begin)}:00`,
        end: `${formatNumber(cell.end)}:00`,
        priority: cell.priority,
      }));
    daySchedules.push(...transformedDayCells);
  }
  return daySchedules;
}

/// unsafe
function formatNumber(n: number): string {
  if (n < 0) {
    throw new Error("Negative number");
  }
  if (n > 23) {
    return "00";
  }
  if (n < 10) {
    return `0${n}`;
  }
  return `${n}`;
}

export function getDayTimes(
  schedule: Omit<SuitableTimeRangeFormValues, "pk" | "priority">[],
  day: number
) {
  return schedule
    .filter((s) => convertWeekday(s.dayOfTheWeek) === day)
    .map((s) => formatApiTimeInterval(s))
    .join(", ");
}
