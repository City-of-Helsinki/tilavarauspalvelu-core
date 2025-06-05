import {
  type IsReservableFieldsFragment,
  type OptionsQuery,
  ReservationStartInterval,
  type ReservationUnitTypeNode,
} from "@/gql/gql-types";
import { base64encode, filterNonNullable } from "common/src/helpers";
import { addDays } from "date-fns";
import { type DocumentNode } from "graphql";
import { type ReservableMap, type RoundPeriod } from "@/modules/reservable";
import { translateOption, type OptionsT } from "@/modules/search";

export type CreateGraphQLMockProps = {
  noUser?: boolean;
  isSearchError?: boolean;
  dateOverride?: Date | null;
};

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
): OptionsT {
  const opts = createOptionQueryMock(props);
  const lang = "fi" as const;
  return {
    units: filterNonNullable(opts.unitsAll).map((n) =>
      translateOption(n, lang)
    ),
    equipments: filterNonNullable(opts.equipmentsAll).map((n) =>
      translateOption(n, lang)
    ),
    purposes: filterNonNullable(
      opts.purposes?.edges.map((edge) => edge?.node)
    ).map((n) => translateOption(n, lang)),
    reservationUnitTypes: filterNonNullable(
      opts.reservationUnitTypes?.edges.map((edge) => edge?.node)
    ).map((n) => translateOption(n, lang)),
    ageGroups: filterNonNullable(
      opts.ageGroups?.edges.map((edge) => edge?.node)
    ).map((op) => ({
      value: op.pk ?? 0,
      label: `${op.minimum ?? ""}-${op.maximum ?? ""}`,
    })),
    cities: filterNonNullable(opts.cities?.edges.map((edge) => edge?.node)).map(
      (n) => translateOption(n, lang)
    ),
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
    id: base64encode(`ReservationPurposeNode:${val.pk}`),
  }));

  const reservationPurposes = reservationPurposeOptions.map(
    ({ value, label }) => ({
      id: base64encode(`ReservationPurposeNode:${value}`),
      pk: value,
      nameFi: label,
      nameSv: label,
      nameEn: label,
    })
  );
  const units = [] as const;
  const equipments = [] as const;
  const purposes = Array.from({ length: nCount }, (_, i) => ({
    id: base64encode(`PurposeNode:${i + 1}`),
    pk: i + 1,
    nameFi: `Purpose ${i + 1} FI`,
    nameSv: `Purpose ${i + 1} SV`,
    nameEn: `Purpose ${i + 1} EN`,
  }));
  const cities = Array.from({ length: nCount }, (_, i) => ({
    id: base64encode(`CityNode:${i + 1}`),
    pk: i + 1,
    nameFi: `City ${i + 1} FI`,
    nameSv: `City ${i + 1} SV`,
    nameEn: `City ${i + 1} EN`,
  }));

  return {
    reservationPurposes: {
      edges: reservationPurposes.map((node) => ({ node })),
    },
    ageGroups: {
      edges: ageGroups.map((node) => ({ node })),
    },
    reservationUnitTypes: {
      edges: reservationUnitTypes.map((node) => ({ node })),
    },
    purposes: {
      edges: purposes.map((node) => ({ node })),
    },
    cities: {
      edges: cities.map((node) => ({ node })),
    },
    equipmentsAll: equipments,
    unitsAll: units,
  };
}

type ReservationUnitType = Omit<
  IsReservableFieldsFragment,
  "reservableTimeSpans"
>;
type MockReservationUnitProps = {
  bufferTimeBefore?: number;
  bufferTimeAfter?: number;
  reservableTimes?: ReservableMap;
  interval?: ReservationStartInterval;
  maxReservationDuration?: IsReservableFieldsFragment["maxReservationDuration"];
  minReservationDuration?: IsReservableFieldsFragment["minReservationDuration"];
  activeApplicationRounds?: RoundPeriod[];
  reservationsMinDaysBefore?: number;
  reservationsMaxDaysBefore?: number | null;
};
/// create a mock for IsReservableFragment (not a full reservation unit)
// TODO use the version in (in application.mocks.ts)
// or alternatively move it to reservation-unit.mocks.ts
export function createMockReservationUnit({
  bufferTimeBefore = 0,
  bufferTimeAfter = 0,
  interval = ReservationStartInterval.Interval_15Mins,
  maxReservationDuration = 0,
  minReservationDuration = 0,
  reservationsMinDaysBefore = 0,
  reservationsMaxDaysBefore = null,
}: MockReservationUnitProps): ReservationUnitType {
  const reservationUnit: ReservationUnitType = {
    id: "1",
    bufferTimeBefore: 60 * 60 * bufferTimeBefore,
    bufferTimeAfter: 60 * 60 * bufferTimeAfter,
    maxReservationDuration,
    minReservationDuration,
    reservationStartInterval: interval,
    reservationsMaxDaysBefore,
    reservationsMinDaysBefore,
    reservationBegins: addDays(new Date(), -1).toISOString(),
    reservationEnds: addDays(new Date(), 180).toISOString(),
  };
  return reservationUnit;
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
