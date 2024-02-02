import { IconCross, Select } from "hds-react";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { TFunction } from "i18next";
import { fontMedium } from "common/src/common/typography";
import styled from "styled-components";
import type {
  ApplicationEventNode,
  ApplicationEventScheduleNode,
  Query,
} from "common/types/gql-types";
import { ShowAllContainer } from "common/src/components/";
import type { ReservationUnitNode } from "common";
import { ALLOCATION_CALENDAR_TIMES } from "@/common/const";
import {
  getApplicationEventsInsideSelection,
  getSlotApplicationEvents,
  getTimeSlotOptions,
  isSlotAccepted,
} from "./modules/applicationRoundAllocation";
import { AllocationCard } from "./AllocationCard";
import { ApolloQueryResult } from "@apollo/client";
import { useSlotSelection } from "./hooks";

type Props = {
  applicationEvents: ApplicationEventNode[] | null;
  reservationUnit?: ReservationUnitNode;
  refetchApplicationEvents: () => Promise<ApolloQueryResult<Query>>;
};

const Wrapper = styled.div`
  position: relative;
  border: 1px solid var(--color-black-30);
  margin-top: var(--spacing-layout-l);
  padding: var(--spacing-s);
  height: fit-content;
  width: 100%;
  max-width: 300px;
`;

const CloseBtn = styled.button`
  background-color: transparent;
  border: none;
  position: absolute;
  top: var(--spacing-s);
  right: var(--spacing-2-xs);
  cursor: pointer;
`;

const StyledShowAllContainer = styled(ShowAllContainer)`
  .ShowAllContainer__ToggleButton {
    margin-top: var(--spacing-2-xs);
    color: var(--color-bus);
  }
`;

const TimeSelectWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  padding-bottom: var(--spacing-s);
  margin-top: var(--spacing-s);
  > * {
    width: calc(50% - var(--spacing-xs));
  }

  label {
    ${fontMedium};
    margin-bottom: 0;
  }
`;

const TimeLabel = styled.div`
  background-color: var(--color-black-5);
  padding: var(--spacing-3-xs) var(--spacing-xs);
  ${fontMedium};
  font-size: var(--fontsize-body-m);
  display: inline-block;
`;

const EmptyState = styled.div`
  font-size: var(--fontsize-body-m);
  margin-bottom: var(--spacing-m);
