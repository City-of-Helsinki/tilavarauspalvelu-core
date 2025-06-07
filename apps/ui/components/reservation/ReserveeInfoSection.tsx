import {
  CustomerTypeChoice,
  ReservationMetadataFieldNode,
  type ReservationPageQuery,
} from "@gql/gql-types";
import { useTranslation } from "next-i18next";
import { H4 } from "common/styled";
import React from "react";
import { containsField, containsNameField } from "common/src/metaFieldsHelpers";
import { LabelValuePair } from "@/components/reservation/LabelValuePair";

type NodeT = NonNullable<ReservationPageQuery["reservation"]>;

export function ReserveeInfoSection({
  reservation,
  supportedFields,
}: Readonly<{
  reservation: Pick<
    NodeT,
    | "reserveeType"
    | "reserveeOrganisationName"
    | "reserveeId"
    | "reserveeFirstName"
    | "reserveeLastName"
    | "reserveePhone"
    | "reserveeEmail"
  >;
  supportedFields: Pick<ReservationMetadataFieldNode, "fieldName">[];
}>) {
  const { t } = useTranslation();
  const showBusinessFields =
    CustomerTypeChoice.Business === reservation.reserveeType ||
    CustomerTypeChoice.Nonprofit === reservation.reserveeType;

  return (
    <div>
      <H4 as="h2">{t("reservationCalendar:reserverInfo")}</H4>
      {showBusinessFields ? (
        <ReserveeBusinessInfo
          reservation={reservation}
          supportedFields={supportedFields}
        />
      ) : (
        <ReserveePersonInfo
          reservation={reservation}
          supportedFields={supportedFields}
        />
      )}
    </div>
  );
}

function ReserveeBusinessInfo({
  reservation,
  supportedFields,
}: Readonly<{
  reservation: Pick<
    NodeT,
    | "reserveeOrganisationName"
    | "reserveeId"
    | "reserveeFirstName"
    | "reserveeLastName"
    | "reserveePhone"
    | "reserveeEmail"
  >;
  supportedFields: Pick<ReservationMetadataFieldNode, "fieldName">[];
}>): JSX.Element {
  const { t } = useTranslation();
  const arr = [];
  if (containsField(supportedFields, "reserveeOrganisationName")) {
    arr.push({
      key: "organisationName",
      label: t("reservations:organisationName"),
      value: reservation.reserveeOrganisationName || "-",
      testId: "reservation__reservee-organisation-name",
    });
  }
  if (containsField(supportedFields, "reserveeId")) {
    arr.push({
      key: "id",
      label: t("reservations:reserveeId"),
      value: reservation.reserveeId || "-",
      testId: "reservation__reservee-id",
    });
  }
  if (containsNameField(supportedFields)) {
    arr.push({
      key: "name",
      label: t("reservations:contactName"),
      value: formatReserveeName(reservation),
      testId: "reservation__reservee-name",
    });
  }
  if (containsField(supportedFields, "reserveePhone")) {
    arr.push({
      key: "phone",
      label: t("reservations:contactPhone"),
      value: reservation.reserveePhone ?? "-",
      testId: "reservation__reservee-phone",
    });
  }
  if (containsField(supportedFields, "reserveeEmail")) {
    arr.push({
      key: "email",
      label: t("reservations:contactEmail"),
      value: reservation.reserveeEmail ?? "-",
      testId: "reservation__reservee-email",
    });
  }
  return (
    <>
      {arr.map(({ key, ...rest }) => (
        <LabelValuePair key={key} {...rest} />
      ))}
    </>
  );
}

function ReserveePersonInfo({
  reservation,
  supportedFields,
}: Readonly<{
  reservation: Pick<
    NodeT,
    "reserveeEmail" | "reserveeFirstName" | "reserveeLastName" | "reserveePhone"
  >;
  supportedFields: Pick<ReservationMetadataFieldNode, "fieldName">[];
}>) {
  const { t } = useTranslation();
  const arr = [];
  if (containsNameField(supportedFields)) {
    arr.push({
      key: "name",
      value: formatReserveeName(reservation),
    });
  }
  if (containsField(supportedFields, "reserveePhone")) {
    arr.push({
      key: "phone",
      value: reservation.reserveePhone ?? "-",
    });
  }
  if (containsField(supportedFields, "reserveeEmail")) {
    arr.push({
      key: "email",
      value: reservation.reserveeEmail ?? "-",
    });
  }
  return (
    <>
      {arr
        .map(({ key, value }) => ({
          key,
          label: t(`common:${key}`),
          value,
          testId: `reservation__reservee-${key}`,
        }))
        .map(({ key, ...rest }) => (
          <LabelValuePair key={key} {...rest} />
        ))}
    </>
  );
}

export function formatReserveeName(
  reservation: Pick<NodeT, "reserveeFirstName" | "reserveeLastName">
): string {
  return `${reservation.reserveeFirstName || ""} ${
    reservation.reserveeLastName || ""
  }`.trim();
}
