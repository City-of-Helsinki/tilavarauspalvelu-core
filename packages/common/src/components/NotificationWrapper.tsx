import React, { useState } from "react";
import styled from "styled-components";
import { Notification, NotificationProps } from "hds-react";

type NotificationPropsWithCentering = NotificationProps & {
  centered?: boolean;
};

const StyledNotification = styled(Notification)`
  > div {
    max-width: var(--tilavaraus-page-max-width);
    margin: 0 auto;
  }
`;

function NotificationWrapper(
  props: NotificationPropsWithCentering
): JSX.Element | null {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) {
    return null;
  }
  return (
    <StyledNotification
      {...props}
      onClose={() => {
        setIsVisible(false);
        props.onClose?.();
      }}
    />
  );
}

export default NotificationWrapper;
