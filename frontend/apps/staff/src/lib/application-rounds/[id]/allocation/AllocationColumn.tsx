import React, { useState } from "react";
import { IconCross, Select } from "hds-react";
import { useTranslation } from "next-i18next/pages";
import styled from "styled-components";
import type { ApolloQueryResult } from "@apollo/client";
import type { Option } from "hds-react";
import type { TFunction } from "next-i18next/pages";
import type { VisibleHours, WeekdayInterval } from "@ui/components/WeeklyPatternCalendar/types";
import { WEEKDAYS_SORTED } from "ui/src/modules/const";
import { convertWeekday } from "ui/src/modules/conversion";
import { formatTimeRange } from "ui/src/modules/date-utils";
import { convertOptionToHDS, filterNonNullable, toNumber } from "ui/src/modules/helpers";
import { fontMedium } from "ui/src/styled";
import { ApplicationRoundStatusChoice, ApplicationSectionStatusChoice } from "@gql/gql-types";
import type { ApplicationSectionAllocationsQuery, ReservationUnitNode, Weekday } from "@gql/gql-types";
import { ALLOCATION_TIME_FORM_ID } from "@/modules/const";
import { AllocatedCard, SuitableTimeCard } from "./AllocationCard";
import { useSlotSelection } from "./hooks";
import { ALLOCATION_STEP_MINUTES, findBlockingAffecting, wantsInterval } from "./modules/allocationPattern";
import type { AllocationSlot, PriorityFilter } from "./modules/allocationPattern";
import { getBeginTimeOptions, getEndTimeOptions } from "./modules/applicationRoundAllocation";
import type { AllocatedTimeSlotNodeT, SectionNodeT } from "./modules/applicationRoundAllocation";
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

/* The three fields of the form. The weekday is first and takes the whole row, because the column is narrow. */
const FormFields = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-xs);
  margin-top: var(--spacing-s);

  > *:first-child {
    grid-column: 1 / -1;
  }

  label {
    ${fontMedium};
    margin-bottom: 0;
  }
`;

const StatusLine = styled.div`
  padding: var(--spacing-2-xs) 0 var(--spacing-s);
  font-size: var(--fontsize-body-s);
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

/** The chosen time, in minutes from midnight. A select writes its value as a string. */
function toMinutes(selected: Option[]): number | null {
  return toNumber(selected.find(() => true)?.value);
}

/** The chosen weekday. A select writes its value as a string, so it is read back off the week itself. */
function toWeekday(selected: Option[]): Weekday | null {
  const value = selected.find(() => true)?.value;
  return WEEKDAYS_SORTED.find((weekday) => weekday === value) ?? null;
}

/** Two spans are the same one when the weekday and both times match. */
function isSameInterval(a: WeekdayInterval, b: WeekdayInterval): boolean {
  return a.weekday === b.weekday && a.beginMinutes === b.beginMinutes && a.endMinutes === b.endMinutes;
}

type FormProps = {
  extent: VisibleHours;
  /** How many request cards the Selection has. The status line reads the number back. */
  requestCardCount: number;
  /** How many allocation cards the Selection has. */
  allocationCardCount: number;
};

/**
 * The weekday, the begin time and the end time of the Selection, which is the same task the grid does with a drag.
 *
 * All three fields are always visible, and the grid's skip link lands on the first of them. The times come from the
 * hours the grid draws, at the grid's own 15 minute step, so the two ways of saying a time offer the same times.
 */
