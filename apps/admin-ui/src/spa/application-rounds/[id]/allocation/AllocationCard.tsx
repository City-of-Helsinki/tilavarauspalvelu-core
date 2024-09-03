import React from "react";
import { Button } from "hds-react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Strong, fontMedium } from "common/src/common/typography";
import { ApolloQueryResult } from "@apollo/client";
import {
  Priority,
  type ApplicationSectionAllocationsQuery,
} from "@gql/gql-types";
import { filterNonNullable } from "common/src/helpers";
import { NotificationInline } from "common/src/components/NotificationInline";
import { convertWeekday } from "common/src/conversion";
import { SemiBold } from "common";
import { formatDuration } from "@/common/util";
import { Accordion } from "@/component/Accordion";
import {
  formatTime,
  formatTimeRangeList,
  parseApiTime,
  createDurationString,
  decodeTimeSlot,
  type SectionNodeT,
  type SuitableTimeRangeNodeT,
  type AllocatedTimeSlotNodeT,
} from "./modules/applicationRoundAllocation";
import {
  useAcceptSlotMutation,
  useRefreshApplications,
  useRemoveAllocation,
} from "./hooks";
import { getApplicantName } from "@/helpers";

type Props = {
  applicationSection: SectionNodeT;
  reservationUnitOptionPk: number;
  selection: string[];
  isAllocationEnabled: boolean;
  // TODO better solution would be to have a query key (similar to tanstack/react-query) and invalidate the key
  // so we don't have to prop drill the refetch
  refetchApplicationEvents: () => Promise<
    ApolloQueryResult<ApplicationSectionAllocationsQuery>
  >;
  // TODO these should be mandatory (but requires refactoring the parent component a bit)
  timeSlot: SuitableTimeRangeNodeT;
  allocatedTimeSlot: AllocatedTimeSlotNodeT;
};

const Wrapper = styled.div`
  &:last-of-type {
    border: 0;
    margin-bottom: 0;
  }

  border-bottom: 1px solid var(--color-black-50);
  margin-bottom: var(--spacing-s);
  padding-bottom: var(--spacing-s);
`;

const ApplicationEventName = styled.h2`
  ${fontMedium}
  font-size: var(--fontsize-body-l);
  line-height: var(--lineheight-l);
`;

const Applicant = styled.div`
  line-height: var(--lineheight-xl);
`;

const DetailRow = styled.div`
  text-align: left;

  > span {
    &:nth-of-type(1) {
      white-space: nowrap;
      margin-right: var(--spacing-3-xs);
    }

    &:nth-of-type(2) {
      ${Strong}
    }
  }
`;

// NOTE flex-wrap doesn't match the design, but there is layout shifts without it
// so when removing it, fix the card size changing when there is more than one button.
const Actions = styled.div`
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  margin-top: var(--spacing-s);
  gap: var(--spacing-s);
  & > * {
    width: 100%;
  }
`;

const StyledAccordion = styled(Accordion)`
  --header-font-size: 1rem;

  padding-top: var(--spacing-xs);
  & > * {
    padding: 0;
  }
  & > div:nth-of-type(2) {
    padding-top: var(--spacing-2-xs);
  }

  & h3 {
    ${fontMedium}
    padding: 0;
  }
`;

const DetailContainer = styled.div`
  padding-top: var(--spacing-2-xs);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2-xs);
`;

