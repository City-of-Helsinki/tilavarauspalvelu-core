import React from "react";
import styled from "styled-components";
import { IconArrowRight } from "hds-react";
import { useTranslation } from "react-i18next";
import { ApplicationStatus, RecommendationStatus } from "../common/types";
import { StatusDot } from "../styles/util";

interface IStatusCellProps {
  text: string;
  status?: ApplicationStatus | RecommendationStatus;
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

export default function StatusCell({
  text,
  status,
}: IStatusCellProps): JSX.Element | null {
  const { t } = useTranslation();

  return status ? (
    <Wrapper>
      <div>
        <StatusDot status={status} size={12} />
        <span>{t(text)}</span>
      </div>
      <IconArrowRight />
    </Wrapper>
  ) : null;
}
