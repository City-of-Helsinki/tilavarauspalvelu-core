import { Dialog } from "hds-react";
import React, { RefObject, useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";

interface IProps {
  id: string;
  focusAfterCloseRef: RefObject<HTMLElement>;
  children: React.ReactNode;
  isOpen: boolean;
  scrollable?: boolean;
  onClose: () => void;
}

const FixedDialog = styled(Dialog)`
  /* Hack to deal with modal trying to fit content. So an error message -> layout shift */
  && {
    width: min(calc(100vw - 2rem), var(--container-width-l));
  }
  & > div:nth-child(2) {
    /* don't layout shift when the modal content changes */
    height: min(80vh, 1024px);
  }
`;

/// Modal that spans most of the screen (instead of resizing based on content)
export function HDSModal({
  focusAfterCloseRef,
  children,
  id,
  isOpen,
  onClose,
  scrollable = false,
  ...rest
}: IProps): JSX.Element {
  const { t } = useTranslation();
  return (
    <FixedDialog
      {...rest}
      id={id}
      variant="primary"
      aria-labelledby="modal-header"
      aria-describedby="modal-description"
      close={onClose}
      closeButtonLabelText={t("common:close")}
      focusAfterCloseRef={focusAfterCloseRef}
      isOpen={isOpen}
      scrollable={scrollable}
    >
      {children}
    </FixedDialog>
  );
}

export function useModal(initiallyOpen = false): {
  open: boolean;
  openModal: () => void;
  closeModal: () => void;
  modalContent: JSX.Element | null;
  openWithContent: (content: JSX.Element) => void;
} {
  const [open, setOpen] = useState(initiallyOpen);
  const [modalContent, setModalContent] = useState<JSX.Element | null>(null);
  const openModal = () => setOpen(true);
  const closeModal = () => setOpen(false);
  const openWithContent = (content: JSX.Element) => {
    setModalContent(content);
    setOpen(true);
  };
  return { open, openModal, closeModal, modalContent, openWithContent };
}
