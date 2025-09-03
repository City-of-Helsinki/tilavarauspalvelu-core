import styled from "styled-components";
import { type TFunction, useTranslation } from "next-i18next";
import { type ReservationNode, ReserveeType } from "@/gql/gql-types";
import { containsField, type FieldName } from "common/src/modules/metaFieldsHelpers";
import { AutoGrid, H4 } from "common/src/styled";
import { type ReservationMetaFieldsFragment } from "common/gql/gql-types";
import { ParagraphAlt, PreviewLabel, PreviewValue } from "./styles";
import { LabelValuePair } from "./LabelValuePair";
import { extendMetaFieldOptions } from "common/src/reservation-form/MetaFields";
import { type OptionsRecord } from "common";
import { getApplicationFields, getGeneralFields } from "common/src/hooks/useApplicationFields";

const Container = styled(AutoGrid)`
  margin-bottom: var(--spacing-2-xl);
`;

function isNotEmpty(
  key: keyof ReservationNode,
  // TODO use proper fieldNames (string literals or enums), the Record is a hack around required fields
  reservation: Record<string, unknown>
): boolean {
  const rawValue = reservation[key];
  return !(rawValue == null || rawValue === "" || rawValue === false || rawValue === 0);
}

/// Component to show the application fields in the reservation confirmation
/// This requires the reservation to be finalized (reserveeType is set)
export function ApplicationFields({
  reservation,
  options,
  supportedFields,
}: {
  reservation: ReservationMetaFieldsFragment;
  options: Omit<OptionsRecord, "municipality">;
  supportedFields: FieldName[];
}): JSX.Element {
  const { t } = useTranslation();

  const includesReserveeType = containsField(supportedFields, "reserveeType");

  if (includesReserveeType && reservation.reserveeType == null) {
    // eslint-disable-next-line no-console
    console.warn("getApplicationFields: reserveeType is null, but it is required");
  }
  const reserveeType = includesReserveeType
    ? (reservation.reserveeType ?? ReserveeType.Individual)
    : ReserveeType.Individual;

  const filteredApplicationFields = getApplicationFields({
    supportedFields,
    reservation,
    reserveeType,
  })
    .filter((key): key is keyof ReservationNode => key !== "reserveeIsUnregisteredAssociation")
    .filter((key) => isNotEmpty(key, reservation));

  const hasReserveeType = filteredApplicationFields.find((x) => x === "reserveeType") != null;

  return (
    <>
      <H4 as="h2">{t("reservationCalendar:reserverInfo")}</H4>
      <Container>
        <>
          {hasReserveeType && (
            <ParagraphAlt $isWide>
              <PreviewLabel>{t("reservationApplication:reserveeTypePrefix")}</PreviewLabel>
              <PreviewValue data-testid="reservation__reserveeType">
                {t(`reservationApplication:reserveeTypes.labels.${reserveeType}`)}
              </PreviewValue>
            </ParagraphAlt>
          )}
          {filteredApplicationFields.map((key) => {
            const value = convertMaybeOptionValue(key, reservation, extendMetaFieldOptions(options, t), t);
            const typeNamespace = reserveeType?.toLocaleLowerCase() || "individual";
            const labelKey = `reservationApplication:label.${typeNamespace}.${key}`;
            const label = t(labelKey);
            const testId = `reservation__${key}`;
            return <LabelValuePair key={key} label={label} value={value} testId={testId} />;
          })}
        </>
      </Container>
    </>
  );
}

export function GeneralFields({
  supportedFields,
  reservation,
  options,
}: {
  supportedFields: FieldName[];
  options: Omit<OptionsRecord, "municipality">;
  reservation: ReservationMetaFieldsFragment;
}): JSX.Element | null {
  const { t } = useTranslation();

  const filteredGeneralFields = getGeneralFields({
    supportedFields,
    reservation,
  }).filter((key) => isNotEmpty(key, reservation));

  if (filteredGeneralFields.length === 0) {
    return null;
  }

  return (
    <>
      <H4 as="h2">{t("reservationCalendar:reservationInfo")}</H4>
      <Container>
        <>
          {filteredGeneralFields.map((key) => {
            const value = convertMaybeOptionValue(key, reservation, extendMetaFieldOptions(options, t), t);
            const isWide = ["name", "description", "freeOfChargeReason"].find((x) => x === key) != null;
            const label = t(`reservationApplication:label.common.${key}`);
            const testId = `reservation__${key}`;
            return <LabelValuePair key={key} label={label} value={value} testId={testId} isWide={isWide} />;
          })}
        </>
      </Container>
    </>
  );
}

/// Type safe conversion from key value maps for the metadata fields
/// TODO this is pretty awful (dynamic type checking) but requires refactoring metafields more
function convertMaybeOptionValue(
  key: keyof ReservationNode,
  // TODO use proper fieldNames (string literals or enums), the Record is a hack around required fields
  reservation: Record<string, unknown>,
  options: OptionsRecord,
  t: TFunction
): string {
  const rawValue = reservation[key];
  if (key in options) {
    const optionsKey = key as keyof OptionsRecord;
    if (rawValue == null) {
      // eslint-disable-next-line no-console
      console.warn("convertMaybeOptionValue: rawValue is not object: ", rawValue);
    } else if (typeof rawValue === "object" && "pk" in rawValue && typeof rawValue.pk === "number") {
      return options[optionsKey].find((option) => option.value === rawValue.pk)?.label ?? "";
    } else if (typeof rawValue === "string" && rawValue !== "") {
      return options[optionsKey].find((option) => option.value === rawValue)?.label ?? "";
    }
    // eslint-disable-next-line no-console
    console.warn("convertMaybeOptionValue: rawValue is not pk, but object: ", rawValue);
    return "unknown";
  }
  if (typeof rawValue === "boolean") {
    return t(`common:${String(rawValue)}`);
  }
  if (typeof rawValue === "string") {
    return rawValue;
  }
  if (typeof rawValue === "number") {
    return String(rawValue);
  }
  return "unknown";
}
