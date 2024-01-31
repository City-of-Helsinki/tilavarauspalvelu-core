import React from "react";
import { Button } from "hds-react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Strong, fontMedium } from "common/src/common/typography";
import { useMutation } from "@apollo/client";
import type {
  ApplicationEventNode,
  ApplicationEventScheduleNode,
  Mutation,
  MutationApproveApplicationEventScheduleArgs,
  MutationResetApplicationEventScheduleArgs,
} from "common/types/gql-types";
import { filterNonNullable } from "common/src/helpers";
import { NotificationInline } from "common/src/components/NotificationInline";
import { SemiBold, type ReservationUnitNode } from "common";
import { getApplicantName } from "@/component/applications/util";
import { formatDuration } from "@/common/util";
import { useNotification } from "@/context/NotificationContext";
import { useAllocationContext } from "@/context/AllocationContext";
import { Accordion } from "@/component/Accordion";
import {
  doSomeSlotsFitApplicationEventSchedule,
  formatTime,
  getApplicationEventScheduleTimeString,
  parseApiTime,
  timeSlotKeyToScheduleTime,
  decodeTimeSlot,
} from "./modules/applicationRoundAllocation";
import {
  APPROVE_APPLICATION_EVENT_SCHEDULE,
  RESET_APPLICATION_EVENT_SCHEDULE,
} from "./queries";

