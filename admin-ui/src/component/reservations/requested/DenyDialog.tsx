import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { useMutation, useQuery } from "@apollo/client";
import { Button, Dialog, TextArea } from "hds-react";
import {
  Mutation,
  Query,
  QueryReservationDenyReasonsArgs,
  ReservationDenyMutationInput,
  ReservationDenyReasonType,
  ReservationType,
} from "common/types/gql-types";
import { useModal } from "../../../context/ModalContext";
import { DENY_RESERVATION, RESERVATION_DENY_REASONS } from "./queries";
import { useNotification } from "../../../context/NotificationContext";
import Loader from "../../Loader";
import Select from "../../ReservationUnits/ReservationUnitEditor/Select";
import { OptionType } from "../../../common/types";
import { VerticalFlex } from "../../../styles/layout";
import { CustomDialogHeader } from "../../CustomDialogHeader";

const ActionButtons = styled(Dialog.ActionButtons)`
  justify-content: end;
`;

const DialogContent = ({
  reservation,
  onClose,
  onReject,
}: {
  reservation: ReservationType;
  onClose: () => void;
  onReject: () => void;
}) => {
  const [denyReservationMutation] = useMutation<Mutation>(DENY_RESERVATION);

  const denyReservation = (input: ReservationDenyMutationInput) =>
    denyReservationMutation({ variables: { input } });

  const [handlingDetails, setHandlingDetails] = useState<string>(
    reservation.workingMemo || ""
  );
  const [denyReasonPk, setDenyReason] = useState<number | null>(null);
  const [denyReasonOptions, setDenyReasonOptions] = useState<OptionType[]>([]);
  const { notifyError, notifySuccess } = useNotification();
  const { t } = useTranslation();

  const { loading } = useQuery<Query, QueryReservationDenyReasonsArgs>(
    RESERVATION_DENY_REASONS,
    {
      onCompleted: ({ reservationDenyReasons }) => {
        if (reservationDenyReasons) {
          setDenyReasonOptions(
            reservationDenyReasons.edges
              .map((x) => x?.node)
              .filter((x): x is ReservationDenyReasonType => x != null)
              .map(
                (dr): OptionType => ({
                  value: dr?.pk ?? 0,
                  label: dr?.reasonFi ?? "",
                })
              )
          );
        }
      },
      onError: () => {
        notifyError(t("RequestedReservation.errorFetchingData"));
      },
    }
  );

  const handleDeny = async () => {
    try {
      if (denyReasonPk == null) {
        throw new Error("Deny PK undefined");
      }
      const res = await denyReservation({
        pk: reservation.pk,
        denyReasonPk,
        handlingDetails,
      });

      if (res.errors) {
        notifyError(t("RequestedReservation.DenyDialog.errorSaving"));
      } else {
        notifySuccess(t("RequestedReservation.DenyDialog.denied"));
        onReject();
      }
    } catch (e) {
      notifyError(t("RequestedReservation.DenyDialog.errorSaving"));
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <>
      <Dialog.Content>
        <VerticalFlex>
          <Select
            required
            id="denyReason"
            options={denyReasonOptions}
            placeholder={t("common.select")}
            label={t("RequestedReservation.DenyDialog.denyReason")}
            onChange={(v) => setDenyReason(Number(v))}
            value={denyReasonPk}
            helper={t("RequestedReservation.DenyDialog.denyReasonHelper")}
          />
          <TextArea
            value={handlingDetails}
            onChange={(e) => setHandlingDetails(e.target.value)}
            label={t("RequestedReservation.DenyDialog.handlingDetails")}
            id="handlingDetails"
            helperText={t(
              "RequestedReservation.DenyDialog.handlingDetailsHelper"
            )}
          />
        </VerticalFlex>
      </Dialog.Content>
      <ActionButtons>
        <Button variant="secondary" onClick={onClose} theme="black">
          {t("common.prev")}
        </Button>
        <Button disabled={!denyReasonPk} onClick={handleDeny}>
          {t("RequestedReservation.DenyDialog.reject")}
        </Button>
      </ActionButtons>
    </>
  );
};

const DenyDialog = ({
  reservation,
  onClose,
  onReject,
}: {
  reservation: ReservationType;
  onClose: () => void;
  onReject: () => void;
}): JSX.Element => {
  const { isOpen } = useModal();
  const { t } = useTranslation();

  return (
    <Dialog
      variant="danger"
      id="info-dialog"
      aria-labelledby="modal-header"
      isOpen={isOpen}
    >
      <VerticalFlex>
        <CustomDialogHeader
          id="modal-header"
          title={t("RequestedReservation.DenyDialog.title")}
          close={onClose}
        />
        <DialogContent
          reservation={reservation}
          onReject={onReject}
          onClose={onClose}
        />
      </VerticalFlex>
    </Dialog>
  );
};
export default DenyDialog;
