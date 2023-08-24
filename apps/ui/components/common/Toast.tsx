import FocusTrap from "focus-trap-react";
import { Notification, NotificationProps } from "hds-react";
import React from "react";

export const Toast = (props: NotificationProps & { trapFocus?: boolean }) => {
  const { trapFocus, ...rest } = props;

  const notification = <Notification {...rest} />;

  const Wrapper = trapFocus ? FocusTrap : React.Fragment;

  return (
    <Wrapper
      {...(trapFocus && {
        focusTrapOptions: {
          initialFocus: "#toast-wrapper",
          clickOutsideDeactivates: true,
        },
      })}
    >
      <div id="toast-wrapper">{notification}</div>
    </Wrapper>
  );
};
