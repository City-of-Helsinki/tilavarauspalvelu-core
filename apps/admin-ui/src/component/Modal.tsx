import React, { useLayoutEffect } from "react";
import ReactDOM from "react-dom";
import styled from "styled-components";
import { Button, IconCross } from "hds-react";
import { useTranslation } from "react-i18next";
import { breakpoints } from "common/src/common/style";
import { useModal } from "../context/ModalContext";
import { Seranwrap } from "../styles/util";

interface IProps {
  children: React.ReactNode;
}

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

  @media (height > 1000px) {
    top: 50%;
    transform: translate(-50%, -50%);
  }
`;

const Inner = styled.div`
  height: calc(100% - (2 * var(--spacing-m)));
  padding: var(--spacing-m) var(--spacing-m) 0 var(--spacing-m);
  overflow-x: hidden;
  overflow-y: auto;
`;

const FocusHolder = styled.button`
  outline: none;
  width: 1px;
  height: 1px;
  border: 0;
`;

const CloseBtn = styled(Button).attrs({
  style: {
    "--color-bus": "transparent",
    "--color-white": "var(--color-black)",
    "--background-color-hover": "transparent",
    "--border-color-hover": "transparent",
    "--color-hover": "rgba(0, 0, 0, 0.4)",
  } as React.CSSProperties,
})`
  position: absolute;
  top: var(--spacing-xl);
  right: var(--spacing-xl);
  width: 20px;
  height: 20px;
`;

function Modal({ children }: IProps): JSX.Element | null {
  const { setModalContent } = useModal();
  const { t } = useTranslation();

  const focusHolder = React.createRef<HTMLButtonElement>();
  const closeBtn = React.createRef<HTMLButtonElement>();

  useLayoutEffect(() => {
    setTimeout(() => {
      focusHolder.current?.focus();
    }, 0);
  }, [focusHolder]);

  if (typeof window === "undefined") {
    return null;
  }
  const modalRoot = document.getElementById("modal-root") ?? document.body;

  const closeModal = () => setModalContent(null, false);

  return ReactDOM.createPortal(
    <>
      <Seranwrap onClick={closeModal} />
      <Content onTransitionEnd={() => focusHolder.current?.focus()}>
        <FocusHolder ref={focusHolder} />
        <CloseBtn
          onClick={closeModal}
          aria-label={t("common.closeModal")}
          ref={closeBtn}
        >
          <IconCross />
        </CloseBtn>
        <Inner>{children}</Inner>
      </Content>
    </>,
    modalRoot
  );
}

export default Modal;
