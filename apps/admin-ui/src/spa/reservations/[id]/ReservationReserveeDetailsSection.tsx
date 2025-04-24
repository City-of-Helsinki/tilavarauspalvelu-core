import { useTranslation } from "react-i18next";
import { Accordion, DataWrapper } from "@/spa/reservations/[id]/components";
import { ApplicationDatas } from "@/styled";
import { trim } from "lodash-es";
import { BirthDate } from "@/component/BirthDate";
import React from "react";
import type { ReservationPageQuery } from "@gql/gql-types";

type ReservationType = NonNullable<ReservationPageQuery["reservation"]>;

export function ReservationReserveeDetailsSection({
  reservation,
}: Readonly<{
  reservation: ReservationType;
}>) {
  const { t } = useTranslation();

  return (
    <Accordion
      id="reservation__reservee-details"
      heading={t("RequestedReservation.reserveeDetails")}
    >
      <ApplicationDatas>
        <DataWrapper label={t("RequestedReservation.user")}>
          {trim(
            `${reservation?.user?.firstName || ""} ${
              reservation?.user?.lastName || ""
            }`
          ) || t("RequestedReservation.noName")}
        </DataWrapper>
        <DataWrapper label={t("RequestedReservation.email")}>
          {reservation?.user?.email}
        </DataWrapper>
        <DataWrapper label={t("RequestedReservation.birthDate")}>
          <BirthDate reservationPk={reservation?.pk ?? 0} />
        </DataWrapper>
        <DataWrapper label={t("RequestedReservation.addressStreet")}>
          <span>{reservation.reserveeAddressStreet || "-"}</span>
          <br />
          <span>
            {reservation.reserveeAddressZip || reservation.reserveeAddressCity
              ? `${reservation.reserveeAddressZip} ${reservation.reserveeAddressCity}`
              : ""}
          </span>
        </DataWrapper>
        <DataWrapper label={t("RequestedReservation.addressCity")}>
          {reservation.reserveeAddressCity || "-"}
        </DataWrapper>
      </ApplicationDatas>
    </Accordion>
  );
}
