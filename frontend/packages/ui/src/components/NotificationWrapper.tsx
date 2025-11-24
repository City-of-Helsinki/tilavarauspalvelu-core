import React, { useState } from "react";
import type { NotificationProps } from "hds-react";
import { Notification } from "hds-react";
import styled from "styled-components";

type NotificationPropsWithCentering = NotificationProps & {
  centered?: boolean;
};

const StyledNotification = styled(Notification)`
  > div {
    max-width: var(--tilavaraus-page-max-width);
    margin: 0 auto;
    & p {
      /* make the notification slimmer */
      &:first-of-type {
        margin-top: 0;
      }

      /* close button should not overlap text */
      padding-right: var(--spacing-m);
      font-size: var(--fontsize-body-s);
    }
  }
`;

export function NotificationWrapper({
  centered,
  onClose,
  ...rest
}: NotificationPropsWithCentering): JSX.Element | null {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) {
    return null;
  }
  return (
    <StyledNotification
      {...rest}
      onClose={() => {
        setIsVisible(false);
        onClose?.();
      }}
    />
  );
}
