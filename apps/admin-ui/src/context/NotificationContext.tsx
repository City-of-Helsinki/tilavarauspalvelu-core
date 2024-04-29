import React, { useContext, useMemo } from "react";

export type NotificationContextProps = {
  notification: NotificationType | null;
  setNotification: (notification: NotificationType) => void;
  notifyError: (message?: string, title?: string) => void;
  notifySuccess: (message?: string, title?: string) => void;
  clearNotification: () => void;
};

type NotificationType = {
  type: "error" | "success";
  title?: string;
  message?: string;
};

export const NotificationContext =
  React.createContext<NotificationContextProps>({
    notification: null,
    setNotification: () => {},
    clearNotification: () => {},
    notifyError: () => {},
    notifySuccess: () => {},
  });

export const useNotification = (): NotificationContextProps =>
  useContext(NotificationContext);

type Props = {
  children: React.ReactNode;
};

export const NotificationContextProvider: React.FC<Props> = ({
  children,
}: Props) => {
  const [notification, setNotification] =
    React.useState<NotificationType | null>(null);

  const clearNotification = () => setNotification(null);

  const notifyError = (message?: string, title?: string) => {
    setNotification({
      type: "error",
      title,
      message,
    });
  };

  const notifySuccess = (message?: string, title?: string) => {
    setNotification({
      type: "success",
      title,
      message,
    });
  };

  const [state] = React.useState({
    setNotification,
    clearNotification,
    notifyError,
    notifySuccess,
  });

  const notificationContextValues = useMemo(
    () => ({ ...state, notification }),
    [state, notification]
  );

  return (
    <NotificationContext.Provider value={notificationContextValues}>
      {children}
    </NotificationContext.Provider>
  );
};
