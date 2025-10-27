import { type TFunction, useTranslation } from "next-i18next";
import { MunicipalityChoice, type ReservationFormFieldsFragment } from "@/gql/gql-types";
import { AutoGrid, H4 } from "common/src/styled";
import { ParagraphAlt, PreviewLabel, PreviewValue } from "./styles";
import { LabelValuePair } from "./LabelValuePair";
import { type OptionsRecord } from "common";
import {
  getReservationFormGeneralFields,
  getReservationFormReserveeFields,
  formContainsField,
  type FormField,
} from "common/src/reservation-form/util";

type SummaryReserveeFieldsProps = {
  reservation: ReservationFormFieldsFragment;
  options: OptionsRecord;
};

/// Component to show the application fields in the reservation confirmation
/// This requires the reservation to be finalized (reserveeType is set)
export function SummaryReserveeFields({ reservation, options }: Readonly<SummaryReserveeFieldsProps>): JSX.Element {
  const { t } = useTranslation();
  const formType = reservation.reservationUnit.reservationForm;

  const includesReserveeType = formContainsField(formType, "reserveeType");

  const reserveeType = includesReserveeType ? reservation.reserveeType : null;

  const reserveeFields = getReservationFormReserveeFields({ reserveeType });
  const filteredReserveeFields = reserveeFields.filter((key) => isNotEmpty(key, reservation));

  const hasReserveeType = includesReserveeType && reservation.reserveeType != null;

  return (
    <>
      <H4 as="h2">{t("reservationCalendar:reserverInfo")}</H4>
      <AutoGrid>
        {hasReserveeType && reserveeType != null && (
          <ParagraphAlt $isWide>
            <PreviewLabel>{t("reservationApplication:reserveeTypePrefix")}</PreviewLabel>
            <PreviewValue data-testid="reservation__reserveeType">
              {t(`reservationApplication:reserveeTypes.labels.${reserveeType}`)}
            </PreviewValue>
          </ParagraphAlt>
        )}
        {filteredReserveeFields.map((key) => {
          const value = convertMaybeOptionValue(t, key, reservation, options);
          const typeNamespace = reserveeType?.toLocaleLowerCase() ?? "individual";
          const label = t(`reservationApplication:label.${typeNamespace}.${key}`);
          const testId = `reservation__${key}`;
          return <LabelValuePair key={key} label={label} value={value} testId={testId} />;
        })}
      </AutoGrid>
    </>
  );
}

const WIDE_FIELDS = new Set(["name", "description", "freeOfChargeReason"]);

export function SummaryGeneralFields({
  reservation,
  options,
}: {
  reservation: ReservationFormFieldsFragment;
  options: OptionsRecord;
}): JSX.Element | null {
  const { t } = useTranslation();

  const generalFields = getReservationFormGeneralFields();
  const filteredGeneralFields = generalFields.filter((key) => isNotEmpty(key, reservation));

  if (filteredGeneralFields.length === 0) {
    return null;
  }

  return (
    <>
      <H4 as="h2">{t("reservationCalendar:reservationInfo")}</H4>
      <AutoGrid>
        {filteredGeneralFields.map((key) => {
          const value = convertMaybeOptionValue(t, key, reservation, options);
          const isWide = WIDE_FIELDS.has(key);
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
  t: TFunction,
  key: FormField,
  reservation: Pick<ReservationFormFieldsFragment, FormField>,
  options: OptionsRecord
): string {
  const rawValue = reservation[key];
  const municipalityOptions = Object.values(MunicipalityChoice).map((value) => ({
    label: t(`common:municipalities.${value.toUpperCase()}`),
    value: value,
  }));
  const extendedOptions = {
    ...options,
    municipality: municipalityOptions,
  };
  type OptionsType = typeof extendedOptions;
  if (key in extendedOptions) {
    const optionsKey = key as keyof OptionsType;
    if (rawValue == null) {
      // eslint-disable-next-line no-console
      console.warn("convertMaybeOptionValue: rawValue is not object: ", rawValue);
    } else if (typeof rawValue === "object" && "pk" in rawValue && typeof rawValue.pk === "number") {
      return extendedOptions[optionsKey].find((option) => option.value === rawValue.pk)?.label ?? "";
    } else if (typeof rawValue === "string" && rawValue !== "") {
      return extendedOptions[optionsKey].find((option) => option.value === rawValue)?.label ?? "";
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

function isNotEmpty(key: keyof ReservationFormFieldsFragment, reservation: ReservationFormFieldsFragment): boolean {
  const rawValue = reservation[key];
  return !(rawValue == null || rawValue === "" || rawValue === false || rawValue === 0);
}
