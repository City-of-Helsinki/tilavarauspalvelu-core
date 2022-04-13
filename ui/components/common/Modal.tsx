import FocusTrap from "focus-trap-react";
import React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { isBrowser } from "../../modules/const";
import { breakpoint } from "../../modules/style";
import { MediumButton } from "../../styles/util";

type Props = {
  handleOk?: () => void;
  handleClose: () => void;
  show: boolean;
  children: React.ReactNode;
  closeButtonKey?: string;
  okButtonKey?: string;
};

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 100;
`;

const ModalElement = styled.div`
  padding: var(--spacing-layout-xs);
  background: var(--color-white);
  max-width: 100%;
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 101;
  display: flex;
  flex-direction: column;
  max-height: 90%;
  overflow-y: auto;

  @media (max-width: ${breakpoint.s}) {
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
  padding-top: var(--spacing-layout-s);

  > button {
    width: fit-content;
    min-width: 9rem;
  }

  @media (max-width: ${breakpoint.s}) {
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
    <>
      <Overlay role="none" onClick={handleClose} onKeyDown={handleClose} />
      <FocusTrap>
        <ModalElement>
          <MainContainer>{children}</MainContainer>
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
        </ModalElement>
      </FocusTrap>
    </>
  );
};

export default Modal;
