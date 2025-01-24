import React from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { Button, ButtonVariant, Dialog } from "hds-react";
import { useModal } from "@/context/ModalContext";

const ActionButtons = styled(Dialog.ActionButtons)`
  justify-content: end;
`;

function DialogContent({
  onClose,
  onAccept,
  description,
  acceptLabel,
}: {
  onClose: () => void;
  onAccept: () => void;
  description: string;
  acceptLabel: string;
}): JSX.Element {
  const { t } = useTranslation();

  return (
    <>
      <Dialog.Content>
        <p id="modal-description" className="text-body">
          {description}
        </p>
      </Dialog.Content>
      <ActionButtons>
        <Button variant={ButtonVariant.Secondary} onClick={onClose}>
          {t("common.cancel")}
        </Button>
        <Button onClick={onAccept}>{acceptLabel}</Button>
      </ActionButtons>
    </>
  );
}

export function GenericDialog({
  onClose,
  onAccept,
  title,
  description,
  acceptLabel,
}: {
  onClose: () => void;
  onAccept: () => void;
  title: string;
  description: string;
  acceptLabel: string;
}): JSX.Element {
  const { isOpen } = useModal();

  return (
    <Dialog
      variant="primary"
      id="info-dialog"
      aria-labelledby="modal-header"
      aria-describedby="modal-description"
      isOpen={isOpen}
    >
      <Dialog.Header id="modal-header" title={title} />
      <DialogContent
        description={description}
        acceptLabel={acceptLabel}
        onAccept={onAccept}
        onClose={onClose}
      />
    </Dialog>
  );
}
