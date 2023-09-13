import { Dialog, IconInfoCircleFill } from "hds-react";
import React from "react";
import { useTranslation } from "next-i18next";
import { BlackButton } from "../../styles/util";
import Sanitize from "./Sanitize";

type Props = {
  id: string;
  heading: string;
  text: string;
  isOpen: boolean;
  onClose: () => void;
};

const InfoDialog = ({
  id,
  heading,
  text,
  isOpen,
  onClose,
}: Props): JSX.Element => {
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
        iconLeft={
          <IconInfoCircleFill
            aria-hidden
            style={{ color: "var(--color-bus)" }}
          />
        }
      />
      <Dialog.Content id={`dialog__${id}--body`}>
        <Sanitize
          style={{ whiteSpace: "pre-line", margin: "var(--spacing-m) 0" }}
          html={text}
        />
      </Dialog.Content>
      <Dialog.ActionButtons>
        <BlackButton variant="secondary" onClick={() => onClose()}>
          {t("common:close")}
        </BlackButton>
      </Dialog.ActionButtons>
    </Dialog>
  );
};

export default InfoDialog;
