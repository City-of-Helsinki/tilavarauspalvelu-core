import React, { forwardRef, useImperativeHandle, useState } from "react";
import { Button, Dialog } from "hds-react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";

type Props = {
  acceptLabel?: string;
  cancelLabel?: string;
  onAccept?: () => void;
  onCancel?: () => void;
  heading?: string;
  content?: string;
  id: string;
  open: boolean;
};

const Content = styled.div`
  padding: var(--spacing-m) 0;
`;

const ConfirmationDialog = forwardRef(
  ({ ...props }: Props, ref): JSX.Element | null => {
    const [state, setState] = useState<Props>(props);
    const { t } = useTranslation();

    useImperativeHandle(ref, () => ({
      open: (newProps: Props) => {
        setState({ ...newProps, open: true });
      },
    }));

    if (state.open !== true) {
      return null;
    }
    return (
      <Dialog
        variant="danger"
        isOpen={state.open}
        id={state.id}
        aria-labelledby={`${state.id}-header`}
        aria-describedby={`${state.id}-content`}
      >
        <Dialog.Header
          id={`${state.id}-header`}
          title={state.heading || t("confirm.heading")}
        />
        <Dialog.Content id={`${state.id}-content`}>
          <Content>{state.content || t("confirm.text")}</Content>
        </Dialog.Content>
        <Dialog.ActionButtons>
          <Button
            variant="secondary"
            onClick={() => {
              setState({ ...state, open: false });
              if (state.onCancel) {
                state.onCancel();
              }
            }}
          >
            {t(state.cancelLabel || "common.cancel")}
          </Button>
          <Button
            onClick={() => {
              setState({ ...state, open: false });
              if (state.onAccept) {
                state.onAccept();
              }
            }}
          >
            {t(state.acceptLabel || "common.approve")}
          </Button>
        </Dialog.ActionButtons>
      </Dialog>
    );
  }
);

export type ModalRef = {
  open: (propChanges: Props) => void;
};

export default ConfirmationDialog;
