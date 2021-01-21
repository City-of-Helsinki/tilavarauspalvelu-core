import { Button } from 'hds-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

type Props = {
  handleClose: (ok: boolean) => void;
  show: boolean;
  children: React.ReactNode;
  okLabel: string;
};

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 10;
`;

const ModalElement = styled.div`
  background: white;
  max-width: var(--breakpoint-l);
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 11;
  width: 80%;
  height: 85%;
  display: flex;
  flex-direction: column;
`;

const MainContainer = styled.section`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  height: 100%;
`;

const ButtonContainer = styled.div`
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  background-color: white;
  padding-top: var(--spacing-layout-xs);
  padding-bottom: var(--spacing-layout-s);
  padding-left: var(--spacing-layout-l);

  & > button {
    margin-right: var(--spacing-layout-s);
  }
`;

const Modal = ({
  handleClose,
  show,
  okLabel,
  children,
}: Props): JSX.Element | null => {
  const { t } = useTranslation();

  if (!show) {
    return null;
  }

  return (
    <>
      <Overlay
        role="none"
        onClick={() => handleClose(false)}
        onKeyDown={() => handleClose(false)}
      />
      <ModalElement>
        <MainContainer>{children}</MainContainer>
        <ButtonContainer>
          <Button variant="secondary" onClick={() => handleClose(false)}>
            {t('common.close')}
          </Button>
          <Button onClick={() => handleClose(true)}>{okLabel}</Button>
        </ButtonContainer>
      </ModalElement>
    </>
  );
};

export default Modal;
