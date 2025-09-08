import { camelCase, get, uniq } from "lodash-es";
import { type ReservationMetadataFieldNode, ReserveeType, MunicipalityChoice } from "../../gql/gql-types";
import { reservationApplicationFields } from "./types";
import { containsField } from "../metaFieldsHelpers";
import { type TFunction } from "next-i18next";
import { type OptionsRecord } from "../../types/common";

export function getReservationApplicationFields({
  supportedFields,
  reserveeType,
}: {
  supportedFields: Pick<ReservationMetadataFieldNode, "fieldName">[];
  reserveeType: ReserveeType | "common";
}): string[] {
  if (!supportedFields || supportedFields?.length === 0) {
    return [];
  }

  // TODO not good, refactor (remove get especially)
  const fields = uniq<string>(
    // TODO don't use get or string comparison, use a switch statement
    get(reservationApplicationFields, reserveeType.toLocaleLowerCase()).filter((field: string) =>
      containsField(supportedFields, camelCase(field))
    )
  );

  return fields.map(camelCase);
}

export function removeRefParam<Type>(params: Type & { ref: unknown }): Omit<Type, "ref"> {
  const { ref, ...rest } = params;
  return rest;
}

// Modify options to include static enums
// the options Record (and down stream components don't narrow types properly)
// so missing keys are not type errors but instead turn Select components -> TextFields
export function extendMetaFieldOptions(options: Omit<OptionsRecord, "municipalities">, t: TFunction): OptionsRecord {
  return {
    ...options,
    municipalities: Object.values(MunicipalityChoice).map((value) => ({
      label: t(`common:municipalities.${value.toUpperCase()}`),
      value: value,
    })),
  };
}
