import React, { useState } from "react";
import {
  NotificationContext,
  type NotificationContextProps,
} from "app/context/NotificationContext";

export const notifySuccess = jest.fn(() => {});
export const notifyError = jest.fn(() => {});
beforeEach(() => {
  notifyError.mockReset();
  notifySuccess.mockReset();
});

const NotificationContextMock = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [notification] = useState<NotificationContextProps>({
    notification: null,
    setNotification: () => {},
    clearNotification: () => {},
    notifyError,
    notifySuccess,
  });

  return (
    <NotificationContext.Provider value={notification}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContextMock;
