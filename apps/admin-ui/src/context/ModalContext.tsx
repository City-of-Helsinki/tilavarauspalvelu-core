import React, { useContext, useMemo, useState } from "react";

type ModalContextProps = {
  modalContent: { content: JSX.Element | null };
  setModalContent: (content: JSX.Element | null) => void;
  isOpen: boolean;
};

const ModalContext = React.createContext<ModalContextProps>({
  modalContent: { content: null },
  setModalContent: () => undefined,
  isOpen: false,
});

export const useModal = (): ModalContextProps => useContext(ModalContext);

type Props = {
  children: React.ReactNode;
};

// TODO non HDS modals should be deprecated (start by removing the default values)
export const ModalContextProvider: React.FC<Props> = ({ children }: Props) => {
  const [modalContent, setModalContent] = useState<{
    content: JSX.Element | null;
  }>({ content: null });

  const toggleModal = (content: JSX.Element | null): void => {
    setModalContent({ content });
  };

  const modalContextValues = useMemo(
    () => ({
      modalContent,
      setModalContent: toggleModal,
      isOpen: modalContent != null,
    }),
    [modalContent]
  );

  return (
    <ModalContext.Provider value={modalContextValues}>
      {children}
    </ModalContext.Provider>
  );
};
