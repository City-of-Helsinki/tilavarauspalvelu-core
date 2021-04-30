import React, { ReactNode } from "react";
import styled from "styled-components";
import { IconArrowRight } from "hds-react";
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

  let dot: ReactNode;
  switch (type) {
    case "applicationEvent":
      dot = (
        <ApplicationEventStatusDot
          status={status as ApplicationEventStatus}
          size={12}
        />
      );
      break;
    case "application":
      dot = <StatusDot status={status as ApplicationStatus} size={12} />;

      break;
    default:
  }

  return status ? (
    <Wrapper>
      <Status>
        {dot}
        <span>{t(text)}</span>
      </Status>
      <IconArrowRight />
    </Wrapper>
  ) : null;
}
