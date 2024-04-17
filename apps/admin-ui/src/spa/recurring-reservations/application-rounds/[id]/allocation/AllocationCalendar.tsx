import { IconCheck, IconCross } from "hds-react";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import styled, { css } from "styled-components";
import { fontMedium } from "common/src/common/typography";
import { filterNonNullable } from "common/src/helpers";
import {
  type ApplicationSectionNode,
  type ReservationUnitOptionNode,
  Weekday,
  ApplicationSectionStatusChoice,
  type AllocatedTimeSlotNode,
  type SuitableTimeRangeNode,
} from "common/types/gql-types";
import { breakpoints } from "common";
import { type Day } from "common/src/conversion";
import { transformWeekday } from "common/src/conversion";
import { WEEKDAYS } from "common/src/const";
import { ALLOCATION_CALENDAR_TIMES } from "@/common/const";
import {
  applicationEventSchedulesToCells,
  getTimeSeries,
  timeSlotKeyToTime,
  type Cell,
  parseApiTime,
  encodeTimeSlot,
  type RelatedSlot,
} from "./modules/applicationRoundAllocation";
import {
  useFocusAllocatedSlot,
  useFocusApplicationEvent,
  useSlotSelection,
} from "./hooks";

type Props = {
  applicationSections: ApplicationSectionNode[] | null;
  relatedAllocations: RelatedSlot[][];
};

// grid:s have some weird scaling rules, the easiest way to make the center scale reasonably is with media queries
// auto / max-width cause jumping element sizes when either of the side elements change
const Wrapper = styled.div`
  display: grid;
  user-select: none;
  margin-top: var(--spacing-l);
  grid-template-columns: 36px repeat(7, 32px);
  @media (width > ${breakpoints.xl}) {
    grid-template-columns: 36px repeat(7, 48px);
  }

  /* custom breakpoint since this is the only page that really cares about having 1200px for content (not content + navi) */
  @media (width > 1400px) {
    grid-template-columns: 36px repeat(7, 60px);
  }
`;

const DayLabel = styled.div`
  display: flex;
  justify-content: center;
  height: var(--spacing-l);
`;

const CalendarSlot = styled.div<{
  $selected?: boolean;
  $eventCount?: number;
  $isAccepted?: boolean;
  $isDeclined?: boolean;
  $isRelated?: boolean;
}>`
  ${fontMedium};
  font-size: var(--fontsize-body-m);
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  width: calc(100% - 4px);
  height: 38px;
  background-color: var(--color-black-10);
  margin-bottom: 4px;
  cursor: pointer;
  ${({ $eventCount, $isAccepted, $isDeclined, $isRelated }) => {
    if ($isAccepted) {
      return css`
        background-color: var(--color-success);
        color: var(--color-white);
      `;
    }
    if ($isRelated) {
      return css`
        background-color: var(--color-black-70);
        color: var(--color-white);
      `;
    }
    if ($isDeclined) {
      return css`
        background-color: var(--color-black-30);
        color: var(--color-black);
      `;
    }
    if ($eventCount && $eventCount > 10) {
      return css`
        background-color: var(--color-gold-dark);
      `;
    }
    if ($eventCount && $eventCount > 3) {
      return css`
        background-color: var(--color-summer-medium-light);
      `;
    }
    if ($eventCount && $eventCount > 1) {
      return css`
        background-color: var(--color-summer-light);
      `;
    }
    if ($eventCount && $eventCount > 0) {
      return css`
        background-color: var(--color-tram-light);
      `;
    }
  }}
`;

const Selection = styled.div<{ $isFirst: boolean; $isLast: boolean }>`
  position: absolute;
  width: calc(100% + 4px);
  height: calc(100% + 4px);
  background-color: rgba(0, 0, 0, 0.1);
  border: 2px solid var(--color-black);
  border-top-width: 0;
  border-bottom-width: 0;
  ${({ $isFirst }) =>
    $isFirst &&
    css`
      border-top-width: 2px;
    `}
  ${({ $isLast }) =>
    $isLast &&
    css`
      border-bottom-width: 2px;
    `}
`;

