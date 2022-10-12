import { useMutation } from "@apollo/client";
import React, { useMemo, useState } from "react";
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
} from "../../../common/gql-types";
import { parseDuration } from "../../../common/util";
import { useAllocationContext } from "../../../context/AllocationContext";
import { useNotification } from "../../../context/NotificationContext";
import { SmallRoundButton } from "../../../styles/buttons";
import {
  ApplicationEventScheduleResultStatuses,
  getApplicantName,
  getApplicationByApplicationEvent,
  getApplicationEventScheduleTimeString,
  getMatchingApplicationEventSchedules,
  timeSlotKeyToScheduleTime,
} from "../modules/applicationRoundAllocation";
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
        "",
        t("Allocation.acceptingSuccess", {
          applicationEvent: applicationEvent.name,
        }),
        { dismissible: false }
      );
    },
    onError: (error) => {
      const msg =
        error.message === "No permission to mutate"
          ? "Allocation.errors.noPermission"
          : "Allocation.errors.acceptingFailed";
      notifyError("", t(msg, { applicationEvent: applicationEvent.name }), {
        dismissible: false,
      });
      setProcessingResult(false);
    },
  });

  const [acceptExistingApplicationEventScheduleResult] = useMutation<
    Mutation,
    MutationUpdateApplicationEventScheduleResultArgs
  >(UPDATE_APPLICATION_EVENT_SCHEDULE_RESULT, {
    onCompleted: () => {
      notifySuccess(
        "",
        t("Allocation.acceptingSuccess", {
          applicationEvent: applicationEvent.name,
        }),
        { dismissible: false }
      );
    },
    onError: (error) => {
      const msg =
        error.message === "No permission to mutate"
          ? "Allocation.errors.noPermission"
          : "Allocation.errors.acceptingFailed";
      notifyError("", t(msg, { applicationEvent: applicationEvent.name }), {
        dismissible: false,
      });
      setProcessingResult(false);
    },
  });

  const selectionDuration = useMemo(
    () => selection && parseDuration(selection.length * 30 * 60),
    [selection]
  );

  const application = useMemo(
    () =>
      getApplicationByApplicationEvent(
        applications,
        applicationEvent.pk as number
      ),
    [applicationEvent, applications]
  );

  const applicantName = useMemo(
    () => getApplicantName(application),
    [application]
  );

  const parsedDuration = useMemo(
    () =>
      applicationEvent.minDuration === applicationEvent.maxDuration
        ? parseDuration(applicationEvent.minDuration)
        : `${parseDuration(applicationEvent.minDuration)} - ${parseDuration(
            applicationEvent.maxDuration
          )}`,
    [applicationEvent.minDuration, applicationEvent.maxDuration]
  );

  const primaryTimes = useMemo(() => {
    return applicationEvent?.applicationEventSchedules
      ? getApplicationEventScheduleTimeString(
          applicationEvent.applicationEventSchedules as ApplicationEventScheduleType[],
          300
        )
      : "";
  }, [applicationEvent?.applicationEventSchedules]);

  const secondaryTimes = useMemo(() => {
    return applicationEvent?.applicationEventSchedules
      ? getApplicationEventScheduleTimeString(
          applicationEvent.applicationEventSchedules as ApplicationEventScheduleType[],
          200
        )
      : "";
  }, [applicationEvent?.applicationEventSchedules]);

  const matchingApplicationEventSchedule: ApplicationEventScheduleType =
    useMemo(() => {
      return getMatchingApplicationEventSchedules(
        selection,
        applicationEvent?.applicationEventSchedules as ApplicationEventScheduleType[]
      )[0];
    }, [selection, applicationEvent?.applicationEventSchedules]);

  const isReservable = useMemo(
    () =>
      !selection.some((slot) =>
        applicationEventScheduleResultStatuses.acceptedSlots.includes(slot)
      ),
    [selection, applicationEventScheduleResultStatuses]
  );

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
          disabled={
            !reservationUnit.pk ||
            !matchingApplicationEventSchedule ||
            !isReservable
          }
          onClick={async () => {
            setProcessingResult(true);
            const allocatedBegin = timeSlotKeyToScheduleTime(selection[0]);
            const allocatedEnd = timeSlotKeyToScheduleTime(
              selection[selection.length - 1],
              true
            );
            const input = {
              accepted: true,
              allocatedReservationUnit: reservationUnit.pk as number,
              applicationEventSchedule:
                matchingApplicationEventSchedule?.pk as number,
              allocatedDay: matchingApplicationEventSchedule?.day,
              allocatedBegin,
              allocatedEnd,
            };
            if (
              matchingApplicationEventSchedule.applicationEventScheduleResult
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
          }}
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
