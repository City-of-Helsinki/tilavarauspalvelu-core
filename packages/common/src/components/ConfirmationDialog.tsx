import React from "react";
import { Button, Dialog, IconAlertCircleFill, IconInfoCircle } from "hds-react";
import { useTranslation } from "react-i18next";

type Props = {
  acceptLabel?: string;
  cancelLabel?: string;
  onAccept?: () => void;
  onCancel?: () => void;
  heading?: string;
  content?: string;
  id?: string;
  isOpen: boolean;
  variant?: "danger" | "primary";
};

// TODO opening the dialog scrolls the page to the top
export function ConfirmationDialog(props: Props): JSX.Element | null {
  const { onAccept, onCancel, variant, isOpen } = props;
  const { acceptLabel, cancelLabel, heading, content } = props;
  const { t } = useTranslation();

  const id = props.id ?? "confirmation-modal";

  return (
    <Dialog
      variant={variant}
      isOpen={isOpen}
      id={id}
      // TODO don't tie to id, use a proper translation key
      aria-labelledby={`${id}-header`}
      aria-describedby={`${id}-content`}
    >
      <Dialog.Header
        id={`${id}-header`}
        title={heading || t("confirm.heading")}
        iconLeft={
          variant === "danger" ? (
            <IconAlertCircleFill color="#b01038" />
          ) : (
            <IconInfoCircle />
          )
        }
      />
      <Dialog.Content id={`${id}-content`}>
        {content || t("confirm.text")}
      </Dialog.Content>
      <Dialog.ActionButtons>
        <Button variant={variant} onClick={() => onAccept?.()}>
          {acceptLabel || t("common.approve")}
        </Button>
        <Button variant="secondary" theme="black" onClick={() => onCancel?.()}>
          {cancelLabel || t("common.cancel")}
        </Button>
      </Dialog.ActionButtons>
    </Dialog>
  );
}
