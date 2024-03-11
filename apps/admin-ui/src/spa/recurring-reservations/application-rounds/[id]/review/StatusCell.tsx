import React, { type ReactNode } from "react";
import styled, { css } from "styled-components";
import { IconCheckCircleFill, IconCrossCircleFill } from "hds-react";
import { useTranslation } from "react-i18next";
import {
  ApplicationSectionStatusChoice,
  ApplicationStatusChoice,
} from "common/types/gql-types";
import {
  getApplicationSectiontatusColor,
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

const ApplicationSectionStatusDot = styled.div<{
  status: ApplicationSectionStatusChoice;
}>`
  ${dotCss}
  background-color: ${({ status }) => getApplicationSectiontatusColor(status)};
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

function ApplicationSectionStatusIcon({
  status,
}: {
  status?: ApplicationSectionStatusChoice;
}): JSX.Element | null {
  if (status == null) {
    return null;
  }

  // TODO what are the states? declined / approved now?
  if (status === ApplicationSectionStatusChoice.Handled) {
    return (
      <IconCheckCircleFill
        aria-hidden
        style={{ color: "var(--color-success)" }}
      />
    );
  }

  return <ApplicationSectionStatusDot aria-hidden status={status} />;
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

export function ApplicationSectionStatusCell({
  status,
}: {
  status?: ApplicationSectionStatusChoice;
}): JSX.Element {
  const text = `ApplicationSectionStatusChoice.${status}`;
  return (
    <StatusCell
      text={text}
      icon={<ApplicationSectionStatusIcon status={status} />}
    />
  );
}

export function TimeSlotStatusCell({
  status,
}: {
  status: "declined" | "approved";
}): JSX.Element {
  const text = `TimeSlotStatusCell.${status}`;
  const icon =
    status === "approved" ? (
      <IconCheckCircleFill
        aria-hidden
        style={{ color: "var(--color-success)" }}
      />
    ) : (
      <IconCrossCircleFill
        aria-hidden
        style={{ color: "var(--color-danger)" }}
      />
    );

  return <StatusCell text={text} icon={icon} />;
}
