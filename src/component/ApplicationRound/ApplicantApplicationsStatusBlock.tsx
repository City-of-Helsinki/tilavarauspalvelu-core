import React from "react";
import isPast from "date-fns/isPast";
import { useTranslation } from "react-i18next";
import { Application, ApplicationRound } from "../../common/types";
import { getNormalizedApplicationRoundStatus } from "../../common/util";
import { getApplicationRoundStatusColor } from "../../styles/util";
import StatusBlock from "../StatusBlock";

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
