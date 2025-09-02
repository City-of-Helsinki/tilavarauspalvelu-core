import { MunicipalityChoice, ReservationKind, type OptionsQuery, type ReservationUnitTypeNode } from "@/gql/gql-types";
import { createNodeId } from "common/src/helpers";
import { type DocumentNode } from "graphql";
import { translateOption } from "@/modules/search";
import { type OptionsListT } from "common/src/modules/search";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ICreateGraphQLMock {}

export interface CreateGraphQLMockProps extends ICreateGraphQLMock {
  noUser?: boolean;
  isSearchError?: boolean;
  dateOverride?: Date | null;
  reservationKind?: ReservationKind;
}

export type CreateGraphQLMocksReturn = Array<{
  request: {
    query: DocumentNode;
    variables?: Record<string, unknown>;
  };
  variableMatcher?: (variables: unknown) => true;
  result: {
    data: Record<string, unknown>;
  };
  error?: Error | undefined;
}>;

export function createOptionMock(
  props: {
    nCount?: number;
  } = {}
): OptionsListT {
  const opts = createOptionQueryMock(props);
  const lang = "fi" as const;
  type FT = Parameters<typeof translateOption>[0];
  const translate = (val: FT) => translateOption(val, lang);

  return {
    units: opts.allUnits.map(translate),
    equipments: opts.allEquipments.map(translate),
    purposes: opts.allPurposes.map(translate),
    reservationUnitTypes: opts.allReservationUnitTypes.map(translate),
    ageGroups: opts.allAgeGroups.map((ag) => ({
      value: ag.pk ?? 0,
      label: `${ag.minimum ?? ""}-${ag.maximum ?? ""}`,
    })),
    municipalities: Object.values(MunicipalityChoice).map((value) => ({
      label: value as string,
      value: value,
    })),
  };
}

export function createOptionQueryMock({
  nCount = 5,
}: {
  nCount?: number;
} = {}): OptionsQuery {
  const pks = Array.from({ length: nCount }, (_, i) => i + 1);
  const reservationPurposeOptions = pks.map((pk) => ({
    value: pk,
    label: `Reservation Purpose ${pk}`,
  }));
  const reservationUnitTypes = pks.map((pk) =>
    createMockReservationUnitType({
      name: `Reservation Unit Type ${pk}`,
      pk,
    })
  );
  const ageGroupOptions = pks.map((v) => ({
    pk: v,
    maximum: v,
    minimum: v,
  }));

  const ageGroups = ageGroupOptions.map((val) => ({
    ...val,
    id: createNodeId("ReservationPurposeNode", val.pk),
  }));

  const reservationPurposes = reservationPurposeOptions.map(({ value, label }) => ({
    id: createNodeId("ReservationPurposeNode", value),
    pk: value,
    nameFi: label,
    nameSv: label,
    nameEn: label,
  }));
  const units = Array.from({ length: nCount }, (_, i) => ({
    id: createNodeId("UnitNode", i + 1),
    pk: i + 1,
    nameFi: `Unit ${i + 1} FI`,
    nameSv: `Unit ${i + 1} SV`,
    nameEn: `Unit ${i + 1} EN`,
  }));
  const equipments = Array.from({ length: nCount }, (_, i) => ({
    id: createNodeId("EquipmentNode", i + 1),
    pk: i + 1,
    nameFi: `Equipment ${i + 1} FI`,
    nameSv: `Equipment ${i + 1} SV`,
    nameEn: `Equipment ${i + 1} EN`,
  }));
  const purposes = Array.from({ length: nCount }, (_, i) => ({
    id: createNodeId("PurposeNode", i + 1),
    pk: i + 1,
    nameFi: `Purpose ${i + 1} FI`,
    nameSv: `Purpose ${i + 1} SV`,
    nameEn: `Purpose ${i + 1} EN`,
  }));

  return {
    allAgeGroups: ageGroups,
    allEquipments: equipments,
    allPurposes: purposes,
    allReservationPurposes: reservationPurposes,
    allReservationUnitTypes: reservationUnitTypes,
    allUnits: units,
  };
}

export function createMockReservationUnitType({
  name,
  pk = 1,
}: {
  name: string;
  pk?: number;
}): ReservationUnitTypeNode {
  return {
    id: `ReservationUnitTypeNode:${pk}`,
    pk,
    rank: pk,
    ...generateNameFragment(name),
  };
}

export function generateNameFragment(name: string) {
  return {
    nameFi: `${name} FI`,
    nameSv: `${name} SV`,
    nameEn: `${name} EN`,
  };
}

export function generateDescriptionFragment(description: string) {
  return {
    descriptionFi: `${description} FI`,
    descriptionSv: `${description} SV`,
    descriptionEn: `${description} EN`,
  };
}

export function generateTextFragment(text: string) {
  return {
    textFi: `${text} FI`,
    textSv: `${text} SV`,
    textEn: `${text} EN`,
  };
}
