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
`;

/// Right hand side single card
/// Contains the single applicationScheduleEvent and its actions (accept / decline etc.)
export function ApplicationEventScheduleCard({
  applicationEvent,
  reservationUnit,
  selection,
  isAllocationEnabled,
}: Props): JSX.Element {
  const { setRefreshApplicationEvents } = useAllocationContext();
  const { notifyError, notifySuccess } = useNotification();
  const { t } = useTranslation();

  const [acceptApplicationEvent] = useMutation<
    Mutation,
    MutationApproveApplicationEventScheduleArgs
  >(APPROVE_APPLICATION_EVENT_SCHEDULE, {
    onCompleted: () => {
      notifySuccess(
        t("Allocation.acceptingSuccess", {
          applicationEvent: applicationEvent.name,
        })
      );
    },
  });

  const [resetApplicationEvent] = useMutation<
    Mutation,
    MutationResetApplicationEventScheduleArgs
  >(RESET_APPLICATION_EVENT_SCHEDULE, {
    onCompleted: () => {
      notifySuccess(
        t("Allocation.resetSuccess", {
          applicationEvent: applicationEvent.name,
        })
      );
    },
  });

  const selectionDuration = formatDuration(selection.length * 30 * 60);

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
    if (
      selection.length === 0 ||
      reservationUnit?.pk == null ||
      matchingApplicationEventSchedule?.pk == null
    ) {
      notifyError(t("Allocation.errors.accepting.generic"));
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
      notifyError(
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
      const alreadyDeclined = resErrors.find(
        (e) => e?.messages.includes(ALREADY_DECLINED_ERROR_MSG)
      );
      const alreadyAllocated = resErrors.find(
        (e) => e?.messages.includes(ALREADY_ALLOCATED_ERROR_MSG)
      );
      const alreadyHandled = resErrors.find(
        (e) => e?.messages.includes(ALREADY_HANDLED_ERROR_MSG)
      );
      const isInReceivedState = resErrors.find(
        (e) => e?.messages.includes(RECEIVED_CANT_ALLOCATE_ERROR_MSG)
      );
      if (isInReceivedState) {
        notifyError(t("Allocation.errors.accepting.receivedCantAllocate"));
        return;
      }
      // Using single error messages because allocated / declined => handled if it has a single schedule
      // declined should take precedence because it should have never been shown in the first place
      if (alreadyDeclined) {
        notifyError(
          t("Allocation.errors.accepting.alreadyDeclined", {
            name: applicationEvent.name,
          })
        );
        return;
      }
      if (alreadyHandled) {
        notifyError(
          t("Allocation.errors.accepting.alreadyHandled", {
            name: applicationEvent.name,
          })
        );
        return;
      }
      if (alreadyAllocated) {
        notifyError(
          t("Allocation.errors.accepting.alreadyAllocated", {
            name: applicationEvent.name,
          })
        );
        return;
      }
      notifyError(
        t("Allocation.errors.accepting.generic", {
          name: applicationEvent.name,
        })
      );
      return;
    }
    setRefreshApplicationEvents(true);
  };

  const handleRemoveAllocation = async () => {
    if (matchingApplicationEventSchedule?.pk == null) {
      notifyError(
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
      notifyError(
        t("Allocation.errors.remove.generic", {
          name: applicationEvent.name,
        })
      );
      return;
    }
    const res = data?.approveApplicationEventSchedule;
    const { errors: resErrors } = res || {};
    if (resErrors) {
      notifyError(
        t("Allocation.errors.remove.generic", {
          name: applicationEvent.name,
        })
      );
      return;
    }
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
            {t("Allocation.acceptSlot", { duration: selectionDuration })}
          </Button>
        )}
      </Actions>
    </Wrapper>
  );
}

function AllocatedDetails({ aes }: { aes: ApplicationEventScheduleNode }) {
  const { t } = useTranslation();

  const allocatedBegin = aes?.allocatedBegin ?? undefined;
  const allocatedEnd = aes?.allocatedEnd ?? undefined;
  const allocatedDay = aes?.allocatedDay ?? undefined;
  const getDurationInHours = (begin: string, end: string) => {
    const bh = parseApiTime(begin);
    const eh = parseApiTime(end);
    if (bh == null || eh == null) {
      return undefined;
    }
    return eh - bh;
  };
  const allocationDuration =
    allocatedBegin && allocatedEnd && allocatedDay
      ? getDurationInHours(allocatedBegin, allocatedEnd)
      : undefined;

  const allocatedTimeString =
    allocatedBegin && allocatedEnd && allocatedDay
      ? `${t(`dayShort.${allocatedDay}`)} ${formatTime(
          allocatedBegin
        )} - ${formatTime(allocatedEnd)}`
      : undefined;

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

  const parsedDuration =
    applicationEvent.minDuration === applicationEvent.maxDuration
      ? formatDuration(applicationEvent.minDuration)
      : `${formatDuration(applicationEvent.minDuration)} - ${formatDuration(
          applicationEvent.maxDuration
        )}`;

  const aes = filterNonNullable(applicationEvent?.applicationEventSchedules);
  const primaryTimes = getApplicationEventScheduleTimeString(aes, 300);
  const secondaryTimes = getApplicationEventScheduleTimeString(aes, 200);

  return (
    <>
      <DetailRow>
        <span>{t("Allocation.applicationsWeek")}:</span>
        <SemiBold>
          {parsedDuration}, {applicationEvent.eventsPerWeek}x
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
    </>
  );
}
