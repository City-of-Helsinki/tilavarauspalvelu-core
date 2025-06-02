import {
  type ApplicationRoundFieldsFragment,
  ApplicationRoundStatusChoice,
  type IsReservableFieldsFragment,
  type OptionsQuery,
  ReservationStartInterval,
  type TermsOfUseFieldsFragment,
  TermsType,
} from "@/gql/gql-types";
import { base64encode } from "common/src/helpers";
import { addDays, addMonths, addYears } from "date-fns";
import { type DocumentNode } from "graphql";
import { type TFunction } from "i18next";
import { getDurationOptions } from "@/modules/const";
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

export function createMockTermsOfUse(): TermsOfUseFieldsFragment {
  return {
    // TODO what is the slug on this page? or does it matter
    // should be RecurringTerms (but not sure if it matters)
    pk: "generic",
    termsType: TermsType.RecurringTerms,
    id: base64encode("TermsOfUseNode:1"),
    ...generateNameFragment("TermsOfUseNode"),
    textFi: "Yleiset käyttöehdot",
    textEn: "General terms of use",
    textSv: "Allmänna användningsvillkor",
  };
}

// Option mocks
// TODO should move to test.utils.ts
// TODO improve mockT so that we pull through the duration value (not just the minutes / hours)
export const mockT: TFunction = ((key: string) => key) as TFunction;
export const mockDurationOptions = getDurationOptions(mockT);
export const mockReservationPurposesOptions = Array.from(
  { length: 5 },
  (_, i) => ({
    pk: i + 1,
  })
).map(({ pk }) => ({ value: pk, label: `Reservation Purpose ${pk}` }));
export const mockAgeGroupOptions = Array.from(
  { length: 5 },
  (_, i) => i + 1
).map((v) => ({
  pk: v,
  maximum: v,
  minimum: v,
}));

export function createOptionQueryMock(): OptionsQuery {
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
        .map(({ pk, maximum, minimum }) => ({
          id: base64encode(`ReservationPurposeNode:${pk}`),
          pk,
          minimum,
          maximum,
        }))
        .map((node) => ({ node })),
    },
    // NOT defining these atm because Seasonal Form doesn't use them
    // but the query requires matching keys
    reservationUnitTypes: {
      edges: [],
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

export function createMockApplicationRound({
  pk = 1,
  status = ApplicationRoundStatusChoice.Open,
  applicationPeriodEnd = new Date(2024, 0, 1, 0, 0, 0),
  applicationPeriodBegin = addYears(new Date(2024, 0, 1, 0, 0, 0), 1),
}: {
  pk?: number;
  status?: ApplicationRoundStatusChoice;
  applicationPeriodEnd?: Date;
  applicationPeriodBegin?: Date;
} = {}): Readonly<ApplicationRoundFieldsFragment> {
  // There is an implicit relation between reservationPeriodBegin and SearchQuery
  // so not mocking reservationPeriodBegin will break search query mock
  if (applicationPeriodBegin.getMilliseconds() !== 0) {
    throw new Error(
      "Application period millis should be 0. You most likely you forgot to set a mock date"
    );
  }
  const reservationPeriodBegin = addMonths(applicationPeriodBegin, 1);
  return {
    id: base64encode(`ApplicationRoundNode:${pk}`),
    pk,
    nameFi: `ApplicationRound ${pk} FI`,
    nameSv: `ApplicationRound ${pk} SV`,
    nameEn: `ApplicationRound ${pk} EN`,
    status,
    // TODO these are not all DateTime
    // some are DateTime (ISO), some are just Date
    reservationPeriodBegin: reservationPeriodBegin.toISOString(),
    reservationPeriodEnd: addYears(reservationPeriodBegin, 1).toISOString(),
    publicDisplayBegin: applicationPeriodBegin.toISOString(),
    publicDisplayEnd: applicationPeriodEnd.toISOString(),
    applicationPeriodBegin: applicationPeriodBegin.toISOString(),
    applicationPeriodEnd: applicationPeriodEnd.toISOString(),
    criteriaFi: null,
    criteriaEn: null,
    criteriaSv: null,
    notesWhenApplyingFi: null,
    notesWhenApplyingEn: null,
    notesWhenApplyingSv: null,
    reservationUnits: [1, 2, 3].map((pk) => ({
      id: base64encode(`ReservationUnitNode:${pk}`),
      pk,
      unit: {
        id: base64encode(`UnitNode:${pk}`),
        pk,
      },
    })),
  };
}

export function createMockReservationUnitType(
  props: { name: string; pk?: number } | null
) {
  if (props == null) {
    return null;
  }
  const { name, pk } = props;
  return {
    id: `ReservationUnitTypeNode:${pk ?? 1}`,
    pk: pk ?? 1,
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
export function generateTextFragment(text: string) {
  return {
    textFi: `${text} FI`,
    textSv: `${text} SV`,
    textEn: `${text} EN`,
  };
}