`;

const getTimeLabel = (selection: string[], t: TFunction): string => {
  if (!selection || selection.length < 1) {
    return "";
  }
  const [startDay, startHour, startMinute] = selection[0].split("-");
  const [, endHour, endMinute] = selection[selection.length - 1].split("-");

  return `${t(`dayLong.${startDay}`)} ${startHour}:${startMinute} - ${
    endMinute === "30"
      ? endHour + endMinute === "2330"
        ? 0
        : Number(endHour) + 1
      : endHour
  }:${endMinute === "30" ? "00" : "30"}`;
};

function TimeSelection(): JSX.Element {
  const { t } = useTranslation();
  const [selection, setSelection] = useSlotSelection();

  const getOptions = useCallback(
    (type: "start" | "end") => {
      if (!selection || selection.length < 1) return [];
      const day = selection[0].split("-")[0];
      const start = ALLOCATION_CALENDAR_TIMES[0];
      const end = ALLOCATION_CALENDAR_TIMES[1];
      return getTimeSlotOptions(day, start, 0, end, type === "end");
    },
    [selection]
  );

  const timeSlotStartOptions = getOptions("start");
  const timeSlotEndOptions = getOptions("end");

  const setSelectedTime = (startValue?: string, endValue?: string): void => {
    if (!selection) {
      return undefined;
    }
    const start = startValue || selection[0];
    const end = endValue || selection[selection.length - 1];
    const [, startHours, startMinutes] = start
      ? start.toString().split("-")
      : [];
    const [, endHours, endMinutes] = end ? end.toString().split("-") : [];
    const timeSlots = getTimeSlotOptions(
      selection[0].split("-")[0],
      Number(startHours),
      Number(startMinutes),
      Number(endHours)
    ).map((n) => n.value);

    if (endValue && endMinutes === "00") timeSlots.pop();
    setSelection(timeSlots);
  };

  return (
    <TimeSelectWrapper>
      <Select
        label={t("Allocation.startingTime")}
        options={timeSlotStartOptions}
        value={
          timeSlotStartOptions.find((n) => n.value === selection?.[0]) ?? null
        }
        onChange={(val: (typeof timeSlotStartOptions)[0]) => {
          const [startHours, startMinutes] = val.label.split(":").map(Number);
          const startTime = new Date().setHours(startHours, startMinutes);
          const endOption = timeSlotEndOptions.find(
            (n) => n.value === selection?.[selection.length - 1]
          );
          if (!endOption) {
            return;
          }
          // TODO this is unsafe
          const [endHours, endMinutes] = endOption.label.split(":").map(Number);
          const endTime = new Date().setHours(endHours, endMinutes);

          const startIndex = timeSlotStartOptions.indexOf(val);
          const endValue =
            startTime >= endTime
              ? timeSlotEndOptions[startIndex + 1].value
              : timeSlotEndOptions.find(
                  (n) => n.value === selection?.[selection.length - 1]
                )?.value;
          if (endValue != null && val.value != null) {
            setSelectedTime(val.value, endValue);
          }
        }}
      />
      <Select
        label={t("Allocation.endingTime")}
        options={timeSlotEndOptions}
        value={
          timeSlotEndOptions.find(
            (n) => n.value === selection?.[selection.length - 1]
          ) ?? null
        }
        onChange={(val: (typeof timeSlotEndOptions)[0]) =>
          setSelectedTime(undefined, val.value)
        }
        isOptionDisabled={(option) => {
          const firstOption = timeSlotStartOptions.find(
            (n) => n.value === selection?.[0]
          );
          if (!firstOption) {
            return false;
          }
          const [startHours, startMinutes] = firstOption.label
            .split(":")
            .map(Number);
          const startTime = new Date().setHours(startHours, startMinutes);
          const [endHours, endMinutes] = option.label.split(":").map(Number);
          const endTime = new Date().setHours(endHours, endMinutes);

          return endTime <= startTime && endHours !== 0;
        }}
      />
    </TimeSelectWrapper>
  );
}

// TODO if the round status === RECEIVED (or draft etc.) we need to block all changes (and maybe the whole page)
// because mutations (approveSchedule) are not possible
// TODO this allows allocating when the applicationEvent is already in allocated / failed state
// which causes a mutation error
// TODO this should be renamed, it's the whole right hand side section (not just actions)
// that includes cards + time selection
export function AllocationColumn({
  applicationEvents,
  reservationUnit,
  refetchApplicationEvents,
}: Props): JSX.Element | null {
  const { t } = useTranslation();
  const [selection, setSelection] = useSlotSelection();

  const painted = getSlotApplicationEvents(selection, applicationEvents);
  const aeList = getApplicationEventsInsideSelection(
    painted,
    selection,
    reservationUnit?.pk ?? 0
  );

  // check if something is already allocated and push it down to the Card components
  const isSlotAlreadyAllocated = (slot: string): boolean =>
    !!painted
      .flatMap((aes) => aes.applicationEventSchedules)
      .filter((aes): aes is ApplicationEventScheduleNode => aes != null)
      .filter((aes) => aes.allocatedDay != null)
      .find((aes) => isSlotAccepted(aes, slot));
  const isSelectionAlreadyAllocated =
    selection?.every((slot) => !isSlotAlreadyAllocated(slot)) ?? false;
  const hasSelection = selection != null && selection.length > 0;
  const canAllocate = hasSelection && isSelectionAlreadyAllocated;

  // TODO empty state when no selection (current is ok placeholder), don't remove from DOM
  return (
    <Wrapper>
      <CloseBtn type="button" onClick={() => setSelection([])}>
        <IconCross />
      </CloseBtn>
      <TimeLabel>{getTimeLabel(selection ?? [], t)}</TimeLabel>
      <StyledShowAllContainer
        showAllLabel={t("Allocation.changeTime")}
        maximumNumber={0}
      >
        <TimeSelection />
      </StyledShowAllContainer>
      {aeList.map((applicationEvent) => (
        <AllocationCard
          key={applicationEvent.pk}
          applicationEvent={applicationEvent}
          reservationUnit={reservationUnit}
          selection={selection ?? []}
          isAllocationEnabled={canAllocate}
          refetchApplicationEvents={refetchApplicationEvents}
        />
      ))}
      {aeList.length === 0 && (
        <EmptyState>{t("Allocation.noRequestedTimes")}</EmptyState>
      )}
    </Wrapper>
  );
}