/// Why two different components?
/// because they require different props
/// allocated requires the allocated data structure (with the pk) so it can be change or destroyed
/// requested requires the reservationUnitOptions so it can be allocated
/// The mutations they use are completely different.
/// - yes the error handling is common
/// - yes we should move them to hooks, but still it's two different hooks
export function AllocatedCard({
  applicationSection,
  refetchApplicationEvents,
  allocatedTimeSlot,
}: Omit<
  Props,
  "timeSlot" | "selection" | "isAllocationEnabled" | "reservationUnitOptionPk"
>): JSX.Element {
  const { t } = useTranslation();

  // TODO refactor so it is mandatory
  if (allocatedTimeSlot == null) {
    // eslint-disable-next-line no-console
    console.warn("MANDATORY: No allocated time slot");
  }

  const [refresh, isRefreshLoading] = useRefreshApplications(
    refetchApplicationEvents
  );

  const [handleRemoveAllocation, { isLoading: isResetLoading }] =
    useRemoveAllocation({
      allocatedTimeSlot,
      applicationSection,
      refresh,
    });

  const handleChangeSlot = async () => {
    // eslint-disable-next-line no-console
    console.warn("TODO: implement");
  };

  const allocationBegin =
    allocatedTimeSlot?.beginTime != null
      ? (parseApiTime(allocatedTimeSlot.beginTime) ?? 0)
      : 0;

  const allocationEnd = allocatedTimeSlot?.endTime
    ? (parseApiTime(allocatedTimeSlot.endTime) ?? 0)
    : 0;

  const minDurationSeconds = applicationSection.reservationMinDuration ?? 0;
  const maxDurationSeconds = applicationSection.reservationMaxDuration ?? 0;
  const allocatedDurationMins = (allocationEnd - allocationBegin) * 60;
  const durationIsInvalid =
    allocatedDurationMins < minDurationSeconds / 60 ||
    allocatedDurationMins > maxDurationSeconds / 60;
  // TODO should compare the allocated to the suitable time ranges, not to selection
  const isTimeMismatch = false;

  const applicantName = getApplicantName(applicationSection.application);
  const isLoading = isResetLoading || isRefreshLoading;

  return (
    <Wrapper>
      <ApplicationEventName>{applicationSection.name}</ApplicationEventName>
      <Applicant>{applicantName}</Applicant>
      {allocatedTimeSlot != null ? (
        <AllocatedDetails
          section={applicationSection}
          allocatedTimeSlot={allocatedTimeSlot}
        />
      ) : null}
      <StyledAccordion
        heading={t("Allocation.showTimeRequests")}
        headingLevel="h3"
      >
        <TimeRequested applicationSection={applicationSection} />
      </StyledAccordion>
      {/* TODO this could be abstracted into a common component (both cards use it, but use diferent error messages and durations
       * a common error component, since there is also a third different error message (with "error" type) */}
      <DetailContainer>
        {isTimeMismatch ? (
          <NotificationInline type="alert">
            {t("Allocation.errors.allocatedOutsideOfRequestedTimes")}
          </NotificationInline>
        ) : null}
        {durationIsInvalid ? (
          <NotificationInline type="alert">
            {t("Allocation.errors.allocatedDurationIsIncorrect")}
          </NotificationInline>
        ) : null}
      </DetailContainer>
      <Actions>
        <Button
          size="small"
          variant="secondary"
          theme="black"
          onClick={handleRemoveAllocation}
          isLoading={isLoading}
          disabled={isLoading}
        >
          {t("Allocation.removeAllocation")}
        </Button>
        <Button size="small" disabled onClick={handleChangeSlot}>
          {t("Allocation.changeSlot")}
        </Button>
      </Actions>
    </Wrapper>
  );
}

// TODO this seems very similar to the AllocationCard and Column filter functions
function isOutsideOfRequestedTimes(
  time: SuitableTimeRangeNodeT | AllocatedTimeSlotNodeT | null,
  beginHours: number,
  endHours: number
) {
  if (time?.beginTime == null || time.endTime == null) {
    return true;
  }
  const beginTime = parseApiTime(time.beginTime);
  const endTime = parseApiTime(time.endTime);
  if (beginTime == null || endTime == null) {
    return true;
  }
  if (beginHours < beginTime || endHours > (endTime === 0 ? 24 : endTime)) {
    return true;
  }
}

