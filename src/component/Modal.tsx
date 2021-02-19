import React, { useEffect, useLayoutEffect } from "react";
import ReactDOM from "react-dom";
import styled from "styled-components";
import { Button, IconCross } from "hds-react";
import { useTranslation } from "react-i18next";
import { useModal } from "../context/UIContext";
import { breakpoints } from "../styles/util";

interface IProps {
  children: React.ReactNode;
}

const modalRoot = document.getElementById("modal-root");

const Seranwrap = styled.div`
  height: 200%;
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: var(--tilavaraus-admin-stack-seranwrap);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background-color: black;
  opacity: 0.2;
`;

const Content = styled.div<{ onTransitionEnd: React.TransitionEventHandler }>`
  &:not(:focus-within) {
    background-color: rgb(255, 255, 254);
    transition: background-color 0.01s;
  }

  position: absolute;
  top: 77px;
  left: 50%;
  transform: translate(-50%, 0);
  background-color: var(--color-white);
  width: 90vw;
  max-width: 600px;
  height: 80vh;
  max-height: 900px;
  z-index: var(--tilavaraus-admin-stack-seranwrap);

  @media (min-width: ${breakpoints.m}) {
    max-width: 700px;
  }

  @media (min-height: 1000px) {
    top: 50%;
    transform: translate(-50%, -50%);
  }
`;

const Inner = styled.div`
  height: calc(100% - (2 * var(--spacing-m)));
  padding: var(--spacing-m);
  overflow-x: hidden;
  overflow-y: auto;
`;

const CloseBtn = styled(Button)`
  position: absolute;
  top: 0;
  right: 0;
  width: 30px;
  height: 30px;
  opacity: 0.7;
`;

function Modal({ children }: IProps): JSX.Element {
  const { setModalContent } = useModal();
  const { t } = useTranslation();
  const element = document.createElement("div");
  const closeBtn = React.createRef<HTMLButtonElement>();

  useLayoutEffect(() => {
    setTimeout(() => {
      closeBtn.current?.focus();
    }, 0);
  }, [closeBtn]);

  useEffect(() => {
    if (modalRoot) modalRoot.appendChild(element);

    return () => {
      if (modalRoot) modalRoot.removeChild(element);
    };
  }, [element]);

  return ReactDOM.createPortal(
    <>
      <Seranwrap onClick={() => setModalContent(null)} />
      <Content onTransitionEnd={() => closeBtn.current?.focus()}>
        <CloseBtn
          onClick={() => setModalContent(null)}
          aria-label={t("common.closeModal")}
          ref={closeBtn}
        >
          <IconCross />
        </CloseBtn>
        <Inner>{children}</Inner>
      </Content>
    </>,
    element
  );
}

export default Modal;
