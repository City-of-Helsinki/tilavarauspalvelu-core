import styled from "styled-components";
import { type TFunction, useTranslation } from "next-i18next";
import { getReservationApplicationFields } from "common/src/reservation-form/util";
import {
  Subheading,
  TwoColumnContainer,
} from "common/src/reservation-form/styles";
import { capitalize } from "@/modules/util";
import {
  CustomerTypeChoice,
  type ReservationNode,
  type ReservationQuery,
  ReserveeType,
} from "@/gql/gql-types";
import { type FieldName, containsField } from "common/src/metaFieldsHelpers";

type OptionType = {
  label: string;
  value: number;
};

export type OptionsRecord = Record<
  "purpose" | "ageGroup" | "homeCity",
  OptionType[]
>;
type NodeT = NonNullable<ReservationQuery["reservation"]>;

const ParagraphAlt = styled.div<{ $isWide?: boolean }>`
  ${({ $isWide }) => $isWide && "grid-column: 1 / -1;"}

  & > div:first-of-type {
    margin-bottom: var(--spacing-3-xs);
  }
`;

const PreviewLabel = styled.span`
  display: block;
  color: var(--color-black-70);
  padding-bottom: var(--spacing-2-xs);
`;

const PreviewValue = styled.span`
  display: block;
  font-size: var(--fontsize-body-l);
`;

function isNotEmpty(
  key: keyof ReservationNode,
  // TODO use proper fieldNames (string literals or enums), the Record is a hack around required fields
  reservation: Record<string, unknown>
): boolean {
  const rawValue = reservation[key];
  if (
    rawValue == null ||
    rawValue === "" ||
    rawValue === false ||
    rawValue === 0
  ) {
    return false;
  }
  return true;
}

function LabelValuePair({
  label,
  value,
  isWide,
  testIdKey,
}: {
  label: string;
  value: string;
  isWide?: boolean;
  testIdKey: keyof ReservationNode;
}) {
  return (
    <ParagraphAlt $isWide={isWide}>
      <PreviewLabel>{label}</PreviewLabel>
      <PreviewValue data-testid={`confirm_${testIdKey}`}>{value}</PreviewValue>
    </ParagraphAlt>
  );
}

// TODO move to common (and reuse in the hooks)
export function getApplicationFields({
  supportedFields,
  reservation,
}: {
  supportedFields: FieldName[];
  reservation: NodeT;
}) {
  const includesReserveeType = containsField(supportedFields, "reserveeType");
  if (includesReserveeType && reservation.reserveeType == null) {
    // eslint-disable-next-line no-console
    console.warn(
      "getApplicationFields: reserveeType is null, but it is required"
    );
  }
  const reserveeType = includesReserveeType
    ? (reservation.reserveeType ?? CustomerTypeChoice.Individual)
    : CustomerTypeChoice.Individual;
  const applicationFields = getReservationApplicationFields({
    supportedFields,
    reserveeType,
  });
  return applicationFields.filter(
    (key): key is keyof ReservationNode => key in reservation
  );
}

// TODO move to common (and reuse in the hooks)
export function getGeneralFields({
  supportedFields,
  reservation,
}: {
  supportedFields: FieldName[];
  reservation: NodeT;
}) {
  const generalFields = getReservationApplicationFields({
    supportedFields,
    reserveeType: "common",
  }).filter((n) => n !== "reserveeType");

  const filteredGeneralFields = generalFields.filter(
    (key): key is keyof ReservationNode => key in reservation
  );

  return filteredGeneralFields;
}

export function ApplicationFields({
  reservation,
  options,
  supportedFields,
}: {
  reservation: NodeT;
  options: OptionsRecord;
  supportedFields: FieldName[];
}): JSX.Element {
  const { t } = useTranslation();

  const filteredApplicationFields = getApplicationFields({
    supportedFields,
    reservation,
  }).filter((key) => isNotEmpty(key, reservation));

  const reserveeType = reservation.reserveeType ?? ReserveeType.Individual;
  const hasReserveeType =
    filteredApplicationFields.find((x) => x === "reserveeType") != null;

  return (
    <>
      <Subheading>{t("reservationCalendar:reserverInfo")}</Subheading>
      <TwoColumnContainer style={{ marginBottom: "var(--spacing-2-xl)" }}>
        <>
          {hasReserveeType && (
            <ParagraphAlt $isWide>
              <PreviewLabel>
                {t("reservationApplication:reserveeTypePrefix")}
              </PreviewLabel>
              <PreviewValue data-testid="reservation-confirm__reserveeType">
                {capitalize(
                  t(
                    `reservationApplication:reserveeTypes.labels.${reserveeType.toLowerCase()}`
                  )
                )}
              </PreviewValue>
            </ParagraphAlt>
          )}
          {filteredApplicationFields.map((key) => {
            const value = convertMaybeOptionValue(key, reservation, options, t);
            const typeNamespace =
              reserveeType?.toLocaleLowerCase() || "individual";
            const labelKey = `reservationApplication:label.${typeNamespace}.${key}`;
            const label = t(labelKey);
            return (
              <LabelValuePair
                key={key}
                label={label}
                value={value}
                testIdKey={key}
              />
            );
          })}
        </>
      </TwoColumnContainer>
    </>
  );
}

export function GeneralFields({
  supportedFields,
  reservation,
  options,
}: {
  supportedFields: FieldName[];
  reservation: NodeT;
  options: OptionsRecord;
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
      <Subheading>{t("reservationCalendar:reservationInfo")} </Subheading>
      <TwoColumnContainer style={{ marginBottom: "var(--spacing-2-xl)" }}>
        <>
          {filteredGeneralFields.map((key) => {
            const value = convertMaybeOptionValue(key, reservation, options, t);
            const isWide =
              ["name", "description", "freeOfChargeReason"].find(
                (x) => x === key
              ) != null;
            const label = t(`reservationApplication:label.common.${key}`);
            return (
              <LabelValuePair
                key={key}
                label={label}
                value={value}
                testIdKey={key}
                isWide={isWide}
              />
            );
          })}
        </>
      </TwoColumnContainer>
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
    if (typeof rawValue !== "object" || rawValue == null) {
      // eslint-disable-next-line no-console
      console.warn(
        "convertMaybeOptionValue: rawValue is not object: ",
        rawValue
      );
    }
    if (
      typeof rawValue === "object" &&
      rawValue != null &&
      "pk" in rawValue &&
      typeof rawValue.pk === "number"
    ) {
      return (
        options[optionsKey].find((option) => option.value === rawValue.pk)
          ?.label ?? ""
      );
    }
    // eslint-disable-next-line no-console
    console.warn(
      "convertMaybeOptionValue: rawValue is not pk, but object: ",
      rawValue
    );
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
