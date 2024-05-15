import React, { useCallback } from "react";
import { IconCross, Select } from "hds-react";
import { useTranslation } from "react-i18next";
import { type TFunction } from "i18next";
import { fontMedium } from "common/src/common/typography";
import { type ApolloQueryResult } from "@apollo/client";
import styled from "styled-components";
import {
  type ApplicationSectionNode,
  ApplicationRoundStatusChoice,
  type Query,
  type AllocatedTimeSlotNode,
  type SuitableTimeRangeNode,
  ApplicationSectionStatusChoice,
  type ReservationUnitNode,
} from "@gql/gql-types";
import { ShowAllContainer } from "common/src/components/";
import { transformWeekday, type Day } from "common/src/conversion";
import { ALLOCATION_CALENDAR_TIMES } from "@/common/const";
import {
  type RelatedSlot,
  decodeTimeSlot,
  getTimeSlotOptions,
  isInsideSelection,
} from "./modules/applicationRoundAllocation";
import { AllocatedCard, SuitableTimeCard } from "./AllocationCard";
import { useSlotSelection } from "./hooks";

type Props = {
  applicationSections: ApplicationSectionNode[] | null;
  reservationUnit?: ReservationUnitNode;
  refetchApplicationEvents: () => Promise<ApolloQueryResult<Query>>;
  applicationRoundStatus: ApplicationRoundStatusChoice;
  relatedAllocations: RelatedSlot[][];
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

function getAllocatedTimeSlot(
  section: ApplicationSectionNode,
  selection: { day: Day; startHour: number; endHour: number }
): AllocatedTimeSlotNode | null {
  const { day, startHour, endHour } = selection;
  return (
    section.reservationUnitOptions
      ?.flatMap((ruo) => ruo.allocatedTimeSlots ?? [])
      .find((ts) => {
        return isInsideSelection({ day, start: startHour, end: endHour }, ts);
      }) ?? null
  );
}

function getSuitableTimeSlot(
  section: ApplicationSectionNode,
  selection: { day: Day; startHour: number; endHour: number }
): SuitableTimeRangeNode | null {
  const { day, startHour, endHour } = selection;
  return (
    section.suitableTimeRanges?.find((tr) => {
      return isInsideSelection({ day, start: startHour, end: endHour }, tr);
    }) ?? null
  );
}

export function AllocationColumn({
  applicationSections,
  reservationUnit,
  refetchApplicationEvents,
  applicationRoundStatus,
  relatedAllocations,
}: Props): JSX.Element | null {
  const { t } = useTranslation();
  const [selection, setSelection] = useSlotSelection();

  const slots = selection.map((s) => decodeTimeSlot(s));
  const day = slots
    .map((s) => s.day)
    .filter((d): d is Day => d >= 0 && d <= 6)
    .reduce<Day>((acc, d) => (d > acc ? d : acc), 0);
  const startHour = slots.length > 0 ? slots[0].hour : 0;
  const endHour = slots.length > 0 ? slots[slots.length - 1].hour : 0;

  // TODO copy pasta from AllocationCalendar (the day part of this)
  const aes = applicationSections ?? [];

  // NOTE need to split the applicationSection into two props
  // - the section
  // - the selected time slot / allocation (this is used for the mutation pk)
  // NOTE we show Handled for already allocated, but not for suitable that have already been allocated.
  const selected = { day, start: startHour, end: endHour };
  const isDay = (ts: SuitableTimeRangeNode | AllocatedTimeSlotNode) =>
    ts.dayOfTheWeek === transformWeekday(day);

  const timeslots = aes
    .filter((ae) => ae.status !== ApplicationSectionStatusChoice.Handled)
    .filter((ae) => ae.suitableTimeRanges?.some(isDay))
    .filter((ae) =>
      ae.suitableTimeRanges?.some((tr) => isInsideSelection(selected, tr))
    );
  const resUnits = aes?.flatMap((ae) => ae.reservationUnitOptions);
  const allocated = resUnits
    .filter((a) => a.allocatedTimeSlots?.some(isDay))
    .filter((ae) =>
      ae.allocatedTimeSlots?.some((tr) => isInsideSelection(selected, tr))
    );

  // check if something is already allocated and push it down to the Card components
  const hasSelection = selection != null && selection.length > 0;
  const isRoundAllocable =
    applicationRoundStatus === ApplicationRoundStatusChoice.InAllocation;

  // NOTE have to reverse search for the pk, as the reservationUnitOption doesn't include any other fields than pk
  const allocatedPks = allocated.flatMap((ruo) =>
    ruo.allocatedTimeSlots?.map(
      (ts) => ts.reservationUnitOption.applicationSection.pk
    )
  );
  const allocatedSections = aes.filter(
    (as) => as.pk != null && allocatedPks.find((x) => x === as.pk)
  );

  const doesCollideToOtherAllocations = relatedAllocations[day].some((slot) => {
    return (
      slot.day === day &&
      slot.beginTime < endHour * 60 &&
      slot.endTime > startHour * 60
    );
  });
  const canAllocateSelection =
    allocatedSections.length === 0 && !doesCollideToOtherAllocations;
  const canAllocate = hasSelection && canAllocateSelection && isRoundAllocable;

  const suitableTimeSlot = (
    as: ApplicationSectionNode
  ): SuitableTimeRangeNode | null =>
    getSuitableTimeSlot(as, { day, startHour, endHour });
  const allocatedTimeSlot = (
    as: ApplicationSectionNode
  ): AllocatedTimeSlotNode | null =>
    getAllocatedTimeSlot(as, { day, startHour, endHour });

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
      {allocatedSections.map((as) => (
        <AllocatedCard
          key={as.pk}
          applicationSection={as}
          refetchApplicationEvents={refetchApplicationEvents}
          allocatedTimeSlot={allocatedTimeSlot(as)}
        />
      ))}
      {timeslots.map((as) => (
        <SuitableTimeCard
          key={as.pk}
          applicationSection={as}
          reservationUnitOptionPk={
            as.reservationUnitOptions?.find(
              (ruo) => ruo.reservationUnit?.pk === reservationUnit?.pk
            )?.pk ?? 0
          }
          selection={selection ?? []}
          isAllocationEnabled={canAllocate}
          refetchApplicationEvents={refetchApplicationEvents}
          timeSlot={suitableTimeSlot(as)}
        />
      ))}
      {timeslots.length + allocated.length === 0 && (
        <EmptyState>{t("Allocation.noRequestedTimes")}</EmptyState>
      )}
    </Wrapper>
  );
}
