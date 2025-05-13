import React, { useCallback } from "react";
import { IconCross, Option, Select } from "hds-react";
import { useTranslation } from "react-i18next";
import { type TFunction } from "i18next";
import { fontMedium } from "common/styled";
import { type ApolloQueryResult } from "@apollo/client";
import styled from "styled-components";
import {
  ApplicationRoundStatusChoice,
  ApplicationSectionStatusChoice,
  type ApplicationSectionAllocationsQuery,
  Weekday,
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
  SectionNodeT,
  AllocatedTimeSlotNodeT,
  SuitableTimeRangeNodeT,
} from "./modules/applicationRoundAllocation";
import { AllocatedCard, SuitableTimeCard } from "./AllocationCard";
import { useSlotSelection } from "./hooks";
import {
  convertOptionToHDS,
  filterNonNullable,
  formatTimeRange,
  timeToMinutes,
  toNumber,
} from "common/src/helpers";
import { addMinutes, startOfDay } from "date-fns";

type Props = {
  applicationSections: SectionNodeT[] | null;
  reservationUnit: Pick<ReservationUnitNode, "pk">;
  refetchApplicationEvents: () => Promise<
    ApolloQueryResult<ApplicationSectionAllocationsQuery>
  >;
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

function getTimeLabel(selection: string[], t: TFunction): string {
  const selectionStart = selection[0];
  const selectionEnd = selection[selection.length - 1];
  if (!selectionStart || !selectionEnd) {
    return "";
  }
  const [day, startHour, startMinute] = selectionStart.split("-").map(toNumber);
  const [, endHour, endMinute] = selectionEnd.split("-").map(toNumber);
  if (
    day == null ||
    startHour == null ||
    startMinute == null ||
    endHour == null ||
    endMinute == null
  ) {
    return "";
  }

  const dayString = `${t(`dayLong.${day}`)}`;

  const beginMinutes = startHour * 60 + startMinute;
  // since all slots are 30 minutes, we add 30 minutes to the end time
  const endMinutes = endHour * 60 + endMinute + 30;
  const timeString = formatTimeRange(beginMinutes, endMinutes, true);
  return `${dayString} ${timeString}`;
}

function deserializeSlot(
  slot: string
): { day: Day; hour: number; mins: number } | null {
  const res = slot.split("-").map(toNumber);
  if (res.length !== 3) {
    return null;
  }
  const [day, hour, mins] = res;
  if (day == null || hour == null || mins == null) {
    return null;
  }
  // safe coercion for day
  if (day < 0 || day > 6) {
    return null;
  }

  return { day: day as Day, hour, mins };
}

function TimeSelection(): JSX.Element {
  const { t } = useTranslation();
  const [selection, setSelection] = useSlotSelection();

  const getOptions = useCallback(
    (type: "start" | "end") => {
      const sel = selection[0];
      if (sel == null) {
        return [];
      }
      const day = sel.split("-")[0];
      const start = ALLOCATION_CALENDAR_TIMES[0];
      const end = ALLOCATION_CALENDAR_TIMES[1];
      // TODO unsafe
      return getTimeSlotOptions(
        Number(day) as Day,
        start,
        0,
        end,
        type === "end"
      );
    },
    [selection]
  );

  const timeSlotStartOptions = getOptions("start");
  const timeSlotEndOptions = getOptions("end");

  const setSelectedTime = (startValue?: string, endValue?: string): void => {
    if (!selection) {
      return undefined;
    }
    const startSelection = startValue || selection[0];
    const endSelection = endValue || selection[selection.length - 1];
    if (startSelection == null || endSelection == null) {
      return;
    }
    const start = deserializeSlot(startSelection);
    const end = deserializeSlot(endSelection);
    if (start == null || end == null) {
      return;
    }

    const { day, hour: startHours, mins: startMinutes } = start;
    const { day: dayEnd, hour: endHours, mins: endMinutes } = end;
    if (day !== dayEnd) {
      return;
    }
    const timeSlots = getTimeSlotOptions(
      day,
      startHours,
      startMinutes,
      endHours
    ).map((n) => n.value);

    if (endValue && endMinutes === 0) timeSlots.pop();
    setSelection(timeSlots);
  };

  const onStartTimeChange = (sel: Option[]): void => {
    const val = sel.find(() => true);
    if (!val) {
      return;
    }
    const minsStart = timeToMinutes(val.label);
    const startTime = addMinutes(startOfDay(new Date()), minsStart);
    const endOption = timeSlotEndOptions.find(
      (n) => n.value === selection?.[selection.length - 1]
    );
    if (!endOption) {
      return;
    }

    const minsEnd = timeToMinutes(endOption.label);
    const endTime = addMinutes(startOfDay(new Date()), minsEnd);
    const startIndex = timeSlotStartOptions.indexOf(val);
    // The select component completely breaks if the end time is before the start time
    // TODO more robust solution that shows errors to the users without breaking the UI
    if (minsEnd <= minsStart && minsEnd !== 0) {
      return;
    }

    const endValue =
      startTime >= endTime
        ? timeSlotEndOptions[startIndex + 1]?.value
        : timeSlotEndOptions.find(
            (n) => n.value === selection?.[selection.length - 1]
          )?.value;
    if (endValue != null && val.value != null) {
      setSelectedTime(val.value, endValue);
    }
  };

  const onEndTimeChange = (sel: Option[]): void => {
    const val = sel.find(() => true);
    if (!val) {
      return;
    }
    const minsEnd = timeToMinutes(val.label);
    // Disabling options shows them disabled but does NOT prevent them from being selected
    // the select component breaks if the end time is before the start time
    const startOption = timeSlotStartOptions.find(
      (n) => n.value === selection?.[0]
    );
    if (!startOption) {
      return;
    }
    const minsStart = timeToMinutes(startOption?.label ?? "");
    if (minsEnd <= minsStart && minsEnd !== 0) {
      return;
    }
    setSelectedTime(undefined, val.value);
  };

  const isOptionDisabled = (option: Partial<Option>) => {
    const firstOption = timeSlotStartOptions.find(
      (n) => n.value === selection?.[0]
    );
    if (!firstOption) {
      return false;
    }
    if (!option.label) {
      return false;
    }
    const minsStart = timeToMinutes(firstOption.label);
    const startTime = addMinutes(startOfDay(new Date()), minsStart);
    const minsEnd = timeToMinutes(option.label);
    const endTime = addMinutes(startOfDay(new Date()), minsEnd);

    return endTime <= startTime && minsEnd !== 0;
  };

  const startTimeOptions = timeSlotStartOptions.map(convertOptionToHDS);
  const endTimeOptions = timeSlotEndOptions
    .map(convertOptionToHDS)
    .map((n) => ({
      ...n,
      disabled: isOptionDisabled(n),
    }));

  return (
    <TimeSelectWrapper>
      <Select
        texts={{
          label: t("Allocation.startingTime"),
        }}
        clearable={false}
        options={startTimeOptions}
        value={
          timeSlotStartOptions.find((n) => n.value === selection?.[0])?.value
        }
        onChange={onStartTimeChange}
      />
      <Select
        texts={{
          label: t("Allocation.endingTime"),
        }}
        clearable={false}
        options={endTimeOptions}
        value={
          timeSlotEndOptions.find(
            (n) => n.value === selection?.[selection.length - 1]
          )?.value
        }
        onChange={onEndTimeChange}
      />
    </TimeSelectWrapper>
  );
}

function getAllocatedTimeSlot(
  section: SectionNodeT,
  selection: { day: Day; startHour: number; endHour: number }
): AllocatedTimeSlotNodeT | null {
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
  section: SectionNodeT,
  selection: { day: Day; startHour: number; endHour: number }
): SuitableTimeRangeNodeT | null {
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
  const startHour = slots[0]?.hour ?? 0;
  const endHour = slots[slots.length - 1]?.hour ?? 0;

  // TODO copy pasta from AllocationCalendar (the day part of this)
  const aes = applicationSections ?? [];

  // NOTE need to split the applicationSection into two props
  // - the section
  // - the selected time slot / allocation (this is used for the mutation pk)
  // NOTE we show Handled for already allocated, but not for suitable that have already been allocated.
  const selected = { day, start: startHour, end: endHour };
  const isDay = (ts: { dayOfTheWeek: Weekday }) =>
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

  const doesCollideToOtherAllocations = relatedAllocations[day]?.some(
    (slot) => {
      return (
        slot.day === day &&
        slot.beginTime < endHour * 60 &&
        slot.endTime > startHour * 60
      );
    }
  );
  const canAllocateSelection =
    allocatedSections.length === 0 && !doesCollideToOtherAllocations;
  const canAllocate = hasSelection && canAllocateSelection && isRoundAllocable;

  const allocatedData = filterNonNullable(
    allocatedSections.map((as) => {
      const allocatedTimeSlot = getAllocatedTimeSlot(as, {
        day,
        startHour,
        endHour,
      });
      if (allocatedTimeSlot != null) {
        return {
          key: as.pk,
          applicationSection: as,
          allocatedTimeSlot,
        };
      }
      return null;
    })
  );

  const suitableData = filterNonNullable(
    timeslots.map((as) => {
      const timeSlot = getSuitableTimeSlot(as, { day, startHour, endHour });
      if (timeSlot != null) {
        const reservationUnitOptionPk =
          as.reservationUnitOptions?.find(
            (ruo) => ruo.reservationUnit?.pk === reservationUnit?.pk
          )?.pk ?? 0;
        return {
          key: as.pk,
          applicationSection: as,
          timeSlot,
          reservationUnitOptionPk,
        };
      }
      return null;
    })
  );

  // TODO empty state when no selection (current is ok placeholder), don't remove from DOM
  return (
    <Wrapper>
      <CloseBtn type="button" onClick={() => setSelection([])}>
        <IconCross />
      </CloseBtn>
      <TimeLabel>{getTimeLabel(selection, t)}</TimeLabel>
      <StyledShowAllContainer showAllLabel={t("Allocation.changeTime")}>
        <TimeSelection />
      </StyledShowAllContainer>
      {allocatedData.map((props) => (
        <AllocatedCard
          {...props}
          key={props.key}
          refetchApplicationEvents={refetchApplicationEvents}
        />
      ))}
      {suitableData.map((props) => (
        <SuitableTimeCard
          {...props}
          key={props.key}
          selection={selection ?? []}
          isAllocationEnabled={canAllocate}
          refetchApplicationEvents={refetchApplicationEvents}
        />
      ))}
      {timeslots.length + allocated.length === 0 && (
        <EmptyState>{t("Allocation.noRequestedTimes")}</EmptyState>
      )}
    </Wrapper>
  );
}
