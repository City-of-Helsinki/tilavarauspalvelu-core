import { useTranslation } from "react-i18next";
import {
  AccessType,
  type ReservationQuery,
  useChangeReservationAccessCodeMutation,
  useRepairReservationAccessCodeMutation,
  UserPermissionChoice,
} from "@gql/gql-types";
import { errorToast, successToast } from "common/src/common/toast";
import { getValidationErrors } from "common/src/apolloUtils";
import {
  Button,
  ButtonSize,
  IconAlertCircleFill,
  IconRefresh,
  Tooltip,
} from "hds-react";
import { formatDate, formatTime } from "@/common/util";
import React, { useState } from "react";

import { Accordion, DataWrapper } from "@/spa/reservations/[id]/components";
import styled, { css } from "styled-components";
import { breakpoints } from "common";
import { ButtonContainer, Flex, NoWrap } from "common/styles/util";
import { ConfirmationDialog } from "common/src/components/ConfirmationDialog";
import { useCheckPermission } from "@/hooks";

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

  const isAccessCodeUsed =
    reservation.accessType === AccessType.AccessCode ||
    (reservation.recurringReservation?.usedAccessTypes &&
      reservation.recurringReservation.usedAccessTypes.includes(
        AccessType.AccessCode
      ));
  if (!isAccessCodeUsed) {
    return null;
  }

  const isRecurring = !!reservation.recurringReservation;
  const isAccessCodeActiveIncorrect = !(isRecurring
    ? reservation?.recurringReservation?.isAccessCodeIsActiveCorrect
    : reservation.isAccessCodeIsActiveCorrect);

  return (
    <Accordion
      id="reservation__access-type"
      heading={t("RequestedReservation.keylessEntry")}
      initiallyOpen={isAccessCodeActiveIncorrect}
    >
      <div>
        {isRecurring ? (
          <ReservationKeylessEntryRecurring
            reservation={reservation}
            onSuccess={onSuccess}
          />
        ) : (
          <ReservationKeylessEntrySingle
            reservation={reservation}
            onSuccess={onSuccess}
          />
        )}
      </div>
    </Accordion>
  );
}

function ReservationKeylessEntrySingle({
  reservation,
  onSuccess,
}: Readonly<{
  reservation: ReservationType;
  onSuccess: () => void;
}>) {
  const { t } = useTranslation();

  const pindoraInfo = reservation.pindoraInfo;

  return (
    <SummaryHorizontal>
      <DataWrapper label={t("RequestedReservation.accessCodeLabel")}>
        {pindoraInfo?.accessCode ?? "-"}
      </DataWrapper>

      <Flex $alignItems="center" $gap="xs" $direction="row">
        <DataWrapper label={t("RequestedReservation.accessCodeStatusLabel")}>
          {pindoraInfo?.accessCodeIsActive
            ? t("RequestedReservation.accessCodeStatusActive")
            : t("RequestedReservation.accessCodeStatusInactive")}
        </DataWrapper>
        {!reservation.isAccessCodeIsActiveCorrect && (
          <IconAlertCircleFill color="var(--color-error)" />
        )}
      </Flex>

      <DataWrapper label={t("RequestedReservation.accessCodeValidityLabel")}>
        {reservation.pindoraInfo
          ? `${formatTime(pindoraInfo?.accessCodeBeginsAt)}–${formatTime(pindoraInfo?.accessCodeEndsAt)}`
          : "-"}
      </DataWrapper>

      <AccessCodeChangeRepairButton
        reservation={reservation}
        onSuccess={onSuccess}
      />
    </SummaryHorizontal>
  );
}

