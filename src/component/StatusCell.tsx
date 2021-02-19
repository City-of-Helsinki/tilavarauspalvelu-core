import React from "react";
import styled from "styled-components";
import { IconArrowRight } from "hds-react";
import { useTranslation } from "react-i18next";
import { ApplicationStatus } from "../common/types";
import { StatusDot } from "../styles/util";

interface ILinkCellProps {
  text: string;
  status: ApplicationStatus;
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

export default function LinkCell({
  text,
  status,
}: ILinkCellProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <Wrapper>
      <div>
        <StatusDot status={status} size={12} />
        <span>{t(text)}</span>
      </div>
      <IconArrowRight />
    </Wrapper>
  );
}
