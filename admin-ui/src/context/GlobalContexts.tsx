import React from "react";
import { ModalContextProvider } from "./ModalContext";
import { NotificationContextProvider } from "./NotificationContext";

// eslint-disable-next-line @typescript-eslint/naming-convention
export const withGlobalContext = (App: () => JSX.Element) => (): JSX.Element =>
  (
    <NotificationContextProvider>
      <ModalContextProvider>
        <App />
      </ModalContextProvider>
    </NotificationContextProvider>
  );
