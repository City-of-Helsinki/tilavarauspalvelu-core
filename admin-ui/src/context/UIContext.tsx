import { createContext, useContext } from "react";

export type UIContextType = {
  modalContent: JSX.Element | null;
  setModalContent: any; // eslint-disable-line @typescript-eslint/no-explicit-any
};

export const UIContext = createContext<UIContextType>({
  modalContent: null,
  setModalContent: () => console.info(""), // eslint-disable-line no-console
});

export const useModal = (): UIContextType => useContext(UIContext);
