import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import {
  Button,
  ButtonVariant,
  Dialog,
  RadioButton,
  Select,
  SelectionGroup,
  TextArea,
} from "hds-react";
import {
  type ReservationDenyMutationInput,
  type ReservationRefundMutationInput,
  useDenyReservationMutation,
  useRefundReservationMutation,
  type ReservationSeriesDenyMutationInput,
  useDenyReservationSeriesMutation,
  OrderStatus,
  type DenyDialogFieldsFragment,
} from "@gql/gql-types";
import { useModal } from "@/context/ModalContext";
import { CenterSpinner, Flex } from "common/styled";
import { useDenyReasonOptions } from "@/hooks";
import { successToast } from "common/src/common/toast";
import { ApolloError, gql } from "@apollo/client";
import { convertOptionToHDS, toNumber } from "common/src/helpers";
import { useDisplayError } from "common/src/hooks";
import { isBefore } from "date-fns";

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

function isPriceReturnable(x: {
  price: number;
  orderStatus: OrderStatus | null;
  orderUuid: string | null;
  refundUuid: string | null;
  begin: string;
}): boolean {
  return (
    x.price > 0 &&
    (x.orderStatus === OrderStatus.Paid ||
      (x.orderStatus === OrderStatus.PaidByInvoice &&
        isBefore(new Date(), new Date(x.begin)))) &&
    x.orderUuid != null &&
    x.refundUuid == null
  );
}

