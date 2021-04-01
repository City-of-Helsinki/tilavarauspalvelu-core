import React from "react";
import { useTranslation } from "react-i18next";
import { ApplicationRoundStatus } from "../../common/types";
import {
  getNormalizedApplicationRoundStatus,
  ApplicationRoundStatusView,
} from "../../common/util";
import { getApplicationRoundStatusColor } from "../../styles/util";
import StatusBlock from "../StatusBlock";

interface IProps {
  status: ApplicationRoundStatus;
  view?: ApplicationRoundStatusView;
  className?: string;
}

function ApplicationRoundStatusBlock({
  status,
  view,
  className,
}: IProps): JSX.Element {
  const { t } = useTranslation();

  const normalizedStatus = view
    ? getNormalizedApplicationRoundStatus(status, view)
    : status;

  return (
    <StatusBlock
      statusStr={t(`ApplicationRound.statuses.${normalizedStatus}`)}
      color={getApplicationRoundStatusColor(normalizedStatus)}
      className={className}
    />
  );
}

export default ApplicationRoundStatusBlock;
