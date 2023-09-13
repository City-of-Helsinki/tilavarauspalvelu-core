import React from "react";
import { useTranslation } from "react-i18next";
import { ApplicationEventStatus } from "../../common/types";
import { getNormalizedApplicationEventStatus } from "../../common/util";
import { getApplicationEventStatusColor } from "../../styles/util";
import StatusBlock from "../StatusBlock";

interface IProps {
  status: ApplicationEventStatus;
  accepted?: boolean;
  className?: string;
}

function ApplicationEventStatusBlock({
  status,
  accepted,
  className,
}: IProps): JSX.Element {
  const { t } = useTranslation();

  const normalizedStatus = getNormalizedApplicationEventStatus(
    status,
    accepted
  );

  return (
    <StatusBlock
      statusStr={t(`Recommendation.statuses.${normalizedStatus}`)}
      color={getApplicationEventStatusColor(normalizedStatus, "l")}
      className={className}
    />
  );
}

export default ApplicationEventStatusBlock;
