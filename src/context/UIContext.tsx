import { createContext, useContext } from "react";

export type UIContextType = {
  modalContent: JSX.Element | null;
  setModalContent: any;
};

export const UIContext = createContext<UIContextType>({
  modalContent: null,
  setModalContent: () => console.info(""),
});

export const useModal = (): UIContextType => useContext(UIContext);
