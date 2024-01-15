import React, { type ReactNode } from "react";
import styled, { css } from "styled-components";
import { IconCheckCircleFill, IconCrossCircleFill } from "hds-react";
import { useTranslation } from "react-i18next";
import {
  ApplicationEventStatusChoice,
  ApplicationStatusChoice,
} from "common/types/gql-types";
import {
  getApplicationEventStatusColor,
  getApplicationStatusColor,
} from "@/component//applications/util";

const dotCss = css`
  display: inline-block;
  width: 16px;
  height: 16px;
  border-radius: 50%;

  /* icons have 24px rect around, add margin to match them */
  margin: 4px;
`;

const StatusDot = styled.div<{
  status: ApplicationStatusChoice;
}>`
  ${dotCss}
  background-color: ${({ status }) => getApplicationStatusColor(status, "s")};
`;

const ApplicationEventStatusDot = styled.div<{
  status: ApplicationEventStatusChoice;
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

function ApplicationStatusIcon({
  status,
}: {
  status?: ApplicationStatusChoice;
}): JSX.Element | null {
  if (status == null) {
    return null;
  }
  return <StatusDot aria-hidden status={status} />;
}

function ApplicationEventStatusIcon({
  status,
}: {
  status?: ApplicationEventStatusChoice;
}): JSX.Element | null {
  if (status == null) {
    return null;
  }
  if (status === ApplicationEventStatusChoice.Approved) {
    return (
      <IconCheckCircleFill
        aria-hidden
        style={{ color: "var(--color-success)" }}
      />
    );
  }
  if (status === ApplicationEventStatusChoice.Declined) {
    return (
      <IconCrossCircleFill
        aria-hidden
        style={{ color: "var(--color-error)" }}
      />
    );
  }
  return <ApplicationEventStatusDot aria-hidden status={status} />;
}

// Define separate components to make the refactoring easier
// the type parameter and dynamic switching is very error prone and hard to grep for in the source code
export function ApplicationStatusCell({
  status,
}: {
  status?: ApplicationStatusChoice;
}): JSX.Element {
  const text = `Application.statuses.${status}`;

  return (
    <StatusCell text={text} icon={<ApplicationStatusIcon status={status} />} />
  );
}

export function ApplicationEventStatusCell({
  status,
}: {
  status?: ApplicationEventStatusChoice;
}): JSX.Element {
  const text = `ApplicationEvent.statuses.${status}`;
  return (
    <StatusCell
      text={text}
      icon={<ApplicationEventStatusIcon status={status} />}
    />
  );
}
