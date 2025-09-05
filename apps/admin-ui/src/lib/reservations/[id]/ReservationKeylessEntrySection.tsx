import { useTranslation } from "next-i18next";
import {
  AccessType,
  type ReservationKeylessEntryFragment,
  useChangeReservationAccessCodeSeriesMutation,
  useChangeReservationAccessCodeSingleMutation,
  useRepairReservationAccessCodeSeriesMutation,
  useRepairReservationAccessCodeSingleMutation,
  UserPermissionChoice,
} from "@gql/gql-types";
import { successToast } from "common/src/components/toast";
import { useDisplayError } from "common/src/hooks";
import { Button, ButtonSize, IconAlertCircleFill, IconRefresh, Tooltip } from "hds-react";
import { dateToMinutes, formatDate, formatTimeRange, toValidDateObject } from "common/src/date-utils";
import React, { useState } from "react";
import { Accordion } from "@/styled";
import { DataWrapper } from "./DataWrapper";
import styled, { css } from "styled-components";
import { ButtonContainer, Flex, NoWrap } from "common/styled";
import { breakpoints } from "common/src/const";
import { ConfirmationDialog } from "common/src/components/ConfirmationDialog";
import { useCheckPermission } from "@/hooks";
import { gql } from "@apollo/client";

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
  reservation: ReservationKeylessEntryFragment;
  onSuccess: () => void;
}>) {
  const { t } = useTranslation();

  const isAccessCodeUsed =
    reservation.accessType === AccessType.AccessCode ||
    (reservation.reservationSeries?.usedAccessTypes &&
      reservation.reservationSeries.usedAccessTypes.includes(AccessType.AccessCode));
  if (!isAccessCodeUsed) {
    return null;
  }

  const isRecurring = !!reservation.reservationSeries;
  const isAccessCodeActiveIncorrect = !(isRecurring
    ? reservation?.reservationSeries?.isAccessCodeIsActiveCorrect
    : reservation.isAccessCodeIsActiveCorrect);

  return (
    <Accordion
      id="reservation__access-type"
      heading={t("reservation:keylessEntryHeader")}
      initiallyOpen={isAccessCodeActiveIncorrect}
    >
      <div>
        {isRecurring ? (
          <ReservationKeylessEntryRecurring reservation={reservation} onSuccess={onSuccess} />
        ) : (
          <ReservationKeylessEntrySingle reservation={reservation} onSuccess={onSuccess} />
        )}
      </div>
    </Accordion>
  );
}

function ReservationKeylessEntrySingle({
  reservation,
  onSuccess,
}: Readonly<{
  reservation: ReservationKeylessEntryFragment;
  onSuccess: () => void;
}>) {
  const { t } = useTranslation();
  const pindoraInfo = reservation.pindoraInfo;
  const pindoraAccessCodeBegins = toValidDateObject(pindoraInfo?.accessCodeBeginsAt ?? "");
  const pindoraAccessCodeEnds = toValidDateObject(pindoraInfo?.accessCodeEndsAt ?? "");

  return (
    <SummaryHorizontal>
      <DataWrapper label={t("accessType:type.ACCESS_CODE")}>{pindoraInfo?.accessCode ?? "-"}</DataWrapper>

      <Flex $alignItems="center" $gap="xs" $direction="row">
        <DataWrapper label={t("accessType:status.label")}>
          {pindoraInfo?.accessCodeIsActive ? t("accessType:status.active") : t("accessType:status.inactive")}
        </DataWrapper>
        {!reservation.isAccessCodeIsActiveCorrect && <IconAlertCircleFill color="var(--color-error)" />}
      </Flex>

      <DataWrapper label={t("accessType:validity.label")}>
        {reservation.pindoraInfo
          ? `${formatTimeRange(dateToMinutes(pindoraAccessCodeBegins), dateToMinutes(pindoraAccessCodeEnds))}`
          : "-"}
      </DataWrapper>

      <AccessCodeChangeRepairButton reservation={reservation} onSuccess={onSuccess} />
    </SummaryHorizontal>
  );
}

