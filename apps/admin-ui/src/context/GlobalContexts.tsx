import React from "react";
import { ModalContextProvider } from "./ModalContext";
import { NotificationContextProvider } from "./NotificationContext";

export const withGlobalContext =
  (App: () => JSX.Element) => (): JSX.Element => (
    <NotificationContextProvider>
      <ModalContextProvider>
        <App />
      </ModalContextProvider>
    </NotificationContextProvider>
  );

export const GlobalContext = ({ children }: { children: React.ReactNode }) =>
  children != null ? withGlobalContext(() => <>{children}</>)() : null;
