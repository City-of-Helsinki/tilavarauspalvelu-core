import React from "react";
import { useTranslation } from "react-i18next";
import { ApplicationEventStatus } from "../../common/types";
import {} from "../../common/util";
import { getApplicationStatusColor } from "../../styles/util";
import StatusBlock from "../StatusBlock";

interface IProps {
  status: ApplicationEventStatus;
  className?: string;
}

function ApplicationEventStatusBlock({
  status,
  className,
}: IProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <StatusBlock
      statusStr={t(`Recommendation.statuses.${status}`)}
      color={getApplicationStatusColor(status, "l")}
      className={className}
    />
  );
}

export default ApplicationEventStatusBlock;
