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

type StatusCellProps = {
  text: string;
};

// Define separate components to make the refactoring easier
// the type parameter and dynamic switching is very error prone and hard to grep for in the source code
export function ApplicationStatusCell(
  props: StatusCellProps & { status?: ApplicationStatusChoice }
): JSX.Element {
  let icon: ReactNode;

  // TODO there is a few icons we want, not the envelope but Cross and Check for ApplicationEvents
  // nothing for Application though
  if (props.status == null) {
    icon = null;
  } else if (props.status === ApplicationStatusChoice.Handled) {
    icon = <IconCheck aria-hidden style={{ color: "var(--color-success)" }} />;
  } else {
    icon = <StatusDot aria-hidden status={props.status} size={12} />;
  }

  return <StyledStatusCell {...props} icon={icon} />;
}

export function ApplicationEventStatusCell(
  props: StatusCellProps & { status?: ApplicationEventStatusChoice }
): JSX.Element {
  return (
    <StyledStatusCell
      {...props}
      icon={
        props.status && (
          <ApplicationEventStatusDot status={props.status} size={12} />
        )
      }
    />
  );
}
