import React from "react";
import { useTranslation } from "react-i18next";
import { useMutation } from "@apollo/client";
import { Button, Dialog, IconInfoCircle } from "hds-react";
import {
  Mutation,
  ReservationRequiresHandlingMutationInput,
  ReservationType,
} from "common/types/gql-types";
import { useModal } from "../../../context/ModalContext";
import { REQUIRE_HANDLING_RESERVATION } from "./queries";
import { useNotification } from "../../../context/NotificationContext";

const DialogContent = ({
  reservation,
  onClose,
  onAccept,
}: {
  reservation: ReservationType;
  onClose: () => void;
  onAccept: () => void;
}) => {
  const [backToRequireHandlingMutation] = useMutation<Mutation>(
    REQUIRE_HANDLING_RESERVATION
  );

  const backToRequireHandling = (
    input: ReservationRequiresHandlingMutationInput
  ) => backToRequireHandlingMutation({ variables: { input } });

  const { notifyError, notifySuccess } = useNotification();
  const { t } = useTranslation();

  return (
    <>
      <Dialog.Content>
        <p id="modal-description" className="text-body" />
      </Dialog.Content>
      <Dialog.ActionButtons>
        <Button variant="secondary" onClick={onClose} theme="black">
          {t("common.prev")}
        </Button>

        <Button
          onClick={async () => {
            try {
              const res = await backToRequireHandling({
                pk: reservation.pk,
              });

              if (!res.errors) {
                notifySuccess(
                  t(
                    "RequestedReservation.ReturnToRequiresHandlingDialog.returned"
                  )
                );
                onAccept();
                return;
              }
            } catch (e) {
              // noop
            }
            notifyError(
              t(
                "RequestedReservation.ReturnToRequiresHandlingDialog.errorSaving"
              )
            );
          }}
        >
          {t("RequestedReservation.ReturnToRequiresHandlingDialog.accept")}
        </Button>
      </Dialog.ActionButtons>
    </>
  );
};

const ReturnToRequiredHandlingDialog = ({
  reservation,
  onClose,
  onAccept,
}: {
  reservation: ReservationType;

  onClose: () => void;
  onAccept: () => void;
}): JSX.Element => {
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
        iconLeft={<IconInfoCircle aria-hidden="true" />}
      />
      <DialogContent
        reservation={reservation}
        onAccept={onAccept}
        onClose={onClose}
      />
    </Dialog>
  );
};
export default ReturnToRequiredHandlingDialog;
