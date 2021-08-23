import { Dialog } from "hds-react";
import React, { RefObject, useState } from "react";
import { createGlobalStyle } from "styled-components";

interface IProps {
  afterCloseFocusRef: RefObject<HTMLElement>;
  children: JSX.Element;
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
): [boolean, () => void, () => void] => {
  const [open, setOpen] = useState(initiallyOpen);
  const openDialog = () => setOpen(true);
  const closeDialog = () => setOpen(false);
  return [open, openDialog, closeDialog];
};
