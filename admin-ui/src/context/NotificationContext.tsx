import React, { useContext } from "react";

export type NotificationContextProps = {
  notification: NotificationType | null;
  setNotification: (notification: NotificationType) => void;
  notifyError: (
    title: string,
    message?: string,
    options?: NotificationOptions
  ) => void;
  notifySuccess: (
    title: string,
    message?: string,
    options?: NotificationOptions
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

export const NotificationContextProvider: React.FC = ({ children }) => {
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

  function notifyError(
    title = "",
    message?: string,
    options?: NotificationOptions
  ) {
    showDisappearingNotification({
      type: "error",
      title: title || null,
      message: message || null,
      options,
    });
  }

  function notifySuccess(
    title = "",
    message?: string,
    options?: NotificationOptions
  ) {
    showDisappearingNotification({
      type: "success",
      title: title || null,
      message: message || null,
      options,
    });
  }

  const [state] = React.useState({
    setNotification: showDisappearingNotification,
    clearNotification,
    notifyError,
    notifySuccess,
  });

  return (
    <NotificationContext.Provider value={{ ...state, notification }}>
      {children}
    </NotificationContext.Provider>
  );
};