type Props = {
  applicationEvent: ApplicationEventNode;
  reservationUnit?: ReservationUnitNode;
  selection: string[];
  isAllocationEnabled: boolean;
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

const Actions = styled.div`
  display: flex;
  justify-content: space-between;
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

// TODO refactor the selection to time slots after we refactor the core selection type
function isOutsideOfRequestedTimes(
  aes: ApplicationEventScheduleNode | undefined,
  selection: string[]
) {
  const { begin, end, day } = aes ?? {};
  const beginHours = parseApiTime(begin ?? "");
  const endHours = parseApiTime(end ?? "");

  // Selection doesn't allow selecting multiple days
  const timeSlots = selection.map(decodeTimeSlot);
  const selectedDay = timeSlots[0].day;
  const hasRequestedTimes = beginHours != null && endHours != null;
  if (!hasRequestedTimes) {
    return false;
  }
  return (
    selectedDay !== day ||
    beginHours > timeSlots[0].hour ||
    endHours < timeSlots[timeSlots.length - 1].hour + 0.5
  );
}

function isOutsideOfAllocatedTimes(
  aes: ApplicationEventScheduleNode | undefined
) {
  const { allocatedBegin, allocatedEnd, allocatedDay, day, begin, end } =
    aes ?? {};
  if (allocatedBegin == null || allocatedEnd == null || allocatedDay == null) {
    return false;
  }
  const allocatedBeginHours = parseApiTime(allocatedBegin ?? "");
  const allocatedEndHours = parseApiTime(allocatedEnd ?? "");
  const beginHours = parseApiTime(begin ?? "");
  const endHours = parseApiTime(end ?? "");

  const isAllocated = allocatedBeginHours != null && allocatedEndHours != null;
  const hasRequestedTimes = beginHours != null && endHours != null;
  if (!isAllocated || !hasRequestedTimes) {
    return false;
  }

  return (
    allocatedDay !== day ||
    allocatedBeginHours > beginHours ||
    allocatedEndHours < endHours ||
    allocatedBeginHours > endHours ||
    allocatedEndHours < beginHours
  );
}

/// Right hand side single card
/// Contains the single applicationScheduleEvent and its actions (accept / decline etc.)
export function ApplicationEventScheduleCard({
  applicationEvent,
  reservationUnit,
  selection,
  isAllocationEnabled,
}: Props): JSX.Element {
  const { setRefreshApplicationEvents } = useAllocationContext();
  const { notifySuccess } = useNotification();
  const { t } = useTranslation();
  const [error, setError] = React.useState<string | null>(null);

  const [acceptApplicationEvent] = useMutation<
    Mutation,
    MutationApproveApplicationEventScheduleArgs
  >(APPROVE_APPLICATION_EVENT_SCHEDULE);

  const [resetApplicationEvent] = useMutation<
    Mutation,
    MutationResetApplicationEventScheduleArgs
  >(RESET_APPLICATION_EVENT_SCHEDULE);

  const aes = filterNonNullable(applicationEvent?.applicationEventSchedules);
  const matchingSchedules = aes.filter((ae) =>
    doSomeSlotsFitApplicationEventSchedule(ae, selection)
  );

  // TODO this looks really scetchy
  // why is it an array? we should be operating on exactly a single schedule
  // why can it be undefined?
  // NOTE: this works, just not clean
  // There is a backend issue where if event has a single accepted schedule it's not possible to accept another one EVER
  const matchingApplicationEventSchedule =
    matchingSchedules.length > 0 ? matchingSchedules[0] : undefined;

  const handleAcceptSlot = async () => {
    setError(null);
    if (
      selection.length === 0 ||
      reservationUnit?.pk == null ||
      matchingApplicationEventSchedule?.pk == null
    ) {
      setError(t("Allocation.errors.accepting.generic"));
      return;
    }
    const allocatedBegin = timeSlotKeyToScheduleTime(selection[0]);
    const allocatedEnd = timeSlotKeyToScheduleTime(
      selection[selection.length - 1],
      true
    );
    const input = {
      pk: matchingApplicationEventSchedule.pk,
      allocatedReservationUnit: reservationUnit.pk,
      allocatedDay: matchingApplicationEventSchedule.day,
      allocatedBegin,
      allocatedEnd,
    };

    const { data, errors } = await acceptApplicationEvent({
      variables: {
        input,
      },
    });
    if (errors) {
      // TODO have unkown error message
      setError(
        t("Allocation.errors.accepting.generic", {
          name: applicationEvent.name,
        })
      );
      return;
    }
    const res = data?.approveApplicationEventSchedule;
    const { errors: resErrors } = res || {};
    if (resErrors) {
      // TODO better error handling
      const ALREADY_DECLINED_ERROR_MSG =
        "Schedule cannot be approved for event in status: 'DECLINED'";
      const ALREADY_HANDLED_ERROR_MSG =
        "Schedule cannot be approved for application in status: 'HANDLED'";
      const ALREADY_ALLOCATED_ERROR_MSG =
        "Schedule cannot be approved for event in status: 'APPROVED'";
      const RECEIVED_CANT_ALLOCATE_ERROR_MSG =
        "Schedule cannot be approved for application in status: 'RECEIVED'";
      const alreadyDeclined = resErrors.find((e) =>
        e?.messages.includes(ALREADY_DECLINED_ERROR_MSG)
      );
      const alreadyAllocated = resErrors.find((e) =>
        e?.messages.includes(ALREADY_ALLOCATED_ERROR_MSG)
      );
      const alreadyHandled = resErrors.find((e) =>
        e?.messages.includes(ALREADY_HANDLED_ERROR_MSG)
      );
      const isInReceivedState = resErrors.find((e) =>
        e?.messages.includes(RECEIVED_CANT_ALLOCATE_ERROR_MSG)
      );
      if (isInReceivedState) {
        setError(t("Allocation.errors.accepting.receivedCantAllocate"));
        return;
      }
      // Using single error messages because allocated / declined => handled if it has a single schedule
      // declined should take precedence because it should have never been shown in the first place
      if (alreadyDeclined) {
        setError(
          t("Allocation.errors.accepting.alreadyDeclined", {
            name: applicationEvent.name,
          })
        );
        return;
      }
      if (alreadyHandled) {
        setError(
          t("Allocation.errors.accepting.alreadyHandled", {
            name: applicationEvent.name,
          })
        );
        return;
      }
      if (alreadyAllocated) {
        setError(
          t("Allocation.errors.accepting.alreadyAllocated", {
            name: applicationEvent.name,
          })
        );
        return;
      }
      setError(
        t("Allocation.errors.accepting.generic", {
          name: applicationEvent.name,
        })
      );
      return;
    }
    const aen = applicationEvent.name;
    const msg = t("Allocation.acceptingSuccess", { applicationEvent: aen });
    notifySuccess(msg);
    setRefreshApplicationEvents(true);
  };

  const handleRemoveAllocation = async () => {
    setError(null);
    if (matchingApplicationEventSchedule?.pk == null) {
      setError(
        t("Allocation.errors.remove.generic", {
          name: applicationEvent.name,
        })
      );
      return;
    }
    const { data, errors } = await resetApplicationEvent({
      variables: {
        input: {
          pk: matchingApplicationEventSchedule.pk,
        },
      },
    });
    if (errors) {
      setError(
        t("Allocation.errors.remove.generic", {
          name: applicationEvent.name,
        })
      );
      return;
    }
    const res = data?.approveApplicationEventSchedule;
    const { errors: resErrors } = res || {};
    if (resErrors) {
      setError(
        t("Allocation.errors.remove.generic", {
          name: applicationEvent.name,
        })
      );
      return;
    }
    const aen = applicationEvent.name;
    const msg = t("Allocation.resetSuccess", { applicationEvent: aen });
    notifySuccess(msg);
    setRefreshApplicationEvents(true);
  };

  const handleChangeSlot = async () => {
    // eslint-disable-next-line no-console
    console.warn("TODO: implement");
  };

  const applicantName = getApplicantName(applicationEvent.application);

  // TODO problem with declined is that it should be specific to the reservation unit (backend issue)
  const isDeclined = applicationEvent.applicationEventSchedules?.every(
    (ae) => ae.declined
  );
  const isAccepted = applicationEvent.applicationEventSchedules?.some(
    (ae) => ae.allocatedDay != null
  );

  const isAllocated =
    matchingApplicationEventSchedule?.allocatedReservationUnit != null;
  // TODO need to check if it's allocated here or elsewhere, don't allow changes if it's elsewhere (just show it or not?)
  const isReservable = !isDeclined && !isAccepted && isAllocationEnabled;
  const isDisabled = !reservationUnit?.pk || !isReservable;

  if (isAllocated) {
    if (
      matchingApplicationEventSchedule.allocatedReservationUnit?.pk !==
      reservationUnit?.pk
    ) {
      // eslint-disable-next-line no-console
      console.warn(
        "Allocated reservation unit does not match the current reservation unit",
        matchingApplicationEventSchedule
      );
    }
  }

  // TODO cleanup and reorganise
  // Time interval checks
  const selectionDurationMins = selection.length * 30;
  const beginSeconds = applicationEvent.minDuration ?? 0;
  const endSeconds = applicationEvent.maxDuration ?? 0;
  const selectionDurationString = formatDuration(selectionDurationMins * 60);
  const isRequestedTimeMismatch = isOutsideOfRequestedTimes(
    matchingApplicationEventSchedule,
    selection
  );
  const isAllocatedTimeMismatch = isOutsideOfAllocatedTimes(
    matchingApplicationEventSchedule
  );
  const isTimeMismatch = isAllocated
    ? isAllocatedTimeMismatch
    : isRequestedTimeMismatch;

  // Duration checks
  const isTooShort = selectionDurationMins < beginSeconds / 60;
  const isTooLong = selectionDurationMins > endSeconds / 60;
  // FIXME don't call parseApiTime with invalid values (causes warnings)
  // wrap it in a function and do null checks first
  const allocationBegin =
    parseApiTime(matchingApplicationEventSchedule?.allocatedBegin ?? "") ?? 0;
  const allocationEnd =
    parseApiTime(matchingApplicationEventSchedule?.allocatedEnd ?? "") ?? 0;
  const allocatedDurationMins = (allocationEnd - allocationBegin) * 60;
  const durationIsInvalid = isAllocated
    ? allocatedDurationMins < beginSeconds / 60 ||
      allocatedDurationMins > endSeconds / 60
    : isTooShort || isTooLong;

  return (
    <Wrapper>
      <ApplicationEventName>{applicationEvent.name}</ApplicationEventName>
      <Applicant>{applicantName}</Applicant>
      {isAllocated ? (
        <AllocatedDetails aes={matchingApplicationEventSchedule} />
      ) : null}
      {isAllocated ? (
        <StyledAccordion
          heading={t("Allocation.showTimeRequests")}
          headingLevel="h3"
        >
          <TimeRequested applicationEvent={applicationEvent} />
        </StyledAccordion>
      ) : (
        <DetailContainer>
          <TimeRequested applicationEvent={applicationEvent} />
        </DetailContainer>
      )}
      <DetailContainer>
        {/* logic: if in edit mode / not allocated -> check against selection
         * if allocated -> check against allocated time
         * always show error
         */}
        {error ? (
          <NotificationInline type="error">{error}</NotificationInline>
        ) : null}
        {isTimeMismatch ? (
          <NotificationInline type="alert">
            {isAllocated
              ? t("Allocation.errors.allocatedOutsideOfRequestedTimes")
              : t("Allocation.errors.selectionOutsideOfRequestedTimes")}
          </NotificationInline>
        ) : null}
        {durationIsInvalid ? (
          <NotificationInline type="alert">
            {isAllocated
              ? t("Allocation.errors.allocatedDurationIsIncorrect")
              : t("Allocation.errors.requestedDurationIsIncorrect")}
          </NotificationInline>
        ) : null}
      </DetailContainer>
      <Actions>
        {isAllocated ? (
          <>
            <Button
              size="small"
              variant="secondary"
              theme="black"
              onClick={handleRemoveAllocation}
            >
              {t("Allocation.removeAllocation")}
            </Button>
            <Button size="small" disabled onClick={handleChangeSlot}>
              {t("Allocation.changeSlot")}
            </Button>
          </>
        ) : (
          <Button
            variant="primary"
            size="small"
            disabled={isDisabled || isAllocated}
            onClick={handleAcceptSlot}
          >
            {t("Allocation.acceptSlot", { duration: selectionDurationString })}
          </Button>
        )}
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
  return eh - bh;
}

function AllocatedDetails({ aes }: { aes: ApplicationEventScheduleNode }) {
  const { t } = useTranslation();

  const allocatedBegin = aes?.allocatedBegin ?? "";
  const allocatedEnd = aes?.allocatedEnd ?? "";
  const allocatedDay = aes?.allocatedDay ?? "";

  const allocationDuration = getDurationFromApiTimeInHours(
    allocatedBegin,
    allocatedEnd
  );
  if (allocationDuration == null) {
    // eslint-disable-next-line no-console
    console.warn("Allocation duration is undefined", { aes });
  }

  const allocatedTimeString = `${t(`dayShort.${allocatedDay}`)} ${formatTime(allocatedBegin)} - ${formatTime(allocatedEnd)}`;

  if (allocatedTimeString == null || allocationDuration == null) {
    // eslint-disable-next-line no-console
    console.warn("Allocated time string or duration is undefined", {
      aes,
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
  applicationEvent,
}: {
  applicationEvent: ApplicationEventNode;
}) {
  const { t } = useTranslation();
  const { minDuration, maxDuration, eventsPerWeek } = applicationEvent;

  const parsedDuration =
    minDuration === maxDuration
      ? formatDuration(minDuration)
      : `${formatDuration(minDuration)} - ${formatDuration(maxDuration)}`;

  const aes = filterNonNullable(applicationEvent?.applicationEventSchedules);
  const primaryTimes = getApplicationEventScheduleTimeString(aes, 300);
  const secondaryTimes = getApplicationEventScheduleTimeString(aes, 200);

  return (
    <div>
      <DetailRow>
        <span>{t("Allocation.applicationsWeek")}:</span>
        <SemiBold>
          {parsedDuration}, {eventsPerWeek}x
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
