import FocusTrap from "focus-trap-react";
import React from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { breakpoints } from "common/src/common/style";
import { isBrowser } from "common/src/helpers";
import { MediumButton } from "@/styles/util";
import { IconCross } from "hds-react";

type Props = {
  handleOk?: () => void;
  handleClose: () => void;
  show: boolean;
  children: React.ReactNode;
  closeButtonKey?: string;
  okButtonKey?: string;
  showControlButtons?: boolean;
};

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: var(--tilavaraus-stack-order-modal);
`;

const ModalElement = styled.div`
  padding: var(--spacing-layout-2-xs);
  background: var(--color-white);
  max-width: 100%;
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: calc(var(--tilavaraus-stack-order-modal) + 1);
  display: flex;
  flex-direction: column;
  max-height: 90%;
  overflow-y: auto;

  {/* The top close button */}
  > button {
    position: absolute;
    top: var(--spacing-layout-xs);
    right: var(--spacing-layout-xs);
    border: 0;
    span {
      display: flex;
      align-items: center;
    }
    @media (max-width: ${breakpoints.s}) {
      top: 0;
      right: 0;
    }
  }

  @media (max-width: ${breakpoints.s}) {
    height: 100%;
    width: 100%;
    padding: 0;
  }
`;

const MainContainer = styled.section``;

const ButtonContainer = styled.div`
  background-color: white;
  bottom: 0;
  display: grid;
  gap: var(--spacing-layout-s);
  grid-template-columns: 1fr 1fr;

  > button {
    width: fit-content;
    min-width: 9rem;
  }

  @media (max-width: ${breakpoints.s}) {
    width: calc(100% - 2 * var(--spacing-layout-xs));
    padding: var(--spacing-layout-xs);
    grid-template-columns: 1fr;

    > button {
      margin: 0;
    }
  }
`;

const Modal = ({
  handleClose,
  handleOk,
  show,
  children,
  closeButtonKey = "common:close",
  okButtonKey = "common:ok",
  showControlButtons = true,
}: Props): JSX.Element | null => {
  const { t } = useTranslation();

  if (!isBrowser) {
    return null;
  }

  const root = document.getElementById("root");

  if (!show) {
    if (root) {
      root.style.overflowY = "auto";
    }
    return null;
  }

  if (root) {
    root.style.overflowY = "hidden";
  }

  return (
    <Overlay role="none" onKeyDown={(e) => e.key === "Escape" && handleClose()}>
      <FocusTrap>
        <ModalElement>
          {!showControlButtons && (
            <MediumButton
              variant="secondary"
              size="small"
              onClick={handleClose}
            >
              {t("common:close")}
              <IconCross />
            </MediumButton>
          )}
          <MainContainer>{children}</MainContainer>
          {showControlButtons && (
            <ButtonContainer>
              {handleOk ? (
                <MediumButton variant="primary" onClick={handleOk}>
                  {t(okButtonKey)}
                </MediumButton>
              ) : null}
              <MediumButton variant="secondary" onClick={handleClose}>
                {t(closeButtonKey)}
              </MediumButton>
            </ButtonContainer>
          )}
        </ModalElement>
      </FocusTrap>
    </Overlay>
  );
};

export default Modal;
