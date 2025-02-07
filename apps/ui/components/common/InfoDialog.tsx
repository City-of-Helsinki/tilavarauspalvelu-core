import { Button, ButtonVariant, Dialog, IconInfoCircleFill } from "hds-react";
import React from "react";
import { useTranslation } from "next-i18next";
import { Sanitize } from "common/src/components/Sanitize";

type Props = {
  id: string;
  heading: string;
  text: string;
  isOpen: boolean;
  onClose: () => void;
};

function InfoDialog({
  id,
  heading,
  text,
  isOpen,
  onClose,
}: Props): JSX.Element {
  const { t } = useTranslation();

  return (
    <Dialog
      id={`dialog__${id}`}
      isOpen={isOpen}
      aria-labelledby={`dialog__${id}--header`}
      aria-describedby={`dialog__${id}--body`}
      scrollable
    >
      <Dialog.Header
        id={`dialog__${id}--header`}
        title={heading}
        iconStart={
          <IconInfoCircleFill
            aria-hidden="true"
            style={{ color: "var(--color-bus)" }}
          />
        }
      />
      <Dialog.Content id={`dialog__${id}--body`}>
        <Sanitize html={text} />
      </Dialog.Content>
      <Dialog.ActionButtons>
        <Button variant={ButtonVariant.Secondary} onClick={() => onClose()}>
          {t("common:close")}
        </Button>
      </Dialog.ActionButtons>
    </Dialog>
  );
}

export default InfoDialog;
