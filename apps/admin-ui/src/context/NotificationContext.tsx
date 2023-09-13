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
  title: string | null;
  message: string | null;
  type: "error" | "success";
  options?: NotificationOptions;
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
  dismissible?: boolean;
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

  const showDisappearingNotification = (n: NotificationType) => {
    clearTimeout(cancel);
    setNotification(n);
    const timeout = setTimeout(() => {
      setNotification(null);
    }, 1000 * 5);

    setCancel(timeout);
  };

  const notifyError = (
    message?: string,
    options?: NotificationOptions,
    title = ""
  ) => {
    showDisappearingNotification({
      type: "error",
      title: title || null,
      message: message || null,
      options,
    });
  };

  const notifySuccess = (
    message?: string,
    options?: NotificationOptions,
    title = ""
  ) => {
    showDisappearingNotification({
      type: "success",
      title: title || null,
      message: message || null,
      options,
    });
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