function AllocationTimeForm({ extent, requestCardCount, allocationCardCount }: FormProps): React.ReactElement {
  const { t } = useTranslation();
  const [selection, setSelection] = useSlotSelection();
  // The span this form wrote last. The status line speaks for a change made here and stays quiet for one made in
  // the grid, which announces its own changes. A change from the grid is another span, so it does not match.
  const [formSelection, setFormSelection] = useState<WeekdayInterval | null>(null);

  const write = (next: WeekdayInterval): void => {
    setSelection(next);
    setFormSelection(next);
  };

  const weekdayOptions = WEEKDAYS_SORTED.map((weekday) => ({
    label: t(`translation:dayLong.${convertWeekday(weekday)}`),
    value: weekday,
  }));
  const beginOptions = getBeginTimeOptions(extent);
  const endOptions = getEndTimeOptions(extent);

  const onWeekdayChange = (selected: Option[]): void => {
    const weekday = toWeekday(selected);
    if (weekday == null) {
      return;
    }
    // A weekday alone starts a Selection, so the whole task can be done without the grid. It opens at the first
    // time the grid draws and is one step long, and the two time fields then say what the time really is.
    if (selection == null) {
      const beginMinutes = extent.beginMinutes;
      write({ weekday, beginMinutes, endMinutes: beginMinutes + ALLOCATION_STEP_MINUTES });
      return;
    }
    // A new weekday keeps the times, because the time is the part the user has already said.
    write({ ...selection, weekday });
  };

  const onBeginTimeChange = (selected: Option[]): void => {
    const beginMinutes = toMinutes(selected);
    if (selection == null || beginMinutes == null) {
      return;
    }
    // A begin time at or after the end time pushes the end one step on, so the Selection is never empty.
    const endMinutes = Math.max(selection.endMinutes, beginMinutes + ALLOCATION_STEP_MINUTES);
    write({ ...selection, beginMinutes, endMinutes });
  };

  const onEndTimeChange = (selected: Option[]): void => {
    const endMinutes = toMinutes(selected);
    if (selection == null || endMinutes == null) {
      return;
    }
    // A disabled option still reports a change, so the end time is checked here as well.
    if (endMinutes <= selection.beginMinutes) {
      return;
    }
    write({ ...selection, endMinutes });
  };

  // What the form says back after a change of its own. The grid says its own changes, so a span that the form did
  // not write is left in silence.
  const status =
    selection != null && formSelection != null && isSameInterval(selection, formSelection)
      ? [
          `${getTimeLabel(selection, t)}.`,
          `${t("allocation:form.status.demand", { count: requestCardCount })},`,
          `${t("allocation:form.status.allocation", { count: allocationCardCount })}.`,
        ].join(" ")
      : "";

  return (
    <>
      <FormFields>
        <Select
          // The grid's skip link lands here, because this is the first field of the equal form.
          id={ALLOCATION_TIME_FORM_ID}
          texts={{
            label: t("allocation:form.weekday"),
          }}
          clearable={false}
          options={weekdayOptions.map((option) => convertOptionToHDS(option))}
          value={selection?.weekday}
          onChange={onWeekdayChange}
        />
        <Select
          texts={{
            label: t("allocation:startingTime"),
          }}
          clearable={false}
          disabled={selection == null}
          options={beginOptions.map((option) => convertOptionToHDS(option))}
          value={selection != null ? String(selection.beginMinutes) : undefined}
          onChange={onBeginTimeChange}
        />
        <Select
          texts={{
            label: t("allocation:endingTime"),
          }}
          clearable={false}
          disabled={selection == null}
          options={endOptions.map((option) => ({
            ...convertOptionToHDS(option),
            disabled: selection != null && option.value <= selection.beginMinutes,
          }))}
          value={selection != null ? String(selection.endMinutes) : undefined}
          onChange={onEndTimeChange}
        />
      </FormFields>
      <StatusLine role="status" aria-live="polite">
        {status}
      </StatusLine>
    </>
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

  // The cards of the Selection are read once, so the status line of the form and the cards under it cannot
  // disagree about how many there are.
  const cards =
    selection == null ? null : toSelectionCards({ selection, applicationSections, reservationUnit, priorityFilter });

  return (
    <Wrapper>
      <CloseBtn type="button" onClick={() => setSelection(null)}>
        <IconCross />
      </CloseBtn>
      <TimeLabel>{selection != null ? getTimeLabel(selection, t) : ""}</TimeLabel>
      <AllocationTimeForm
        extent={extent}
        requestCardCount={cards?.requested.length ?? 0}
        allocationCardCount={cards?.allocated.length ?? 0}
      />
      {selection != null && cards != null ? (
        <SelectionCards
          cards={cards}
          selection={selection}
          applicationSections={applicationSections}
          reservationUnit={reservationUnit}
          refetchApplicationEvents={refetchApplicationEvents}
          applicationRoundStatus={applicationRoundStatus}
          affecting={affecting}
        />
      ) : (
        <EmptyState>{t("allocation:noRequestedTimes")}</EmptyState>
      )}
    </Wrapper>
  );
}

type SelectionCardsData = {
  /** One card per Allocation the Selection's time overlaps. */
  allocated: Array<{
    key: number | null | undefined;
    applicationSection: SectionNodeT;
    allocatedTimeSlot: AllocatedTimeSlotNodeT;
  }>;
  /** One card per Application Section that wants the Selection's time. */
  requested: Array<{
    key: number | null | undefined;
    applicationSection: SectionNodeT;
    reservationUnitOptionPk: number;
  }>;
};

/**
 * The cards of one Selection. The rule and the filter are the builder's own, so a cell's number, the number of
 * request cards and the number the status line reads out cannot disagree.
 */
function toSelectionCards({
  selection,
  applicationSections,
  reservationUnit,
  priorityFilter,
}: Pick<Props, "applicationSections" | "reservationUnit" | "priorityFilter"> & {
  selection: WeekdayInterval;
}): SelectionCardsData {
  const sections = applicationSections ?? [];

  const allocated = filterNonNullable(
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
  const requested = sections
    .filter((section) => section.status !== ApplicationSectionStatusChoice.Handled)
    .filter((section) => wantsInterval(selection, section, priorityFilter))
    .map((section) => ({
      key: section.pk,
      applicationSection: section,
      reservationUnitOptionPk:
        section.reservationUnitOptions.find((ruo) => ruo.reservationUnit?.pk === reservationUnit?.pk)?.pk ?? 0,
    }));

  return { allocated, requested };
}

/** The cards the Selection has, and the actions on them. */
function SelectionCards({
  cards,
  selection,
  applicationSections,
  reservationUnit,
  refetchApplicationEvents,
  applicationRoundStatus,
  affecting,
}: Omit<Props, "extent" | "priorityFilter"> & {
  cards: SelectionCardsData;
  selection: WeekdayInterval;
}): React.ReactElement {
  const { t } = useTranslation();

  const sections = applicationSections ?? [];
  const { allocated: allocatedData, requested: requestedData } = cards;

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
