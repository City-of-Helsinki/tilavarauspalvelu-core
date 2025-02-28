import { useTranslation } from "react-i18next";
import {
  type ReservationQuery,
  useChangeReservationAccessCodeMutation,
  useRepairReservationAccessCodeMutation,
} from "@gql/gql-types";
import { errorToast, successToast } from "common/src/common/toast";
import { getValidationErrors } from "common/src/apolloUtils";
import {
  Button,
  ButtonSize,
  IconAlertCircleFill,
  IconRefresh,
} from "hds-react";
import { formatDate, formatTime } from "@/common/util";
import React, { useState } from "react";

import { Accordion, DataWrapper } from "@/spa/reservations/[id]/components";
import styled, { css } from "styled-components";
import { breakpoints } from "common";
import { ButtonContainer } from "common/styles/util";
import { ConfirmationDialog } from "common/src/components/ConfirmationDialog";

type ReservationType = NonNullable<ReservationQuery["reservation"]>;

const SummaryHorizontal = styled.div<{
  $isRecurring?: boolean;
}>`
  gap: var(--spacing-s);
  padding: var(--spacing-m);
  background: var(--color-black-5);
  justify-content: space-between;
  display: grid;

  ${({ $isRecurring }) =>
    $isRecurring
      ? css`
          grid-template-columns: repeat(2, 1fr);
          @media (min-width: ${breakpoints.l}) {
            grid-template-columns: repeat(6, 1fr);
          }
        `
      : css`
          grid-template-columns: repeat(3, 1fr);
          @media (min-width: ${breakpoints.s}) {
            grid-template-columns: repeat(4, 1fr);
          }
        `};
`;

const SingleButtonContainer = styled(ButtonContainer)<{
  $isRecurring?: boolean;
}>`
  ${({ $isRecurring }) =>
    $isRecurring
      ? css`
          @media (max-width: ${breakpoints.l}) {
            grid-column: 1 / span 2;
          }
          @media (min-width: ${breakpoints.l}) {
            width: auto;
          }
        `
      : css`
          @media (max-width: ${breakpoints.s}) {
            grid-column: 1 / span 3;
          }
          @media (min-width: ${breakpoints.s}) {
            width: auto;
          }
        `};

  justify-content: flex-end;
`;

export function ReservationKeylessEntry({
  reservation,
  onSuccess,
}: Readonly<{
  reservation: ReservationType;
  onSuccess: () => void;
}>) {
  const { t } = useTranslation();

  return (
    <Accordion
      id="reservation__access-type"
      heading={t("RequestedReservation.keylessEntry")}
      initiallyOpen={false}
    >
      <div>
        <SummaryHorizontal $isRecurring={!!reservation.recurringReservation}>
          <DataWrapper label={t("RequestedReservation.accessCodeLabel")}>
            {reservation.pindoraInfo?.accessCode ?? "-"}
          </DataWrapper>

          <DataWrapper label={t("RequestedReservation.accessCodeStatusLabel")}>
            {reservation.pindoraInfo?.accessCodeIsActive
              ? t("RequestedReservation.accessCodeStatusActive")
              : t("RequestedReservation.accessCodeStatusInactive")}
            {reservation.pindoraInfo?.accessCodeIsActive !==
              reservation.accessCodeShouldBeActive && <IconAlertCircleFill />}
          </DataWrapper>

          {reservation.recurringReservation && (
            <>
              <DataWrapper label={t("common.startingDate")}>
                {reservation.recurringReservation?.beginDate
                  ? formatDate(reservation.recurringReservation.beginDate)
                  : "-"}
              </DataWrapper>
              <DataWrapper label={t("common.endingDate")}>
                {reservation.recurringReservation?.endDate
                  ? formatDate(reservation.recurringReservation.endDate)
                  : "-"}
              </DataWrapper>
            </>
          )}

          <DataWrapper
            label={t("RequestedReservation.accessCodeValidityLabel")}
          >
            {reservation.pindoraInfo
              ? `${formatTime(reservation.pindoraInfo.accessCodeBeginsAt)}–${formatTime(reservation.pindoraInfo.accessCodeEndsAt)}`
              : "-"}
          </DataWrapper>

          <AccessCodeChangeRepairButton
            reservation={reservation}
            onSuccess={onSuccess}
          />
        </SummaryHorizontal>
      </div>
    </Accordion>
  );
}

function AccessCodeChangeRepairButton({
  reservation,
  onSuccess,
}: Readonly<{
  reservation: ReservationType;
  onSuccess: () => void;
}>) {
  const { t, i18n } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [changeAccessCodeMutation] = useChangeReservationAccessCodeMutation();
  const [repairAccessCodeMutation] = useRepairReservationAccessCodeMutation();

  const isAccessCodeBroken =
    reservation.pindoraInfo?.accessCodeIsActive !==
    reservation.accessCodeShouldBeActive;

  const handleExecuteMutation = async () => {
    const payload = { variables: { input: { pk: reservation.pk ?? 0 } } };

    try {
      if (isAccessCodeBroken) {
        await repairAccessCodeMutation(payload);
        successToast({
          text: t("RequestedReservation.accessCodeRepairedSuccess"),
        });
      } else {
        await changeAccessCodeMutation(payload);
        successToast({
          text: t("RequestedReservation.accessCodeChangedSuccess"),
        });
      }
      onSuccess(); // refetch reservation
    } catch (err: unknown) {
      handleExecuteMutationError(err);
    }

    setIsModalOpen(false);
  };

  const handleExecuteMutationError = (e: unknown) => {
    const validationErrors = getValidationErrors(e);
    if (validationErrors.length > 0) {
      const code = validationErrors[0].validation_code;
      if (code && i18n.exists(`errors.backendValidation.${code}`)) {
        errorToast({ text: t(`errors.backendValidation.${code}`) });
        return;
      }

      errorToast({
        text: validationErrors[0].message ?? validationErrors[0].code,
      });
      return;
    }

    if (e instanceof Error) {
      errorToast({ text: e.message });
    } else {
      errorToast({ text: t("errors.descriptive.genericError") });
    }
  };

  return (
    <SingleButtonContainer
      $justifyContent="center"
      $isRecurring={!!reservation.recurringReservation}
    >
      <Button
        size={ButtonSize.Small}
        onClick={() => {
          if (isAccessCodeBroken) {
            // if access code is broken, execute mutation immediately, no need to confirm
            handleExecuteMutation();
          } else {
            // Otherwise open confirmation dialog
            setIsModalOpen(true);
          }
        }}
        iconStart={<IconRefresh />}
      >
        {reservation.pindoraInfo?.accessCodeIsActive ===
        reservation.accessCodeShouldBeActive
          ? t("RequestedReservation.accessCodeChange")
          : t("RequestedReservation.accessCodeRepair")}
      </Button>
      <ConfirmationDialog
        isOpen={isModalOpen}
        onAccept={() => handleExecuteMutation()}
        onCancel={() => setIsModalOpen(false)}
        heading={
          reservation.recurringReservation
            ? t("RequestedReservation.accessCodeChangeMultiple")
            : t("RequestedReservation.accessCodeChange")
        }
        content={
          reservation.recurringReservation
            ? t("RequestedReservation.accessCodeChangeConfirmMultiple")
            : t("RequestedReservation.accessCodeChangeConfirm")
        }
        acceptLabel={t("RequestedReservation.accessCodeChange")}
        cancelLabel={t("RequestedReservation.cancel")}
        acceptIcon={<IconRefresh />}
      />
    </SingleButtonContainer>
  );
}
