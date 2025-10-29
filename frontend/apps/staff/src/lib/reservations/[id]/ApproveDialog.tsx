import React, { useState } from "react";
import { trim } from "lodash-es";
import styled from "styled-components";
import { useTranslation } from "next-i18next";
import { Button, ButtonVariant, Checkbox, Dialog, Notification, NumberInput, TextArea } from "hds-react";
import {
  type ApprovalDialogFieldsFragment,
  useApproveReservationMutation,
  type ReservationApproveMutationInput,
} from "@gql/gql-types";
import { useModal } from "@/context/ModalContext";
import { Flex } from "common/src/styled";
import { getReservationPriceDetails } from "@/modules/reservation";
import { successToast } from "common/src/components/toast";
import { toNumber } from "common/src/modules/helpers";
import { gql } from "@apollo/client";
import { useDisplayError } from "common/src/hooks";

const Label = styled.p`
  color: var(--color-black-70);
`;

const Content = styled.p`
  font-size: var(--fontsize-body-l);
`;

const ActionButtons = styled(Dialog.ActionButtons)`
  justify-content: end;
`;

type Props = {
  reservation: ApprovalDialogFieldsFragment;
  onClose: () => void;
  onAccept: () => void;
  isFree?: boolean;
  focusAfterCloseRef?: React.RefObject<HTMLButtonElement>;
};

const DialogContent = ({ reservation, onClose, onAccept }: Props) => {
  const { t } = useTranslation();

  const [mutation] = useApproveReservationMutation();
  const displayError = useDisplayError();

  const approveReservation = async (input: ReservationApproveMutationInput) => {
    try {
      await mutation({ variables: { input } });
      successToast({ text: t("reservation:ApproveDialog.approved") });
      onAccept();
    } catch (err) {
      displayError(err);
    }
  };

  const [price, setPrice] = useState(toNumber(reservation.price) ?? 0);
  const [handlingDetails, setHandlingDetails] = useState<string>(reservation.handlingDetails ?? "");
  const hasPrice = reservation.price != null && Number(reservation.price) > 0;
  const priceIsValid = !hasPrice || !Number.isNaN(price);

  const handleApprove = () => {
    if (reservation.pk == null) {
      throw new Error("Reservation pk is missing");
    }
    approveReservation({
      pk: reservation.pk,
      price: price.toString(),
      handlingDetails,
    });
  };

  return (
    <>
      <Dialog.Content>
        <Flex>
          {reservation.applyingForFreeOfCharge && (
            <>
              <div>
                <Label>{t("reservation:ApproveDialog.subventionReason")}</Label>
                <Content>{trim(reservation.freeOfChargeReason ?? "") || "-"}</Content>
              </div>
              <Notification>{getReservationPriceDetails(reservation, t)}</Notification>
              <Checkbox
                label={t("reservation:ApproveDialog.clearPrice")}
                id="clearPrice"
                checked={price === 0}
                onClick={() => {
                  if (price !== 0) {
                    setPrice(0);
                  }
                }}
              />
              <div style={{ width: "14em" }}>
                <NumberInput
                  type="number"
                  value={price}
                  required
                  min={0}
                  minusStepButtonAriaLabel={t("common:subtract")}
                  plusStepButtonAriaLabel={t("common:add")}
                  step={1}
                  id="approvalPrice"
                  label={t("reservation:ApproveDialog.price")}
                  onChange={(e) => {
                    if (e.target.value === "") {
                      setPrice(0);
                      return;
                    }
                    if (Number.isNaN(Number(e.target.value))) {
                      return;
                    }
                    setPrice(Number(e.target.value));
                  }}
                  errorText={!priceIsValid ? t("reservation:ApproveDialog.missingPrice") : undefined}
                />
              </div>
            </>
          )}
          <TextArea
            value={handlingDetails}
            onChange={(e) => setHandlingDetails(e.target.value)}
            label={t("reservation:handlingDetails")}
            id="handlingDetails"
            helperText={t("reservation:workingMemoHelperText")}
          />
        </Flex>
      </Dialog.Content>
      <ActionButtons>
        <Button disabled={!priceIsValid} onClick={handleApprove} data-testid="approval-dialog__accept-button">
          {t("reservation:ApproveDialog.accept")}
        </Button>
        <Button variant={ButtonVariant.Secondary} onClick={onClose} data-testid="approval-dialog__cancel-button">
          {t("common:cancel")}
        </Button>
      </ActionButtons>
    </>
  );
};

export function ApproveDialog({ reservation, isFree, onClose, onAccept, focusAfterCloseRef }: Props): JSX.Element {
  const { isOpen } = useModal();
  const { t } = useTranslation();

  return (
    <Dialog
      variant="primary"
      id="info-dialog"
      aria-labelledby="modal-header"
      isOpen={isOpen}
      focusAfterCloseRef={focusAfterCloseRef}
    >
      <Flex>
        <Dialog.Header
          id="modal-header"
          title={isFree ? t("reservation:ApproveDialog.titleWithoutSubvention") : t("reservation:ApproveDialog.title")}
        />
        <DialogContent reservation={reservation} onAccept={onAccept} onClose={onClose} />
      </Flex>
    </Dialog>
  );
}

export const APPROVAL_DIALOG_FRAGMENT = gql`
  fragment ApprovalDialogFields on ReservationNode {
    pk
    price
    handlingDetails
    applyingForFreeOfCharge
    freeOfChargeReason
    ...ReservationPriceDetailsFields
  }
`;

export const APPROVE_RESERVATION_MUTATION = gql`
  mutation ApproveReservation($input: ReservationApproveMutationInput!) {
    approveReservation(input: $input) {
      pk
      state
    }
  }
`;
