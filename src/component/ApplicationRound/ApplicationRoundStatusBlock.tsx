import React from "react";
import { useTranslation } from "react-i18next";
import { ApplicationRoundStatus } from "../../common/types";
import { getNormalizedApplicationRoundStatus } from "../../common/util";
import { getApplicationRoundStatusColor } from "../../styles/util";
import StatusBlock from "../StatusBlock";

interface IProps {
  status: ApplicationRoundStatus;
  className?: string;
}

function ApplicationRoundStatusBlock({
  status,
  className,
}: IProps): JSX.Element {
  const { t } = useTranslation();

  const normalizedStatus = getNormalizedApplicationRoundStatus(status);

  return (
    <StatusBlock
      statusStr={t(`ApplicationRound.statuses.${normalizedStatus}`)}
      color={getApplicationRoundStatusColor(normalizedStatus)}
      className={className}
    />
  );
}

export default ApplicationRoundStatusBlock;
