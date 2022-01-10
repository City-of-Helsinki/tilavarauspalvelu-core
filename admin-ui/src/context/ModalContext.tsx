import React, { useContext, useState } from "react";

export type ModalContextProps = {
  modalContent: JSX.Element | null;
  setModalContent: (content: JSX.Element | null) => void;
};

export const ModalContext = React.createContext<ModalContextProps>({
  modalContent: null,
  setModalContent: () => undefined,
});

export const useModal = (): ModalContextProps => useContext(ModalContext);

export const ModalContextProvider: React.FC = ({ children }) => {
  const [modalContent, setModalContent] = useState<JSX.Element | null>(null);

  const toggleModal = (content: JSX.Element | null): void => {
    const bodyEl = document.getElementsByTagName("body")[0];
    const classes = ["noScroll"];
    if (
      window.document.body.scrollHeight >
      window.document.documentElement.clientHeight
    ) {
      classes.push("scrollbarActive");
    }
    if (content) {
      bodyEl.classList.add(...classes);
    } else {
      bodyEl.classList.remove(...classes);
    }
    setModalContent(content);
  };

  return (
    <ModalContext.Provider
      value={{
        modalContent,
        setModalContent: toggleModal,
      }}
    >
      {children}
    </ModalContext.Provider>
  );
};
