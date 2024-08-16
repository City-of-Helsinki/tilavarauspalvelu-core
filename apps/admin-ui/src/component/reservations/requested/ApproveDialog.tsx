import React, { useState } from "react";
import { trim } from "lodash";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import {
  Button,
  Checkbox,
  Dialog,
  Notification,
  NumberInput,
  TextArea,
} from "hds-react";
import {
  useApproveReservationMutation,
  type ReservationApproveMutationInput,
  type ReservationQuery,
} from "@gql/gql-types";
import { useModal } from "@/context/ModalContext";
import { useNotification } from "@/context/NotificationContext";
import { VerticalFlex } from "@/styles/layout";
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

function calcPriceNet(price: number, taxPercentageValue?: number | null) {
  const priceNet =
    taxPercentageValue != null && taxPercentageValue > 0
      ? Number(price) / (1 + taxPercentageValue / 100)
      : Number(price);

  return Number(priceNet.toFixed(2));
}

// TODO use a fragment for the reservation type
type ReservationType = NonNullable<ReservationQuery["reservation"]>;
type Props = {
  reservation: ReservationType;
  isFree: boolean;
  onClose: () => void;
  onAccept: () => void;
};

const DialogContent = ({
  reservation,
  isFree: isReservationUnitFree,
  onClose,
  onAccept,
}: Props) => {
  const { notifyError, notifySuccess } = useNotification();
  const { t, i18n } = useTranslation();

  const [mutation] = useApproveReservationMutation({
    onCompleted: () => {
      notifySuccess(t("RequestedReservation.ApproveDialog.approved"));
      onAccept();
    },
    onError: (err) => {
      const { message } = err;
      const hasTranslatedErrorMsg = i18n.exists(
        `errors.descriptive.${message}`
      );
      const errorTranslated = hasTranslatedErrorMsg
        ? `errors.descriptive.${message}`
        : `errors.descriptive.genericError`;
      notifyError(
        t("RequestedReservation.ApproveDialog.errorSaving", {
          error: t(errorTranslated),
        })
      );
    },
  });

  const approveReservation = (input: ReservationApproveMutationInput) =>
    mutation({ variables: { input } });

  const [price, setPrice] = useState(Number(reservation.price) ?? 0);
  const [handlingDetails, setHandlingDetails] = useState<string>(
    reservation.handlingDetails ?? ""
  );
  const hasPrice = reservation.price != null && Number(reservation.price) > 0;
  const priceIsValid = !hasPrice || !Number.isNaN(price);

  const handleApprove = () => {
    if (reservation.pk == null) {
      throw new Error("Reservation pk is missing");
    }
    const taxP = reservation.taxPercentageValue ?? "0";
    approveReservation({
      pk: reservation.pk,
      price: price.toString(),
      priceNet: calcPriceNet(Number(price), parseFloat(taxP)).toString(),
      handlingDetails,
    });
  };

  // the reservation has a price and the reservation unit is paid
  // might be extrenous checks (the reservation price is what is important here)
  // a free reservation should never be allowed to be approved with a price
  const shouldDisplayPrice = !isReservationUnitFree && hasPrice;

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
          {shouldDisplayPrice && (
            <>
              <Checkbox
                label={t("RequestedReservation.ApproveDialog.clearPrice")}
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
                  label={t("RequestedReservation.ApproveDialog.price")}
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
                  errorText={
                    !priceIsValid
                      ? t("RequestedReservation.ApproveDialog.missingPrice")
                      : undefined
                  }
                />
              </div>
            </>
          )}
          <TextArea
            value={handlingDetails}
            onChange={(e) => setHandlingDetails(e.target.value)}
            label={t("RequestedReservation.handlingDetails")}
            id="handlingDetails"
            helperText={t("RequestedReservation.workingMemoHelperText")}
          />
        </VerticalFlex>
      </Dialog.Content>
      <ActionButtons>
        <Button
          variant="secondary"
          onClick={onClose}
          data-testid="approval-dialog__cancel-button"
        >
          {t("common.cancel")}
        </Button>
        <Button
          disabled={!priceIsValid}
          onClick={handleApprove}
          data-testid="approval-dialog__accept-button"
        >
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
}: Props): JSX.Element => {
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
