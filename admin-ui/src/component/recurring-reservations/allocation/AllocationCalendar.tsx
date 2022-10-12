import { IconCheck, IconCross } from "hds-react";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import styled, { css } from "styled-components";
import { Strongish } from "common/src/common/typography";
import { ALLOCATION_CALENDAR_TIMES, weekdays } from "../../../common/const";
import {
  ApplicationEventScheduleType,
  ApplicationEventType,
} from "../../../common/gql-types";

import {
  applicationEventSchedulesToCells,
  getSlotApplicationEventCount,
  getSlotApplicationEvents,
  getTimeSeries,
  getTimeSlots,
  isSlotFirst,
  isSlotLast,
  timeSlotKeyToTime,
  ApplicationEventScheduleResultStatuses,
  areSlotsOnStatus,
} from "../modules/applicationRoundAllocation";

type Props = {
  applicationEvents: ApplicationEventType[] | null;
  selectedApplicationEvent?: ApplicationEventType;
  paintApplicationEvents: (val: ApplicationEventType[]) => void;
  selection: string[];
  setSelection: (val: string[]) => void;
  isSelecting: boolean;
  setIsSelecting: (val: boolean) => void;
  applicationEventScheduleResultStatuses: ApplicationEventScheduleResultStatuses;
};

const Wrapper = styled.div`
  display: grid;
  grid-template-columns: auto repeat(7, 1fr);
  user-select: none;
  margin-top: var(--spacing-l);
`;

const Day = styled.div``;

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
  ${Strongish};
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
  ${({ $eventCount, $isAccepted, $isDeclined }) =>
    $eventCount && $eventCount > 10
      ? css`
          background-color: var(--color-gold-dark);
        `
      : $eventCount && $eventCount > 3
      ? css`
          background-color: var(--color-summer-medium-light);
        `
      : $eventCount && $eventCount > 1
      ? css`
          background-color: var(--color-summer-light);
        `
      : $eventCount && $eventCount > 0
      ? css`
          background-color: var(--color-tram-light);
        `
      : $isDeclined
      ? css`
          background-color: var(--color-black-30);
          color: var(--color-black);
        `
      : $isAccepted
      ? css`
          background-color: var(--color-success);
          color: var(--color-white);
        `
      : css``}
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

const Active = styled.div<{ $isFirst: boolean; $isLast: boolean }>`
  position: absolute;
  width: calc(100% - 2px);
  height: calc(100% - 2px);
  border: 2px dashed var(--color-bus);
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

const AllocationCalendar = ({
  applicationEvents,
  selectedApplicationEvent,
  paintApplicationEvents,
  selection,
  setSelection,
  isSelecting,
  setIsSelecting,
  applicationEventScheduleResultStatuses,
}: Props): JSX.Element => {
  const [cells] = useState(
    applicationEventSchedulesToCells(
      ALLOCATION_CALENDAR_TIMES[0],
      ALLOCATION_CALENDAR_TIMES[1]
    )
  );

  const { t } = useTranslation();

  const activeSlots = useMemo(
    () =>
      getTimeSlots(
        selectedApplicationEvent?.applicationEventSchedules as ApplicationEventScheduleType[]
      ),
    [selectedApplicationEvent?.applicationEventSchedules]
  );

  return (
    <Wrapper>
      <Day>
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
      </Day>
      {weekdays.map((c, i) => (
        <Day key={`day-${c}`}>
          <DayLabel>{t(`dayShort.${i}`)}</DayLabel>
          {cells[i].map((cell) => {
            const isSlotRequested =
              getSlotApplicationEventCount([cell.key], applicationEvents) > 0;
            const isSlotAccepted = areSlotsOnStatus(
              [cell.key],
              applicationEventScheduleResultStatuses,
              "accepted"
            );
            const isSlotDeclined = areSlotsOnStatus(
              [cell.key],
              applicationEventScheduleResultStatuses,
              "declined"
            );
            const slotEventCount =
              isSlotRequested && !isSlotAccepted && !isSlotDeclined
                ? getSlotApplicationEventCount([cell.key], applicationEvents)
                : 0;
            return (
              <Slot
                key={cell.key}
                onMouseDown={() => {
                  setIsSelecting(true);
                  setSelection([cell.key]);
                }}
                onMouseUp={() => {
                  const slotApplicationEvents = getSlotApplicationEvents(
                    selection,
                    applicationEvents
                  );
                  setIsSelecting(false);
                  paintApplicationEvents(slotApplicationEvents);
                }}
                onMouseEnter={() => {
                  if (isSelecting) {
                    const [day] = selection
                      ? selection[0].split("-")
                      : cell.key.split("-");
                    const timeSeries = [...selection, cell.key].sort((a, b) => {
                      return timeSlotKeyToTime(a) - timeSlotKeyToTime(b);
                    });
                    const newSelection = getTimeSeries(
                      day,
                      timeSeries[0],
                      timeSeries[timeSeries.length - 1]
                    );
                    setSelection(newSelection);
                  }
                }}
                $eventCount={slotEventCount}
                $isAccepted={isSlotAccepted}
                $isDeclined={isSlotDeclined}
              >
                {slotEventCount > 0 && slotEventCount}
                {isSlotAccepted && !isSlotDeclined && <IconCheck />}
                {isSlotDeclined && <IconCross />}
                {selection.includes(cell.key) && (
                  <Selection
                    $isFirst={isSlotFirst(selection, cell.key)}
                    $isLast={isSlotLast(selection, cell.key)}
                  />
                )}
                {activeSlots?.includes(cell.key) && (
                  <Active
                    $isFirst={isSlotFirst(activeSlots, cell.key)}
                    $isLast={isSlotLast(activeSlots, cell.key)}
                  />
                )}
              </Slot>
            );
          })}
        </Day>
      ))}
    </Wrapper>
  );
};

export default AllocationCalendar;
