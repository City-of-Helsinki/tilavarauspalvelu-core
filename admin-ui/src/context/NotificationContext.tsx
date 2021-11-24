import React, { useContext } from "react";

export type NotificationContextProps = {
  notification: NotificationType | null;
  setNotification: (notification: NotificationType) => void;
  clearNotification: () => void;
};

export type NotificationType = {
  title: string;
  message: string;
  type: "error" | "success";
};

export const NotificationContext =
  React.createContext<NotificationContextProps>({
    notification: null,
    setNotification: () => {},
    clearNotification: () => {},
  });

export const useNotification = (): NotificationContextProps =>
  useContext(NotificationContext);

export const NotificationContextProvider: React.FC = ({ children }) => {
  const [notification, setNotification] =
    React.useState<NotificationType | null>(null);
  const clearNotification = () => setNotification(null);

  return (
    <NotificationContext.Provider
      value={{
        notification,
        setNotification: (n) => {
          setNotification(n);
          setTimeout(() => setNotification(null), 1000 * 5);
        },
        clearNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
