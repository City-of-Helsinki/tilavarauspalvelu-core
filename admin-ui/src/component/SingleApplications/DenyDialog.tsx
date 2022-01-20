import React, { useState } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery } from "@apollo/client";
import { Button, Dialog, IconInfoCircle, IconTrash, TextArea } from "hds-react";
import {
  Mutation,
  Query,
  QueryReservationDenyReasonsArgs,
  ReservationDenyMutationInput,
  ReservationType,
} from "../../common/gql-types";
import { useModal } from "../../context/ModalContext";
import {
  DENY_RESERVATION,
  RESERVATION_DENY_REASONS,
} from "../../common/queries";
import { useNotification } from "../../context/NotificationContext";
import Loader from "../Loader";
import Select from "../ReservationUnits/Select";
import { OptionType } from "../../common/types";

const Fields = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 2em;
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

  const [handlingDetails, setHandlingDetails] = useState<string>("");
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
            reservationDenyReasons.edges.map(
              (dr): OptionType => ({
                value: dr?.node?.pk as number,
                label: dr?.node?.reasonFi as string,
              })
            )
          );
        }
      },

      onError: () => {
        notifyError(t("SingleApplication.errorFetchingData"));
      },
    }
  );

  if (loading) {
    return <Loader />;
  }

  return (
    <>
      <Dialog.Content>
        <p id="modal-description" className="text-body">
          Lorem ipsum.
        </p>
        <Fields>
          <Select
            id="denyReason"
            options={denyReasonOptions}
            placeholder={t("common.select")}
            label={t("SingleApplication.DenyDialog.denyReason")}
            onChange={(v) => setDenyReason(Number(v))}
            value={denyReasonPk}
          />
          <TextArea
            value={handlingDetails}
            onChange={(e) => setHandlingDetails(e.target.value)}
            label={t("SingleApplication.DenyDialog.handlingDetails")}
            id="handlingDetails"
          />
        </Fields>
      </Dialog.Content>
      <Dialog.ActionButtons>
        <Button variant="secondary" onClick={onClose} theme="black">
          {t("common.prev")}
        </Button>

        <Button
          disabled={!denyReasonPk}
          variant="danger"
          iconLeft={<IconTrash />}
          onClick={async () => {
            try {
              const res = await denyReservation({
                pk: reservation.pk,
                denyReasonPk: denyReasonPk as number,
                handlingDetails,
              });

              if (res.errors) {
                notifyError(t("SingleApplication.DenyDialog.errorSaving"));
              } else {
                notifySuccess(t("SingleApplication.DenyDialog.approved"));
                onReject();
              }
            } catch (e) {
              notifyError(t("SingleApplication.DenyDialog.errorSaving"));
            }
          }}
        >
          {t("SingleApplication.DenyDialog.reject")}
        </Button>
      </Dialog.ActionButtons>
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
      aria-describedby="modal-description"
      isOpen={isOpen}
    >
      <Dialog.Header
        id="modal-header"
        title={t("SingleApplication.DenyDialog.title")}
        iconLeft={<IconInfoCircle aria-hidden="true" />}
      />
      <DialogContent
        reservation={reservation}
        onReject={onReject}
        onClose={onClose}
      />
    </Dialog>
  );
};
export default DenyDialog;
