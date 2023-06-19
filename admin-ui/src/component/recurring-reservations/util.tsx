import React from "react";
import styled from "styled-components";
import { orderBy, trim, uniqBy } from "lodash";
import { TFunction } from "i18next";
import { formatters as getFormatters } from "common";
import {
  ApplicationEventType,
  ApplicationType,
  UnitType,
} from "common/types/gql-types";
import { fromApiDate } from "common/src/common/util";
import {
  ApplicationRound as ApplicationRoundType,
  ApplicationRoundStatus,
  ApplicationStatus,
} from "../../common/types";
import {
  appEventHours,
  applicantName,
  getNormalizedApplicationStatus,
  numTurns,
} from "../applications/util";
import StatusCell from "../StatusCell";
import { formatNumber } from "../../common/util";

export type ApplicationView = {
  id: number;
  eventId: number;
  key: string;
  applicant?: string;
  name: string;
  type: string;
  units: UnitType[];
  applicationCount: string;
  status: ApplicationStatus;
  statusView: JSX.Element;
  statusType: ApplicationStatus;
};

export type ApplicationEventView = {
  applicationId: number;
  id: number;
  applicant?: string;
  name: string;
  units: UnitType[];
  statusView: JSX.Element;
  applicationCount: string;
};

const StyledStatusCell = styled(StatusCell)`
  gap: 0 !important;
  > div {
    gap: 0 !important;
  }
`;

const formatters = getFormatters("fi");

export const appMapper = (
  round: ApplicationRoundType,
  app: ApplicationType,
  t: TFunction
): ApplicationView => {
  let applicationStatusView: ApplicationRoundStatus;
  switch (round.status) {
    case "approved":
      applicationStatusView = "approved";
      break;
    default:
      applicationStatusView = "in_review";
  }

  const units = orderBy(
    uniqBy(
      (app.applicationEvents || [])
        .flatMap((ae) => ae?.eventReservationUnits)
        .flatMap((eru) => ({
          ...eru?.reservationUnit?.unit,
          priority: eru?.priority as number,
        })),
      "pk"
    ),
    "priority",
    "asc"
  ) as UnitType[];
  const name = app.applicationEvents?.find(() => true)?.name || "-";
  const eventId = app.applicationEvents?.find(() => true)
    ?.id as unknown as number;

  const status = getNormalizedApplicationStatus(
    app.status as ApplicationStatus,
    applicationStatusView
  );

  const applicant = applicantName(app);

  return {
    key: `${app.id}-${eventId || "-"} `,
    id: app.pk as number,
    eventId,
    applicant,
    type: app.applicantType
      ? t(`Application.applicantTypes.${app.applicantType.toLowerCase()}`)
      : "",
    units,
    name,
    status: status as ApplicationStatus,
    statusView: (
      <StyledStatusCell
        status={status}
        text={`Application.statuses.${status}`}
        type="application"
        withArrow={false}
      />
    ),
    statusType: app.status as ApplicationStatus,
    applicationCount: trim(
      `${formatNumber(
        app.aggregatedData?.appliedReservationsTotal,
        ""
      )} / ${formatters.oneDecimal.format(
        Number(app.aggregatedData?.appliedMinDurationTotal) / 3600
      )} t`,
      " / "
    ),
  };
};

export const appEventMapper = (
  round: ApplicationRoundType,
  appEvent: ApplicationEventType
): ApplicationEventView => {
  let applicationStatusView: ApplicationRoundStatus;
  switch (round.status) {
    case "approved":
      applicationStatusView = "approved";
      break;
    default:
      applicationStatusView = "in_review";
  }

  const status = getNormalizedApplicationStatus(
    appEvent.application.status as ApplicationStatus,
    applicationStatusView
  );

  const units = orderBy(
    uniqBy(
      appEvent.eventReservationUnits?.flatMap((eru) => ({
        ...eru?.reservationUnit?.unit,
        priority: eru?.priority as number,
      })),
      "pk"
    ),
    "priority",
    "asc"
  ) as UnitType[];
  const name = appEvent.name || "-";
  const eventId = appEvent.pk as number;

  const applicant = applicantName(appEvent.application);

  const turns =
    appEvent.begin && appEvent.end
      ? numTurns(
          appEvent.begin,
          appEvent.end,
          appEvent.biweekly,
          appEvent.eventsPerWeek as number
        )
      : 0;

  const totalHours =
    appEvent.begin && appEvent.end
      ? appEventHours(
          fromApiDate(appEvent.begin).toISOString(),
          fromApiDate(appEvent.end).toISOString(),
          appEvent.biweekly,
          appEvent.eventsPerWeek as number,
          appEvent.minDuration as number
        )
      : 0;

  return {
    applicationId: appEvent.application.pk as number,
    id: eventId,
    applicant,
    units,
    name,
    applicationCount: trim(
      `${formatNumber(turns, "")} / ${formatters.oneDecimal.format(
        totalHours
      )} t`,
      " / "
    ),
    statusView: (
      <StyledStatusCell
        status={status}
        text={`Application.statuses.${status}`}
        type="application"
        withArrow={false}
      />
    ),
  };
};

export const truncate = (val: string, maxLen: number): string =>
  val.length > maxLen ? `${val.substring(0, maxLen)}…` : val;
