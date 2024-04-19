import React from "react";
import { Notification } from "hds-react";

export function ErrorToast({
  error,
  onClose,
  title,
}: {
  error: string;
  onClose?: () => void;
  title?: string;
}): JSX.Element {
  return (
    <Notification
      type="error"
      label={title ?? error}
      position="top-center"
      autoClose
      displayAutoCloseProgress={false}
      onClose={onClose}
    >
      {error}
    </Notification>
  );
}
