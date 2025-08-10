import { IconCheck, IconCross } from "hds-react";
import React, { useState } from "react";
import { useTranslation } from "next-i18next";
import styled, { css } from "styled-components";
import { filterNonNullable, timeToMinutes } from "common/src/helpers";
import { ApplicationSectionStatusChoice, type SuitableTimeRangeNode } from "@gql/gql-types";
import { fontMedium } from "common/styled";
import { breakpoints, type DayT, WEEKDAYS } from "common/src/const";
import { transformWeekday } from "common/src/conversion";
import { ALLOCATION_CALENDAR_TIMES } from "@/common/const";
import {
  applicationEventSchedulesToCells,
  getTimeSeries,
  timeSlotKeyToTime,
  type Cell,
  encodeTimeSlot,
  type RelatedSlot,
  isInsideCell,
  convertPriorityFilter,
  type SectionNodeT,
  ReservationUnitOptionNodeT,
} from "./modules/applicationRoundAllocation";
import { useFocusAllocatedSlot, useFocusApplicationEvent, useSlotSelection } from "./hooks";
import { useGetFilterSearchParams } from "@/hooks";

type Props = {
  applicationSections: SectionNodeT[];
  relatedAllocations: RelatedSlot[][];
};

// grid:s have some weird scaling rules, the easiest way to make the center scale reasonably is with media queries
// auto / max-width cause jumping element sizes when either of the side elements change
const Wrapper = styled.div`
  display: grid;
  user-select: none;
  margin-top: var(--spacing-l);
  grid-template-columns: 36px repeat(7, 32px);
  @media (min-width: ${breakpoints.xl}) {
    grid-template-columns: 36px repeat(7, 48px);
  }

  /* custom breakpoint since this is the only page that really cares about having 1200px for content (not content + navi) */
  @media (min-width: 1400px) {
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
        background-color: var(--tilavaraus-allocation-calendar-colour-bg-allocated);
        color: var(--tilavaraus-allocation-calendar-colour-text-allocated);
      `;
    }
    if ($isRelated) {
      return css`
        background-color: var(--tilavaraus-allocation-calendar-colour-bg-allocated-elsewhere);
        color: var(--tilavaraus-allocation-calendar-colour-text-allocated-elsewhere);
      `;
    }
    if ($isDeclined) {
      return css`
        background-color: var(--tilavaraus-allocation-calendar-colour-bg-disabled);
        color: var(--tilavaraus-allocation-calendar-colour-text-disabled);
      `;
    }
    if ($eventCount && $eventCount > 10) {
      return css`
        background-color: var(--tilavaraus-allocation-calendar-colour-bg-full);
        color: var(--tilavaraus-allocation-calendar-colour-text-full);
      `;
    }
    if ($eventCount && $eventCount > 4) {
      return css`
        background-color: var(--tilavaraus-allocation-calendar-colour-bg-many);
        color: var(--tilavaraus-allocation-calendar-colour-text-many);
      `;
    }
    if ($eventCount && $eventCount > 1) {
      return css`
        background-color: var(--tilavaraus-allocation-calendar-colour-bg-few);
        color: var(--tilavaraus-allocation-calendar-colour-text-few);
      `;
    }
    if ($eventCount && $eventCount > 0) {
      return css`
        background-color: var(--tilavaraus-allocation-calendar-colour-bg-one);
        color: var(--tilavaraus-allocation-calendar-colour-text-one);
      `;
    }
  }}
`;

const Selection = styled.div<{ $isFirst: boolean; $isLast: boolean }>`
  position: absolute;
  width: calc(100% + 4px);
  height: calc(100% + 4px);
  background-color: rgb(0, 0, 0, 0.1);
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
  border: ${({ $isAllocated }) => ($isAllocated ? "2px solid var(--color-black)" : "2px dashed var(--color-bus)")};
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
  if (day == null || hour == null || minute == null) {
    return false;
  }
  return minute === 0 ? !selection.includes(`${day}-${hour - 1}-30`) : !selection.includes(`${day}-${hour}-00`);
};

const isSlotLast = (selection: string[], slot: string): boolean => {
  const [day, hour, minute] = slot.split("-").map(Number);
  if (day == null || hour == null || minute == null) {
    return false;
  }
  return minute === 0 ? !selection.includes(`${day}-${hour}-30`) : !selection.includes(`${day}-${hour + 1}-00`);
};

