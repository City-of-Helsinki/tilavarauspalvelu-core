import React from "react";
import { ModalContextProvider } from "./ModalContext";

const withGlobalContext = (App: () => JSX.Element) => (): JSX.Element => (
  <ModalContextProvider>
    <App />
  </ModalContextProvider>
);

export const GlobalContext = ({ children }: { children: React.ReactNode }) =>
  children != null ? withGlobalContext(() => <>{children}</>)() : null;
