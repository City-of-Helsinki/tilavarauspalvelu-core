import React from "react";
import { useTranslation } from "react-i18next";
import { ApplicationStatus } from "../../common/types";
import {
  getNormalizedApplicationStatus,
  ApplicationStatusView,
} from "../../common/util";
import { getApplicationStatusColor } from "../../styles/util";
import StatusBlock from "../StatusBlock";

interface IProps {
  status: ApplicationStatus;
  view?: ApplicationStatusView;
  className?: string;
}

function ApplicationStatusBlock({
  status,
  view,
  className,
}: IProps): JSX.Element {
  const { t } = useTranslation();

  const normalizedStatus = view
    ? getNormalizedApplicationStatus(status, view)
    : status;

  return (
    <StatusBlock
      statusStr={t(`Application.statuses.${normalizedStatus}`)}
      color={getApplicationStatusColor(normalizedStatus, "l")}
      className={className}
    />
  );
}

export default ApplicationStatusBlock;
