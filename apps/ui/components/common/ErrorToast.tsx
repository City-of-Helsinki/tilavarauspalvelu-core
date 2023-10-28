import React from "react";
import { Notification } from "hds-react";

export const ErrorToast = ({
  error,
  onClose,
}: {
  error: string;
  onClose?: () => void;
}): JSX.Element => {
  return (
    <Notification
      type="error"
      label={error}
      position="top-center"
      autoClose
      displayAutoCloseProgress={false}
      onClose={onClose}
    >
      {error}
    </Notification>
  );
};