const Active = styled.div<{
  $isFirst: boolean;
  $isLast: boolean;
  $isAllocated?: boolean;
}>`
  position: absolute;
  width: calc(100%);
  height: calc(100% + 2px);
  border: ${({ $isAllocated }) =>
    $isAllocated
      ? "2px solid var(--color-black)"
      : "2px dashed var(--color-bus)"};
  border-top-width: 0;
  border-bottom-width: 0;
  ${({ $isFirst }) =>
    $isFirst &&
    css`
      border-top-width: 2px;
    `}
  ${({ $isLast }) =>
    $isLast &&
    css`
      border-bottom-width: 2px;
    `}
`;

const HourLabel = styled(CalendarSlot)<{ $hour?: boolean }>`
  border-top: 1px solid transparent;
  ${({ $hour }) => $hour && "border-color: var(--color-black-20);"}
  width: var(--fontsize-heading-l);
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: transparent;
  box-sizing: border-box;
  font-family: var(--font-medium);
  font-weight: 500;
  font-size: var(--fontsize-body-m);
`;

const isSlotFirst = (selection: string[], slot: string): boolean => {
  const [day, hour, minute] = slot.split("-").map(Number);
  return minute === 0
    ? !selection.includes(`${day}-${hour - 1}-30`)
    : !selection.includes(`${day}-${hour}-00`);
};

const isSlotLast = (selection: string[], slot: string): boolean => {
  const [day, hour, minute] = slot.split("-").map(Number);
  return minute === 0
    ? !selection.includes(`${day}-${hour}-30`)
    : !selection.includes(`${day}-${hour + 1}-00`);
};

// Assume that this is already filtered by the day
// TODO Not a good name it should match the Cell type (which isn't great either)
type Slot = {
  day: Day;
  cell: string;
  allocated: boolean;
  minutes: number;
};
function addTimeSlotToArray(
  arr: Slot[],
  slot: { beginTime: string; endTime: string },
  day: Day,
  allocated: boolean
) {
  const { beginTime, endTime } = slot;
  const begin = parseApiTime(beginTime);
  const end = parseApiTime(endTime);
  if (!begin || !end) {
    return;
  }
  const beginMinutes = begin * 60;
  const endMinutes = end * 60;
  for (let i = beginMinutes; i < endMinutes; i += 30) {
    const cell = i / 60;
    const key = encodeTimeSlot(day, cell);
    arr.push({ day, cell: key, allocated, minutes: i });
  }
}

