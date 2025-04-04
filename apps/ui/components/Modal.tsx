import React from "react";
import { FocusTrap } from "focus-trap-react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { isBrowser } from "common/src/helpers";
import { IconCross } from "hds-react";
import { Flex, focusStyles } from "common/styled";
import { breakpoints } from "common/src/const";

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
  border-top: 8px solid var(--color-bus);
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

const CloseButton = styled.button`
  --min-size: 44px;
  --border-width: 1px;
  & {
    --background-color-focus: white;
  }

  position: absolute;
  top: var(--spacing-layout-xs);
  right: var(--spacing-layout-xs);
  min-height: var(--min-size);
  min-width: var(--min-size);

  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-white);
  border: var(--border-width) solid var(--color-black);

  :hover {
    cursor: pointer;
    background: var(--color-black-10);
  }
  ${focusStyles}
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
export function Modal({
  handleClose,
  show,
  children,
  closeButtonKey = "common:close",
  hideCloseButton = false,
  actions,
  maxWidth,
  fullHeight,
}: Readonly<Props>): JSX.Element | null {
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
            <CloseButton
              aria-label={t(closeButtonKey) ?? t("common:close")}
              onClick={handleClose}
              type="button"
            >
              <IconCross aria-hidden="true" />
            </CloseButton>
          )}
          <section>{children}</section>
          {actions}
        </ModalElement>
      </FocusTrap>
    </Overlay>
  );
}
