"use client";

// A native <table role="grid"> is the APG pattern for a keyboard-navigable grid. The row, cell and header
// roles are spelled out even though the table elements imply them, because not every assistive technology
// (or test tool) derives them from a table that has been given the grid role.
// oxlint-disable jsx-a11y/no-noninteractive-element-to-interactive-role, jsx-a11y/no-redundant-roles, jsx-a11y/no-interactive-element-to-noninteractive-role

import React, { forwardRef, useImperativeHandle, useMemo } from "react";
import type { ForwardedRef, ReactElement, Ref } from "react";
import { WEEKDAYS_SORTED } from "@ui/modules/const";
import { formatTimeRange, minutesToHoursString } from "@ui/modules/date-utils";
import type { Weekday } from "../../../gql/gql-types";
import { LiveRegion, SkipLink } from "../CalendarGrid/styles";
import { WeeklyPatternRoot } from "./styles";
import type { CalendarData, WeeklyPatternCalendarProps, WeeklyPatternCellInfo, WeeklyPatternHandle } from "./types";
import { useWeeklyPatternCalendar } from "./useWeeklyPatternCalendar";

const NOOP = () => {};
const NO_ANNOUNCEMENTS = { painted: "", erased: "" };

const pad = (value: number) => value.toString().padStart(2, "0");

/** 24 hour clock text. The end of the day reads as 24:00. */
function formatClock(minutes: number): string {
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
}

function formatRange(beginMinutes: number, endMinutes: number): string {
  return `${formatClock(beginMinutes)}–${formatClock(endMinutes)}`;
}

// Monday 1 January 2024, so WEEKDAYS_SORTED's index is the day offset.
function weekdayNames(locale: string, style: "long" | "short"): Record<Weekday, string> {
  const formatter = new Intl.DateTimeFormat(locale, { weekday: style, timeZone: "UTC" });
  return Object.fromEntries(
    WEEKDAYS_SORTED.map((weekday, offset) => [weekday, formatter.format(new Date(Date.UTC(2024, 0, 1 + offset)))])
  ) as Record<Weekday, string>;
}

function WeeklyPatternTable<TData extends CalendarData>(
  props: WeeklyPatternCalendarProps<TData>,
  ref: ForwardedRef<WeeklyPatternHandle>
): ReactElement {
  const {
    value,
    onChange = NOOP,
    onBlur,
    name,
    disabled,
    readOnly,
    announcements = NO_ANNOUNCEMENTS,
    step,
    availability,
    visibleHours,
    brush,
    isDataEqual,
    isValidPaint,
    locale,
    getStateLabel,
    getCellAppearance,
    getCellProps,
    alternative,
    className,
    style,
    ...tableAttributes
  } = props;

  const longNames = useMemo(() => weekdayNames(locale, "long"), [locale]);

  const grid = useWeeklyPatternCalendar({
    value,
    onChange,
    onBlur,
    step,
    availability,
    visibleHours,
    brush,
    isDataEqual,
    isValidPaint,
    readOnly,
    disabled,
    announcements,
    describeSpan: (weekday, beginMinutes, endMinutes) =>
      `${longNames[weekday]}, ${formatRange(beginMinutes, endMinutes)}`,
  });

  useImperativeHandle(ref, () => ({ focus: grid.focus }), [grid.focus]);

  // The first cell of a run names the whole run. The cells after it name only themselves.
  const getCellLabel = (cell: WeeklyPatternCellInfo<TData>) => {
    const [begin, end] = cell.isRunStart
      ? [cell.runBeginMinutes, cell.runEndMinutes]
      : [cell.beginMinutes, cell.endMinutes];
    return `${longNames[cell.weekday]}, ${formatRange(begin, end)}, ${getStateLabel(cell)}`;
  };

  // A run's first cell shows where it starts, its last where it ends, the rest a connector.
  // A run of two cells or fewer shows the whole range once, on its last cell.
  const getCellContent = (cell: WeeklyPatternCellInfo<TData>): string | null => {
    if (!cell.painted) {
      return minutesToHoursString(cell.beginMinutes, true);
    }
    if (cell.runEndMinutes - cell.runBeginMinutes <= 2 * step) {
      return cell.isRunEnd ? formatTimeRange(cell.runBeginMinutes, cell.runEndMinutes) : null;
    }
    if (cell.isRunStart) {
      return minutesToHoursString(cell.beginMinutes, true);
    }
    return "|";
  };

  return (
    <>
      <SkipLink href={`#${alternative.id}`}>{alternative.label}</SkipLink>
      <WeeklyPatternRoot className={className} style={style}>
        <table
          {...tableAttributes}
          {...grid.tableHandlers}
          role="grid"
          aria-multiselectable="true"
          aria-readonly={readOnly || undefined}
          aria-disabled={disabled || undefined}
          data-name={name}
          data-readonly={readOnly ? "" : undefined}
          data-disabled={disabled ? "" : undefined}
        >
          <colgroup>
            <col />
            {grid.days.map((weekday) => (
              <col key={weekday} />
            ))}
          </colgroup>
          <thead>
            <tr role="row">
              {/* The corner above the time labels is not a column header, so it is a plain td. */}
              <td aria-hidden />
              {grid.days.map((weekday) => (
                <th key={weekday} role="columnheader" scope="col">
                  {longNames[weekday]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.rows.map((row) => (
              <tr key={row.index} role="row">
                {row.headerRowSpan != null && (
                  <th
                    role="rowheader"
                    scope="row"
                    rowSpan={row.headerRowSpan}
                    aria-label={formatClock(row.beginMinutes)}
                  >
                    {Math.floor(row.beginMinutes / 60)}
                  </th>
                )}
                {grid.days.map((weekday) => {
                  const cell = grid.cellInfo(weekday, row.index);
                  const appearance = cell.data ? getCellAppearance?.(cell.data) : undefined;
                  return (
                    <td
                      key={weekday}
                      role="gridcell"
                      {...getCellProps?.(cell)}
                      {...grid.cellBehaviour(weekday, row.index)}
                      aria-label={getCellLabel(cell)}
                      aria-selected={cell.selected}
                      aria-disabled={cell.availability === "closed" ? true : undefined}
                      data-weekday={weekday}
                      data-begin-minutes={cell.beginMinutes}
                      data-availability={cell.availability}
                      data-appearance={appearance}
                      data-selected={cell.selected ? "" : undefined}
                      data-hour-start={cell.beginMinutes % 60 === 0 ? "" : undefined}
                      data-time-start={formatClock(cell.beginMinutes)}
                      data-time-end={formatClock(cell.endMinutes)}
                      data-runtime-start={minutesToHoursString(cell.runBeginMinutes, true)}
                      data-runtime-end={minutesToHoursString(cell.runEndMinutes, true)}
                      data-run-start={cell.isRunStart ? "" : undefined}
                      data-run-end={cell.isRunEnd ? "" : undefined}
                    >
                      {getCellContent(cell)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <LiveRegion role="status" aria-live="polite" aria-atomic="true">
          {grid.liveMessage}
        </LiveRegion>
      </WeeklyPatternRoot>
    </>
  );
}

// forwardRef erases the generic. The cast restores it for call sites.
export const WeeklyPatternCalendar = forwardRef(WeeklyPatternTable) as <TData extends CalendarData>(
  props: WeeklyPatternCalendarProps<TData> & { ref?: Ref<WeeklyPatternHandle> }
) => ReactElement;
