import { IconCheck, IconCross } from "hds-react";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import styled, { css } from "styled-components";
import { fontMedium } from "common/src/common/typography";
import { filterNonNullable } from "common/src/helpers";
import {
  ApplicationEventNode,
  ApplicationEventScheduleNode,
} from "common/types/gql-types";
import { ALLOCATION_CALENDAR_TIMES } from "@/common/const";
import {
  applicationEventSchedulesToCells,
  getTimeSeries,
  timeSlotKeyToTime,
  type Cell,
  encodeTimeSlot,
  TimeSlot,
  constructTimeRange,
  pickTimeSlot,
} from "./modules/applicationRoundAllocation";
import { uniqBy } from "lodash";
import { breakpoints } from "common";
import { useSlotSelection } from "./hooks";

type Props = {
  applicationEvents: ApplicationEventNode[] | null;
  focusedApplicationEvent?: ApplicationEventNode;
  reservationUnitPk: number;
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

const DayWrapper = styled.div``;

const DayLabel = styled.div`
  display: flex;
  justify-content: center;
  height: var(--spacing-l);
`;

const Slot = styled.div<{
  $selected?: boolean;
  $eventCount?: number;
  $isAccepted?: boolean;
  $isDeclined?: boolean;
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
  ${({ $eventCount, $isAccepted, $isDeclined }) => {
    if ($isAccepted) {
      return css`
        background-color: var(--color-success);
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

const HourLabel = styled(Slot)<{ $hour?: boolean }>`
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

/// Is application event schedule on a cell (time slot)
/// Assumes that the day is already checked
/// TODO reuse this?
function isInRange(aes: ApplicationEventScheduleNode, cell: Cell) {
  const time = cell.hour * 60 + cell.minute;
  const { day, begin, end } = pickTimeSlot(aes) ?? {};
  if (!day || !begin || !end) {
    return false;
  }
  const b = begin.split(":").map((n) => parseInt(n, 10));
  const e = end.split(":").map((n) => parseInt(n, 10));
  if (b.length < 2 || e.length < 2) {
    return false;
  }
  const beginTime = b[0] * 60 + b[1];
  const endTime = e[0] * 60 + e[1];
  return time >= beginTime && time < endTime;
}

/// Check if the applciation event schedule is allocated on a specific day and time
/// @param aes the application event schedule
/// @param cell on a day (time slot)
/// @param day we are interested in
function isSlotAccepted(
  aes: ApplicationEventScheduleNode,
  cell: Cell,
  day: 0 | 1 | 2 | 3 | 4 | 5 | 6
) {
  const { allocatedDay, allocatedBegin, allocatedEnd } = aes;
  if (allocatedDay == null || allocatedBegin == null || allocatedEnd == null) {
    return false;
  }
  if (allocatedDay !== day) {
    return false;
  }
  const time = cell.hour * 60 + cell.minute;
  const begin = allocatedBegin.split(":").map((n) => parseInt(n, 10));
  const end = allocatedEnd.split(":").map((n) => parseInt(n, 10));
  if (begin.length < 2 || end.length < 2) {
    return false;
  }
  const beginTime = begin[0] * 60 + begin[1];
  const endTime = end[0] * 60 + end[1];
  return time >= beginTime && time < endTime;
}

const weekdays = [0, 1, 2, 3, 4, 5, 6] as const;

export function AllocationCalendar({
  applicationEvents,
  focusedApplicationEvent,
  reservationUnitPk,
}: Props): JSX.Element {
  const [selection, setSelection] = useSlotSelection();
  const [isSelecting, setIsSelecting] = useState(false);
  const [cells] = useState(
    applicationEventSchedulesToCells(
      ALLOCATION_CALENDAR_TIMES[0],
      ALLOCATION_CALENDAR_TIMES[1]
    )
  );

  const handleFinishSelection = () => {
    setIsSelecting(false);
  };

  return (
    <Wrapper>
      <DayWrapper>
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
      </DayWrapper>
      {weekdays.map((day) => {
        // Only show allocated that match the unit and day
        const aes = filterNonNullable(
          applicationEvents?.flatMap((ae) => ae.applicationEventSchedules)
        )
          .filter((a) =>
            a.allocatedDay != null ? a.allocatedDay === day : a.day === day
          )
          .filter(
            (a) =>
              a.allocatedReservationUnit == null ||
              a.allocatedReservationUnit.pk === reservationUnitPk
          );
        const uAes = uniqBy(aes, "pk");
        return (
          <Day
            key={`day-${day}`}
            aesForDay={uAes}
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
            reservationUnitPk={reservationUnitPk}
            focusedApplicationEvent={focusedApplicationEvent}
          />
        );
      })}
    </Wrapper>
  );
}

function toTimeSlots(aes: ApplicationEventScheduleNode[]): TimeSlot[][] {
  const allocated = aes
    .filter(
      (a) =>
        a.allocatedDay != null &&
        a.allocatedBegin != null &&
        a.allocatedEnd != null
    )
    .map((a) => {
      if (
        a.allocatedDay == null ||
        a.allocatedBegin == null ||
        a.allocatedEnd == null
      ) {
        return null;
      }
      return {
        day: a.allocatedDay,
        begin: a.allocatedBegin,
        end: a.allocatedEnd,
      };
    })
    .filter((a): a is NonNullable<typeof a> => a != null);
  if (allocated.length > 0) {
    return filterNonNullable(
      allocated.map((a) => constructTimeRange(a.day, a.begin, a.end))
    );
  }
  return filterNonNullable(
    aes.map((a) => constructTimeRange(a.day, a.begin, a.end))
  );
}

function Day({
  aesForDay,
  day,
  cells,
  isSelecting,
  selection,
  setSelection,
  onFinishSelection,
  onStartSelection,
  reservationUnitPk,
  focusedApplicationEvent,
}: {
  aesForDay: ApplicationEventScheduleNode[];
  day: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  cells: Cell[][];
  isSelecting: boolean;
  selection: string[];
  setSelection: (selection: string[]) => void;
  onFinishSelection: () => void;
  onStartSelection: (key: string) => void;
  reservationUnitPk: number;
  focusedApplicationEvent?: ApplicationEventNode;
}): JSX.Element {
  const { t } = useTranslation();

  // TODO rename this, it's only the focused application event schedules
  const aesEvt = filterNonNullable(
    focusedApplicationEvent?.applicationEventSchedules
  ).filter(
    (a) =>
      a.allocatedReservationUnit == null ||
      a.allocatedReservationUnit.pk === reservationUnitPk
  );

  // TODO refactor this (don't string convert)
  // What we want:
  // - if it's allocated return the allocated range
  // - if it's not allocated return all the requested ranges
  const activeSlots = toTimeSlots(aesEvt)
    .reduce<{ day: number; hour: number }[]>((acc, val) => {
      const s = [];
      for (let i = val[0].hour; i < val[1].hour; i++) {
        s.push({ day: val[0].day, hour: i });
        s.push({ day: val[0].day, hour: i + 0.5 });
      }
      return [...acc, ...s];
    }, [])
    .map((x) => encodeTimeSlot(x.day, x.hour));

  const isActiveAllocated = aesEvt.some((a) => a.allocatedDay === day);

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

  return (
    <DayWrapper key={`day-${day}`}>
      <DayLabel>{t(`dayShort.${day}`)}</DayLabel>
      {cells[day].map((cell) => {
        const foundAes = aesForDay.filter((aes) => isInRange(aes, cell));
        const isSlotDeclined =
          foundAes.filter((aes) => aes.declined).length > 0;
        const isAccepted =
          foundAes.filter((aes) => isSlotAccepted(aes, cell, day)).length > 0;
        const slotEventCount = foundAes.length;
        return (
          <Slot
            key={cell.key}
            onMouseDown={() => onStartSelection(cell.key)}
            onMouseUp={onFinishSelection}
            onMouseEnter={() => handleMouseEnter(cell)}
            $eventCount={slotEventCount}
            $isAccepted={isAccepted}
            $isDeclined={isSlotDeclined}
          >
            {isAccepted ? (
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
            {activeSlots?.includes(cell.key) && (
              <Active
                $isAllocated={isActiveAllocated}
                $isFirst={isSlotFirst(activeSlots, cell.key)}
                $isLast={isSlotLast(activeSlots, cell.key)}
              />
            )}
          </Slot>
        );
      })}
    </DayWrapper>
  );
}
