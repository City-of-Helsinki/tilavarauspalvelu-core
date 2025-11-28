import React from "react";
import type { ApolloQueryResult } from "@apollo/client";
import { Button, ButtonSize, ButtonVariant, LoadingSpinner } from "hds-react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { formatDuration, timeToMinutes } from "ui/src/modules/date-utils";
import { filterNonNullable } from "ui/src/modules/helpers";
import { Flex, fontMedium, H5, SemiBold, Strong } from "ui/src/styled";
import { Accordion } from "@/components/Accordion";
import { NotificationInline } from "@/components/NotificationInline";
import { getApplicantName } from "@/modules/helpers";
import { Priority } from "@gql/gql-types";
import type { ApplicationSectionAllocationsQuery } from "@gql/gql-types";
import { useAcceptSlotMutation, useRefreshApplications, useRemoveAllocation } from "./hooks";
import {
  createDurationString,
  decodeTimeSlot,
  formatSuitableTimeRange,
  formatTimeRangeList,
} from "./modules/applicationRoundAllocation";
import type {
  AllocatedTimeSlotNodeT,
  SectionNodeT,
  SuitableTimeRangeNodeT,
} from "./modules/applicationRoundAllocation";

type Props = {
  applicationSection: SectionNodeT;
  reservationUnitOptionPk: number;
  selection: string[];
  isAllocationEnabled: boolean;
  // TODO better solution would be to have a query key (similar to tanstack/react-query) and invalidate the key
  // so we don't have to prop drill the refetch
  refetchApplicationEvents: () => Promise<ApolloQueryResult<ApplicationSectionAllocationsQuery>>;
  // TODO these should be mandatory (but requires refactoring the parent component a bit)
  timeSlot: SuitableTimeRangeNodeT;
  allocatedTimeSlot: AllocatedTimeSlotNodeT;
};

