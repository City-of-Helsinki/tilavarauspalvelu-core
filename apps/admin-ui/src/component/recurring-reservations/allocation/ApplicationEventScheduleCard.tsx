import { useMutation } from "@apollo/client";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Strong } from "common/src/common/typography";
import {
  ApplicationEventScheduleType,
  ApplicationEventType,
  ApplicationType,
  Mutation,
  MutationCreateApplicationEventScheduleResultArgs,
  MutationUpdateApplicationEventScheduleResultArgs,
  ReservationUnitType,
} from "common/types/gql-types";
import { applicantName as getApplicantName } from "@/component/applications/util";
import { formatDuration } from "../../../common/util";
import { useAllocationContext } from "../../../context/AllocationContext";
import { useNotification } from "../../../context/NotificationContext";
import { SmallRoundButton } from "../../../styles/buttons";
import {
  ApplicationEventScheduleResultStatuses,
  doSomeSlotsFitApplicationEventSchedule,
  getApplicationByApplicationEvent,
  getApplicationEventScheduleTimeString,
  timeSlotKeyToScheduleTime,
} from "./modules/applicationRoundAllocation";
import {
  CREATE_APPLICATION_EVENT_SCHEDULE_RESULT,
  UPDATE_APPLICATION_EVENT_SCHEDULE_RESULT,
} from "../queries";

type Props = {
  applicationEvent: ApplicationEventType;
  applications: ApplicationType[];
  reservationUnit: ReservationUnitType;
  selection: string[];
  applicationEventScheduleResultStatuses: ApplicationEventScheduleResultStatuses;
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

const ApplicationEventName = styled.div`
  ${Strong}
  font-size: var(--fontsize-body-m);
`;

const Applicant = styled.div`
  line-height: var(--lineheight-m);
  padding-bottom: var(--spacing-2-xs);
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
  justify-content: flex-end;
  margin-top: var(--spacing-s);
`;

const getMatchingApplicationEventSchedules = (
  selection: string[],
  applicationEventSchedules: ApplicationEventScheduleType[]
): ApplicationEventScheduleType[] => {
  if (!applicationEventSchedules) {
    return [];
  }
  return applicationEventSchedules.filter((applicationEventSchedule) =>
    doSomeSlotsFitApplicationEventSchedule(applicationEventSchedule, selection)
  );
};

const ApplicationEventScheduleCard = ({
  applicationEvent,
  applications,
  reservationUnit,
  selection,
  applicationEventScheduleResultStatuses,
}: Props): JSX.Element => {
  const { setRefreshApplicationEvents } = useAllocationContext();
  const { notifySuccess, notifyError } = useNotification();
  const { t } = useTranslation();

  const [processingResult, setProcessingResult] = useState(false);

  const [acceptApplicationEvent] = useMutation<
    Mutation,
    MutationCreateApplicationEventScheduleResultArgs
  >(CREATE_APPLICATION_EVENT_SCHEDULE_RESULT, {
    onCompleted: () => {
      notifySuccess(
        t("Allocation.acceptingSuccess", {
          applicationEvent: applicationEvent.name,
        })
      );
    },
    onError: (error) => {
      const msg =
        error.message === "No permission to mutate"
          ? "Allocation.errors.noPermission"
          : "Allocation.errors.acceptingFailed";
      notifyError(t(msg, { applicationEvent: applicationEvent.name }));
      setProcessingResult(false);
    },
  });

  const [acceptExistingApplicationEventScheduleResult] = useMutation<
    Mutation,
    MutationUpdateApplicationEventScheduleResultArgs
  >(UPDATE_APPLICATION_EVENT_SCHEDULE_RESULT, {
    onCompleted: () => {
      notifySuccess(
        t("Allocation.acceptingSuccess", {
          applicationEvent: applicationEvent.name,
        })
      );
    },
    onError: (error) => {
      const msg =
        error.message === "No permission to mutate"
          ? "Allocation.errors.noPermission"
          : "Allocation.errors.acceptingFailed";
      notifyError(t(msg, { applicationEvent: applicationEvent.name }));
      setProcessingResult(false);
    },
  });

  const selectionDuration = formatDuration(selection.length * 30 * 60);

  const parsedDuration =
    applicationEvent.minDuration === applicationEvent.maxDuration
      ? formatDuration(applicationEvent.minDuration)
      : `${formatDuration(applicationEvent.minDuration)} - ${formatDuration(
          applicationEvent.maxDuration
        )}`;

  const schedules =
    applicationEvent?.applicationEventSchedules?.filter(
      (x): x is ApplicationEventScheduleType => x !== null
    ) ?? [];
  const primaryTimes = getApplicationEventScheduleTimeString(schedules, 300);
  const secondaryTimes = getApplicationEventScheduleTimeString(schedules, 200);
  const matchingSchedules = getMatchingApplicationEventSchedules(
    selection,
    schedules
  );
  const matchingApplicationEventSchedule =
    matchingSchedules.length > 0 ? matchingSchedules[0] : undefined;

  const handleAcceptSlot = async () => {
    if (
      selection.length === 0 ||
      reservationUnit.pk == null ||
      matchingApplicationEventSchedule?.pk == null
    ) {
      notifyError(t("Allocation.errors.acceptingFailed"));
      return;
    }
    setProcessingResult(true);
    const allocatedBegin = timeSlotKeyToScheduleTime(selection[0]);
    const allocatedEnd = timeSlotKeyToScheduleTime(
      selection[selection.length - 1],
      true
    );
    const input = {
      accepted: true,
      allocatedReservationUnit: reservationUnit.pk,
      applicationEventSchedule: matchingApplicationEventSchedule.pk,
      allocatedDay: matchingApplicationEventSchedule.day,
      allocatedBegin,
      allocatedEnd,
    };
    if (
      matchingApplicationEventSchedule.applicationEventScheduleResult != null
    ) {
      await acceptExistingApplicationEventScheduleResult({
        variables: {
          input,
        },
      });
    } else {
      await acceptApplicationEvent({
        variables: {
          input,
        },
      });
    }
    setRefreshApplicationEvents(true);
  };

  const application = getApplicationByApplicationEvent(
    applications,
    applicationEvent.pk ?? 0
  );
  const applicantName =
    application != null ? getApplicantName(application) : "-";
  const isReservable = !selection.some((slot) =>
    applicationEventScheduleResultStatuses.acceptedSlots.includes(slot)
  );
  const disableAllocateButton =
    !reservationUnit.pk || !matchingApplicationEventSchedule || !isReservable;

  return (
    <Wrapper>
      <ApplicationEventName>{applicationEvent.name}</ApplicationEventName>
      <Applicant>{applicantName}</Applicant>
      <DetailRow>
        <span>{t("Allocation.applicationsWeek")}:</span>
        <span>
          {parsedDuration}, {applicationEvent.eventsPerWeek}x
        </span>
      </DetailRow>
      <DetailRow>
        <span>{t("Allocation.primaryTimes")}:</span>
        <span>{primaryTimes || "-"}</span>
      </DetailRow>
      <DetailRow>
        <span>{t("Allocation.secondaryTimes")}:</span>
        <span>{secondaryTimes || "-"}</span>
      </DetailRow>
      <Actions>
        <SmallRoundButton
          variant="primary"
          disabled={disableAllocateButton}
          onClick={handleAcceptSlot}
        >
          {processingResult
            ? t("Allocation.acceptingSlot")
            : t("Allocation.acceptSlot", { duration: selectionDuration })}
        </SmallRoundButton>
      </Actions>
    </Wrapper>
  );
};

export default ApplicationEventScheduleCard;
