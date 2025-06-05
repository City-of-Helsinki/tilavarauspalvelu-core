import React, { RefObject, useState } from "react";
import { Dialog } from "hds-react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";

interface ModalProps {
  id: string;
  focusAfterCloseRef: RefObject<HTMLElement>;
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  scrollable?: boolean;
  maxWidth?: "m" | "l" | "xl";
  fixedHeight?: boolean;
}

const FixedDialog = styled(Dialog)<{
  $maxWidth?: "m" | "l" | "xl";
  $fixedHeight?: boolean;
}>`
  /* Hack to deal with modal trying to fit content. So an error message -> layout shift */
  && {
    /* stylelint-disable custom-property-pattern */
    width: min(
      calc(100vw - 2rem),
      var(--container-width-${(props) => props.$maxWidth ?? "l"})
    );
    /* stylelint-enable custom-property-pattern */
  }
  & > div:nth-child(2) {
    /* don't layout shift when the modal content changes */
    height: ${(props) => (props.$fixedHeight ? "min(80vh, 1024px)" : "auto")};
  }
`;

/// Modal that spans most of the screen (instead of resizing based on content)
export function HDSModal({
  focusAfterCloseRef,
  children,
  id,
  isOpen,
  onClose,
  maxWidth = "l",
  scrollable = false,
  fixedHeight = false,
  ...rest
}: ModalProps): JSX.Element {
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
      $maxWidth={maxWidth}
      $fixedHeight={fixedHeight}
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