export function AllocationCalendar({
  applicationSections,
  relatedAllocations,
}: Props): JSX.Element {
  const [selection, setSelection] = useSlotSelection();
  const [isSelecting, setIsSelecting] = useState(false);
  const [cells] = useState(
    applicationEventSchedulesToCells(
      ALLOCATION_CALENDAR_TIMES[0],
      ALLOCATION_CALENDAR_TIMES[1]
    )
  );

  const [focused] = useFocusApplicationEvent();
  const focusedApplicationEvent = applicationSections?.find(
    (ae) => ae.pk === focused
  );
  const [focusedAllocated] = useFocusAllocatedSlot();

  const handleFinishSelection = () => {
    setIsSelecting(false);
  };

  const aesForThisUnit = filterNonNullable(applicationSections);
  return (
    <Wrapper>
      <div>
        <DayLabel />
        {cells[0].map((cell) => {
          const key = `${cell.hour}-${cell.minute}`;
          return cell.minute === 0 ? (
            <HourLabel $hour key={key}>
              {cell.hour}
            </HourLabel>
          ) : (
            <HourLabel key={key} />
          );
        })}
      </div>
      {WEEKDAYS.map((day) => {
        // Only show allocated that match the unit and day
        const timeslots = filterNonNullable(
          aesForThisUnit
            .filter(
              (ae) => ae.status !== ApplicationSectionStatusChoice.Handled
            )
            .filter((ae) =>
              ae.suitableTimeRanges?.some(
                (tr) => tr.dayOfTheWeek === transformWeekday(day)
              )
            )
        );

        const resUnits = filterNonNullable(
          aesForThisUnit?.flatMap((ae) => ae.reservationUnitOptions)
        );

        const isDay = (slot: AllocatedTimeSlotNode | SuitableTimeRangeNode) =>
          slot.dayOfTheWeek === transformWeekday(day);
        // TODO wrap this into a function? we need the same for focused
        // TODO do we have to do it like this? or should we split the data (similar to Column / Cards)?
        // reason why it's needed is because we need per day time slot data but all of the section data (the section includes all the days)
        const allocated = resUnits
          .filter((a) => a.allocatedTimeSlots?.some(isDay))
          .map((a) => ({
            ...a,
            allocatedTimeSlots: a.allocatedTimeSlots?.filter(isDay),
          }));

        // this should transform it into
        // so focused: Array<{ beginTime, endTime, allocated: boolean }>
        // then use a separate map to transform it into the cells (we want to remove the cell type completely)
        const focusedTimeSlots = filterNonNullable(
          focusedApplicationEvent?.suitableTimeRanges?.filter(isDay)
        );
        const focusedAllocatedTimeSlots =
          focusedAllocated != null
            ? allocated.filter((a) =>
                a.allocatedTimeSlots?.some((ts) => ts.pk === focusedAllocated)
              )
            : focusedApplicationEvent?.reservationUnitOptions
                ?.filter((a) => a.allocatedTimeSlots?.some(isDay))
                .map((a) => ({
                  ...a,
                  allocatedTimeSlots: a.allocatedTimeSlots?.filter(isDay),
                }));

        const focusedSlots: Slot[] = [];
        if (focusedAllocated == null) {
          for (const ts of focusedTimeSlots) {
            addTimeSlotToArray(focusedSlots, ts, day, false);
          }
        }

        for (const a of filterNonNullable(focusedAllocatedTimeSlots)) {
          if (!a.allocatedTimeSlots) {
            continue;
          }
          for (const ts of a.allocatedTimeSlots) {
            if (focusedAllocated != null && focusedAllocated !== ts.pk) {
              continue;
            }
            addTimeSlotToArray(focusedSlots, ts, day, true);
          }
        }

        return (
          <CalendarDay
            key={`day-${day}`}
            allocated={allocated}
            suitable={timeslots}
            day={day}
            cells={cells}
            isSelecting={isSelecting}
            selection={selection}
            setSelection={setSelection}
            onFinishSelection={handleFinishSelection}
            onStartSelection={(key: string) => {
              setIsSelecting(true);
              setSelection([key]);
            }}
            relatedTimeSpans={relatedAllocations[day] ?? []}
            focusedSlots={focusedSlots}
          />
        );
      })}
    </Wrapper>
  );
}

// TODO combine with isInsideSelection in AllocationColumn
function checkCell(
  day: Day,
  cell: Cell,
  ts: {
    dayOfTheWeek: Weekday;
    beginTime: string;
    endTime: string;
  }
) {
  const { beginTime, endTime, dayOfTheWeek } = ts;
  if (dayOfTheWeek !== transformWeekday(day)) {
    return false;
  }
  // NOTE if the end time is 00:00 swap it to 24:00 (24h)
  const begin = parseApiTime(beginTime);
  const end = parseApiTime(endTime);
  if (begin == null || end == null) {
    return false;
  }
  const cellTime = cell.hour * 60 + cell.minute;
  const beginMinutes = begin * 60;
  const endMinutes = (end === 0 ? 24 : end) * 60;
  return cellTime >= beginMinutes && cellTime < endMinutes;
}

function isInRange(ae: ApplicationSectionNode, cell: Cell, day: Day) {
  return (
    ae.suitableTimeRanges?.some((tr) => {
      return checkCell(day, cell, tr);
    }) ?? false
  );
}

