import React, { ReactNode } from "react";
import styled from "styled-components";
import { IconArrowRight, IconCheck } from "hds-react";
import { useTranslation } from "react-i18next";
import {
  ApplicationEventStatusChoice,
  ApplicationStatusChoice,
} from "common/types/gql-types";
import {
  getApplicationEventStatusColor,
  getApplicationStatusColor,
} from "@/component//applications/util";

const StatusDot = styled.div<{
  status: ApplicationStatusChoice;
  size: number;
}>`
  display: inline-block;
  width: ${({ size }) => size && `${size}px`};
  height: ${({ size }) => size && `${size}px`};
  border-radius: 50%;
  background-color: ${({ status }) => getApplicationStatusColor(status, "s")};
`;

const ApplicationEventStatusDot = styled.div<{
  status: ApplicationEventStatusChoice;
  size: number;
}>`
  display: inline-block;
  width: ${({ size }) => size && `${size}px`};
  height: ${({ size }) => size && `${size}px`};
  border-radius: 50%;
  background-color: ${({ status }) =>
    getApplicationEventStatusColor(status, "s")};
`;

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--tilavaraus-admin-content-text-color);

  ${StatusDot} {
    margin-right: 0.625em;
  }
`;

const Status = styled.div`
  display: inline-flex;
  align-items: center;
`;

interface IStatusCellProps {
  text: string;
  icon: ReactNode;
  linkText: string;
}

function StatusCell({ text, icon, linkText }: IStatusCellProps): JSX.Element {
  const { t } = useTranslation();
  const withArrow = false;

  return (
    <Wrapper>
      <Status>
        {icon}
        <span>{t(text)}</span>
      </Status>
      {withArrow && (
        <IconArrowRight
          aria-label={t(linkText)}
          data-testid="status-cell__link--icon"
        />
      )}
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
  const linkText = "Application.gotoLink";

  if (props.status == null) {
    icon = null;
  } else if (props.status === ApplicationStatusChoice.Handled) {
    icon = <IconCheck aria-hidden style={{ color: "var(--color-success)" }} />;
  } else {
    icon = <StatusDot aria-hidden status={props.status} size={12} />;
  }

  return <StyledStatusCell {...props} icon={icon} linkText={linkText} />;
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
      linkText="ApplicationEvent.gotoLink"
    />
  );
}
