import React from "react";
import { ApolloProvider } from "@apollo/client";
import { DataContextProvider } from "./DataContext";
import { ModalContextProvider } from "./ModalContext";
import { NotificationContextProvider } from "./NotificationContext";
import apolloClient from "../common/apolloClient";
import { AllocationContextProvider } from "./AllocationContext";

// eslint-disable-next-line @typescript-eslint/naming-convention
export const withGlobalContext = (App: () => JSX.Element) => (): JSX.Element =>
  (
    <ApolloProvider client={apolloClient}>
      <DataContextProvider>
        <NotificationContextProvider>
          <ModalContextProvider>
            <AllocationContextProvider>
              <App />
            </AllocationContextProvider>
          </ModalContextProvider>
        </NotificationContextProvider>
      </DataContextProvider>
    </ApolloProvider>
  );

export const GlobalContext = ({ children }: { children: React.ReactNode }) =>
  children != null ? withGlobalContext(() => <>{children}</>)() : null;
