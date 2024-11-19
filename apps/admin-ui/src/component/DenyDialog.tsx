import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import {
  Button,
  Dialog,
  RadioButton,
  SelectionGroup,
  TextArea,
} from "hds-react";
import {
  type ReservationDenyMutationInput,
  type ReservationRefundMutationInput,
  useDenyReservationMutation,
  useRefundReservationMutation,
  type ReservationQuery,
  type ReservationSeriesDenyMutationInput,
  useDenyReservationSeriesMutation,
  OrderStatus,
} from "@gql/gql-types";
import { useModal } from "@/context/ModalContext";
import { Select } from "@/component/Select";
import { CenterSpinner, Flex } from "common/styles/util";
import { CustomDialogHeader } from "@/component/CustomDialogHeader";
import { useDenyReasonOptions } from "@/hooks";
import { successToast, errorToast } from "common/src/common/toast";
import { gql } from "@apollo/client";
import { getValidationErrors } from "common/src/apolloUtils";
import { toNumber } from "common/src/helpers";

const ActionButtons = styled(Dialog.ActionButtons)`
  justify-content: end;
`;

// TODO use a fragment
type QueryT = NonNullable<ReservationQuery["reservation"]>;
type ReservationType = Pick<
  QueryT,
  "pk" | "handlingDetails" | "price" | "paymentOrder"
>;

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

function isPriceReturnable(x: {
  price: number;
  orderStatus: OrderStatus | null;
  orderUuid: string | null;
  refundUuid: string | null;
}): boolean {
  return (
    x.price > 0 &&
    x.orderStatus === OrderStatus.Paid &&
    x.orderUuid != null &&
    x.refundUuid == null
  );
}

function findPrice(reservation: Pick<ReservationType, "price">): number {
  return toNumber(reservation.price) ?? 0;
}

function convertToReturnState(
  reservation: ReservationType
): ReturnAllowedState {
  const { price, paymentOrder } = reservation;
  const order = paymentOrder[0] ?? null;
  const payed = {
    price: toNumber(price) ?? 0,
    orderStatus: order?.status ?? null,
    orderUuid: order?.orderUuid ?? null,
    refundUuid: order?.refundUuid ?? null,
  };

  if (payed.refundUuid != null) {
    return "already-refunded";
  }
  if (payed.price === 0) {
    return "free";
  }
  if (isPriceReturnable(payed)) {
    return "not-decided";
  }
  return "not-allowed";
}

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

type Props = {
  reservation: ReservationType;
  onClose: () => void;
  onReject: (vars: DenyVariables) => void;
};

type DenyVariables = {
  shouldRefund: boolean;
  handlingDetails: string;
  denyReasonPk: number | null;
};

function DialogContent({ reservation, onClose, onReject }: Props): JSX.Element {
  const { t } = useTranslation();

  const [handlingDetails, setHandlingDetails] = useState<string>(
    reservation.handlingDetails ?? ""
  );
  const [denyReasonPk, setDenyReason] = useState<number | null>(null);

  const [returnState, setReturnState] = useState<ReturnAllowedState>(
    convertToReturnState(reservation)
  );

  const { options, loading } = useDenyReasonOptions();

  const handleDeny = () => {
    const shouldRefund = returnState === "refund";
    onReject({ shouldRefund, handlingDetails, denyReasonPk });
  };

  if (loading) {
    return (
      <Dialog.Content>
        <CenterSpinner />
      </Dialog.Content>
    );
  }

  return (
    <>
      <Dialog.Content>
        <Flex>
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
            label={t("RequestedReservation.handlingDetails")}
            id="handlingDetails"
            helperText={t(
              "RequestedReservation.DenyDialog.handlingDetailsHelper"
            )}
          />
          <ReturnMoney
            state={returnState}
            onChange={setReturnState}
            price={findPrice(reservation)}
          />
        </Flex>
      </Dialog.Content>
      <ActionButtons>
        <Button
          variant="secondary"
          onClick={onClose}
          theme="black"
          data-testid="deny-dialog__cancel-button"
        >
          {t("common.prev")}
        </Button>
        <Button
          disabled={!denyReasonPk || returnState === "not-decided"}
          onClick={handleDeny}
          data-testid="deny-dialog__deny-button"
        >
          {t("RequestedReservation.DenyDialog.reject")}
        </Button>
      </ActionButtons>
    </>
  );
}

function DenyDialogWrapper({
  children,
  title,
  onClose,
}: {
  children: JSX.Element;
  title?: string;
  onClose: () => void;
}): JSX.Element {
  const { isOpen } = useModal();
  const { t } = useTranslation();

  return (
    <Dialog
      variant="danger"
      id="info-dialog"
      aria-labelledby="modal-header"
      isOpen={isOpen}
    >
      <Flex>
        <CustomDialogHeader
          id="modal-header"
          title={title ?? t("RequestedReservation.DenyDialog.title")}
          close={onClose}
        />
        {children}
      </Flex>
    </Dialog>
  );
}

