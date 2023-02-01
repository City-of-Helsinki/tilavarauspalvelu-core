import React, { useContext, useMemo, useState } from "react";

export type ModalContextProps = {
  modalContent: { isHds: boolean; content: JSX.Element | null };
  setModalContent: (content: JSX.Element | null, isHds?: boolean) => void;
  isOpen: boolean;
};

export const ModalContext = React.createContext<ModalContextProps>({
  modalContent: { isHds: false, content: null },
  setModalContent: () => undefined,
  isOpen: false,
});

export const useModal = (): ModalContextProps => useContext(ModalContext);

type Props = {
  children: React.ReactNode;
};

export const ModalContextProvider: React.FC<Props> = ({ children }: Props) => {
  const [modalContent, setModalContent] = useState<{
    isHds: boolean;
    content: JSX.Element | null;
  }>({ isHds: true, content: null });

  const toggleModal = (content: JSX.Element | null, isHds = false): void => {
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
    setModalContent({ isHds, content });
  };

  const modalContextValues = useMemo(
    () => ({
      modalContent,
      setModalContent: toggleModal,
      isOpen: modalContent !== null,
    }),
    [modalContent]
  );

  return (
    <ModalContext.Provider value={modalContextValues}>
      {children}
    </ModalContext.Provider>
  );
};