const Wrapper = styled(Flex).attrs({
  $gap: "2-xs",
})`
  &:last-of-type {
    border: 0;
    margin-bottom: 0;
  }

  border-bottom: 1px solid var(--color-black-50);
  margin-bottom: var(--spacing-s);
  padding-bottom: var(--spacing-s);
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
    ${fontMedium};
    padding: 0;
  }
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
}: Omit<Props, "timeSlot" | "selection" | "isAllocationEnabled" | "reservationUnitOptionPk">): JSX.Element {
  const { t } = useTranslation();

  const [refresh, isRefreshLoading] = useRefreshApplications(refetchApplicationEvents);

  const [handleRemoveAllocation, { isLoading: isResetLoading }] = useRemoveAllocation({
    allocatedTimeSlot,
    applicationSection,
    refresh,
  });

  const allocationBeginMins = timeToMinutes(allocatedTimeSlot.beginTime) ?? 0;
  const allocationEndMins = timeToMinutes(allocatedTimeSlot.endTime) ?? 0;
  const minDurationSeconds = applicationSection.reservationMinDuration ?? 0;
  const maxDurationSeconds = applicationSection.reservationMaxDuration ?? 0;
  const allocatedDurationMins = allocationEndMins - allocationBeginMins;
  const durationIsInvalid =
    allocatedDurationMins < minDurationSeconds / 60 || allocatedDurationMins > maxDurationSeconds / 60;
  // TODO should compare the allocated to the suitable time ranges, not to selection
  const isTimeMismatch = false;

  const applicantName = getApplicantName(applicationSection.application);
  const isLoading = isResetLoading || isRefreshLoading;

  return (
    <Wrapper>
      <H5 as="h3" $noMargin>
        {applicationSection.name}
      </H5>
      <Applicant>{applicantName}</Applicant>
      <AllocatedDetails allocatedTimeSlot={allocatedTimeSlot} />
      <StyledAccordion heading={t("allocation:showTimeRequests")} headingLevel="h3">
        <TimeRequested applicationSection={applicationSection} />
      </StyledAccordion>
      {/* TODO this could be abstracted into a common component (both cards use it, but use diferent error messages and durations
       * a common error component, since there is also a third different error message (with "error" type) */}
      {isTimeMismatch ? (
        <NotificationInline type="alert">{t("allocation:errors.allocatedOutsideOfRequestedTimes")}</NotificationInline>
      ) : null}
      {durationIsInvalid ? (
        <NotificationInline type="alert">{t("allocation:errors.allocatedDurationIsIncorrect")}</NotificationInline>
      ) : null}
      <Flex $gap="s" $justifyContent="space-between">
        <Button
          size={ButtonSize.Small}
          onClick={handleRemoveAllocation}
          variant={isLoading ? ButtonVariant.Clear : ButtonVariant.Secondary}
          iconStart={isLoading ? <LoadingSpinner small /> : undefined}
          disabled={isLoading}
        >
          {t("allocation:removeAllocation")}
        </Button>
      </Flex>
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
  const beginTime = timeToMinutes(time.beginTime) / 60;
  const endTime = timeToMinutes(time.endTime) / 60;
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

  const [refresh, isRefreshLoading] = useRefreshApplications(refetchApplicationEvents);

  const [handleAcceptSlot, { isLoading: isAcceptLoading }] = useAcceptSlotMutation({
    selection,
    timeRange: timeSlot,
    applicationSection,
    reservationUnitOptionPk,
    refresh,
  });
  const applicantName = getApplicantName(applicationSection.application);

  const isDisabled = !reservationUnitOptionPk || !isAllocationEnabled;

  // Time interval checks
  const selectionMins = selection.length * 30;
  const minDurationSeconds = applicationSection.reservationMinDuration ?? 0;
  const maxDurationSeconds = applicationSection.reservationMaxDuration ?? 0;
  const selectionDurationString = formatDuration(t, { minutes: selectionMins });
  // TODO this should be cleaner, only pass things we need here
  // TODO should not default to empty string (unless this is designed zero by default)
  const firstSelected = selection[0] ?? "";
  const lastSelected = selection[selection.length - 1] ?? "";
  const selectionBegin = decodeTimeSlot(firstSelected);
  const selectionEnd = decodeTimeSlot(lastSelected);
  // Duration checks
  const isTooShort = selectionMins < minDurationSeconds / 60;
  const isTooLong = selectionMins > maxDurationSeconds / 60;
  const durationIsInvalid = isTooShort || isTooLong;

  const isTimeMismatch = isOutsideOfRequestedTimes(timeSlot, selectionBegin.hour, selectionEnd.hour + 0.5);

  const isMutationLoading = isAcceptLoading;
  const isLoading = isMutationLoading || isRefreshLoading;

  return (
    <Wrapper>
      <H5 as="h3" $noMargin>
        {applicationSection.name}
      </H5>
      <Applicant>{applicantName}</Applicant>
      <TimeRequested applicationSection={applicationSection} />
      {/* logic: if in edit mode / not allocated -> check against selection
       * if allocated -> check against allocated time
       * always show error
       * TODO error should be shown for some cases where the selection is not valid
       */}
      {/*error ? (
        <NotificationInline type="error">{error}</NotificationInline>
      ) : null*/}
      {isTimeMismatch ? (
        <NotificationInline type="alert">{t("allocation:errors.selectionOutsideOfRequestedTimes")}</NotificationInline>
      ) : null}
      {durationIsInvalid ? (
        <NotificationInline type="alert">{t("allocation:errors.requestedDurationIsIncorrect")}</NotificationInline>
      ) : null}
      <Flex $gap="s" $justifyContent="space-between">
        <Button
          size={ButtonSize.Small}
          variant={isLoading ? ButtonVariant.Clear : ButtonVariant.Secondary}
          iconStart={isLoading ? <LoadingSpinner small /> : undefined}
          disabled={isDisabled || isLoading}
          onClick={handleAcceptSlot}
        >
          {t("allocation:acceptSlot", { duration: selectionDurationString })}
        </Button>
      </Flex>
    </Wrapper>
  );
}

function getDurationFromApiTimeInHours({ beginTime, endTime }: { beginTime: string; endTime: string }): number {
  const bh = timeToMinutes(beginTime) / 60;
  const eh = timeToMinutes(endTime) / 60;
  return (eh === 0 ? 24 : eh) - bh;
}

function AllocatedDetails({ allocatedTimeSlot }: { allocatedTimeSlot: AllocatedTimeSlotNodeT }) {
  const { t } = useTranslation();
  const allocationDuration = getDurationFromApiTimeInHours(allocatedTimeSlot);
  const timeString = formatSuitableTimeRange(t, allocatedTimeSlot);

  const durString = t("common:hoursUnit", { count: allocationDuration });

  return (
    <DetailRow>
      <span>{t("allocation:allocatedTime")}</span>
      <SemiBold>
        {timeString} ({durString})
      </SemiBold>
    </DetailRow>
  );
}

function TimeRequested({ applicationSection }: { applicationSection: SectionNodeT }) {
  const { t } = useTranslation();
  const { appliedReservationsPerWeek } = applicationSection;
  const durationString = createDurationString(applicationSection, t);

  const aes = filterNonNullable(applicationSection?.suitableTimeRanges);
  const primaryTimes = formatTimeRangeList(t, aes, Priority.Primary);
  const secondaryTimes = formatTimeRangeList(t, aes, Priority.Secondary);

  return (
    <div>
      <DetailRow>
        <span>{t("allocation:applicationsWeek")}:</span>
        <SemiBold>
          {durationString}, {appliedReservationsPerWeek}x
        </SemiBold>
      </DetailRow>
      <DetailRow>
        <span>{t("allocation:primaryTimes")}:</span>
        <SemiBold>{primaryTimes || "-"}</SemiBold>
      </DetailRow>
      <DetailRow>
        <span>{t("allocation:secondaryTimes")}:</span>
        <SemiBold>{secondaryTimes || "-"}</SemiBold>
      </DetailRow>
    </div>
  );
}
