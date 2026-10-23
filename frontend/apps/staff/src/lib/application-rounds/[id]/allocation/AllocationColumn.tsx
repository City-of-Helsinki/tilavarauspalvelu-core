import React, { useCallback } from "react";
import { addMinutes, startOfDay } from "date-fns";
import { IconCross, Select } from "hds-react";
import { useTranslation } from "next-i18next/pages";
import styled from "styled-components";
import type { ApolloQueryResult } from "@apollo/client";
import type { Option } from "hds-react";
import type { TFunction } from "next-i18next/pages";
import type { VisibleHours, WeekdayInterval } from "@ui/components/WeeklyPatternCalendar/types";
import { ShowAllContainer } from "ui/src/components";
import type { DayT } from "ui/src/modules/const";
import { convertWeekday, numberToDayT } from "ui/src/modules/conversion";
import { timeToMinutes, formatTimeRange } from "ui/src/modules/date-utils";
import { convertOptionToHDS, filterNonNullable, toNumber } from "ui/src/modules/helpers";
import { fontMedium } from "ui/src/styled";
import { ApplicationRoundStatusChoice, ApplicationSectionStatusChoice } from "@gql/gql-types";
import type { ApplicationSectionAllocationsQuery, ReservationUnitNode } from "@gql/gql-types";
import { ALLOCATION_TIME_FORM_ID } from "@/modules/const";
import { AllocatedCard, SuitableTimeCard } from "./AllocationCard";
import { useSlotSelection } from "./hooks";
import { findBlockingAffecting, wantsInterval } from "./modules/allocationPattern";
import type { AllocationSlot, PriorityFilter } from "./modules/allocationPattern";
import { getTimeSlotOptions } from "./modules/applicationRoundAllocation";
import type { SectionNodeT } from "./modules/applicationRoundAllocation";
import { useSelectedSlots } from "./SelectedSlotsContext";

