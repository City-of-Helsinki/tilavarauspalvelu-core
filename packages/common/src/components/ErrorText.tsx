import React from "react";
import { Notification, NotificationSize } from "hds-react";
import styled from "styled-components";

const StyledNotification = styled(Notification)`
  [class*="notification_hds-notification__body__"] {
    font-size: var(--fontsize-body-m);
  }
`;

type Props = {
  children: React.ReactNode;
  size?: NotificationSize;
  noTitle?: boolean;
  title?: string;
  className?: string;
  style?: React.CSSProperties;
  [key: `data-${string}`]: string;
  [key: `aria-${string}`]: string;
};

/// Specialize HDS notification
/// issues with the default HDS notification component
/// - label is mandatory if we want icon to show
/// - any other size than small shows the label as massive title text
/// - default font-size does not match input error text
export function ErrorText({ children, size, noTitle, title, ...rest }: Props) {
  const label = noTitle ? undefined : (title ?? children);
  return (
    <StyledNotification {...rest} size={size ?? NotificationSize.Small} type="error" label={label}>
      {children}
    </StyledNotification>
  );
}
