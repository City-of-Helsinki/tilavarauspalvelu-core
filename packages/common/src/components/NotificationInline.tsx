import React from "react";
import {
  IconAlertCircleFill,
  IconErrorFill,
  Notification,
  NotificationProps,
} from "hds-react";
import styled from "styled-components";

type Props = {
  children: React.ReactNode;
  type: NotificationProps["type"];
};

const StyledNotification = styled(Notification)`
  padding: var(--spacing-2-xs) var(--spacing-xs);
  & > div > div {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: var(--spacing-2-xs);

    & > svg {
      flex-shrink: 0;
    }
  }
`;

/// TODO see if we can use vars for the colours (they are svg fill colours so css vars might not work)
const WarningIcon = <IconAlertCircleFill size="s" color="#D18200" />;
const ErrorIcon = <IconErrorFill size="s" color="#B01038" />;
// TODO check the colours and icons for success and info
const SuccessIcon = <IconAlertCircleFill size="s" color="#006442" />;
const InfoIcon = <IconAlertCircleFill size="s" color="#006442" />;

function getIcon(type: NotificationProps["type"]): React.ReactNode {
  switch (type) {
    case "alert":
      return WarningIcon;
    case "success":
      return SuccessIcon;
    case "info":
      return InfoIcon;
    case "error":
      return ErrorIcon;
    default:
      return undefined;
  }
}

/// Inline replacement for HDS Notification component.
/// Without this the inline icon is not aligned properly.
/// Doesn't include the title (label) prop of HDS Notification.
export function NotificationInline({ children, type }: Props): JSX.Element {
  return (
    <StyledNotification type={type}>
      {getIcon(type)}
      {children}
    </StyledNotification>
  );
}
