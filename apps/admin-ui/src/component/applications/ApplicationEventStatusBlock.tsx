import React from "react";
import { useTranslation } from "react-i18next";
import { ApplicationEventStatus } from "common/types/common";
import { getApplicationEventStatusColor } from "../../styles/util";
import StatusBlock from "../StatusBlock";

const getNormalizedApplicationEventStatus = (
  status: ApplicationEventStatus,
  accepted?: boolean
): ApplicationEventStatus => {
  let normalizedStatus: ApplicationEventStatus = status;

  if (accepted) {
    normalizedStatus = "validated";
  } else if (["created", "allocating", "allocated"].includes(status)) {
    normalizedStatus = "created";
  }

  return normalizedStatus;
};

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