function ReservationKeylessEntryRecurring({
  reservation,
  onSuccess,
}: Readonly<{
  reservation: ReservationType;
  onSuccess: () => void;
}>) {
  const { t } = useTranslation();

  if (!reservation.recurringReservation) return null;

  const pindoraInfo = reservation.recurringReservation.pindoraInfo;

  const {
    validityBeginsDate,
    validityEndsDate,
    validityBeginsTime,
    validityEndsTime,
  } = getRecurringReservationAccessCodeValidity(pindoraInfo);

  return (
    <SummaryHorizontal $isRecurring>
      <DataWrapper label={t("RequestedReservation.accessCodeLabel")}>
        {pindoraInfo?.accessCode ?? "-"}
      </DataWrapper>

      <Flex $alignItems="center" $gap="xs" $direction="row">
        <DataWrapper label={t("RequestedReservation.accessCodeStatusLabel")}>
          {pindoraInfo?.accessCodeIsActive
            ? t("RequestedReservation.accessCodeStatusActive")
            : t("RequestedReservation.accessCodeStatusInactive")}
        </DataWrapper>
        {!reservation.recurringReservation.isAccessCodeIsActiveCorrect && (
          <IconAlertCircleFill color="var(--color-error)" />
        )}
      </Flex>

      <DataWrapper label={t("common.startingDate")}>
        {formatDate(validityBeginsDate) || "-"}
      </DataWrapper>
      <DataWrapper label={t("common.endingDate")}>
        {formatDate(validityEndsDate) || "-"}
      </DataWrapper>

      <Flex $alignItems="center" $gap="xs" $direction="row">
        <DataWrapper label={t("RequestedReservation.accessCodeValidityLabel")}>
          <NoWrap>
            {validityBeginsTime
              ? `${formatTime(validityBeginsTime)}–${formatTime(validityEndsTime)}`
              : "-"}
          </NoWrap>
        </DataWrapper>
        {validityBeginsTime && (
          <Tooltip placement="top">
            {t("RequestedReservation.accessCodeValidityFromNextReservation")} (
            {formatDate(validityBeginsTime)})
          </Tooltip>
        )}
      </Flex>

      <AccessCodeChangeRepairButton
        reservation={reservation}
        onSuccess={onSuccess}
      />
    </SummaryHorizontal>
  );
}

function getRecurringReservationAccessCodeValidity(
  pindoraInfo:
    | {
        accessCode: string;
        accessCodeIsActive: boolean;
        accessCodeValidity: Array<{
          accessCodeBeginsAt: string;
          accessCodeEndsAt: string;
        }>;
      }
    | null
    | undefined
) {
  let validityBeginsDate = null,
    validityEndsDate = null,
    validityBeginsTime = null,
    validityEndsTime = null;

  const accessCodeValidity = pindoraInfo?.accessCodeValidity;
  if (pindoraInfo && accessCodeValidity && accessCodeValidity.length > 0) {
    // Get the DATE value from the first and last validity dates
    validityBeginsDate = accessCodeValidity[0]?.accessCodeBeginsAt;
    validityEndsDate =
      accessCodeValidity[accessCodeValidity.length - 1]?.accessCodeEndsAt;

    // Get the TIME value from the next validity date
    const now = new Date();
    for (const validity of accessCodeValidity) {
      if (now < new Date(validity.accessCodeEndsAt)) {
        validityBeginsTime = validity.accessCodeBeginsAt;
        validityEndsTime = validity.accessCodeEndsAt;
        break;
      }
    }
    if (!validityBeginsTime) {
      // If no next validity date found, use the last one
      validityBeginsTime =
        accessCodeValidity[accessCodeValidity.length - 1]?.accessCodeBeginsAt;
      validityEndsTime =
        accessCodeValidity[accessCodeValidity.length - 1]?.accessCodeEndsAt;
    }
  }

  return {
    validityBeginsDate,
    validityEndsDate,
    validityBeginsTime,
    validityEndsTime,
  };
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

  const { hasPermission } = useCheckPermission({
    units: [reservation.reservationUnits?.[0]?.unit?.pk ?? 0],
    permission: UserPermissionChoice.CanManageReservations,
  });

  const handleExecuteMutation = async () => {
    const payload = { variables: { input: { pk: reservation.pk ?? 0 } } };

    try {
      if (!reservation.isAccessCodeIsActiveCorrect) {
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
      const code = validationErrors[0]?.validation_code;
      if (code && i18n.exists(`errors.backendValidation.${code}`)) {
        errorToast({ text: t(`errors.backendValidation.${code}`) });
        return;
      }

      if (validationErrors[0]?.message || validationErrors[0]?.code) {
        errorToast({
          text: validationErrors[0]?.message ?? validationErrors[0]?.code,
        });
        return;
      }
    }

    if (e instanceof Error) {
      errorToast({ text: e.message });
    } else {
      errorToast({ text: t("errors.descriptive.genericError") });
    }
  };

  const isReservationEnded =
    !reservation.recurringReservation && new Date() > new Date(reservation.end);

  return (
    <SingleButtonContainer
      $justifyContent="center"
      $isRecurring={!!reservation.recurringReservation}
    >
      <Button
        size={ButtonSize.Small}
        onClick={() => {
          if (!reservation.isAccessCodeIsActiveCorrect) {
            // if access code is broken, execute mutation immediately, no need to confirm
            handleExecuteMutation();
          } else {
            // Otherwise open confirmation dialog
            setIsModalOpen(true);
          }
        }}
        iconStart={<IconRefresh />}
        disabled={!hasPermission || isReservationEnded}
      >
        {reservation.isAccessCodeIsActiveCorrect
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
