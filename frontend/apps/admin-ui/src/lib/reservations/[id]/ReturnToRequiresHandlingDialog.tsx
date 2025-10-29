import React, { type RefObject } from "react";
import { useTranslation } from "next-i18next";
import { Button, ButtonVariant, Dialog, IconInfoCircle } from "hds-react";
import { type ReservationNode, useRequireHandlingMutation } from "@gql/gql-types";
import { useModal } from "@/context/ModalContext";
import { successToast } from "common/src/components/toast";
import { gql } from "@apollo/client";
import { useDisplayError } from "common/src/hooks";

type ReservationType = Pick<ReservationNode, "pk">;
type Props = {
  reservation: ReservationType;
  onClose: () => void;
  onAccept: () => void;
  focusAfterCloseRef: RefObject<HTMLButtonElement>;
};

function DialogContent({ reservation, onClose, onAccept }: Omit<Props, "focusAfterCloseRef">): JSX.Element {
  const { t } = useTranslation();
  const displayError = useDisplayError();

  const [backToRequireHandlingMutation] = useRequireHandlingMutation();

  const handleClick = async () => {
    try {
      if (!reservation.pk) {
        throw new Error("Reservation pk is missing");
      }
      const input = { pk: reservation.pk };
      await backToRequireHandlingMutation({ variables: { input } });
      successToast({
        text: t("reservation:ReturnToRequiresHandlingDialog.returned"),
      });
      onAccept();
    } catch (err) {
      displayError(err);
    }
  };

  return (
    <>
      <Dialog.Content>
        <p id="modal-description" className="text-body" />
      </Dialog.Content>
      <Dialog.ActionButtons>
        <Button onClick={handleClick}>{t("reservation:ReturnToRequiresHandlingDialog.accept")}</Button>
        <Button variant={ButtonVariant.Secondary} onClick={onClose}>
          {t("common:prev")}
        </Button>
      </Dialog.ActionButtons>
    </>
  );
}

export function ReturnToRequiresHandlingDialog({
  reservation,
  onClose,
  onAccept,
  focusAfterCloseRef,
}: Readonly<Props>): JSX.Element {
  const { isOpen } = useModal();
  const { t } = useTranslation();

  return (
    <Dialog
      variant="primary"
      id="info-dialog"
      aria-labelledby="modal-header"
      aria-describedby="modal-description"
      isOpen={isOpen}
      focusAfterCloseRef={focusAfterCloseRef}
    >
      <Dialog.Header
        id="modal-header"
        title={t("reservation:ReturnToRequiresHandlingDialog.title")}
        iconStart={<IconInfoCircle />}
      />
      <DialogContent reservation={reservation} onAccept={onAccept} onClose={onClose} />
    </Dialog>
  );
}

export const REQUIRE_HANDLING_RESERVATION = gql`
  mutation RequireHandling($input: ReservationRequiresHandlingMutationInput!) {
    requireHandlingForReservation(input: $input) {
      pk
      state
    }
  }
`;