export function DenyDialog({
  reservation,
  onClose,
  onReject,
  title,
}: {
  reservation: ReservationType;
  onClose: () => void;
  onReject: () => void;
  title?: string;
}): JSX.Element {
  const { t } = useTranslation();
  const [denyReservationMutation] = useDenyReservationMutation();
  const [refundReservationMutation] = useRefundReservationMutation();

  const denyReservation = (input: ReservationDenyMutationInput) =>
    denyReservationMutation({ variables: { input } });

  const refundReservation = async (input: ReservationRefundMutationInput) => {
    try {
      await refundReservationMutation({ variables: { input } });
      successToast({
        text: t("RequestedReservation.DenyDialog.refund.mutationSuccess"),
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Refund failed with: ", err);
      errorToast({
        text: t("RequestedReservation.DenyDialog.refund.mutationFailure"),
      });
    }
  };

  const handleDeny = async (vars: DenyVariables) => {
    const { shouldRefund, handlingDetails, denyReasonPk } = vars;
    try {
      if (denyReasonPk == null) {
        throw new Error("Deny PK undefined");
      }

      if (reservation.pk == null) {
        throw new Error("Reservation PK undefined");
      }

      const res = await denyReservation({
        pk: reservation.pk,
        denyReason: denyReasonPk,
        handlingDetails,
      });

      // TODO check that the data is valid
      if (res.errors != null && res.errors.length > 0) {
        errorToast({ text: t("RequestedReservation.DenyDialog.errorSaving") });
      } else {
        if (shouldRefund) {
          // TODO check errors and valid reposponse
          await refundReservation({ pk: reservation.pk });
        } else {
          successToast({
            text: t("RequestedReservation.DenyDialog.successNotify"),
          });
        }
        onReject();
      }
    } catch (e) {
      const validationErrors = getValidationErrors(e);
      if (validationErrors.length > 0) {
        const validationError = validationErrors[0];
        errorToast({
          text: t(`errors.backendValidation.${validationError.code}`),
        });
      } else {
        errorToast({ text: t("RequestedReservation.DenyDialog.errorSaving") });
      }
    }
  };

  return (
    <DenyDialogWrapper title={title} onClose={onClose}>
      <DialogContent
        reservation={reservation}
        onReject={handleDeny}
        onClose={onClose}
      />
    </DenyDialogWrapper>
  );
}

export function DenyDialogSeries({
  title,
  onClose,
  onReject,
  reservation,
  recurringReservation,
}: {
  title?: string;
  onClose: () => void;
  onReject: () => void;
  reservation: ReservationType;
  recurringReservation: NonNullable<QueryT["recurringReservation"]>;
}): JSX.Element {
  const { t } = useTranslation();
  const [denyMutation] = useDenyReservationSeriesMutation();

  const handleDeny = async (vars: DenyVariables) => {
    const { shouldRefund, handlingDetails, denyReasonPk } = vars;
    const inputPk = recurringReservation.pk;
    try {
      if (denyReasonPk == null) {
        throw new Error("Deny PK undefined");
      }
      if (shouldRefund) {
        throw new Error("Refund not allowed for series");
      }
      if (inputPk == null) {
        throw new Error("Recurring reservation PK undefined");
      }

      const input: ReservationSeriesDenyMutationInput = {
        pk: inputPk,
        denyReason: denyReasonPk,
        handlingDetails,
      };
      const res = await denyMutation({ variables: { input } });

      if (res.errors != null && res.errors?.length > 0) {
        errorToast({ text: t("RequestedReservation.DenyDialog.errorSaving") });
      }
      successToast({
        text: t("RequestedReservation.DenyDialog.successNotify"),
      });
      onReject();
    } catch (e) {
      const validationErrors = getValidationErrors(e);
      if (validationErrors.length > 0) {
        const validationError = validationErrors[0];
        errorToast({
          text: t(`errors.backendValidation.${validationError.code}`),
        });
      } else {
        errorToast({ text: t("RequestedReservation.DenyDialog.errorSaving") });
      }
    }
  };

  return (
    <DenyDialogWrapper title={title} onClose={onClose}>
      <DialogContent
        reservation={reservation}
        onReject={handleDeny}
        onClose={onClose}
      />
    </DenyDialogWrapper>
  );
}

export const DENY_RESERVATION = gql`
  mutation DenyReservation($input: ReservationDenyMutationInput!) {
    denyReservation(input: $input) {
      pk
      state
    }
  }
`;

export const DENY_SERIES_RESERVATION = gql`
  mutation DenyReservationSeries($input: ReservationSeriesDenyMutationInput!) {
    denyReservationSeries(input: $input) {
      denied
      future
    }
  }
`;

export const REFUND_RESERVATION = gql`
  mutation RefundReservation($input: ReservationRefundMutationInput!) {
    refundReservation(input: $input) {
      pk
    }
  }
`;
