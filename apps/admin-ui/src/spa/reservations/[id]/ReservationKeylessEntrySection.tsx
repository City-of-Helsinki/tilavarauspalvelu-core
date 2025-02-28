import React from "react";
import { useTranslation } from "react-i18next";
import {
  type ReservationQuery,
  useChangeReservationAccessCodeMutation,
  useRepairReservationAccessCodeMutation,
} from "@gql/gql-types";
import { formatTime } from "@/common/util";
import { Button, ButtonSize, IconAlertCircleFill } from "hds-react";
import { SummaryFourColumns } from "@/styles/util";
import { errorToast, successToast } from "common/src/common/toast";
import { getValidationErrors } from "common/src/apolloUtils";
import { Accordion, DataWrapper } from "@/spa/reservations/[id]/components";

type ReservationType = NonNullable<ReservationQuery["reservation"]>;

export function ReservationKeylessEntry({
  reservation,
  onSuccess,
}: Readonly<{
  reservation: ReservationType;
  onSuccess: () => void;
}>) {
  const { t, i18n } = useTranslation();

  const [changeAccessCodeMutation] = useChangeReservationAccessCodeMutation();
  const [repairAccessCodeMutation] = useRepairReservationAccessCodeMutation();

  const handleButton = async (reservationPk: number) => {
    const payload = { variables: { input: { pk: reservationPk } } };

    try {
      if (
        reservation.pindoraInfo?.accessCodeIsActive ===
        reservation.accessCodeShouldBeActive
      ) {
        await changeAccessCodeMutation(payload);
        successToast({
          text: t("RequestedReservation.accessCodeChangedSuccess"),
        });
      } else {
        await repairAccessCodeMutation(payload);
        successToast({
          text: t("RequestedReservation.accessCodeRepairedSuccess"),
        });
      }
      onSuccess(); // refetch reservation
    } catch (err: unknown) {
      handleError(err);
    }
  };

  const handleError = (e: unknown) => {
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
    <Accordion
      id="reservation__access-type"
      heading={t("RequestedReservation.keylessEntry")}
      initiallyOpen={false}
    >
      <div>
        <SummaryFourColumns>
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
          <DataWrapper
            label={t("RequestedReservation.accessCodeValidityLabel")}
          >
            {reservation.pindoraInfo
              ? `${formatTime(reservation.pindoraInfo.accessCodeBeginsAt)}–${formatTime(reservation.pindoraInfo.accessCodeEndsAt)}`
              : "-"}
          </DataWrapper>
          <Button
            size={ButtonSize.Small}
            onClick={() => handleButton(reservation.pk ?? 0)}
          >
            {reservation.pindoraInfo?.accessCodeIsActive ===
            reservation.accessCodeShouldBeActive
              ? t("RequestedReservation.accessCodeChange")
              : t("RequestedReservation.accessCodeRepair")}
          </Button>
        </SummaryFourColumns>
      </div>
    </Accordion>
  );
}
