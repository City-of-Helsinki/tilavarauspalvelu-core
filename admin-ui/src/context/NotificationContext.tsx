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
  const clearNotification = () => setNotification(null);

  const showDisappearingNotification = (n: NotificationType) => {
    setNotification(n);
    setTimeout(() => setNotification(null), 1000 * 5);
  };

  return (
    <NotificationContext.Provider
      value={{
        notification,
        setNotification: showDisappearingNotification,
        clearNotification,
        notifyError: (title, message?) => {
          showDisappearingNotification({
            type: "error",
            title,
            message: message || null,
          });
        },
        notifySuccess: (title, message?) => {
          showDisappearingNotification({
            type: "success",
            title,
            message: message || null,
          });
        },
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
