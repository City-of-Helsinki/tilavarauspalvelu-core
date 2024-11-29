import FocusTrap from "focus-trap-react";
import React from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { isBrowser } from "common/src/helpers";
import { Button, IconCross } from "hds-react";
import { Flex } from "common/styles/util";
import { breakpoints } from "common";

const Overlay = styled(Flex).attrs({
  $justifyContent: "center",
  $alignItems: "center",
})`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: var(--tilavaraus-stack-order-modal);
`;

const ModalElement = styled(Flex)<{ $maxWidth?: string; $height?: string }>`
  --modal-max-width: 800px;

  background: var(--color-white);
  max-width: ${({ $maxWidth }) => $maxWidth ?? "var(--modal-max-width)"};
  width: 90%;
  position: relative;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  height: ${({ $height }) => $height ?? "auto"};
  max-height: 90vh;
  overflow-y: auto;

  --modal-padding: var(--spacing-xs);
  @media (min-width: ${breakpoints.s}) {
    --modal-padding: var(--spacing-s);
  }
  @media (min-width: ${breakpoints.m}) {
    --modal-padding: var(--spacing-m);
  }
  padding: var(--modal-padding);
`;

const CloseButton = styled(Button).attrs({
  size: "small",
  variant: "secondary",
})``;

const CloseButtonWrapper = styled.div`
  position: absolute;
  top: var(--spacing-layout-xs);
  right: var(--spacing-layout-xs);
`;

type Props = {
  handleClose: () => void;
  show: boolean;
  children: React.ReactNode;
  closeButtonKey?: string;
  hideCloseButton?: boolean;
  maxWidth?: string;
  actions?: React.ReactNode;
  fullHeight?: boolean;
};

/// TODO disable body scroll when modal is open
function Modal({
  handleClose,
  show,
  children,
  closeButtonKey = "common:close",
  hideCloseButton = false,
  actions,
  maxWidth,
  fullHeight,
}: Props): JSX.Element | null {
  const { t } = useTranslation();

  if (!isBrowser) {
    return null;
  }

  if (!show) {
    return null;
  }

  return (
    <Overlay role="none" onKeyDown={(e) => e.key === "Escape" && handleClose()}>
      <FocusTrap>
        <ModalElement
          $maxWidth={maxWidth}
          $height={fullHeight ? "100%" : undefined}
        >
          {!hideCloseButton && (
            <CloseButtonWrapper>
              <CloseButton
                onClick={handleClose}
                aria-label={t(closeButtonKey) ?? t("common:close")}
              >
                <IconCross />
              </CloseButton>
            </CloseButtonWrapper>
          )}
          <section>{children}</section>
          {actions}
        </ModalElement>
      </FocusTrap>
    </Overlay>
  );
}

export default Modal;
