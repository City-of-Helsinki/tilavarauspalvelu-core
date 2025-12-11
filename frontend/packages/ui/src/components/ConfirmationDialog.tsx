import React from "react";
import { Button, ButtonVariant, Dialog, IconAlertCircleFill, IconQuestionCircle } from "hds-react";
import { useTranslation } from "next-i18next";
import { filterEmpty } from "../modules/helpers";

type Props = {
  acceptLabel?: string;
  acceptIcon?: React.ReactNode;
  cancelLabel?: string;
  onAccept?: () => void;
  onCancel?: () => void;
  heading?: string;
  content?: string;
  id?: string;
  isOpen: boolean;
  variant?: "danger" | "primary";
  testId?: string;
};

export function ConfirmationDialog(props: Props): JSX.Element | null {
  const { onAccept, onCancel, acceptIcon, variant, isOpen, testId: testIdOrig } = props;
  const testId = filterEmpty(testIdOrig);
  const { acceptLabel, cancelLabel, heading, content } = props;
  const { t } = useTranslation();

  const id = props.id ?? "confirmation-modal";

  return (
    <Dialog
      variant={variant}
      isOpen={isOpen}
      id={id}
      aria-labelledby={`${id}-header`}
      aria-describedby={`${id}-content`}
    >
      <Dialog.Header
        id={`${id}-header`}
        title={heading || t("confirm.heading")}
        iconStart={variant === "danger" ? <IconAlertCircleFill color="#b01038" /> : <IconQuestionCircle />}
      />
      <Dialog.Content id={`${id}-content`}>{content || t("confirm.text")}</Dialog.Content>
      <Dialog.ActionButtons>
        <Button
          variant={variant === "danger" ? ButtonVariant.Danger : ButtonVariant.Primary}
          onClick={() => onAccept?.()}
          iconStart={acceptIcon}
          data-testid={testId ? `${testId}__ConfirmationDialog--accept` : undefined}
        >
          {acceptLabel || t("common:approve")}
        </Button>
        <Button
          data-testid={testId ? `${testId}__ConfirmationDialog--cancel` : undefined}
          variant={ButtonVariant.Secondary}
          onClick={() => onCancel?.()}
        >
          {cancelLabel || t("common:cancel")}
        </Button>
      </Dialog.ActionButtons>
    </Dialog>
  );
}
