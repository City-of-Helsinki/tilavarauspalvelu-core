import React from "react";
import { ApolloProvider } from "@apollo/client";
import { DataContextProvider } from "./DataContext";
import { ModalContextProvider } from "./ModalContext";
import { NotificationContextProvider } from "./NotificationContext";
import apolloClient from "../common/apolloClient";
import { AuthStateContextProvider } from "./AuthStateContext";
import { AllocationContextProvider } from "./AllocationContext";

// eslint-disable-next-line @typescript-eslint/naming-convention
export const withGlobalContext = (App: () => JSX.Element) => (): JSX.Element =>
  (
    <ApolloProvider client={apolloClient}>
      <AuthStateContextProvider>
        <DataContextProvider>
          <NotificationContextProvider>
            <ModalContextProvider>
              <AllocationContextProvider>
                <App />
              </AllocationContextProvider>
            </ModalContextProvider>
          </NotificationContextProvider>
        </DataContextProvider>
      </AuthStateContextProvider>
    </ApolloProvider>
  );