// Assume that this is already filtered by the day
// TODO Not a good name it should match the Cell type (which isn't great either)
type Slot = {
  day: DayT;
  cell: string;
  allocated: boolean;
  minutes: number;
};
function addTimeSlotToArray(arr: Slot[], slot: { beginTime: string; endTime: string }, day: DayT, allocated: boolean) {
  const { beginTime, endTime } = slot;

  const beginMinutes = timeToMinutes(beginTime);
  const endM = timeToMinutes(endTime);
  const endMinutes = endM === 0 ? 24 * 60 : endM;
  for (let i = beginMinutes; i < endMinutes; i += 30) {
    const cell = i / 60;
    const key = encodeTimeSlot(day, cell);
    arr.push({ day, cell: key, allocated, minutes: i });
  }
}

function generateAllocatedSlots(allocated: ReservationUnitOptionNodeT[], day: DayT): Slot[] {
  const arr: Slot[] = [];
  for (const a of allocated) {
    if (!a.allocatedTimeSlots) {
      continue;
    }
    for (const ts of a.allocatedTimeSlots) {
      addTimeSlotToArray(arr, ts, day, true);
    }
  }
  return arr;
}

function isDay(slot: Pick<SuitableTimeRangeNode, "dayOfTheWeek">, day: DayT) {
  return slot.dayOfTheWeek === transformWeekday(day);
}

/// We have to have all allocated slots for the event in the original data
/// at some point (either here or in the draw function) those other days have to be removed
function removeOtherAllocatedDays(a: ReservationUnitOptionNodeT, day: DayT): ReservationUnitOptionNodeT {
  return {
    ...a,
    allocatedTimeSlots: a.allocatedTimeSlots?.filter((ts) => isDay(ts, day)),
  };
}

// Generate the focused slots for a selected application section
function generateFocusedSlots(focusedAes: SectionNodeT, day: DayT): Slot[] {
  const focusedTimeSlots = focusedAes.suitableTimeRanges.filter((ts) => isDay(ts, day));
  const focusedAllocatedTimeSlots = focusedAes.reservationUnitOptions
    .filter((a) => a.allocatedTimeSlots.some((ts) => isDay(ts, day)))
    .map((ts) => removeOtherAllocatedDays(ts, day));

  const focusedSlots: Slot[] = [];

  for (const ts of filterNonNullable(focusedTimeSlots)) {
    addTimeSlotToArray(focusedSlots, ts, day, false);
  }

  const tmp = filterNonNullable(focusedAllocatedTimeSlots);
  return focusedSlots.concat(generateAllocatedSlots(tmp, day));
}

function isInRange(ae: SectionNodeT, cell: Cell, day: DayT): boolean {
  return ae.suitableTimeRanges?.some((tr) => isInsideCell(day, cell, tr));
}

function isAllocated(ae: ReservationUnitOptionNodeT, cell: Cell, day: DayT): boolean {
  return ae.allocatedTimeSlots.map((tr) => isInsideCell(day, cell, tr)).some((x) => x);
}

function usePriorityFilteredApplicationSections(aes: Props["applicationSections"]): SectionNodeT[] {
  const { priorityFilter } = useGetFilterSearchParams();
  const priority = convertPriorityFilter(priorityFilter ?? []);

  return aes.map((ae) => {
    // if priority filter is set, we need to filter what is shown in calendar based on that
    // these are included in the backend request because we want to show them elsewhere, but not in the calendar
    if (priority.length > 0) {
      return {
        ...ae,
        suitableTimeRanges: ae.suitableTimeRanges.filter((tr) => priority.find((p) => p === tr.priority)),
      };
    }
    return ae;
  });
}

