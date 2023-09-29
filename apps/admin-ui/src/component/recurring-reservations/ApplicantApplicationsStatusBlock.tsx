import React from "react";
import isPast from "date-fns/isPast";
import { useTranslation } from "react-i18next";
import {
  Application,
  ApplicationRound,
  ApplicationRoundStatus,
} from "common/types/common";
import { NormalizedApplicationRoundStatus } from "@/common/types";
import { getApplicationRoundStatusColor } from "../../styles/util";
import StatusBlock from "../StatusBlock";

const getNormalizedApplicationRoundStatus = (
  applicationRound: ApplicationRound
): ApplicationRoundStatus | NormalizedApplicationRoundStatus => {
  let normalizedStatus: NormalizedApplicationRoundStatus;

  if (
    ["in_review", "review_done", "allocated", "handled"].includes(
      applicationRound.status
    )
  ) {
    normalizedStatus = "handling";
  } else if (
    ["approved"].includes(applicationRound.status) &&
    applicationRound.applicationsSent
  ) {
    normalizedStatus = "sent";
  } else {
    normalizedStatus = applicationRound.status;
  }

  return normalizedStatus;
};

interface IProps {
  applicationRound: ApplicationRound;
  application: Application;
  className?: string;
}

function ApplicantApplicationsStatusBlock({
  applicationRound,
  application,
  className,
}: IProps): JSX.Element {
  const { t } = useTranslation();

  let { status } = applicationRound;
  if (
    status === "draft" &&
    isPast(new Date(applicationRound.applicationPeriodEnd))
  ) {
    status = "in_review";
  }

  const normalizedStatus =
    application.status === "sent"
      ? "sent"
      : getNormalizedApplicationRoundStatus(applicationRound);

  return (
    <StatusBlock
      statusStr={t(`Recommendation.applicantStatuses.${normalizedStatus}`)}
      color={getApplicationRoundStatusColor(normalizedStatus)}
      className={className}
    />
  );
}

export default ApplicantApplicationsStatusBlock;
