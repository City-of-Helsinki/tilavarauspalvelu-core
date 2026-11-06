import React, { useState } from "react";
import { gql } from "@apollo/client";
import { Button, ButtonVariant, Checkbox, Dialog, Notification, NumberInput, TextArea } from "hds-react";
import { trim } from "lodash-es";
import { useTranslation } from "next-i18next/pages";
import styled from "styled-components";
import { successToast } from "ui/src/components/toast";
import { useDisplayError } from "ui/src/hooks";
import { toNumber } from "ui/src/modules/helpers";
import { Flex } from "ui/src/styled";
import { useApproveReservationMutation } from "@gql/gql-types";
import type { ApprovalDialogFieldsFragment, ReservationApproveMutationInput } from "@gql/gql-types";
import { useModal } from "@/context/ModalContext";
import { getReservationPriceDetails } from "@/modules/reservation";

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
  focusAfterCloseRef?: React.RefObject<HTMLElement>;
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

  const priceLine = getOnlyPriceLine(reservation);
  const initialPrice = priceLine != null ? (priceLine.overrideAmount ?? priceLine.amount) : reservation.price;
  const [price, setPrice] = useState(toNumber(initialPrice) ?? 0);
  const [handlingDetails, setHandlingDetails] = useState<string>(reservation.handlingDetails ?? "");
  const hasPrice = initialPrice != null && Number(initialPrice) > 0;
  const priceIsValid = !hasPrice || !Number.isNaN(price);

  const handleApprove: () => Promise<void> = async () => {
    if (reservation.pk == null) {
      throw new Error("Reservation pk is missing");
    }
    await approveReservation({
      pk: reservation.pk,
      handlingDetails,
      ...getPriceInput(reservation, price),
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

type PriceLine = NonNullable<ApprovalDialogFieldsFragment["priceLines"]>[number];

function getOnlyPriceLine(reservation: ApprovalDialogFieldsFragment): PriceLine | null {
  const priceLineList = reservation.priceLines ?? [];
  return priceLineList.length === 1 ? (priceLineList[0] ?? null) : null;
}

/// The handler can only change the price when the reservation applies for a free of charge reservation.
/// In other cases, keep the current override of the price line.
/// Reservations made before price lines have no lines. For these, send the price.
/// The dialog has one price input, so it supports only reservations with one price line.
function getPriceInput(
  reservation: ApprovalDialogFieldsFragment,
  price: number
): Pick<ReservationApproveMutationInput, "price" | "priceLines"> {
  const priceLine = getOnlyPriceLine(reservation);
  if (priceLine?.pk == null) {
    return { price: price.toString() };
  }
  const overrideAmount = reservation.applyingForFreeOfCharge ? price.toString() : (priceLine.overrideAmount ?? null);
  return { priceLines: [{ pk: priceLine.pk, overrideAmount }] };
}

export function ApproveDialog({
  reservation,
  isFree,
  onClose,
  onAccept,
  focusAfterCloseRef,
}: Props): React.ReactElement {
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
    priceLines {
      id
      pk
      amount
      overrideAmount
    }
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
