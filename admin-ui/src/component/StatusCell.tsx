import React, { ReactNode } from "react";
import styled from "styled-components";
import { IconArrowRight, IconCheck, IconEnvelope } from "hds-react";
import { useTranslation } from "react-i18next";
import { ApplicationEventStatus, ApplicationStatus } from "../common/types";
import { ApplicationEventStatusDot, StatusDot } from "../styles/util";

interface IStatusCellProps {
  text: string;
  status?: ApplicationStatus | ApplicationEventStatus;
  type: "application" | "applicationEvent";
}

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--tilavaraus-admin-content-text-color);
  gap: var(--spacing-3-xs);

  ${StatusDot} {
    margin-right: 0.625em;
  }
`;

const Status = styled.div`
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
`;

export default function StatusCell({
  text,
  status,
  type,
}: IStatusCellProps): JSX.Element | null {
  const { t } = useTranslation();

  let icon: ReactNode;
  let linkText = "";
  switch (type) {
    case "applicationEvent":
      icon = (
        <ApplicationEventStatusDot
          status={status as ApplicationEventStatus}
          size={12}
        />
      );
      linkText = "ApplicationEvent.gotoLink";
      break;
    case "application":
      if (["sent"].includes(status as ApplicationStatus)) {
        icon = <IconEnvelope aria-hidden />;
      } else if (["approved"].includes(status as ApplicationStatus)) {
        icon = (
          <IconCheck aria-hidden style={{ color: "var(--color-success)" }} />
        );
      } else {
        icon = (
          <StatusDot
            aria-hidden
            status={status as ApplicationStatus}
            size={12}
          />
        );
      }
      linkText = "Application.gotoLink";
      break;
    default:
  }

  return status ? (
    <Wrapper>
      <Status>
        {icon}
        <span>{t(text)}</span>
      </Status>
      <IconArrowRight
        aria-label={t(linkText)}
        data-testid="status-cell__link--icon"
      />
    </Wrapper>
  ) : null;
}
