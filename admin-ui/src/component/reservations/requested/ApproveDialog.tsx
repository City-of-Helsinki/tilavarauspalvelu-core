import React, { useState } from "react";
import { trim } from "lodash";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { useMutation } from "@apollo/client";
import {
  Button,
  Checkbox,
  Dialog,
  Notification,
  NumberInput,
  TextArea,
} from "hds-react";
import {
  Mutation,
  ReservationApproveMutationInput,
  ReservationType,
} from "common/types/gql-types";
import { useModal } from "../../../context/ModalContext";
import { APPROVE_RESERVATION } from "./queries";
import { useNotification } from "../../../context/NotificationContext";
import { VerticalFlex } from "../../../styles/layout";
import { getReservationPriceDetails } from "./util";

const Label = styled.p`
  color: var(--color-black-70);
`;

const Content = styled.p`
  font-size: var(--fontsize-body-l);
`;

const ActionButtons = styled(Dialog.ActionButtons)`
  justify-content: end;
`;

const parseNumber = (n: string): number => Number(n.replace(",", "."));
const calcPriceNet = (price: string, taxPercentageValue?: number | null) => {
  const priceNet = taxPercentageValue
    ? Number(price) / ((1 + taxPercentageValue) / 100)
    : Number(price);

  return Number(priceNet.toFixed(2));
};

const DialogContent = ({
  reservation,
  isFree,
  onClose,
  onAccept,
}: {
  reservation: ReservationType;
  isFree: boolean;
  onClose: () => void;
  onAccept: () => void;
}) => {
  const [approveReservationMutation] =
    useMutation<Mutation>(APPROVE_RESERVATION);

  const approveReservation = (input: ReservationApproveMutationInput) =>
    approveReservationMutation({ variables: { input } });

  const [price, setPrice] = useState<string>(String(reservation.price || 0));
  const [handlingDetails, setHandlingDetails] = useState<string>(
    reservation.workingMemo || ""
  );
  const { notifyError, notifySuccess } = useNotification();
  const { t } = useTranslation();

  const hasPrice = Boolean(reservation.price !== undefined);
  const priceIsValid = !hasPrice || !Number.isNaN(parseNumber(price));

  const handleApprove = async () => {
    try {
      const res = await approveReservation({
        pk: reservation.pk,
        price: parseNumber(price),
        priceNet: calcPriceNet(price, reservation.taxPercentageValue),
        handlingDetails,
      });

      if (res.data?.approveReservation?.errors) {
        notifyError(
          t("RequestedReservation.ApproveDialog.errorSaving", {
            error: res.data?.approveReservation?.errors
              .map((e) => `${e?.field}: ${e?.messages}`)
              .join(", "),
          })
        );
      } else {
        notifySuccess(t("RequestedReservation.ApproveDialog.approved"));
        onAccept();
      }
    } catch (e) {
      notifyError(t("RequestedReservation.ApproveDialog.errorSaving"));
    }
  };

  return (
    <>
      <Dialog.Content>
        <VerticalFlex>
          {reservation.applyingForFreeOfCharge && (
            <>
              <div>
                <Label>
                  {t("RequestedReservation.ApproveDialog.subventionReason")}
                </Label>
                <Content>
                  {trim(reservation.freeOfChargeReason ?? "") || "-"}
                </Content>
              </div>
              <Notification>
                {getReservationPriceDetails(reservation, t)}
              </Notification>
            </>
          )}
          {!isFree && hasPrice ? (
            <>
              <Checkbox
                label={t("RequestedReservation.ApproveDialog.clearPrice")}
                id="organisation.notRegistered"
                name="organisation.notRegistered"
                checked={Number(price) === 0}
                onClick={() => {
                  if (Number(price) !== 0) {
                    setPrice("0");
                  }
                }}
              />
              <div style={{ width: "14em" }}>
                <NumberInput
                  type="number"
                  value={price ? Number(price) : ""}
                  required
                  min={0}
                  minusStepButtonAriaLabel={t("common:subtract")}
                  plusStepButtonAriaLabel={t("common:add")}
                  step={1}
                  id="name"
                  label={t("RequestedReservation.ApproveDialog.price")}
                  onChange={(e) => setPrice(e.target.value)}
                  errorText={
                    !priceIsValid
                      ? t("RequestedReservation.ApproveDialog.missingPrice")
                      : undefined
                  }
                />
              </div>
            </>
          ) : null}

          <TextArea
            value={handlingDetails}
            onChange={(e) => setHandlingDetails(e.target.value)}
            label={t("RequestedReservation.ApproveDialog.handlingDetails")}
            id="handlingDetails"
            helperText={t("RequestedReservation.workingMemoHelperText")}
          />
        </VerticalFlex>
      </Dialog.Content>
      <ActionButtons>
        <Button variant="secondary" onClick={onClose}>
          {t("common.cancel")}
        </Button>

        <Button disabled={!priceIsValid} onClick={handleApprove}>
          {t("RequestedReservation.ApproveDialog.accept")}
        </Button>
      </ActionButtons>
    </>
  );
};

const ApproveDialog = ({
  reservation,
  isFree,
  onClose,
  onAccept,
}: {
  reservation: ReservationType;
  isFree: boolean;
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
      isOpen={isOpen}
      focusAfterCloseRef={undefined}
    >
      <VerticalFlex>
        <Dialog.Header
          id="modal-header"
          title={
            isFree
              ? t("RequestedReservation.ApproveDialog.titleWithoutSubvention")
              : t("RequestedReservation.ApproveDialog.title")
          }
        />

        <DialogContent
          isFree={isFree}
          reservation={reservation}
          onAccept={onAccept}
          onClose={onClose}
        />
      </VerticalFlex>
    </Dialog>
  );
};
export default ApproveDialog;
