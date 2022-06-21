import React, { useContext } from "react";

export type NotificationContextProps = {
  notification: NotificationType | null;
  setNotification: (notification: NotificationType) => void;
  notifyError: (title: string, message?: string) => void;
  notifySuccess: (title: string, message?: string) => void;
  clearNotification: () => void;
};

export type NotificationType = {
  title: string;
  message: string | null;
  type: "error" | "success";
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

export const NotificationContextProvider: React.FC = ({ children }) => {
  const [notification, setNotification] =
    React.useState<NotificationType | null>(null);
  const [cancel, setCancel] = React.useState<any>();

  const clearNotification = () => setNotification(null);

  const showDisappearingNotification = (n: NotificationType) => {
    clearTimeout(cancel);
    setNotification(n);
    const timeout = setTimeout(() => {
      setNotification(null);
    }, 1000 * 5);

    setCancel(timeout);
  };

  function notifyError(title: string, message?: string) {
    showDisappearingNotification({
      type: "error",
      title,
      message: message || null,
    });
  }

  function notifySuccess(title: string, message?: string) {
    showDisappearingNotification({
      type: "success",
      title,
      message: message || null,
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
