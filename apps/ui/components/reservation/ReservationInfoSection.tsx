import { gql } from "@apollo/client";
import { useTranslation } from "next-i18next";
import { type LocalizationLanguages } from "common/src/urlBuilder";
import {
  type ReservationMetadataFieldNode,
  type ReservationInfoFragment,
} from "@gql/gql-types";
import { containsField } from "common/src/metaFieldsHelpers";
import { LabelValuePair } from "./LabelValuePair";
import {
  convertLanguageCode,
  getTranslationSafe,
} from "common/src/common/util";
import { H4 } from "common/styled";

export function ReservationInfoSection({
  reservation,
  supportedFields,
}: Readonly<{
  reservation: ReservationInfoFragment;
  supportedFields: Pick<ReservationMetadataFieldNode, "fieldName">[];
}>) {
  const { t, i18n } = useTranslation();
  const POSSIBLE_FIELDS = [
    "purpose",
    "numPersons",
    "ageGroup",
    "description",
  ] as const;
  const fields = POSSIBLE_FIELDS.filter((field) =>
    containsField(supportedFields, field)
  );

  if (fields.length === 0) {
    return null;
  }
  const lang = convertLanguageCode(i18n.language);

  return (
    <div>
      <H4 as="h2">{t("reservationApplication:applicationInfo")}</H4>
      {fields
        .map((field) => ({
          key: field,
          label: t(`reservationApplication:label.common.${field}`),
          value: getReservationValue(reservation, field, lang) ?? "-",
          testId: `reservation__${field}`,
        }))
        .map(({ key, ...rest }) => (
          <LabelValuePair key={key} {...rest} />
        ))}
    </div>
  );
}

function getReservationValue(
  reservation: ReservationInfoFragment,
  key: "purpose" | "numPersons" | "ageGroup" | "description",
  lang: LocalizationLanguages
): string | number | null {
  if (key === "ageGroup") {
    const { minimum, maximum } = reservation.ageGroup || {};
    return minimum && maximum ? `${minimum} - ${maximum}` : null;
  } else if (key === "purpose") {
    if (reservation.purpose != null) {
      return getTranslationSafe(reservation.purpose, "name", lang);
    }
    return null;
  } else if (key in reservation) {
    const val = reservation[key as keyof ReservationInfoFragment];
    if (typeof val === "string" || typeof val === "number") {
      return val;
    }
  }
  return null;
}

export const RESERVATION_INFO_FRAGMENT = gql`
  fragment ReservationInfo on ReservationNode {
    id
    description
    purpose {
      id
      pk
      nameFi
      nameEn
      nameSv
    }
    ageGroup {
      id
      pk
      minimum
      maximum
    }
    numPersons
  }
`;
