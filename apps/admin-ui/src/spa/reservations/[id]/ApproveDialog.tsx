import React, { useState } from "react";
import { trim } from "lodash-es";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import {
  Button,
  ButtonVariant,
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
import { Flex } from "common/styles/util";
import { getReservationPriceDetails } from "./util";
import { errorToast, successToast } from "common/src/common/toast";
import { toNumber } from "common/src/helpers";

const Label = styled.p`
  color: var(--color-black-70);
`;

const Content = styled.p`
  font-size: var(--fontsize-body-l);
`;

const ActionButtons = styled(Dialog.ActionButtons)`
  justify-content: end;
`;

// TODO use a fragment for the reservation type
type ReservationType = NonNullable<ReservationQuery["reservation"]>;
type Props = {
  reservation: ReservationType;
  onClose: () => void;
  onAccept: () => void;
  isFree?: boolean;
};

const DialogContent = ({ reservation, onClose, onAccept }: Props) => {
  const { t, i18n } = useTranslation();

  const [mutation] = useApproveReservationMutation();

  const approveReservation = async (input: ReservationApproveMutationInput) => {
    try {
      await mutation({ variables: { input } });
      successToast({ text: t("RequestedReservation.ApproveDialog.approved") });
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
        text: t("RequestedReservation.ApproveDialog.errorSaving", {
          error: t(errorTranslated),
        }),
      });
    }
  };

  const [price, setPrice] = useState(toNumber(reservation.price) ?? 0);
  const [handlingDetails, setHandlingDetails] = useState<string>(
    reservation.handlingDetails ?? ""
  );
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
        </Flex>
      </Dialog.Content>
      <ActionButtons>
        <Button
          disabled={!priceIsValid}
          onClick={handleApprove}
          data-testid="approval-dialog__accept-button"
        >
          {t("RequestedReservation.ApproveDialog.accept")}
        </Button>
        <Button
          variant={ButtonVariant.Secondary}
          onClick={onClose}
          data-testid="approval-dialog__cancel-button"
        >
          {t("common.cancel")}
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
      <Flex>
        <Dialog.Header
          id="modal-header"
          title={
            isFree
              ? t("RequestedReservation.ApproveDialog.titleWithoutSubvention")
              : t("RequestedReservation.ApproveDialog.title")
          }
        />
        <DialogContent
          reservation={reservation}
          onAccept={onAccept}
          onClose={onClose}
        />
      </Flex>
    </Dialog>
  );
};

export default ApproveDialog;
