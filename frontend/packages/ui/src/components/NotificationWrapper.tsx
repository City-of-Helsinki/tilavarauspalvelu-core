import React, { useState } from "react";
import { Notification } from "hds-react";
import styled from "styled-components";
import type { NotificationProps } from "hds-react";

type NotificationPropsWithCentering = NotificationProps & {
  centered?: boolean;
};

const StyledNotification = styled(Notification)`
  > div {
    max-width: var(--tilavaraus-page-max-width);
    margin: 0 auto;

    /* close button should not overlap text */
    padding-right: var(--spacing-m);

    & p {
      /* make the notification slimmer */
      &:first-of-type {
        margin-top: 0;
      }
      font-size: var(--fontsize-body-s);
    }
  }
`;

export function NotificationWrapper({
  centered,
  onClose,
  ...rest
}: NotificationPropsWithCentering): React.ReactElement | null {
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
