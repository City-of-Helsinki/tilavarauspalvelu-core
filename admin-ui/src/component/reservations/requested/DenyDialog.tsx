import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { useMutation } from "@apollo/client";
import { GraphQLError } from "graphql";
import { z } from "zod";
import {
  Button,
  Dialog,
  RadioButton,
  SelectionGroup,
  TextArea,
} from "hds-react";
import {
  Mutation,
  MutationDenyReservationArgs,
  MutationRefundReservationArgs,
  ReservationDenyMutationInput,
  ReservationRefundMutationInput,
  ReservationType,
  ReservationTypeConnection,
  ReservationsReservationStateChoices,
} from "common/types/gql-types";
import { useModal } from "../../../context/ModalContext";
import { DENY_RESERVATION, REFUND_RESERVATION } from "./queries";
import { useNotification } from "../../../context/NotificationContext";
import Loader from "../../Loader";
import Select from "../../ReservationUnits/ReservationUnitEditor/Select";
import { VerticalFlex } from "../../../styles/layout";
import { CustomDialogHeader } from "../../CustomDialogHeader";
import { useDenyReasonOptions } from "./hooks";

const ActionButtons = styled(Dialog.ActionButtons)`
  justify-content: end;
`;

type ReturnAllowedState =
  // state selection
  | "refund"
  | "no-refund"
  | "not-decided"
  // invalid type (i.e. multi reservation)
  | "not-allowed"
  // no refunds
  | "free"
  | "already-refunded";

const convertToReturnState: (
  reservations: ReservationType[]
) => ReturnAllowedState = (reservations) => {
  const isPriceReturnable = (x: {
    price?: number;
    orderStatus?: string;
    orderUuid?: string;
    refundUuid?: string;
  }) =>
    x.price && x.price > 0 && x.orderStatus === "PAID" && x.orderUuid != null;

  const payed = reservations
    .map(({ price, orderStatus, orderUuid }) => ({
      price: price ?? 0,
      orderStatus: orderStatus ?? undefined,
      orderUuid: orderUuid ?? undefined,
    }))
    .filter((x) => isPriceReturnable(x));

  // multiple reservations shouldn't be paid and are not tested
  if (payed.length > 1) {
    return "not-allowed";
  }

  if (payed.length === 0) {
    return "free";
  }
  return "not-decided";
};

const ReturnMoney = ({
  state,
  onChange,
  price,
}: {
  state: ReturnAllowedState;
  onChange: (val: ReturnAllowedState) => void;
  price: number;
}) => {
  const { t } = useTranslation("translation", {
    keyPrefix: "RequestedReservation.DenyDialog.refund",
  });

  switch (state) {
    case "free":
      return null;
    case "not-allowed":
      return <div>{t("notAllowed")}</div>;
    case "already-refunded":
      return <div>{t("alreadyRefunded")}</div>;
    case "refund":
    case "no-refund":
    case "not-decided":
    default:
      return (
        <SelectionGroup required direction="horizontal" label={t("radioLabel")}>
          <RadioButton
            id="return-money"
            name="return-money"
            label={t("returnChoice", { price })}
            checked={state === "refund"}
            onChange={() => onChange("refund")}
          />
          <RadioButton
            id="no-return-money"
            checked={state === "no-refund"}
            label={t("noReturnChoice")}
            onChange={() => onChange("no-refund")}
          />
        </SelectionGroup>
      );
  }
};

