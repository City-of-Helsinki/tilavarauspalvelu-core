import React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { ApplicationStatus } from "../common/types";
import { getNormalizedStatus } from "../common/util";
import { getStatusColor } from "../styles/util";

interface IProps {
  status: ApplicationStatus;
  view?: 1;
  className?: string;
}

const Wrapper = styled.div<{ $color: string }>`
  display: inline-flex;
  align-items: center;
  margin-bottom: var(--spacing-3-xl);
  background-color: ${({ $color }) => $color};
  height: 28px;
  padding: 0 15px;
  color: var(--color-white);
  font-family: var(--tilavaraus-admin-font-bold);
  font-weight: bold;
  font-size: var(--fontsize-body-s);
`;

function StatusBlock({ status, view, className }: IProps): JSX.Element {
  const { t } = useTranslation();

  const normalizedStatus = view ? getNormalizedStatus(status, view) : status;

  return (
    <Wrapper
      $color={getStatusColor(normalizedStatus, "l")}
      className={className}
    >
      <span>{t(`Application.statuses.${normalizedStatus}`)}</span>
    </Wrapper>
  );
}

export default StatusBlock;
