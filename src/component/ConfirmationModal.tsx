import React, { forwardRef, useImperativeHandle, useState } from 'react';
import ReactDOM from 'react-dom';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { breakpoint } from '../common/style';
import Modal from './Modal';

const ModalContent = styled.div`
  margin: 0;
  padding: 0;
  width: 100%;
  max-width: 24em;
  max-height: 100%;
  min-height: 10em;
  font-family: var(--font-bold);
  @media (max-width: ${breakpoint.s}) {
    margin-top: var(--spacing-layout-xs);
    margin-left: var(--spacing-layout-xs);
    margin-right: auto;
    width: calc(100% - 2 * var(--spacing-layout-xs));
  }
`;

const ModalHeading = styled.div`
  font-size: var(--fontsize-heading-l);
`;

const ModalText = styled.div`
  margin-top: 2em;
  font-size: var(--fontsize-body-l);
`;

type Props = {
  okLabel?: string;
  cancelLabel?: string;
  onOk?: () => void;
  onCancel?: () => void;
  heading?: string;
  content?: string;
};

const ConfirmationModal = forwardRef(
  (
    {
      heading,
      content,
      onOk,
      onCancel,
      okLabel = 'common.ok',
      cancelLabel = 'common.cancel',
    }: Props,
    ref
  ): JSX.Element | null => {
    const [open, setOpen] = useState(false);
    const { t } = useTranslation();

    useImperativeHandle(ref, () => ({
      open() {
        setOpen(true);
      },
    }));

    const root = document.getElementById('modal-root');
    if (!root) {
      return null;
    }

    return ReactDOM.createPortal(
      <Modal
        handleClose={() => {
          setOpen(false);
          if (onCancel) {
            onCancel();
          }
        }}
        closeButtonKey={cancelLabel}
        handleOk={() => {
          setOpen(false);
          if (onOk) {
            onOk();
          }
        }}
        okButtonKey={okLabel}
        show={open}>
        <ModalContent>
          <ModalHeading>{heading || t('confirm.heading')}</ModalHeading>
          <ModalText>{content || t('confirm.text')}</ModalText>
        </ModalContent>
      </Modal>,
      root
    );
  }
);

export type ModalRef = {
  open: () => void;
};

export default ConfirmationModal;
