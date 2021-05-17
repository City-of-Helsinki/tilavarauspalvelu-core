import { IconCheck, IconEnvelope } from "hds-react";
import React, { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ApplicationStatus, ApplicationRoundStatus } from "../../common/types";
import { getNormalizedApplicationStatus } from "../../common/util";
import { getApplicationStatusColor } from "../../styles/util";
import StatusBlock from "../StatusBlock";

interface IProps {
  status: ApplicationStatus;
  view?: ApplicationRoundStatus;
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

  let icon: ReactNode | null;
  let style: React.CSSProperties = {};
  switch (normalizedStatus) {
    case "approved":
      icon = <IconCheck style={{ color: "var(--color-success)" }} />;
      style = { fontSize: "var(--fontsize-heading-xs)" };
      break;
    case "resolution_sent":
      icon = <IconEnvelope />;
      style = { fontSize: "var(--fontsize-heading-xs)" };
      break;
    default:
  }

  return (
    <StatusBlock
      statusStr={t(`Application.statuses.${normalizedStatus}`)}
      color={getApplicationStatusColor(normalizedStatus, "l")}
      icon={icon}
      className={className}
      style={style}
    />
  );
}

export default ApplicationStatusBlock;
