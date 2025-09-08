import { type TFunction, useTranslation } from "next-i18next";
import { type ReservationNode, ReserveeType } from "@/gql/gql-types";
import { containsField, type FieldName } from "common/src/modules/metaFieldsHelpers";
import { AutoGrid, H4 } from "common/src/styled";
import { ParagraphAlt, PreviewLabel, PreviewValue } from "./styles";
import { LabelValuePair } from "./LabelValuePair";
import { type OptionsRecord } from "common";
import {
  extendMetaFieldOptions,
  getReservationFormGeneralFields,
  getReservationFormReserveeFields,
} from "common/src/reservation-form/util";
import { type ReservationFormFieldsFragment } from "common/gql/gql-types";

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
export function SummaryReserveeFields({
  reservation,
  options,
  supportedFields,
}: {
  reservation: ReservationFormFieldsFragment;
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

  const reserveeFields = getReservationFormReserveeFields({ reserveeType });
  const filteredReserveeFields = reserveeFields.filter((key) => isNotEmpty(key, reservation));

  const hasReserveeType = includesReserveeType && reservation.reserveeType != null;

  return (
    <>
      <H4 as="h2">{t("reservationCalendar:reserverInfo")}</H4>
      <AutoGrid>
        {hasReserveeType && (
          <ParagraphAlt $isWide>
            <PreviewLabel>{t("reservationApplication:reserveeTypePrefix")}</PreviewLabel>
            <PreviewValue data-testid="reservation__reserveeType">
              {t(`reservationApplication:reserveeTypes.labels.${reserveeType}`)}
            </PreviewValue>
          </ParagraphAlt>
        )}
        {filteredReserveeFields.map((key) => {
          const value = convertMaybeOptionValue(key, reservation, extendMetaFieldOptions(options, t), t);
          const typeNamespace = reserveeType?.toLocaleLowerCase() || "individual";
          const labelKey = `reservationApplication:label.${typeNamespace}.${key}`;
          const label = t(labelKey);
          const testId = `reservation__${key}`;
          return <LabelValuePair key={key} label={label} value={value} testId={testId} />;
        })}
      </AutoGrid>
    </>
  );
}

const WIDE_FIELDS = ["name", "description", "freeOfChargeReason"];

export function SummaryGeneralFields({
  reservation,
  options,
}: {
  reservation: ReservationFormFieldsFragment;
  options: Omit<OptionsRecord, "municipality">;
}): JSX.Element | null {
  const { t } = useTranslation();

  const generalFields = getReservationFormGeneralFields();
  const filteredGeneralFields = generalFields
    .filter((key) => isNotEmpty(key, reservation))
    .filter((key) => key !== "reserveeType");

  if (filteredGeneralFields.length === 0) {
    return null;
  }

  return (
    <>
      <H4 as="h2">{t("reservationCalendar:reservationInfo")}</H4>
      <AutoGrid>
        {filteredGeneralFields.map((key) => {
          const value = convertMaybeOptionValue(key, reservation, extendMetaFieldOptions(options, t), t);
          const isWide = WIDE_FIELDS.find((x) => x === key) != null;
          const label = t(`reservationApplication:label.common.${key}`);
          const testId = `reservation__${key}`;
          return <LabelValuePair key={key} label={label} value={value} testId={testId} isWide={isWide} />;
        })}
      </AutoGrid>
    </>
  );
}

/// Type safe conversion from key value maps for the metadata fields
/// TODO this is pretty awful (dynamic type checking) but requires refactoring metafields more
function convertMaybeOptionValue(
  key: keyof ReservationFormFieldsFragment,
  // TODO use proper fieldNames (string literals or enums), the Record is a hack around required fields
  reservation: ReservationFormFieldsFragment,
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