type Props = {
  applicationSections: SectionNodeT[] | null;
  reservationUnit: Pick<ReservationUnitNode, "pk">;
  refetchApplicationEvents: () => Promise<ApolloQueryResult<ApplicationSectionAllocationsQuery>>;
  applicationRoundStatus: ApplicationRoundStatusChoice;
  /** The flat list of Affecting Allocations, which are the times this reservation unit cannot be given away. */
  affecting: ReadonlyArray<AllocationSlot>;
  /** The filter the cells count by, so a cell's number and the number of request cards agree. */
  priorityFilter: PriorityFilter;
  /** The hours the grid draws. The time options come from them, so both sides offer the same times. */
  extent: VisibleHours;
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

function getTimeLabel(selection: WeekdayInterval, t: TFunction): string {
  const dayString = t(`translation:dayLong.${convertWeekday(selection.weekday)}`);
  const timeString = formatTimeRange(selection.beginMinutes, selection.endMinutes, true);
  return `${dayString} ${timeString}`;
}

function deserializeSlot(slot: string): { day: DayT; hour: number; mins: number } | null {
  const res = slot.split("-").map((part) => toNumber(part));
  if (res.length !== 3) {
    return null;
  }
  const [d, hour, mins] = res;
  if (d == null || hour == null || mins == null) {
    return null;
  }
  const day = numberToDayT(d);
  if (day == null) {
    return null;
  }

  return { day: day, hour, mins };
}

function TimeSelection({ extent }: { extent: VisibleHours }): React.ReactElement {
  const { t } = useTranslation();
  const [selection, setSelection] = useSlotSelection();

  // The last option starts in the hour before the end of the extent, because an option is a slot start.
  const start = Math.floor(extent.beginMinutes / 60);
  const end = Math.ceil(extent.endMinutes / 60) - 1;

  const getOptions = useCallback(
    (type: "start" | "end") => {
      const sel = selection[0];
      if (sel == null) {
        return [];
      }
      const d = sel.split("-")[0];
      const day = numberToDayT(Number(d));
      if (day == null) {
        return [];
      }
      return getTimeSlotOptions(day, start, 0, end, type === "end");
    },
    [selection, start, end]
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
    const timeSlots = getTimeSlotOptions(day, startHours, startMinutes, endHours).map((n) => n.value);

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
    const endOption = timeSlotEndOptions.find((n) => n.value === selection?.[selection.length - 1]);
    if (!endOption) {
      return;
    }

    const minsEnd = timeToMinutes(endOption.label);
    const endTime = addMinutes(startOfDay(new Date()), minsEnd);
    const startIndex = timeSlotStartOptions.indexOf(val);
    // The select component completely breaks if the end time is before the start time
    if (minsEnd <= minsStart && minsEnd !== 0) {
      return;
    }

    const endValue =
      startTime >= endTime
        ? timeSlotEndOptions[startIndex + 1]?.value
        : timeSlotEndOptions.find((n) => n.value === selection?.[selection.length - 1])?.value;
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
    const startOption = timeSlotStartOptions.find((n) => n.value === selection?.[0]);
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
    const firstOption = timeSlotStartOptions.find((n) => n.value === selection?.[0]);
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

  const startTimeOptions = timeSlotStartOptions.map((option) => convertOptionToHDS(option));
  const endTimeOptions = timeSlotEndOptions
    .map((option) => convertOptionToHDS(option))
    .map((n) => ({
      ...n,
      disabled: isOptionDisabled(n),
    }));

  return (
    <TimeSelectWrapper>
      <Select
        texts={{
          label: t("allocation:startingTime"),
        }}
        clearable={false}
        options={startTimeOptions}
        value={timeSlotStartOptions.find((n) => n.value === selection?.[0])?.value}
        onChange={onStartTimeChange}
      />
      <Select
        texts={{
          label: t("allocation:endingTime"),
        }}
        clearable={false}
        options={endTimeOptions}
        value={timeSlotEndOptions.find((n) => n.value === selection?.[selection.length - 1])?.value}
        onChange={onEndTimeChange}
      />
    </TimeSelectWrapper>
  );
}

export function AllocationColumn({
  applicationSections,
  reservationUnit,
  refetchApplicationEvents,
  applicationRoundStatus,
  affecting,
  priorityFilter,
  extent,
}: Props): React.ReactElement | null {
  const { t } = useTranslation();
  const { selection, setSelection } = useSelectedSlots();

  return (
    // The grid's skip link lands here, because this column is the equal form for the same task.
    <Wrapper id={ALLOCATION_TIME_FORM_ID}>
      <CloseBtn type="button" onClick={() => setSelection(null)}>
        <IconCross />
      </CloseBtn>
      <TimeLabel>{selection != null ? getTimeLabel(selection, t) : ""}</TimeLabel>
      <StyledShowAllContainer showAllLabel={t("allocation:changeTime")}>
        <TimeSelection extent={extent} />
      </StyledShowAllContainer>
      {selection != null ? (
        <SelectionCards
          selection={selection}
          applicationSections={applicationSections}
          reservationUnit={reservationUnit}
          refetchApplicationEvents={refetchApplicationEvents}
          applicationRoundStatus={applicationRoundStatus}
          affecting={affecting}
          priorityFilter={priorityFilter}
        />
      ) : (
        <EmptyState>{t("allocation:noRequestedTimes")}</EmptyState>
      )}
    </Wrapper>
  );
}

/**
 * The cards of one Selection. An allocation card is shown for every Allocation the Selection's time overlaps, and
 * a request card for every Application Section that wants that time. The rule and the filter are the builder's
 * own, so a cell's number and the number of request cards cannot disagree.
 */
function SelectionCards({
  selection,
  applicationSections,
  reservationUnit,
  refetchApplicationEvents,
  applicationRoundStatus,
  affecting,
  priorityFilter,
}: Omit<Props, "extent"> & { selection: WeekdayInterval }): React.ReactElement {
  const { t } = useTranslation();

  const sections = applicationSections ?? [];

  const allocatedData = filterNonNullable(
    sections.map((section) => {
      const allocations = section.reservationUnitOptions.flatMap((ruo) => ruo.allocatedTimeSlots);
      // An Allocation takes the time the same way an Affecting Allocation does, so one rule answers both.
      const allocatedTimeSlot = findBlockingAffecting(selection, allocations);
      if (allocatedTimeSlot == null) {
        return null;
      }
      return { key: section.pk, applicationSection: section, allocatedTimeSlot };
    })
  );

  // NOTE we show Handled for already allocated, but not for suitable that have already been allocated.
  const requestedData = sections
    .filter((section) => section.status !== ApplicationSectionStatusChoice.Handled)
    .filter((section) => wantsInterval(selection, section, priorityFilter))
    .map((section) => ({
      key: section.pk,
      applicationSection: section,
      reservationUnitOptionPk:
        section.reservationUnitOptions.find((ruo) => ruo.reservationUnit?.pk === reservationUnit?.pk)?.pk ?? 0,
    }));

  // An Affecting Allocation that overlaps the Selection blocks it, even when it starts inside the Selection.
  const blocking = findBlockingAffecting(selection, affecting);
  const isRoundAllocable = applicationRoundStatus === ApplicationRoundStatusChoice.InAllocation;
  const canAllocate = allocatedData.length === 0 && blocking == null && isRoundAllocable;

  // Every option of these sections is on the shown reservation unit, so they all carry the same start interval.
  const startInterval = sections
    .flatMap((section) => section.reservationUnitOptions)
    .find((ruo) => ruo.reservationUnit?.pk === reservationUnit?.pk)?.reservationUnit.reservationStartInterval;

  if (allocatedData.length + requestedData.length === 0) {
    return <EmptyState>{t("allocation:noRequestedTimes")}</EmptyState>;
  }

  return (
    <>
      {allocatedData.map((props) => (
        <AllocatedCard
          key={props.key}
          applicationSection={props.applicationSection}
          allocatedTimeSlot={props.allocatedTimeSlot}
          refetchApplicationEvents={refetchApplicationEvents}
        />
      ))}
      {requestedData.map((props) => (
        <SuitableTimeCard
          key={props.key}
          applicationSection={props.applicationSection}
          reservationUnitOptionPk={props.reservationUnitOptionPk}
          selection={selection}
          startInterval={startInterval}
          isAllocationEnabled={canAllocate}
          refetchApplicationEvents={refetchApplicationEvents}
        />
      ))}
    </>
  );
}
