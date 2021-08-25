import { Dialog } from "hds-react";
import React, { RefObject, useState } from "react";
import { createGlobalStyle } from "styled-components";

interface IProps {
  afterCloseFocusRef: RefObject<HTMLElement>;
  children: JSX.Element | null;
  id: string;
  open: boolean;
  close: () => void;
}

const WideDialogStyle = createGlobalStyle`
  div [role=dialog] {
    width: var(--container-width-m) !important;
  }
  `;

const Modal = ({
  afterCloseFocusRef,
  children,
  id,
  open,
  close,
}: IProps): JSX.Element => {
  return (
    <>
      <WideDialogStyle />
      <Dialog
        aria-describedby="dialog-content"
        aria-labelledby="dialog-title"
        close={close}
        closeButtonLabelText="Close"
        focusAfterCloseRef={afterCloseFocusRef}
        isOpen={open}
        id={id}
      >
        {children}
      </Dialog>
    </>
  );
};

export default Modal;

export const useModal = (
  initiallyOpen = false
): {
  open: boolean;
  openModal: () => void;
  closeModal: () => void;
  modalContent: JSX.Element | null;
  openWithContent: (content: JSX.Element) => void;
} => {
  const [open, setOpen] = useState(initiallyOpen);
  const [modalContent, setModalContent] = useState<JSX.Element | null>(null);
  const openModal = () => setOpen(true);
  const closeModal = () => setOpen(false);
  const openWithContent = (content: JSX.Element) => {
    setModalContent(content);
    setOpen(true);
  };
  return { open, openModal, closeModal, modalContent, openWithContent };
};
