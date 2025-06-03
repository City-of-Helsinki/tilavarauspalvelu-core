import {
  type IsReservableFieldsFragment,
  type OptionsQuery,
  ReservationStartInterval,
  type ReservationUnitTypeNode,
} from "@/gql/gql-types";
import { base64encode } from "common/src/helpers";
import { addDays } from "date-fns";
import { type DocumentNode } from "graphql";
import { type ReservableMap, type RoundPeriod } from "@/modules/reservable";

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

export function createOptionQueryMock({
  nCount = 5,
}: {
  nCount?: number;
} = {}): OptionsQuery {
  const pks = Array.from({ length: nCount }, (_, i) => i + 1);
  const mockReservationPurposesOptions = pks.map((pk) => ({
    value: pk,
    label: `Reservation Purpose ${pk}`,
  }));
  const mockAgeGroupOptions = pks.map((v) => ({
    pk: v,
    maximum: v,
    minimum: v,
  }));

  return {
    reservationPurposes: {
      edges: mockReservationPurposesOptions
        .map(({ value, label }) => ({
          id: base64encode(`ReservationPurposeNode:${value}`),
          pk: value,
          nameFi: label,
          nameSv: label,
          nameEn: label,
        }))
        .map((node) => ({ node })),
    },
    ageGroups: {
      edges: mockAgeGroupOptions
        .map((val) => ({
          ...val,
          id: base64encode(`ReservationPurposeNode:${val.pk}`),
        }))
        .map((node) => ({ node })),
    },
    reservationUnitTypes: {
      edges: pks
        .map((pk) =>
          createMockReservationUnitType({
            name: `Reservation Unit Type ${pk}`,
            pk,
          })
        )
        .map((node) => ({ node })),
    },
    purposes: {
      edges: [],
    },
    cities: {
      edges: [],
    },
    equipmentsAll: [],
    unitsAll: [],
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
