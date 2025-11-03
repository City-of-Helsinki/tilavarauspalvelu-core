import React, { useState } from "react";
import { Notification, NotificationProps } from "hds-react";
import styled from "styled-components";

type NotificationPropsWithCentering = NotificationProps & {
  centered?: boolean;
};

const StyledNotification = styled(Notification)`
  > div {
    max-width: var(--tilavaraus-page-max-width);
    margin: 0 auto;
    & p {
      &:first-of-type {
        margin-top: 0;
      }
      font-size: var(--fontsize-body-s);
    }
  }
`;

function NotificationWrapper({ centered, onClose, ...rest }: NotificationPropsWithCentering): JSX.Element | null {
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

export default NotificationWrapper;
