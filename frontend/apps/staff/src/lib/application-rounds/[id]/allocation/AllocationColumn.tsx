import React from "react";
import { IconCross, Select } from "hds-react";
import { useTranslation } from "next-i18next/pages";
import styled from "styled-components";
import type { ApolloQueryResult } from "@apollo/client";
import type { Option } from "hds-react";
import type { TFunction } from "next-i18next/pages";
import type { VisibleHours, WeekdayInterval } from "@ui/components/WeeklyPatternCalendar/types";
import { ShowAllContainer } from "ui/src/components";
import { convertWeekday } from "ui/src/modules/conversion";
import { formatTimeRange } from "ui/src/modules/date-utils";
import { convertOptionToHDS, filterNonNullable, toNumber } from "ui/src/modules/helpers";
import { fontMedium } from "ui/src/styled";
import { ApplicationRoundStatusChoice, ApplicationSectionStatusChoice } from "@gql/gql-types";
import type { ApplicationSectionAllocationsQuery, ReservationUnitNode } from "@gql/gql-types";
import { ALLOCATION_TIME_FORM_ID } from "@/modules/const";
import { AllocatedCard, SuitableTimeCard } from "./AllocationCard";
import { useSlotSelection } from "./hooks";
import { ALLOCATION_STEP_MINUTES, findBlockingAffecting, wantsInterval } from "./modules/allocationPattern";
import type { AllocationSlot, PriorityFilter } from "./modules/allocationPattern";
import { getBeginTimeOptions, getEndTimeOptions } from "./modules/applicationRoundAllocation";
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

/** The chosen time, in minutes from midnight. A select writes its value as a string. */
function toMinutes(selected: Option[]): number | null {
  return toNumber(selected.find(() => true)?.value);
}

/**
 * The begin and the end time of the Selection, which is the same task the grid does with a drag.
 *
 * Both times come from the hours the grid draws, at the grid's own 15 minute step, so the two ways of saying a time
 * offer exactly the same times. The weekday still comes from the grid, which step 14 of the migration changes.
 */
function TimeSelection({ extent }: { extent: VisibleHours }): React.ReactElement {
  const { t } = useTranslation();
  const [selection, setSelection] = useSlotSelection();

  // There is no weekday to put a time on before the grid makes a Selection, so the form offers nothing yet.
  const beginOptions = selection == null ? [] : getBeginTimeOptions(extent);
  const endOptions = selection == null ? [] : getEndTimeOptions(extent);

  const onBeginTimeChange = (selected: Option[]): void => {
    const beginMinutes = toMinutes(selected);
    if (selection == null || beginMinutes == null) {
      return;
    }
    // A begin time at or after the end time pushes the end one step on, so the Selection is never empty.
    const endMinutes = Math.max(selection.endMinutes, beginMinutes + ALLOCATION_STEP_MINUTES);
    setSelection({ ...selection, beginMinutes, endMinutes });
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
    setSelection({ ...selection, endMinutes });
  };

  return (
    <TimeSelectWrapper>
      <Select
        texts={{
          label: t("allocation:startingTime"),
        }}
        clearable={false}
        options={beginOptions.map((option) => convertOptionToHDS(option))}
        value={selection != null ? String(selection.beginMinutes) : undefined}
        onChange={onBeginTimeChange}
      />
      <Select
        texts={{
          label: t("allocation:endingTime"),
        }}
        clearable={false}
        options={endOptions.map((option) => ({
          ...convertOptionToHDS(option),
          disabled: selection != null && option.value <= selection.beginMinutes,
        }))}
        value={selection != null ? String(selection.endMinutes) : undefined}
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
