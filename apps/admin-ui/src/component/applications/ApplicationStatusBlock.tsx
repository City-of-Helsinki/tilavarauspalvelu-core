import { IconCheck, IconEnvelope } from "hds-react";
import React, { ReactNode } from "react";
import { ApplicationStatusChoice } from "common/types/gql-types";
import { useTranslation } from "react-i18next";
import StatusBlock from "../StatusBlock";
import { getApplicationStatusColor } from "./util";

interface IProps {
  status: ApplicationStatusChoice;
  className?: string;
}

function ApplicationStatusBlock({
  status,
  className,
}: IProps): JSX.Element {
  const { t } = useTranslation();

  let icon: ReactNode | null;
  let style: React.CSSProperties = {};
  switch (status) {
    case ApplicationStatusChoice.Handled:
      icon = (
        <IconCheck aria-hidden style={{ color: "var(--color-success)" }} />
      );
      style = { fontSize: "var(--fontsize-heading-xs)" };
      break;
    case ApplicationStatusChoice.ResultsSent:
      icon = <IconEnvelope aria-hidden />;
      style = { fontSize: "var(--fontsize-heading-xs)" };
      break;
    default:
  }

  return (
    <StatusBlock
      statusStr={t(`Application.statuses.${status}`)}
      color={getApplicationStatusColor(status, "l")}
      icon={icon}
      className={className}
      style={style}
    />
  );
}

export default ApplicationStatusBlock;
