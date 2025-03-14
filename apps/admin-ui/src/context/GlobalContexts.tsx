import React from "react";
import { ModalContextProvider } from "./ModalContext";

export function GlobalContext({ children }: { children: React.ReactNode }) {
  if (children == null) {
    return null;
  }
  return <ModalContextProvider>{children}</ModalContextProvider>;
}
