import { Dialog } from "hds-react";
import React, {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import ReactDOM from "react-dom";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { breakpoints } from "common/src/common/style";
import { MediumButton } from "../../styles/util";

type Props = {
  okLabel?: string;
  cancelLabel?: string;
  onOk?: () => void;
  onCancel?: () => void;
  heading?: string;
  content?: string;
  id: string;
  type?: "confirm" | "alert";
};

const StyledDialog = styled(Dialog)`
  button {
    font-size: var(--fontsize-body-m);
  }

  > div:last-of-type {
    padding-top: var(--spacing-layout-m);
    display: flex;
    flex-direction: column-reverse;
    gap: var(--spacing-s);

    button {
      margin: 0;
    }

    @media (min-width: ${breakpoints.s}) {
      flex-direction: row;
      justify-content: flex-end;
    }
  }

  padding: var(--spacing-m) var(--spacing-s);
  font-size: var(--fontsize-body-l);

  h2 {
    font-size: var(--fontsize-heading-m);
    font-family: var(--font-regular);
    font-weight: 400;
    line-height: 2rem;
    margin-bottom: var(--spacing-m);

    @media (min-width: ${breakpoints.s}) {
      font-size: 2rem;
    }
  }
`;

const ConfirmationModal = forwardRef(
  (
    {
      id,
      heading,
      content,
      onOk,
      onCancel,
      okLabel = "common:ok",
      cancelLabel = "common:cancel",
      type = "alert",
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

    const variant = useMemo(() => {
      switch (type) {
        case "confirm":
          return "primary";
        case "alert":
        default:
          return "danger";
      }
    }, [type]);

    const root = document.getElementById("modal-root");
    if (!root) {
      return null;
    }

    return ReactDOM.createPortal(
      <StyledDialog
        variant={variant}
        isOpen={open}
        id={id}
        aria-labelledby={`${id}-header`}
        aria-describedby={`${id}-content`}
        style={{ width: "auto" }}
      >
        <Dialog.Header id={`${id}-header`} title={heading} />
        <Dialog.Content id={`${id}-content`}>{content}</Dialog.Content>
        <Dialog.ActionButtons>
          <MediumButton
            variant="secondary"
            onClick={() => {
              setOpen(false);
              if (onCancel) {
                onCancel();
              }
            }}
          >
            {t(cancelLabel)}
          </MediumButton>
          <MediumButton
            onClick={() => {
              setOpen(false);
              if (onOk) {
                onOk();
              }
            }}
          >
            {t(okLabel)}
          </MediumButton>
        </Dialog.ActionButtons>
      </StyledDialog>,
      root
    );
  }
);

export type ModalRef = {
  open: () => void;
};

export default ConfirmationModal;