function ReservationKeylessEntryRecurring({
  reservation,
  onSuccess,
}: Readonly<{
  reservation: ReservationKeylessEntryFragment;
  onSuccess: () => void;
}>) {
  const { t } = useTranslation();

  if (!reservation.reservationSeries) return null;

  const pindoraInfo = reservation.reservationSeries.pindoraInfo;

  const { validityBeginsDate, validityEndsDate, validityBeginsTime, validityEndsTime } =
    getReservationSeriesAccessCodeValidity(pindoraInfo);

  return (
    <SummaryHorizontal $isRecurring>
      <DataWrapper label={t("accessType:type.ACCESS_CODE")}>{pindoraInfo?.accessCode ?? "-"}</DataWrapper>

      <Flex $alignItems="center" $gap="xs" $direction="row">
        <DataWrapper label={t("accessType:status.label")}>
          {pindoraInfo?.accessCodeIsActive ? t("accessType:status.active") : t("accessType:status.inactive")}
        </DataWrapper>
        {!reservation.reservationSeries.isAccessCodeIsActiveCorrect && (
          <IconAlertCircleFill color="var(--color-error)" />
        )}
      </Flex>

      <DataWrapper label={t("common:startingDate")}>
        {validityBeginsDate ? formatDate(toValidDateObject(validityBeginsDate)) : "-"}
      </DataWrapper>
      <DataWrapper label={t("common:endingDate")}>
        {validityEndsDate ? formatDate(toValidDateObject(validityEndsDate)) : "-"}
      </DataWrapper>

      <Flex $alignItems="center" $gap="xs" $direction="row">
        <DataWrapper label={t("accessType:validity.label")}>
          <NoWrap>
            {validityBeginsTime
              ? `${formatTimeRange(dateToMinutes(toValidDateObject(validityBeginsTime)), dateToMinutes(toValidDateObject(validityEndsTime ?? "")))}`
              : "-"}
          </NoWrap>
        </DataWrapper>
        {validityBeginsTime && (
          <Tooltip placement="top">
            {t("accessType:validity.fromNextReservation")} ({formatDate(toValidDateObject(validityBeginsTime))})
          </Tooltip>
        )}
      </Flex>

      <AccessCodeChangeRepairButton reservation={reservation} onSuccess={onSuccess} />
    </SummaryHorizontal>
  );
}

function getReservationSeriesAccessCodeValidity(
  pindoraInfo: NonNullable<ReservationKeylessEntryFragment["reservationSeries"]>["pindoraInfo"]
) {
  let validityBeginsDate = null,
    validityEndsDate = null,
    validityBeginsTime = null,
    validityEndsTime = null;

  const accessCodeValidity = pindoraInfo?.accessCodeValidity;
  if (pindoraInfo && accessCodeValidity && accessCodeValidity.length > 0) {
    // Get the DATE value from the first and last validity dates
    validityBeginsDate = accessCodeValidity[0]?.accessCodeBeginsAt;
    validityEndsDate = accessCodeValidity[accessCodeValidity.length - 1]?.accessCodeEndsAt;

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
      validityBeginsTime = accessCodeValidity[accessCodeValidity.length - 1]?.accessCodeBeginsAt;
      validityEndsTime = accessCodeValidity[accessCodeValidity.length - 1]?.accessCodeEndsAt;
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
  reservation: ReservationKeylessEntryFragment;
  onSuccess: () => void;
}>) {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [changeAccessCodeMutationSingle] = useChangeReservationAccessCodeSingleMutation();
  const [repairAccessCodeMutationSingle] = useRepairReservationAccessCodeSingleMutation();

  const [changeAccessCodeMutationSeries] = useChangeReservationAccessCodeSeriesMutation();
  const [repairAccessCodeMutationSeries] = useRepairReservationAccessCodeSeriesMutation();

  const { hasPermission } = useCheckPermission({
    units: [reservation.reservationUnit?.unit?.pk ?? 0],
    permission: UserPermissionChoice.CanManageReservations,
  });

  const displayError = useDisplayError();

  const handleExecuteMutation = async () => {
    const instance = reservation.reservationSeries || reservation;
    const payload = { variables: { input: { pk: instance.pk ?? 0 } } };

    const isAccessCodeIsActiveCorrect = reservation.reservationSeries
      ? reservation.reservationSeries.isAccessCodeIsActiveCorrect
      : reservation.isAccessCodeIsActiveCorrect;

    try {
      if (!isAccessCodeIsActiveCorrect) {
        const repairMutation = reservation.reservationSeries
          ? repairAccessCodeMutationSeries
          : repairAccessCodeMutationSingle;

        await repairMutation(payload);
        successToast({
          text: t("accessType:actions.repairSuccess"),
        });
      } else {
        const changeMutation = reservation.reservationSeries
          ? changeAccessCodeMutationSeries
          : changeAccessCodeMutationSingle;

        await changeMutation(payload);
        successToast({
          text: t("accessType:actions.changeSuccess"),
        });
      }
      onSuccess(); // refetch reservation
    } catch (err: unknown) {
      handleExecuteMutationError(err);
    }

    setIsModalOpen(false);
  };

  const handleExecuteMutationError = (e: unknown) => {
    displayError(e);
  };

  const endDate = reservation.reservationSeries?.endDate || reservation.endsAt;
  const isReservationEnded = new Date() > new Date(endDate);

  return (
    <SingleButtonContainer $justifyContent="center" $isRecurring={!!reservation.reservationSeries}>
      <Button
        size={ButtonSize.Small}
        data-testid="AccessCodeChangeRepairButton--open-dialog"
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
        {reservation.isAccessCodeIsActiveCorrect ? t("accessType:actions.change") : t("accessType:actions.repair")}
      </Button>
      <ConfirmationDialog
        isOpen={isModalOpen}
        onAccept={() => handleExecuteMutation()}
        onCancel={() => setIsModalOpen(false)}
        heading={t(`accessType:actions.change${reservation.reservationSeries ? "Multiple" : ""}`)}
        content={t(`accessType:actions.changeConfirmation${reservation.reservationSeries ? "Multiple" : ""}`)}
        acceptLabel={t("accessType:actions.change")}
        cancelLabel={t("common:cancel")}
        acceptIcon={<IconRefresh />}
        testId="AccessCodeChangeRepairButton"
      />
    </SingleButtonContainer>
  );
}

