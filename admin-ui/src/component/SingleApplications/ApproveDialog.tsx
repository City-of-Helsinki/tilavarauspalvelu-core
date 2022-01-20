import React, { useState } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { useMutation } from "@apollo/client";
import {
  Button,
  Dialog,
  IconCheckCircleFill,
  IconInfoCircle,
  TextArea,
  TextInput,
} from "hds-react";
import {
  Mutation,
  ReservationApproveMutationInput,
  ReservationType,
} from "../../common/gql-types";
import { useModal } from "../../context/ModalContext";
import { APPROVE_RESERVATION } from "../../common/queries";
import { useNotification } from "../../context/NotificationContext";

const Fields = styled.div`
  display: flex;
  gap: var(--spacing-m);
  flex-direction: column;
  margin-bottom: 2em;
`;

const parseNumber = (n: string): number => Number(n.replace(",", "."));

const DialogContent = ({
  reservation,
  onClose,
  onAccept,
}: {
  reservation: ReservationType;
  onClose: () => void;
  onAccept: () => void;
}) => {
  const [approveReservationMutation] =
    useMutation<Mutation>(APPROVE_RESERVATION);

  const approveReservation = (input: ReservationApproveMutationInput) =>
    approveReservationMutation({ variables: { input } });

  const [price, setPrice] = useState<string>(String(reservation.price));
  const [handlingDetails, setHandlingDetails] = useState<string>("");
  const { notifyError, notifySuccess } = useNotification();
  const { t } = useTranslation();

  const hasPrice = Boolean(reservation.price !== undefined);
  const priceIsValid = !hasPrice || !Number.isNaN(parseNumber(price));

  return (
    <>
      <Dialog.Content>
        <p id="modal-description" className="text-body">
          Lorem ipsum.
        </p>
        <Fields>
          {hasPrice ? (
            <TextInput
              value={price}
              required
              id="name"
              label={t("SingleApplication.ApproveDialog.price")}
              onChange={(e) => setPrice(e.target.value)}
              errorText={
                !priceIsValid
                  ? t("SingleApplication.ApproveDialog.missingPrice")
                  : undefined
              }
            />
          ) : null}
          <TextArea
            value={handlingDetails}
            onChange={(e) => setHandlingDetails(e.target.value)}
            required
            label={t("SingleApplication.ApproveDialog.handlingDetails")}
            id="handlingDetails"
          />
        </Fields>
      </Dialog.Content>
      <Dialog.ActionButtons>
        <Button variant="secondary" onClick={onClose} theme="black">
          {t("common.prev")}
        </Button>

        <Button
          disabled={!priceIsValid}
          iconLeft={<IconCheckCircleFill />}
          onClick={async () => {
            try {
              const res = await approveReservation({
                pk: reservation.pk,
                price: parseNumber(price),
                handlingDetails,
              });

              if (res.errors) {
                notifyError(t("SingleApplication.ApproveDialog.errorSaving"));
              } else {
                notifySuccess(t("SingleApplication.ApproveDialog.approved"));
                onAccept();
              }
            } catch (e) {
              notifyError(t("SingleApplication.ApproveDialog.errorSaving"));
            }
          }}
        >
          {t("SingleApplication.ApproveDialog.accept")}
        </Button>
      </Dialog.ActionButtons>
    </>
  );
};

const ApproveDialog = ({
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
        title={t("SingleApplication.ApproveDialog.title")}
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
export default ApproveDialog;