const DialogContent = ({
  reservations,
  onClose,
  onReject,
}: {
  reservations: ReservationType[];
  onClose: () => void;
  onReject: () => void;
}) => {
  const [denyReservationMutation] = useMutation<
    Mutation,
    MutationDenyReservationArgs
  >(DENY_RESERVATION, {
    update(cache, { data }) {
      // Manually update the cache instead of invalidating the whole query
      // because we can't invalidate single elements in the recurring list.
      // For a single reservation doing a query invalidation is fine
      // but doing that to a list of 2000 reservations when a single one of them gets
      // denied would cause 5s delay and full rerender of the list on every button press.
      cache.modify({
        fields: {
          // find the pk => slice the array => replace the state variable in the slice
          reservations(existing: ReservationTypeConnection) {
            const queryRes = data?.denyReservation;
            if (queryRes?.errors) {
              // eslint-disable-next-line no-console
              console.error(
                "NOT updating cache: mutation failed with: ",
                queryRes?.errors
              );
            } else if (!queryRes?.errors && !queryRes?.pk) {
              // eslint-disable-next-line no-console
              console.error(
                "NOT updating cache: mutation success but PK missing"
              );
            } else {
              const { state, pk } = queryRes;
              const fid = existing.edges.findIndex((x) => x?.node?.pk === pk);
              if (fid > -1) {
                const cpy = structuredClone(existing.edges[fid]);
                if (cpy?.node && state) {
                  // State === ReservationsReservationStateChoices: are the exact same enum
                  // but Typescript complains about them so use zod just in case.
                  const val = z
                    .nativeEnum(ReservationsReservationStateChoices)
                    .parse(state.valueOf());
                  cpy.node.state = val;
                }
                return {
                  ...existing,
                  edges: [
                    ...existing.edges.slice(0, fid),
                    cpy,
                    ...existing.edges.slice(fid + 1),
                  ],
                };
              }
            }
            return existing;
          },
        },
      });
    },
  });

  const { notifyError, notifySuccess } = useNotification();
  const { t } = useTranslation();

  const [refundReservationMutation] = useMutation<
    Mutation,
    MutationRefundReservationArgs
  >(REFUND_RESERVATION, {
    onCompleted: () => {
      notifySuccess(
        t("RequestedReservation.DenyDialog.refund.mutationSuccess")
      );
    },
    onError: (err) => {
      // eslint-disable-next-line no-console
      console.error("Refund failed with: ", err);
      notifyError(t("RequestedReservation.DenyDialog.refund.mutationFailure"));
    },
  });

  const denyReservation = (input: ReservationDenyMutationInput) =>
    denyReservationMutation({ variables: { input } });

  const refundReservation = (input: ReservationRefundMutationInput) =>
    refundReservationMutation({ variables: { input } });

  const [handlingDetails, setHandlingDetails] = useState<string>(
    reservations.length === 1 ? reservations[0].workingMemo ?? "" : ""
  );
  const [denyReasonPk, setDenyReason] = useState<number | null>(null);
  const [inProgress, setInProgress] = useState(false);

  const [returnState, setReturnState] = React.useState<ReturnAllowedState>(
    convertToReturnState(reservations)
  );

  const { options, loading } = useDenyReasonOptions();

  const handleDeny = async () => {
    try {
      if (denyReasonPk == null) {
        throw new Error("Deny PK undefined");
      }

      setInProgress(true);
      const denyPromises = reservations.map((x) =>
        denyReservation({
          pk: x.pk,
          denyReasonPk,
          handlingDetails,
        })
      );

      const res = await Promise.all(denyPromises);

      const errors = res
        .map((x) => x.errors)
        .filter((x): x is GraphQLError[] => x != null);

      if (errors.length !== 0) {
        // eslint-disable-next-line no-console
        console.error("Deny failed with: ", errors);
        notifyError(t("RequestedReservation.DenyDialog.errorSaving"));
      } else {
        if (returnState === "refund") {
          const refundPromises = reservations.map((x) =>
            refundReservation({ pk: x.pk })
          );
          await Promise.all(refundPromises);
        } else {
          notifySuccess(t("RequestedReservation.DenyDialog.successNotify"));
        }
        onReject();
      }
    } catch (e) {
      notifyError(t("RequestedReservation.DenyDialog.errorSaving"));
    } finally {
      setInProgress(false);
    }
  };

  if (loading || inProgress) {
    return (
      <Dialog.Content>
        <Loader />
      </Dialog.Content>
    );
  }

  return (
    <>
      <Dialog.Content>
        <VerticalFlex>
          <Select
            required
            id="denyReason"
            options={options}
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
          <ReturnMoney
            state={returnState}
            onChange={setReturnState}
            price={reservations.find((x) => x.price && x.price > 0)?.price ?? 0}
          />
        </VerticalFlex>
      </Dialog.Content>
      <ActionButtons>
        <Button variant="secondary" onClick={onClose} theme="black">
          {t("common.prev")}
        </Button>
        <Button
          disabled={!denyReasonPk || returnState === "not-decided"}
          onClick={handleDeny}
        >
          {t("RequestedReservation.DenyDialog.reject")}
        </Button>
      </ActionButtons>
    </>
  );
};

const DenyDialog = ({
  reservations,
  onClose,
  onReject,
  title,
}: {
  reservations: ReservationType[];
  onClose: () => void;
  onReject: () => void;
  title?: string;
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
          title={title ?? t("RequestedReservation.DenyDialog.title")}
          close={onClose}
        />
        <DialogContent
          reservations={reservations}
          onReject={onReject}
          onClose={onClose}
        />
      </VerticalFlex>
    </Dialog>
  );
};
export default DenyDialog;
