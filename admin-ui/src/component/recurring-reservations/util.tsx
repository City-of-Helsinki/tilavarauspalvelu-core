import React from "react";
import styled from "styled-components";
import { orderBy, trim, uniqBy } from "lodash";
import { TFunction } from "react-i18next";
import {
  Application as ApplicationType,
  ApplicationEventStatus,
  ApplicationRound as ApplicationRoundType,
  ApplicationRoundStatus,
  ApplicationStatus,
  Unit,
} from "../../common/types";
import {
  applicantName,
  applicationHours,
  applicationTurns,
  getNormalizedApplicationStatus,
} from "../applications/util";
import StatusCell from "../StatusCell";
import { formatNumber } from "../../common/util";

export type ApplicationView = {
  id: number;
  eventId: number;
  key: string;
  applicant?: string;
  applicantSort: string;
  name: string;
  nameSort: string;
  type: string;
  units: Unit[];
  unitsSort: string;
  applicationCount: string;
  applicationCountSort: number;
  status: ApplicationStatus | ApplicationEventStatus;
  statusView: JSX.Element;
  statusType: ApplicationStatus;
};

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
      app.applicationEvents
        .flatMap((ae) => ae.eventReservationUnits)
        .flatMap((eru) => ({
          ...eru.reservationUnitDetails.unit,
          priority: eru.priority,
        })),
      "id"
    ),
    "priority",
    "asc"
  );

  const name = app.applicationEvents.find(() => true)?.name || "-";
  const eventId = app.applicationEvents.find(() => true)?.id as number;

  const StyledStatusCell = styled(StatusCell)`
    gap: 0 !important;
    > div {
      gap: 0 !important;
    }
  `;

  const status = getNormalizedApplicationStatus(
    app.status,
    applicationStatusView
  );

  const applicant = applicantName(app);

  return {
    key: `${app.id}-${eventId || "-"} `,
    id: app.id,
    eventId,
    applicant,
    applicantSort: applicant.toLowerCase(),
    type: app.applicantType
      ? t(`Application.applicantTypes.${app.applicantType}`)
      : "",
    units,
    unitsSort: units.find(() => true)?.name.fi || "",
    name,
    nameSort: name.toLowerCase(),
    status,
    statusView: (
      <StyledStatusCell
        status={status}
        text={`Application.statuses.${status}`}
        type="application"
        withArrow={false}
      />
    ),
    statusType: app.status,
    applicationCount: trim(
      `${formatNumber(
        applicationTurns(app),
        t("common.volumeUnit")
      )} / ${applicationHours(app)} t`,
      " / "
    ),
    applicationCountSort: applicationTurns(app) || 0,
  };
};

export const truncate = (val: string, maxLen: number): string =>
  val.length > maxLen ? `${val.substring(0, maxLen)}…` : val;
