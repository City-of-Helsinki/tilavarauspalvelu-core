import React from "react";
import { ModalContextProvider } from "./ModalContext";
import { NotificationContextProvider } from "./NotificationContext";
import { AllocationContextProvider } from "./AllocationContext";

// eslint-disable-next-line @typescript-eslint/naming-convention
export const withGlobalContext = (App: () => JSX.Element) => (): JSX.Element =>
  (
    <NotificationContextProvider>
      <ModalContextProvider>
        <AllocationContextProvider>
          <App />
        </AllocationContextProvider>
      </ModalContextProvider>
    </NotificationContextProvider>
  );

export const GlobalContext = ({ children }: { children: React.ReactNode }) =>
  children != null ? withGlobalContext(() => <>{children}</>)() : null;
