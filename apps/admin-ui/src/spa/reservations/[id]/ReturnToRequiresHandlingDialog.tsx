import React from "react";
import { useTranslation } from "react-i18next";
import { Button, ButtonVariant, Dialog, IconInfoCircle } from "hds-react";
import {
  type ReservationNode,
  useRequireHandlingMutation,
} from "@gql/gql-types";
import { useModal } from "@/context/ModalContext";
import { errorToast, successToast } from "common/src/common/toast";
import { gql } from "@apollo/client";

type ReservationType = Pick<ReservationNode, "pk">;
type Props = {
  reservation: ReservationType;
  onClose: () => void;
  onAccept: () => void;
};

function DialogContent({ reservation, onClose, onAccept }: Props) {
  const { t, i18n } = useTranslation();

  const [backToRequireHandlingMutation] = useRequireHandlingMutation();

  const handleClick = async () => {
    try {
      if (!reservation.pk) {
        throw new Error("Reservation pk is missing");
      }
      const input = { pk: reservation.pk };
      await backToRequireHandlingMutation({ variables: { input } });
      successToast({
        text: t("RequestedReservation.ReturnToRequiresHandlingDialog.returned"),
      });
      onAccept();
    } catch (err) {
      let message = "errors.descriptive.genericError";
      if (err instanceof Error) {
        message = err.message;
      }
      const hasTranslatedErrorMsg = i18n.exists(
        `errors.descriptive.${message}`
      );
      const errorTranslated = hasTranslatedErrorMsg
        ? `errors.descriptive.${message}`
        : `errors.descriptive.genericError`;
      errorToast({
        text: t(
          "RequestedReservation.ReturnToRequiresHandlingDialog.errorSaving",
          {
            error: t(errorTranslated),
          }
        ),
      });
    }
  };

  return (
    <>
      <Dialog.Content>
        <p id="modal-description" className="text-body" />
      </Dialog.Content>
      <Dialog.ActionButtons>
        <Button onClick={handleClick}>
          {t("RequestedReservation.ReturnToRequiresHandlingDialog.accept")}
        </Button>
        <Button variant={ButtonVariant.Secondary} onClick={onClose}>
          {t("common.prev")}
        </Button>
      </Dialog.ActionButtons>
    </>
  );
}

function ReturnToRequiredHandlingDialog({
  reservation,
  onClose,
  onAccept,
}: Props): JSX.Element {
  const { isOpen } = useModal();
  const { t } = useTranslation();

  return (
    <Dialog
      variant="primary"
      id="info-dialog"
      aria-labelledby="modal-header"
      aria-describedby="modal-description"
      isOpen={isOpen}
      focusAfterCloseRef={undefined}
    >
      <Dialog.Header
        id="modal-header"
        title={t("RequestedReservation.ReturnToRequiresHandlingDialog.title")}
        iconStart={<IconInfoCircle aria-hidden="true" />}
      />
      <DialogContent
        reservation={reservation}
        onAccept={onAccept}
        onClose={onClose}
      />
    </Dialog>
  );
}

export default ReturnToRequiredHandlingDialog;

export const REQUIRE_HANDLING_RESERVATION = gql`
  mutation RequireHandling($input: ReservationRequiresHandlingMutationInput!) {
    requireHandlingForReservation(input: $input) {
      pk
      state
    }
  }
`;