function convertToReturnState(
  reservation: Pick<
    DenyDialogFieldsFragment,
    "price" | "paymentOrder" | "begin"
  >
): ReturnAllowedState {
  const { price, paymentOrder, begin } = reservation;
  const order = paymentOrder[0] ?? null;
  const paid = {
    price: toNumber(price) ?? 0,
    orderStatus: order?.status ?? null,
    orderUuid: order?.orderUuid ?? null,
    refundUuid: order?.refundUuid ?? null,
    begin: begin,
  };

  if (paid.refundUuid != null) {
    return "already-refunded";
  }
  if (paid.price === 0) {
    return "free";
  }

  if (isPriceReturnable(paid)) {
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

type DenyVariables = {
  handlingDetails: string;
  denyReasonPk: number | null;
};

type DialogContentProps = {
  initialHandlingDetails: string;
  onClose: () => void;
  onReject: (vars: DenyVariables) => void;
  disabled?: boolean;
  children?: JSX.Element;
};

function DialogContent({
  initialHandlingDetails,
  onClose,
  onReject,
  disabled,
  children,
}: Readonly<DialogContentProps>): JSX.Element {
  const { t } = useTranslation();

  const [handlingDetails, setHandlingDetails] = useState<string>(
    initialHandlingDetails
  );

  const [denyReasonPk, setDenyReason] = useState<number | null>(null);

  const { options, loading } = useDenyReasonOptions();

  const handleDeny = () => {
    onReject({ handlingDetails, denyReasonPk });
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
            id="denyReason"
            required
            clearable={false}
            texts={{
              placeholder: t("common.select"),
              label: t("RequestedReservation.DenyDialog.denyReason"),
              assistive: t("RequestedReservation.DenyDialog.denyReasonHelper"),
            }}
            options={options.map(convertOptionToHDS)}
            value={denyReasonPk ? denyReasonPk.toString() : undefined}
            onChange={(selected) => {
              const v = selected.find(() => true)?.value;
              setDenyReason(toNumber(v));
            }}
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
          {children}
        </Flex>
      </Dialog.Content>
      <ActionButtons>
        <Button
          disabled={!denyReasonPk || disabled}
          onClick={handleDeny}
          data-testid="deny-dialog__deny-button"
        >
          {t("RequestedReservation.DenyDialog.reject")}
        </Button>
        <Button
          variant={ButtonVariant.Secondary}
          onClick={onClose}
          data-testid="deny-dialog__cancel-button"
        >
          {t("common.prev")}
        </Button>
      </ActionButtons>
    </>
  );
}

function DenyDialogWrapper({
  children,
  title,
  onClose,
  focusAfterCloseRef,
}: Readonly<{
  children: JSX.Element;
  title?: string;
  onClose: () => void;
  focusAfterCloseRef?: React.RefObject<HTMLButtonElement>;
}>): JSX.Element {
  const { isOpen } = useModal();
  const { t } = useTranslation();

  return (
    <Dialog
      variant="danger"
      id="deny-dialog"
      aria-labelledby="deny-dialog__header"
      aria-live="polite"
      isOpen={isOpen}
      close={onClose}
      closeButtonLabelText={t("common.close")}
      focusAfterCloseRef={focusAfterCloseRef}
    >
      <Flex>
        <Dialog.Header
          id="deny-dialog__header"
          title={title ?? t("RequestedReservation.DenyDialog.title")}
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
  focusAfterCloseRef,
}: Readonly<{
  reservation: DenyDialogFieldsFragment;
  onClose: () => void;
  onReject: () => void;
  title?: string;
  focusAfterCloseRef?: React.RefObject<HTMLButtonElement>;
}>): JSX.Element {
  const { t } = useTranslation();
  const [denyReservationMutation] = useDenyReservationMutation();
  const [refundReservationMutation] = useRefundReservationMutation();

  const denyReservation = (input: ReservationDenyMutationInput) =>
    denyReservationMutation({ variables: { input } });

  const [returnState, setReturnState] = useState<ReturnAllowedState>(
    convertToReturnState(reservation)
  );

  const displayError = useDisplayError();

  const refundReservation = async (input: ReservationRefundMutationInput) => {
    try {
      await refundReservationMutation({ variables: { input } });
      successToast({
        text: t("RequestedReservation.DenyDialog.refund.mutationSuccess"),
      });
    } catch (err) {
      displayError(err);
    }
  };

  const handleDeny = async (vars: DenyVariables) => {
    const shouldRefund = returnState === "refund";
    const { handlingDetails, denyReasonPk } = vars;
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

      if (res.errors != null && res.errors.length > 0) {
        throw new ApolloError({
          graphQLErrors: res.errors,
        });
      }
      if (shouldRefund) {
        await refundReservation({ pk: reservation.pk });
      } else {
        successToast({
          text: t("RequestedReservation.DenyDialog.successNotify"),
        });
      }
      onReject();
    } catch (err) {
      displayError(err);
    }
  };

  return (
    <DenyDialogWrapper
      title={title}
      onClose={onClose}
      focusAfterCloseRef={focusAfterCloseRef}
    >
      <DialogContent
        initialHandlingDetails={reservation.handlingDetails ?? ""}
        onReject={handleDeny}
        onClose={onClose}
        disabled={returnState === "not-decided"}
      >
        <ReturnMoney
          state={returnState}
          onChange={setReturnState}
          price={toNumber(reservation.price) ?? 0}
        />
      </DialogContent>
    </DenyDialogWrapper>
  );
}

export function DenyDialogSeries({
  title,
  onClose,
  onReject,
  initialHandlingDetails,
  recurringReservation,
  focusAfterCloseRef,
}: Readonly<{
  title?: string;
  onClose: () => void;
  onReject: () => void;
  initialHandlingDetails: string;
  recurringReservation: { pk: number | null };
  focusAfterCloseRef?: React.RefObject<HTMLButtonElement>;
}>): JSX.Element {
  const { t } = useTranslation();
  const [denyMutation] = useDenyReservationSeriesMutation();
  const displayError = useDisplayError();

  const handleDeny = async (vars: DenyVariables) => {
    const { handlingDetails, denyReasonPk } = vars;
    const inputPk = recurringReservation.pk;
    try {
      if (denyReasonPk == null) {
        throw new Error("Deny PK undefined");
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

      if (res.errors != null && res.errors.length > 0) {
        throw new ApolloError({
          graphQLErrors: res.errors,
        });
      }
      successToast({
        text: t("RequestedReservation.DenyDialog.successNotify"),
      });
      onReject();
    } catch (err) {
      displayError(err);
    }
  };

  return (
    <DenyDialogWrapper
      title={title}
      onClose={onClose}
      focusAfterCloseRef={focusAfterCloseRef}
    >
      <DialogContent
        initialHandlingDetails={initialHandlingDetails}
        onReject={handleDeny}
        onClose={onClose}
      />
    </DenyDialogWrapper>
  );
}

export const DENY_DIALOG_FRAGMENT = gql`
  fragment DenyDialogFields on ReservationNode {
    id
    pk
    begin
    handlingDetails
    price
    paymentOrder {
      id
      orderUuid
      status
      refundUuid
    }
  }
`;

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
