import {
  ApplicantTypeChoice,
  type ApplicationFormFragment,
  type ApplicationPage2Query,
  ApplicationRoundFieldsFragment,
  ApplicationRoundStatusChoice,
  ApplicationSectionStatusChoice,
  ApplicationStatusChoice,
  ApplicationViewFragment,
  CreateApplicationDocument,
  type CreateApplicationMutationResult,
  type CreateApplicationMutationVariables,
  CurrentUserDocument,
  type CurrentUserQuery,
  type IsReservableFieldsFragment,
  OptionsDocument,
  type OptionsQuery,
  OrganizationTypeChoice,
  Priority,
  ReservationKind,
  ReservationPurposeOrderingChoices,
  ReservationStartInterval,
  ReservationUnitOrderingChoices,
  ReservationUnitTypeOrderingChoices,
  SearchReservationUnitsDocument,
  type SearchReservationUnitsQuery,
  type SearchReservationUnitsQueryVariables,
  type TermsOfUseFieldsFragment,
  TermsType,
  TimeSelectorFragment,
  UpdateApplicationDocument,
  type UpdateApplicationMutation,
  Weekday,
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

// TODO parametrize the variables
// we need at least the following:
// - no user
// - query var version
// - error version
export function createApplicationSearchGraphQLMocks({
  noUser = false,
  isSearchError = false,
}: CreateGraphQLMockProps = {}): CreateGraphQLMocksReturn {
  // TODO this should enforce non nullable for the query
  // it can be null when the query is loading, but when we mock it it should be non nullable
  // Q: what about failed queries? (though they should have different type)
  const SearchReservationUnitsQueryMock: SearchReservationUnitsQuery = {
    reservationUnits: {
      totalCount: 10,
      edges: Array.from({ length: 10 }, (_, i) => ({
        node: createSearchQueryNode(i + 1),
      })),
      pageInfo: {
        // TOOD how to mock this?
        endCursor: null,
        hasNextPage: false,
      },
    },
  };
  const SearchReservationUnitsQueryMockWithParams: SearchReservationUnitsQuery =
    {
      reservationUnits: {
        totalCount: 1,
        edges: [
          {
            node: createSearchQueryNode(1),
          },
        ],
        pageInfo: {
          // TOOD how to mock this?
          endCursor: null,
          hasNextPage: false,
        },
      },
    };
  const CurrentUserMock: CurrentUserQuery = {
    currentUser: !noUser
      ? {
          id: base64encode("UserNode:1"),
          pk: 1,
          firstName: "Test",
          lastName: "User",
          email: "test@user",
          isAdAuthenticated: false,
        }
      : null,
  };
  const CreateApplicationMutationMock: CreateApplicationMutationResult["data"] =
    {
      createApplication: {
        pk: 1,
      },
    };
  const CreateApplicationMutationMockVariables: CreateApplicationMutationVariables =
    {
      input: {
        applicationRound: 1,
      },
    };

  return [
    {
      request: {
        query: SearchReservationUnitsDocument,
        variables: createSearchVariablesMock(),
      },
      result: {
        data: SearchReservationUnitsQueryMock,
      },
      // There are no different errors for this query result (just default error text)
      error: isSearchError ? new Error("Search error") : undefined,
    },
    {
      request: {
        query: SearchReservationUnitsDocument,
        variables: createSearchVariablesMock({ date: null }),
      },
      result: {
        data: SearchReservationUnitsQueryMock,
      },
      error: isSearchError ? new Error("Search error") : undefined,
    },
    {
      request: {
        query: SearchReservationUnitsDocument,
        variables: createSearchVariablesMock({ textSearch: "foobar" }),
      },
      result: {
        data: SearchReservationUnitsQueryMockWithParams,
      },
      error: isSearchError ? new Error("Search error") : undefined,
    },
    {
      request: {
        query: CreateApplicationDocument,
        variables: CreateApplicationMutationMockVariables,
      },
      result: {
        data: CreateApplicationMutationMock,
      },
    },
    {
      request: {
        query: CurrentUserDocument,
      },
      result: {
        data: CurrentUserMock,
      },
    },
  ];
}

export function createGraphQLApplicationIdMock(): CreateGraphQLMocksReturn {
  const UpdateApplicationMutationMock: UpdateApplicationMutation = {
    updateApplication: {
      pk: 1,
    },
  };

  const OptionsMock: OptionsQuery = createOptionQueryMock();

  return [
    {
      request: {
        query: UpdateApplicationDocument,
      },
      variableMatcher: () => true,
      result: {
        data: UpdateApplicationMutationMock,
      },
    },
    {
      request: {
        query: OptionsDocument,
        variables: {
          reservationUnitTypesOrderBy:
            ReservationUnitTypeOrderingChoices.RankAsc,
          reservationPurposesOrderBy: ReservationPurposeOrderingChoices.RankAsc,
          unitsOrderBy: [],
          equipmentsOrderBy: [],
          purposesOrderBy: [],
        },
      },
      result: {
        data: OptionsMock,
      },
    },
  ];
}

function createSearchQueryNode(
  i: number
): NonNullable<
  NonNullable<SearchReservationUnitsQuery["reservationUnits"]>["edges"][number]
>["node"] {
  return {
    id: base64encode(`ReservationUnitNode:${i}`),
    pk: i,
    nameFi: `ReservationUnit ${i} FI`,
    nameEn: `ReservationUnit ${i} EN`,
    nameSv: `ReservationUnit ${i} SV`,
    reservationBegins: addYears(new Date(), -1 * i).toISOString(),
    reservationEnds: addYears(new Date(), 1 * i).toISOString(),
    isClosed: false,
    // TODO implement though for Seasonal this doesn't matter
    firstReservableDatetime: null,
    currentAccessType: null,
    effectiveAccessType: null,
    maxPersons: null,
    // TODO implement though for Seasonal this doesn't matter
    pricings: [],
    unit: {
      id: base64encode(`UnitNode:${i}`),
      nameFi: `Unit ${i} FI`,
      nameEn: `Unit ${i} EN`,
      nameSv: `Unit ${i} SV`,
    },
    reservationUnitType: createMockReservationUnitType({
      name: "ReservationUnitType",
    }),
    images: [],
    accessTypes: [],
  };
}

function createSearchVariablesMock({
  textSearch = null,
  date = new Date(2024, 1, 1),
}: {
  textSearch?: string | null;
  date?: Date | null;
  // TODO return type issues because all of them are optional (by backend)
  // we'd need to match them to a Required return type that we actully use
  // so what happens:
  // a new query param is added but that is not reflected in the mock
  // -> this is not a lint / type error but a runtime error in the tests
} = {}): Readonly<SearchReservationUnitsQueryVariables> {
  return {
    textSearch,
    purposes: [],
    unit: [],
    reservationUnitType: [],
    equipments: [],
    accessType: [],
    accessTypeBeginDate: date ? date.toISOString() : null,
    accessTypeEndDate: date ? addYears(date, 1).toISOString() : null,
    reservableDateStart: date ? date.toISOString() : null,
    reservableDateEnd: null,
    reservableTimeStart: null,
    reservableTimeEnd: null,
    reservableMinimumDurationMinutes: null,
    applicationRound: [1],
    personsAllowed: null,
    first: 36,
    orderBy: [
      ReservationUnitOrderingChoices.NameFiAsc,
      ReservationUnitOrderingChoices.PkAsc,
    ],
    isDraft: false,
    isVisible: true,
    reservationKind: ReservationKind.Season,
  } as const;
}

type CreateReservationUnitOption =
  ApplicationSectionMockType["reservationUnitOptions"][0];
function createReservationUnitOption({
  order,
  page,
}: {
  order: number;
  page: PageOptions;
}): CreateReservationUnitOption {
  const timeSelector: TimeSelectorFragment = {
    id: base64encode(`ApplicationRoundTimeSlotNode:1`),
    weekday: 1,
    closed: false,
    reservableTimes: [
      {
        begin: "08:00",
        end: "16:00",
      },
    ],
  };

  // NOTE even though the queries for other pages than page2 don't include most of this
  // typing becomes too complicated if we don't include it (use empty time slots array)
  const reservationUnit: CreateReservationUnitOption["reservationUnit"] = {
    id: base64encode(`ReservationUnitNode:${order}`),
    pk: order,
    ...generateNameFragment(`Reservation Unit ${order}`),
    unit: {
      id: base64encode(`UnitNode:1`),
      ...generateNameFragment("Unit"),
    },
    applicationRoundTimeSlots: page === "page2" ? [timeSelector] : [],
  };
  return {
    id: base64encode(`ReservationUnitOptionNode:1`),
    pk: order,
    preferredOrder: order,
    reservationUnit,
  };
}

type ApplicationMockType = NonNullable<ApplicationPage2Query["application"]>;
type ApplicationSectionMockType = NonNullable<
  ApplicationMockType["applicationSections"]
>[number];
/// @param page which page is valid (page0 => nothing is valid), preview => it's sent
export function createMockApplicationSection({
  page = "page0",
  pk = 1,
  nReservationUnitOptions = 1,
}: {
  page?: PageOptions;
  pk?: number;
  nReservationUnitOptions?: number;
} = {}): ApplicationSectionMockType {
  // TODO parametrize so we can zero this for page0 (nothing filled yet)

  const reservationUnitOptions: ApplicationSectionMockType["reservationUnitOptions"] =
    page !== "page0"
      ? Array.from({ length: nReservationUnitOptions }).map((_, i) =>
          createReservationUnitOption({ order: i + 1, page })
        )
      : [];

  const page2Data = {
    // TODO add other options
    suitableTimeRanges:
      page === "page0" || page === "page1"
        ? []
        : [
            {
              id: "SuitableTimeRangeNode:1",
              pk: 1,
              beginTime: "08:00",
              endTime: "16:00",
              dayOfTheWeek: Weekday.Wednesday,
              priority: Priority.Primary,
            },
          ],
  };

  if (page !== "page0" && page !== "page1") {
    if (page2Data.suitableTimeRanges.length === 0) {
      throw new Error("SuitableTimeRanges must be filled for page2");
    }
  }

  return {
    id: base64encode(`ApplicationSectionNode:${pk}`),
    pk,
    status: ApplicationSectionStatusChoice.Unallocated,
    // page 1 data
    name: "foobar",
    reservationMinDuration: 2 * 60 * 60,
    reservationMaxDuration: 4 * 60 * 60,
    numPersons: 1,
    reservationsBeginDate: addDays(new Date(), 1).toISOString(),
    reservationsEndDate: addDays(new Date(), 30 + 1).toISOString(),
    appliedReservationsPerWeek: 1,
    ageGroup: {
      id: base64encode(`AgeGroupNode:1`),
      pk: 1,
      minimum: 1,
      maximum: null,
    },
    purpose: {
      id: base64encode(`PurposeNode:1`),
      pk: 1,
      ...generateNameFragment("PurposeNode"),
    },
    reservationUnitOptions,
    ...page2Data,
  };
}

export type PageOptions = "page0" | "page1" | "page2" | "page3" | "page4";
export type CreateMockApplicationFragmentProps = {
  pk?: number;
  // completed page
  page?: PageOptions;
  notesWhenApplying?: string | null;
  status?: ApplicationStatusChoice;
  nReservationUnitOptions?: number;
};

export function createMockApplicationFragment({
  pk = 1,
  page = "page0",
  notesWhenApplying = "Notes when applying",
  status = ApplicationStatusChoice.Draft,
  nReservationUnitOptions = 1,
}: CreateMockApplicationFragmentProps = {}): ApplicationMockType {
  const now = new Date();

  const page3Data = {
    applicantType: ApplicantTypeChoice.Association,
    additionalInformation: null,
    contactPerson: {
      id: base64encode("ContactPersonNode:1"),
      pk: 1,
      firstName: "Test",
      lastName: "User",
      email: "test@user.fi",
      phoneNumber: "123456789",
    },
    organisation: {
      id: base64encode("OrganisationNode:1"),
      pk: 1,
      nameFi: "Organisation FI",
      identifier: "1234567-8",
      organisationType: OrganizationTypeChoice.PublicAssociation,
      coreBusinessFi: "Core business FI",
      yearEstablished: 2020,
      address: {
        id: base64encode("AddressNode:1"),
        pk: 1,
        postCode: "00000",
        streetAddressFi: "Street address FI",
        cityFi: "City FI",
      },
    },
    homeCity: {
      id: base64encode("CityNode:1"),
      pk: 1,
      ...generateNameFragment("CityNode"),
    },
    billingAddress: {
      id: base64encode("AddressNode:2"),
      pk: 2,
      postCode: "00000",
      streetAddressFi: "Street address FI",
      cityFi: "City FI",
    },
  };

  const MockApplicationForm = {
    id: base64encode(`ApplicationNode:${pk}`),
    pk,
    status: page === "page4" ? ApplicationStatusChoice.Received : status,
    // TODO this can't be combined with the other Fragment
    // colliding with the same name (spread syntax)
    applicationSections:
      page === "page0"
        ? []
        : [createMockApplicationSection({ page, nReservationUnitOptions })],
    ...(page === "page3" || page === "page4"
      ? page3Data
      : {
          applicantType: null,
          billingAddress: null,
          additionalInformation: null,
          contactPerson: null,
          organisation: null,
          homeCity: null,
        }),
  };
  const reservationUnits: ApplicationFormFragment["applicationRound"]["reservationUnits"] =
    Array.from({ length: 10 }, (_, i) => ({
      id: base64encode(`ReservationUnitNode:${i}`),
      pk: i,
      ...generateNameFragment("ReservationUnitNode"),
      minPersons: 1,
      maxPersons: 10,
      images: [],
      unit: {
        id: base64encode(`UnitNode:${i}`),
        pk: i,
        ...generateNameFragment("UnitNode"),
      },
      accessTypes: [],
    }));
  return {
    ...MockApplicationForm,
    applicationRound: {
      id: base64encode("ApplicationRoundNode:1"),
      notesWhenApplyingFi: notesWhenApplying ? `${notesWhenApplying} FI` : null,
      notesWhenApplyingEn: notesWhenApplying ? `${notesWhenApplying} EN` : null,
      notesWhenApplyingSv: notesWhenApplying ? `${notesWhenApplying} SV` : null,
      reservationPeriodBegin: addDays(now, 1).toISOString(),
      reservationPeriodEnd: addDays(now, 30 + 1).toISOString(),
      pk: 1,
      reservationUnits,
      ...generateNameFragment("ApplicationRoundNode"),
    },
  };
}

type ApplicationPage4 = ApplicationViewFragment;
export function createMockApplicationViewFragment(
  props: CreateMockApplicationFragmentProps = {}
) {
  const applicationRoundMock = {
    sentDate: new Date().toISOString(),
    status: ApplicationRoundStatusChoice.Open,
    ...generateNameFragment("ApplicationRound"),
    termsOfUse: {
      id: base64encode("TermsOfUseNode:1"),
      pk: "recurring",
      termsType: TermsType.RecurringTerms,
      ...generateNameFragment("TermsOfUse"),
      ...generateTextFragment("Recurring Terms of Use"),
    },
  };
  const baseFragment = createMockApplicationFragment(props);
  const application: ApplicationPage4 = {
    ...baseFragment,
    applicationRound: {
      ...baseFragment.applicationRound,
      ...applicationRoundMock,
    },
  };
  return application;
}

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
