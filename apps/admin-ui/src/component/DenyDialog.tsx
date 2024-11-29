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
} from "@gql/gql-types";
import { useModal } from "@/context/ModalContext";
import { Select } from "@/component/Select";
import { CenterSpinner, Flex } from "common/styles/util";
import { CustomDialogHeader } from "@/component/CustomDialogHeader";
import { useDenyReasonOptions } from "@/hooks";
import { filterNonNullable } from "common/src/helpers";
import { successToast, errorToast } from "common/src/common/toast";

const ActionButtons = styled(Dialog.ActionButtons)`
  justify-content: end;
`;

// TODO use a fragment
type ReservationType = Pick<
  NonNullable<ReservationQuery["reservation"]>,
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
  orderStatus: string | null;
  orderUuid: string | null;
  refundUuid: string | null;
}): boolean {
  return (
    x.price > 0 &&
    x.orderStatus === "PAID" &&
    x.orderUuid != null &&
    x.refundUuid == null
  );
}

function findPrice(reservations: Pick<ReservationType, "price">[]): number {
  const fp = reservations
    .map((x) => x.price)
    .map(Number)
    .find((x) => x > 0);
  return fp ?? 0;
}

function convertToReturnState(
  reservations: ReservationType[]
): ReturnAllowedState {
  const payed = reservations
    .map(({ price, paymentOrder }) => {
      const order = paymentOrder[0] ?? null;
      return {
        price: price ? Number(price) : 0,
        orderStatus: order?.status ?? null,
        orderUuid: order?.orderUuid ?? null,
        refundUuid: order?.refundUuid ?? null,
      };
    })
    .filter((x) => isPriceReturnable(x));

  // multiple reservations shouldn't be paid and are not tested
  if (payed.length > 1) {
    return "not-allowed";
  }

  if (payed.length === 0) {
    return "free";
  }
  return "not-decided";
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
  reservations: ReservationType[];
  onClose: () => void;
  onReject: () => void;
};

const DialogContent = ({
  reservations,
  onClose,
  onReject,
}: Props): JSX.Element => {
  const [denyReservationMutation] = useDenyReservationMutation();
  const [refundReservationMutation] = useRefundReservationMutation();

  const { t } = useTranslation();

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

  const [handlingDetails, setHandlingDetails] = useState<string>(
    reservations?.[0].handlingDetails ?? ""
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

      const pks = filterNonNullable(reservations.map((x) => x.pk));
      if (pks.length === 0) {
        throw new Error("No reservation PKs found");
      }
      setInProgress(true);
      const denyPromises = pks.map((pk) =>
        denyReservation({
          pk,
          denyReason: denyReasonPk,
          handlingDetails,
        })
      );

      const res = await Promise.all(denyPromises);

      const errors = filterNonNullable(res.map((x) => x.errors));

      if (errors.length !== 0) {
        // eslint-disable-next-line no-console
        console.error("Deny failed with: ", errors);
        errorToast({ text: t("RequestedReservation.DenyDialog.errorSaving") });
      } else {
        if (returnState === "refund") {
          const refundPromises = reservations.map((x) =>
            refundReservation({ pk: x.pk })
          );
          await Promise.all(refundPromises);
        } else {
          successToast({
            text: t("RequestedReservation.DenyDialog.successNotify"),
          });
        }
        onReject();
      }
    } catch (e) {
      errorToast({ text: t("RequestedReservation.DenyDialog.errorSaving") });
    } finally {
      setInProgress(false);
    }
  };

  if (loading || inProgress) {
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
            price={findPrice(reservations)}
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
};

function DenyDialog({
  reservations,
  onClose,
  onReject,
  title,
}: Props & { title?: string }): JSX.Element {
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
        <DialogContent
          reservations={reservations}
          onReject={onReject}
          onClose={onClose}
        />
      </Flex>
    </Dialog>
  );
}

export default DenyDialog;
