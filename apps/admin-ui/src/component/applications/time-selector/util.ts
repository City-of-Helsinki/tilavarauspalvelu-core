import type { ApplicationEventScheduleNode } from "common/types/gql-types";
import type { ApplicationEventSchedulePriority } from "common/types/common";

export type Cell = {
  hour: number;
  label: string;
  state?: ApplicationEventSchedulePriority;
  key: string;
};

const cellLabel = (row: number): string => {
  return `${row} - ${row + 1}`;
};

export const applicationEventSchedulesToCells = (
  applicationEventSchedules: ApplicationEventScheduleNode[]
): Cell[][] => {
  const firstSlotStart = 7;
  const lastSlotStart = 23;

  const cells = [] as Cell[][];

  for (let j = 0; j < 7; j += 1) {
    const day = [];
    for (let i = firstSlotStart; i <= lastSlotStart; i += 1) {
      day.push({
        key: `${i}-${j}`,
        hour: i,
        label: cellLabel(i),
      } as Cell);
    }
    cells.push(day);
  }

  applicationEventSchedules.forEach((applicationEventSchedule) => {
    const { day } = applicationEventSchedule;
    if (day == null) return;
    const hourBegin =
      Number(applicationEventSchedule.begin.substring(0, 2)) - firstSlotStart;

    const hourEnd =
      (Number(applicationEventSchedule.end.substring(0, 2)) || 24) -
      firstSlotStart;

    const { priority } = applicationEventSchedule;
    for (let h = hourBegin; h < hourEnd; h += 1) {
      const cell = cells[day][h];
      cell.state = priority === 300 || priority === 200 ? priority : 100;
    }
  });

  return cells;
};
