import React, { ReactNode } from "react";
import styled, { css } from "styled-components";
import { IconCheck } from "hds-react";
import { useTranslation } from "react-i18next";
import {
  ApplicationEventStatusChoice,
  ApplicationStatusChoice,
} from "common/types/gql-types";
import {
  getApplicationEventStatusColor,
  getApplicationStatusColor,
} from "@/component//applications/util";

const dotCss = css<{
  size: number;
}>`
  display: inline-block;
  width: ${({ size }) => size && `${size}px`};
  height: ${({ size }) => size && `${size}px`};
  border-radius: 50%;
`;
const StatusDot = styled.div<{
  status: ApplicationStatusChoice;
  size: number;
}>`
  ${dotCss}
  background-color: ${({ status }) => getApplicationStatusColor(status, "s")};
`;

const ApplicationEventStatusDot = styled.div<{
  status: ApplicationEventStatusChoice;
  size: number;
}>`
  ${dotCss}
  background-color: ${({ status }) =>
    getApplicationEventStatusColor(status, "s")};
`;

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.625em;
  color: var(--tilavaraus-admin-content-text-color);
`;

const Status = styled.div`
  display: inline-flex;
  align-items: center;
`;

interface IStatusCellProps {
  text: string;
  icon: ReactNode;
}

function StatusCell({ text, icon }: IStatusCellProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <Wrapper>
      <Status>{icon}</Status>
      <span>{t(text)}</span>
    </Wrapper>
  );
}

const StyledStatusCell = styled(StatusCell)`
  gap: 0 !important;
  > div {
    gap: 0 !important;
  }
`;

// Define separate components to make the refactoring easier
// the type parameter and dynamic switching is very error prone and hard to grep for in the source code
export function ApplicationStatusCell({
  status,
}: {
  status?: ApplicationStatusChoice;
}): JSX.Element {
  // TODO this can return undefined
  const text = `Application.statuses.${status}`;

  // TODO there is a few icons we want, not the envelope but Cross and Check for ApplicationEvents
  // nothing for Application though
  let icon: ReactNode;
  if (status == null) {
    icon = null;
  } else if (status === ApplicationStatusChoice.Handled) {
    icon = <IconCheck aria-hidden style={{ color: "var(--color-success)" }} />;
  } else {
    icon = <StatusDot aria-hidden status={status} size={12} />;
  }

  return <StyledStatusCell text={text} icon={icon} />;
}

export function ApplicationEventStatusCell({
  status,
}: {
  status?: ApplicationEventStatusChoice;
}): JSX.Element {
  // TODO this can return undefined
  const text = `ApplicationEvent.statuses.${status}`;
  return (
    <StyledStatusCell
      text={text}
      icon={status && <ApplicationEventStatusDot status={status} size={12} />}
    />
  );
}