/// Right hand side single card
/// Contains the single applicationScheduleEvent and its actions (accept / decline etc.)
export function SuitableTimeCard({
  applicationSection,
  reservationUnitOptionPk,
  selection,
  isAllocationEnabled,
  refetchApplicationEvents,
  timeSlot,
}: Omit<Props, "allocatedTimeSlot">): JSX.Element {
  const { t } = useTranslation();

  // TODO should cause a type error if both are null
  if (timeSlot == null) {
    // eslint-disable-next-line no-console
    console.warn("MANDATORY: No time slot or allocated time slot");
  }

  if (reservationUnitOptionPk === 0) {
    // eslint-disable-next-line no-console
    console.warn("Invalid reservation unit option: missing pk");
  }

  const [refresh, isRefreshLoading] = useRefreshApplications(
    refetchApplicationEvents
  );

  const [handleAcceptSlot, { isLoading: isAcceptLoading }] =
    useAcceptSlotMutation({
      selection,
      timeRange: timeSlot,
      applicationSection,
      reservationUnitOptionPk,
      refresh,
    });
  const applicantName = getApplicantName(applicationSection.application);

  const isDisabled = !reservationUnitOptionPk || !isAllocationEnabled;

  // Time interval checks
  const selectionDurationMins = selection.length * 30;
  const minDurationSeconds = applicationSection.reservationMinDuration ?? 0;
  const maxDurationSeconds = applicationSection.reservationMaxDuration ?? 0;
  const selectionDurationString = formatDuration(selectionDurationMins, t);
  // TODO this should be cleaner, only pass things we need here
  const firstSelected = selection[0];
  const lastSelected = selection[selection.length - 1];
  const selectionBegin = decodeTimeSlot(firstSelected);
  const selectionEnd = decodeTimeSlot(lastSelected);
  // Duration checks
  const isTooShort = selectionDurationMins < minDurationSeconds / 60;
  const isTooLong = selectionDurationMins > maxDurationSeconds / 60;
  const durationIsInvalid = isTooShort || isTooLong;

  const isTimeMismatch = isOutsideOfRequestedTimes(
    timeSlot,
    selectionBegin.hour,
    selectionEnd.hour + 0.5
  );

  const isMutationLoading = isAcceptLoading;
  const isLoading = isMutationLoading || isRefreshLoading;

  return (
    <Wrapper>
      <ApplicationEventName>{applicationSection.name}</ApplicationEventName>
      <Applicant>{applicantName}</Applicant>
      <DetailContainer>
        <TimeRequested applicationSection={applicationSection} />
      </DetailContainer>
      <DetailContainer>
        {/* logic: if in edit mode / not allocated -> check against selection
         * if allocated -> check against allocated time
         * always show error
         * TODO error should be shown for some cases where the selection is not valid
         */}
        {/*error ? (
          <NotificationInline type="error">{error}</NotificationInline>
        ) : null*/}
        {isTimeMismatch ? (
          <NotificationInline type="alert">
            {t("Allocation.errors.selectionOutsideOfRequestedTimes")}
          </NotificationInline>
        ) : null}
        {durationIsInvalid ? (
          <NotificationInline type="alert">
            {t("Allocation.errors.requestedDurationIsIncorrect")}
          </NotificationInline>
        ) : null}
      </DetailContainer>
      <Actions>
        <Button
          variant="primary"
          size="small"
          disabled={isDisabled || isLoading}
          isLoading={isLoading}
          onClick={handleAcceptSlot}
        >
          {t("Allocation.acceptSlot", { duration: selectionDurationString })}
        </Button>
      </Actions>
    </Wrapper>
  );
}

function getDurationFromApiTimeInHours(begin: string, end: string) {
  const bh = parseApiTime(begin);
  const eh = parseApiTime(end);
  if (bh == null || eh == null) {
    return undefined;
  }
  return (eh === 0 ? 24 : eh) - bh;
}

function AllocatedDetails({
  section,
  allocatedTimeSlot,
}: {
  section: SectionNodeT;
  allocatedTimeSlot: AllocatedTimeSlotNodeT;
}) {
  const { t } = useTranslation();
  const { beginTime, endTime, dayOfTheWeek } = allocatedTimeSlot;
  const allocationDuration = getDurationFromApiTimeInHours(beginTime, endTime);
  const day = convertWeekday(dayOfTheWeek);
  const allocatedTimeString = `${t(`dayShort.${day}`)} ${formatTime(beginTime)} - ${formatTime(endTime)}`;

  if (allocationDuration == null) {
    // eslint-disable-next-line no-console
    console.warn("Allocation duration is undefined", { section });
  }

  if (allocatedTimeString == null || allocationDuration == null) {
    // eslint-disable-next-line no-console
    console.warn("Allocated time string or duration is undefined", {
      section,
    });
  }

  const durString = t("common.hoursUnit", { count: allocationDuration });

  return (
    <DetailRow>
      <span>{t("Allocation.allocatedTime")}</span>
      <SemiBold>
        {allocatedTimeString} ({durString})
      </SemiBold>
    </DetailRow>
  );
}

function TimeRequested({
  applicationSection,
}: {
  applicationSection: SectionNodeT;
}) {
  const { t } = useTranslation();
  const { appliedReservationsPerWeek } = applicationSection;
  const durationString = createDurationString(applicationSection, t);

  const aes = filterNonNullable(applicationSection?.suitableTimeRanges);
  const primaryTimes = formatTimeRangeList(aes, Priority.Primary);
  const secondaryTimes = formatTimeRangeList(aes, Priority.Secondary);

  return (
    <div>
      <DetailRow>
        <span>{t("Allocation.applicationsWeek")}:</span>
        <SemiBold>
          {durationString}, {appliedReservationsPerWeek}x
        </SemiBold>
      </DetailRow>
      <DetailRow>
        <span>{t("Allocation.primaryTimes")}:</span>
        <SemiBold>{primaryTimes || "-"}</SemiBold>
      </DetailRow>
      <DetailRow>
        <span>{t("Allocation.secondaryTimes")}:</span>
        <SemiBold>{secondaryTimes || "-"}</SemiBold>
      </DetailRow>
    </div>
  );
}