export function AllocationCalendar({ applicationSections, relatedAllocations }: Props): JSX.Element {
  const [cells] = useState(
    applicationEventSchedulesToCells(ALLOCATION_CALENDAR_TIMES[0], ALLOCATION_CALENDAR_TIMES[1])
  );

  const [focused] = useFocusApplicationEvent();
  const aes = usePriorityFilteredApplicationSections(applicationSections);
  const [focusedAllocated] = useFocusAllocatedSlot();

  const data = WEEKDAYS.map((day) => {
    const isNotHandled = (ae: (typeof aes)[0]) => ae.status !== ApplicationSectionStatusChoice.Handled;

    // Only show allocated that match the unit and day
    const timeslots = filterNonNullable(aes)
      .filter(isNotHandled)
      .filter((ae) => ae.suitableTimeRanges?.some((tr) => isDay(tr, day)));

    const resUnits = aes.flatMap((ae) => ae.reservationUnitOptions);

    const allocated = filterNonNullable(resUnits)
      .filter((a) => a.allocatedTimeSlots?.some((ts) => isDay(ts, day)))
      .map((ts) => removeOtherAllocatedDays(ts, day));

    const focusedAllocatedTimes = filterNonNullable(allocated).filter((a) =>
      a.allocatedTimeSlots.some((ts) => ts.pk === focusedAllocated)
    );

    const focusedApplicationSection = aes.find((ae) => ae.pk === focused);
    const focusedSlots =
      focusedAllocated == null && focusedApplicationSection != null
        ? generateFocusedSlots(focusedApplicationSection, day)
        : generateAllocatedSlots(focusedAllocatedTimes, day);

    return {
      day,
      allocated,
      timeslots,
      focusedSlots,
      relatedTimeSpans: relatedAllocations[day] ?? [],
    };
  });

  return (
    <Wrapper>
      <div>
        <DayLabel />
        {cells[0]?.map((cell) => {
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
      {data.map(({ day, allocated, timeslots, focusedSlots, relatedTimeSpans }) => (
        <CalendarDay
          key={`day-${day}`}
          allocated={allocated}
          suitable={timeslots}
          day={day}
          cells={cells[day] ?? []}
          relatedTimeSpans={relatedTimeSpans}
          focusedSlots={focusedSlots}
        />
      ))}
    </Wrapper>
  );
}

function useSelection() {
  const [selection, setSelection] = useSlotSelection();
  const [isSelecting, setIsSelecting] = useState(false);

  const handleFinishSelection = () => {
    setIsSelecting(false);
  };

  const handleStartSelection = (key: string) => {
    setIsSelecting(true);
    setSelection([key]);
  };

  return {
    selection,
    setSelection,
    isSelecting,
    handleFinishSelection,
    handleStartSelection,
  };
}

// TODO
// the allocated / suitable should be filtered by day
// focused should be filtered by day
// remove day if possible (key's might require it)
function CalendarDay({
  allocated,
  suitable,
  day,
  cells,
  focusedSlots,
  relatedTimeSpans,
}: {
  allocated: ReservationUnitOptionNodeT[];
  suitable: SectionNodeT[];
  day: DayT;
  cells: Cell[];
  focusedSlots: Slot[];
  relatedTimeSpans: RelatedSlot[];
}): JSX.Element {
  const { t } = useTranslation();

  const { selection, setSelection, isSelecting, handleFinishSelection, handleStartSelection } = useSelection();

  const handleMouseEnter = (cell: Cell) => {
    const sel = selection[0];
    if (isSelecting && sel != null) {
      const [d] = sel.split("-");
      const timeSeries = [...selection, cell.key].sort((a, b) => {
        return timeSlotKeyToTime(a) - timeSlotKeyToTime(b);
      });
      const start = timeSeries[0];
      const end = timeSeries[timeSeries.length - 1];
      if (d == null || start == null || end == null) {
        return;
      }
      const newSelection = getTimeSeries(d, start, end);
      setSelection(newSelection);
    }
  };

  // NOTE this should already be filtered by day
  const focused = focusedSlots.filter((x) => x.day === day);

  // debug checks
  if (focused.length !== focusedSlots.length) {
    // eslint-disable-next-line no-console
    console.warn("focused slots is not prefiltered by day");
  }

  return (
    <div>
      <DayLabel>{t(`translation:dayShort.${day}`)}</DayLabel>
      {cells.map((cell) => {
        const foundAes = suitable.filter((aes) => isInRange(aes, cell, day));
        const isSlotDeclined = false;
        const isAccepted = allocated.some((aes) => isAllocated(aes, cell, day));
        const slotEventCount = foundAes.length;
        const timeInMinutes = cell.hour * 60 + cell.minute;
        const focusedSlot = focused.find((x) => x.minutes === timeInMinutes);
        const isFocused = focusedSlot != null;
        // TODO these don't look nice and don't work if the array is not presorted
        const isFocusedFirst = focused.length > 0 && focused[0]?.minutes === timeInMinutes;
        const isFocusedLast = focused.length > 0 && focused[focused.length - 1]?.minutes === timeInMinutes;
        const isInsideRelatedTimeSpan =
          relatedTimeSpans?.some((ts) => ts.beginTime <= timeInMinutes && ts.endTime > timeInMinutes) ?? false;
        return (
          <CalendarSlot
            key={cell.key}
            onMouseDown={() => handleStartSelection(cell.key)}
            onMouseUp={handleFinishSelection}
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
              <Selection $isFirst={isSlotFirst(selection, cell.key)} $isLast={isSlotLast(selection, cell.key)} />
            )}
            {isFocused && (
              <Active $isAllocated={focusedSlot.allocated} $isFirst={isFocusedFirst} $isLast={isFocusedLast} />
            )}
          </CalendarSlot>
        );
      })}
    </div>
  );
}
