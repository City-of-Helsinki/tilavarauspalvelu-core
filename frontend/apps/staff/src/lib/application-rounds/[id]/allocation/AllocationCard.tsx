import React from "react";
import { Button, ButtonSize, ButtonVariant, LoadingSpinner } from "hds-react";
import { useTranslation } from "next-i18next/pages";
import styled from "styled-components";
import type { ApolloQueryResult } from "@apollo/client";
import type { WeekdayInterval } from "@ui/components/WeeklyPatternCalendar/types";
import { getIntervalMinutes } from "ui/src/modules/conversion";
import { formatDuration, timeToMinutes } from "ui/src/modules/date-utils";
import { filterNonNullable } from "ui/src/modules/helpers";
import { Flex, fontMedium, H5, SemiBold, Strong } from "ui/src/styled";
import { Priority } from "@gql/gql-types";
import type { ApplicationSectionAllocationsQuery, Maybe, ReservationStartInterval } from "@gql/gql-types";
import { Accordion } from "@/components/Accordion";
import { NotificationInline } from "@/components/NotificationInline";
import { getApplicantName, getNormalizedInterval } from "@/modules/helpers";
import { useAcceptSlotMutation, useRefreshApplications, useRemoveAllocation } from "./hooks";
import { fitsSection } from "./modules/allocationPattern";
import {
  createDurationString,
  formatSuitableTimeRange,
  formatTimeRangeList,
} from "./modules/applicationRoundAllocation";
import type { AllocatedTimeSlotNodeT, SectionNodeT } from "./modules/applicationRoundAllocation";

type CommonProps = {
  applicationSection: SectionNodeT;
  refetchApplicationEvents: () => Promise<ApolloQueryResult<ApplicationSectionAllocationsQuery>>;
};

type AllocatedCardProps = CommonProps & {
  allocatedTimeSlot: AllocatedTimeSlotNodeT;
};

type SuitableTimeCardProps = CommonProps & {
  reservationUnitOptionPk: number;
  /** The Selection, which is one span on one weekday. Both the duration and the mutation read it. */
  selection: WeekdayInterval;
  /** The shown reservation unit's own start interval. The begin time has to match it, capped at 30 minutes. */
  startInterval: Maybe<ReservationStartInterval> | undefined;
  isAllocationEnabled: boolean;
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
}: AllocatedCardProps): React.ReactElement {
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

/// Right hand side single card
/// Contains the single applicationScheduleEvent and its actions (accept / decline etc.)
export function SuitableTimeCard({
  applicationSection,
  reservationUnitOptionPk,
  selection,
  startInterval,
  isAllocationEnabled,
  refetchApplicationEvents,
}: SuitableTimeCardProps): React.ReactElement {
  const { t } = useTranslation();

  const [refresh, isRefreshLoading] = useRefreshApplications(refetchApplicationEvents);

  const [handleAcceptSlot, { isLoading: isAcceptLoading }] = useAcceptSlotMutation({
    selection,
    applicationSection,
    reservationUnitOptionPk,
    refresh,
  });
  const applicantName = getApplicantName(applicationSection.application);

  // The duration is the Selection's own length, so a 45 minute Selection reads as 45 minutes.
  const selectionMins = selection.endMinutes - selection.beginMinutes;
  const minDurationSeconds = applicationSection.reservationMinDuration ?? 0;
  const maxDurationSeconds = applicationSection.reservationMaxDuration ?? 0;
  const selectionDurationString = formatDuration(t, { minutes: selectionMins });
  // Duration checks
  const isTooShort = selectionMins < minDurationSeconds / 60;
  const isTooLong = selectionMins > maxDurationSeconds / 60;
  const durationIsInvalid = isTooShort || isTooLong;

  // The section's own ranges on this weekday are merged first, so a Selection across two touching ranges fits.
  const isTimeMismatch = !fitsSection(selection, applicationSection);

  // The backend caps the staff start interval at 30 minutes. An end time only has to be a multiple of 15, which
  // every Selection is, so only the begin time is checked here.
  const beginStepMinutes = getIntervalMinutes(getNormalizedInterval(startInterval));
  const isBeginTimeRefused = selection.beginMinutes % beginStepMinutes !== 0;

  const isDisabled = !reservationUnitOptionPk || !isAllocationEnabled || isBeginTimeRefused;

  const isMutationLoading = isAcceptLoading;
  const isLoading = isMutationLoading || isRefreshLoading;

  return (
    <Wrapper>
      <H5 as="h3" $noMargin>
        {applicationSection.name}
      </H5>
      <Applicant>{applicantName}</Applicant>
      <TimeRequested applicationSection={applicationSection} />
      {isTimeMismatch ? (
        <NotificationInline type="alert">{t("allocation:errors.selectionOutsideOfRequestedTimes")}</NotificationInline>
      ) : null}
      {durationIsInvalid ? (
        <NotificationInline type="alert">{t("allocation:errors.requestedDurationIsIncorrect")}</NotificationInline>
      ) : null}
      {isBeginTimeRefused ? (
        <NotificationInline type="alert">{t("allocation:errors.selectionBeginTimeNotAllowed")}</NotificationInline>
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
