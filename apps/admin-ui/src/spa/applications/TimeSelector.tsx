import React from "react";
import { Priority, type ApplicationAdminQuery } from "@gql/gql-types";
import { convertWeekday } from "common/src/conversion";
import { filterNonNullable } from "common/src/helpers";
import { WEEKDAYS } from "common/src/const";
import { ApplicationTimeSelector, type Cell } from "common/src/components/ApplicationTimeSelector";
import { useTranslation } from "react-i18next";

type ApplicationType = NonNullable<ApplicationAdminQuery["application"]>;
type ApplicationSectionType = NonNullable<ApplicationType["applicationSections"]>[0];
type SuitableTimeRangeType = NonNullable<ApplicationSectionType["suitableTimeRanges"]>[0];
type TimeSelectorProps = {
  applicationSection: ApplicationSectionType;
};

// TODO there is a form version of this in timeSelectorModule.tsx
// the logic is the same (but types are different)
function timeRangeToCell(timeRanges: SuitableTimeRangeType[]): Cell[][] {
  const firstSlotStart = 7;
  const lastSlotStart = 23;

  const cells: Cell[][] = [];

  for (const j of WEEKDAYS) {
    const day: Cell[] = [];
    for (let i = firstSlotStart; i <= lastSlotStart; i += 1) {
      day.push({
        hour: i,
        day: j,
        state: "none",
        // TODO need open and close times for the reservation unit
        openState: "open",
      });
    }
    cells.push(day);
  }

  for (const timeRange of timeRanges) {
    const { dayOfTheWeek, beginTime, endTime, priority } = timeRange;
    // TODO conversion functions from API time to frontend format
    const hourBegin = Number(beginTime.substring(0, 2)) - firstSlotStart;
    const hourEnd = (Number(endTime.substring(0, 2)) || 24) - firstSlotStart;

    const day = convertWeekday(dayOfTheWeek);
    for (let h = hourBegin; h < hourEnd; h += 1) {
      const cell = cells[day]?.[h];
      if (cell) {
        const p = priority === Priority.Primary ? "primary" : "secondary";
        cell.state = p;
      }
    }
  }

  return cells;
}

export function TimeSelector({ applicationSection }: TimeSelectorProps): JSX.Element {
  const { t } = useTranslation();
  const schedules = filterNonNullable(applicationSection.suitableTimeRanges);
  const cells = timeRangeToCell(schedules);

  return <ApplicationTimeSelector cells={cells} aria-label={t("application:TimeSelector.calendarLabel")} />;
}