function isAllocated(ae: ReservationUnitOptionNode, cell: Cell, day: Day) {
  return ae.allocatedTimeSlots
    ?.map((tr) => {
      return checkCell(day, cell, tr);
    })
    .some((x) => x);
}

// TODO filter this before passing it to the component
// so it should be Cell[] not Cell[][]
// the allocated / suitable should be filtered by day
// focused should be filtered by day
// remove day if possible (key's might require it)
function CalendarDay({
  allocated,
  suitable,
  day,
  cells,
  isSelecting,
  selection,
  setSelection,
  onFinishSelection,
  onStartSelection,
  focusedSlots,
  relatedTimeSpans,
}: {
  allocated: ReservationUnitOptionNode[];
  suitable: ApplicationSectionNode[];
  day: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  cells: Cell[][];
  isSelecting: boolean;
  selection: string[];
  setSelection: (selection: string[]) => void;
  onFinishSelection: () => void;
  onStartSelection: (key: string) => void;
  focusedSlots: Slot[];
  relatedTimeSpans: RelatedSlot[];
}): JSX.Element {
  const { t } = useTranslation();

  const handleMouseEnter = (cell: (typeof cells)[0][0]) => {
    if (isSelecting && selection.length > 0) {
      const [d] = selection ? selection[0].split("-") : cell.key.split("-");
      const timeSeries = [...selection, cell.key].sort((a, b) => {
        return timeSlotKeyToTime(a) - timeSlotKeyToTime(b);
      });
      const newSelection = getTimeSeries(
        d,
        timeSeries[0],
        timeSeries[timeSeries.length - 1]
      );
      setSelection(newSelection);
    }
  };

  const focused = focusedSlots.filter((x) => x.day === day);
  return (
    <div key={`day-${day}`}>
      <DayLabel>{t(`dayShort.${day}`)}</DayLabel>
      {cells[day].map((cell) => {
        const foundAes = suitable.filter((aes) => isInRange(aes, cell, day));
        const isSlotDeclined = false;
        const isAccepted = allocated.some((aes) => isAllocated(aes, cell, day));
        const slotEventCount = foundAes.length;
        const focusedSlot = focused.find(
          (x) => x.minutes === cell.hour * 60 + cell.minute
        );
        const isFocused = focusedSlot != null;
        // TODO these don't look nice and don't work if the array is not presorted
        const isFocusedFirst =
          focused.length > 0 &&
          focused[0].minutes === cell.hour * 60 + cell.minute;
        const isFocusedLast =
          focused.length > 0 &&
          focused[focused.length - 1].minutes === cell.hour * 60 + cell.minute;
        const isInsideRelatedTimeSpan =
          relatedTimeSpans?.some((ts) => {
            return (
              ts.beginTime <= cell.hour * 60 + cell.minute &&
              ts.endTime > cell.hour * 60 + cell.minute
            );
          }) ?? false;
        return (
          <CalendarSlot
            key={cell.key}
            onMouseDown={() => onStartSelection(cell.key)}
            onMouseUp={onFinishSelection}
            onMouseEnter={() => handleMouseEnter(cell)}
            $eventCount={slotEventCount}
            $isAccepted={isAccepted}
            $isDeclined={isSlotDeclined}
            $isRelated={isInsideRelatedTimeSpan}
          >
            {isAccepted || isInsideRelatedTimeSpan ? (
              <IconCheck />
            ) : isSlotDeclined ? (
              <IconCross />
            ) : slotEventCount > 0 ? (
              slotEventCount
            ) : null}
            {/* Border styling done weirdly with absolute positioning */}
            {selection.includes(cell.key) && (
              <Selection
                $isFirst={isSlotFirst(selection, cell.key)}
                $isLast={isSlotLast(selection, cell.key)}
              />
            )}
            {isFocused && (
              <Active
                $isAllocated={focusedSlot.allocated}
                $isFirst={isFocusedFirst}
                $isLast={isFocusedLast}
              />
            )}
          </CalendarSlot>
        );
      })}
    </div>
  );
}
