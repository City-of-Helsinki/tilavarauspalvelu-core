import React, { createContext, useContext, useMemo, useState } from "react";

type ModalContextProps = {
  modalContent: { content: JSX.Element | null };
  setModalContent: (content: JSX.Element | null) => void;
  isOpen: boolean;
};

const ModalContext = createContext<ModalContextProps>({
  modalContent: { content: null },
  setModalContent: () => undefined,
  isOpen: false,
});

/**
 * Hook to access the modal context
 * Provides access to modal content state and controls
 * @returns ModalContextProps containing modalContent, setModalContent function, and isOpen flag
 */
export const useModal = (): ModalContextProps => useContext(ModalContext);

type Props = {
  children: React.ReactNode;
};

/**
 * Context provider for managing modal state across the application
 * @param children - Child components that will have access to modal context
 * @returns React component that provides modal context
 * @deprecated Non-HDS modals should be deprecated (start by removing the default values)
 */
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

  return <ModalContext.Provider value={modalContextValues}>{children}</ModalContext.Provider>;
};
