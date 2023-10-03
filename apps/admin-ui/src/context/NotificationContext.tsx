import React, { useContext, useMemo } from "react";

export type NotificationContextProps = {
  notification: NotificationType | null;
  setNotification: (notification: NotificationType) => void;
  notifyError: (
    message?: string,
    options?: NotificationOptions,
    title?: string
  ) => void;
  notifySuccess: (
    message?: string,
    options?: NotificationOptions,
    title?: string
  ) => void;
  clearNotification: () => void;
};

export type NotificationType = {
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

export type NotificationOptions = {
  autoClose?: boolean;
};

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
  const [cancel, setCancel] = React.useState<NodeJS.Timeout>();

  const clearNotification = () => setNotification(null);

  const showDisappearingNotification = (
    n: NotificationType,
    options?: NotificationOptions
  ) => {
    clearTimeout(cancel);
    setNotification(n);
    if (options?.autoClose) {
      const timeout = setTimeout(() => {
        setNotification(null);
      }, 5 * 1000);
      setCancel(timeout);
    }
  };

  const notifyError = (
    message?: string,
    options?: NotificationOptions,
    title?: string
  ) => {
    showDisappearingNotification(
      {
        type: "error",
        title,
        message,
      },
      options
    );
  };

  const notifySuccess = (
    message?: string,
    options?: NotificationOptions,
    title?: string
  ) => {
    showDisappearingNotification(
      {
        type: "success",
        title,
        message,
      },
      options
    );
  };

  const [state] = React.useState({
    setNotification: showDisappearingNotification,
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