export const CHANGE_RESERVATION_ACCESS_CODE_SINGLE = gql`
  mutation ChangeReservationAccessCodeSingle($input: ReservationStaffChangeAccessCodeMutationInput!) {
    staffChangeReservationAccessCode(input: $input) {
      pk
      accessCodeIsActive
      accessCodeGeneratedAt
    }
  }
`;

export const REPAIR_RESERVATION_ACCESS_CODE_SINGLE = gql`
  mutation RepairReservationAccessCodeSingle($input: ReservationStaffRepairAccessCodeMutationInput!) {
    staffRepairReservationAccessCode(input: $input) {
      pk
      accessCodeIsActive
      accessCodeGeneratedAt
    }
  }
`;

export const CHANGE_RESERVATION_ACCESS_CODE_SERIES = gql`
  mutation ChangeReservationAccessCodeSeries($input: ReservationSeriesChangeAccessCodeMutationInput!) {
    changeReservationSeriesAccessCode(input: $input) {
      pk
      accessCodeIsActive
      accessCodeGeneratedAt
    }
  }
`;

export const REPAIR_RESERVATION_ACCESS_CODE_SERIES = gql`
  mutation RepairReservationAccessCodeSeries($input: ReservationSeriesRepairAccessCodeMutationInput!) {
    repairReservationSeriesAccessCode(input: $input) {
      pk
      accessCodeIsActive
      accessCodeGeneratedAt
    }
  }
`;

export const RESERVATION_KEYLESS_ENTRY_FRAGMENT = gql`
  fragment ReservationKeylessEntry on ReservationNode {
    id
    pk
    endsAt
    reservationUnit {
      id
      unit {
        id
        pk
      }
    }
    accessType
    isAccessCodeIsActiveCorrect
    pindoraInfo {
      accessCode
      accessCodeIsActive
      accessCodeBeginsAt
      accessCodeEndsAt
    }
    reservationSeries {
      id
      pk
      endDate
      isAccessCodeIsActiveCorrect
      usedAccessTypes
      pindoraInfo {
        accessCode
        accessCodeIsActive
        accessCodeValidity {
          accessCodeBeginsAt
          accessCodeEndsAt
        }
      }
    }
  }
`;
