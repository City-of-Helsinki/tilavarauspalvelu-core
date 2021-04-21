import React, { CSSProperties, ReactNode, useLayoutEffect } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { IconCross } from "hds-react";
import { breakpoints, Seranwrap } from "../styles/util";

interface IProps {
  children: ReactNode;
  canBeClosed?: boolean;
  closeDialog?: () => void;
  className?: string;
  style?: CSSProperties;
}

const Content = styled.div`
  --width: 518px;
  --padding: var(--spacing-layout-l);
  position: fixed;
  top: 30vh;
  right: var(--spacing-m);
  left: var(--spacing-m);
  background-color: var(--color-white);
  padding: var(--padding);
  z-index: var(--tilavaraus-admin-stack-modal);
  line-height: var(--lineheight-l);

  @media (min-width: ${breakpoints.s}) {
    left: calc(50% - var(--width) / 2);
    width: calc(var(--width) - var(--spacing-layout-l) * 2);
  }
`;

const CloseBtn = styled.button`
  position: absolute;
  top: var(--spacing-s);
  right: var(--spacing-s);
  background-color: transparent;
  border: 0;
  cursor: pointer;
`;

function Dialog({
  children,
  canBeClosed = true,
  closeDialog,
  className,
  style,
}: IProps): JSX.Element {
  useLayoutEffect(() => {
    const bodyEl = document.getElementsByTagName("body")[0];
    const noScrollClassName = "noScroll";
    bodyEl.classList.add(noScrollClassName);

    return () => {
      bodyEl.classList.remove(noScrollClassName);
    };
  }, []);

  const { t } = useTranslation();

  return (
    <>
      <Seranwrap
        style={{ cursor: `${canBeClosed ? "cursor" : "default"}` }}
        onClick={() => canBeClosed && closeDialog && closeDialog()}
      />
      <Content className={className} style={style}>
        {canBeClosed && (
          <CloseBtn onClick={closeDialog} aria-label={t("common.closeModal")}>
            <IconCross />
          </CloseBtn>
        )}
        {children}
      </Content>
    </>
  );
}

export default Dialog;
