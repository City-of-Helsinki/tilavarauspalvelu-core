import {
  ApplicantTypeChoice,
  type ApplicationFormFragment,
  ApplicationRoundFieldsFragment,
  ApplicationRoundStatusChoice,
  ApplicationStatusChoice,
  CreateApplicationDocument,
  type CreateApplicationMutationResult,
  type CreateApplicationMutationVariables,
  CurrentUserDocument,
  type CurrentUserQuery,
  IsReservableFieldsFragment,
  OptionsQuery,
  OrganizationTypeChoice,
  Priority,
  ReservationKind,
  ReservationStartInterval,
  ReservationUnitOrderingChoices,
  SearchReservationUnitsDocument,
  type SearchReservationUnitsQuery,
  type SearchReservationUnitsQueryVariables,
  type TermsOfUseFieldsFragment,
  TermsType,
  Weekday,
} from "@/gql/gql-types";
import { base64encode } from "common/src/helpers";
import { addDays, addYears } from "date-fns";
import { type DocumentNode } from "graphql";
import { type TFunction } from "i18next";
import { getDurationOptions } from "@/modules/const";
import { type ReservableMap, type RoundPeriod } from "@/modules/reservable";

export type CreateGraphQLMockProps = {
  noUser?: boolean;
  isSearchError?: boolean;
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
export function createGraphQLMocks({
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
        variables: createSearchVariablesMock({ textSearch: "foobar" }),
      },
      result: {
        data: SearchReservationUnitsQueryMockWithParams,
      },
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
    maxPersons: null,
    // TODO implement though for Seasonal this doesn't matter
    pricings: [],
    unit: {
      id: base64encode(`UnitNode:${i}`),
      pk: i,
      nameFi: `Unit ${i} FI`,
      nameEn: `Unit ${i} EN`,
      nameSv: `Unit ${i} SV`,
      location: {
        addressStreetFi: "Address street FI",
        addressStreetEn: "Address street EN",
        addressStreetSv: "Address street SV",
        addressCityFi: "Address city FI",
        addressCityEn: "Address city EN",
        addressCitySv: "Address city SV",
        id: base64encode(`LocationNode:${i}`),
        addressZip: "00000",
      },
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
}: {
  textSearch?: string | null;
  // TODO return type issues because all of them are optional (by backend)
  // we'd need to match them to a Required return type that we actully use
  // so what happens:
  // a new query param is added but that is not reflected in the mock
  // -> this is not a lint / type error but a runtime error in the tests
} = {}): Readonly<SearchReservationUnitsQueryVariables> {
  return {
    personsAllowed: null,
    textSearch,
    purposes: [],
    unit: [],
    reservationUnitType: [],
    equipments: [],
    accessType: [],
    accessTypeBeginDate: "2024-02-01T00:00:00Z",
    accessTypeEndDate: "2025-01-01T00:00:00Z",
    applicationRound: [1],
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

/// @param page which page is valid (page0 => nothing is valid), preview => it's sent
function createMockApplicationSection({
  page = "page0",
}: {
  page?: PageOptions;
} = {}): NonNullable<ApplicationFormFragment["applicationSections"]>[number] {
  const pk = 1;
  // TODO parametrize so we can zero this for page0 (nothing filled yet)
  const page1Data = {
    // page 1 data
    name: "foobar",
    reservationMinDuration: 1 * 60 * 60,
    reservationMaxDuration: 2 * 60 * 60,
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
    reservationUnitOptions:
      page !== "page0"
        ? [
            {
              id: base64encode(`ReservationUnitOptionNode:1`),
              pk: 1,
              preferredOrder: 1,
              reservationUnit: {
                id: base64encode(`ReservationUnitNode:1`),
                pk: 1,
                ...generateNameFragment("ReservationUnitNode"),
                unit: {
                  id: base64encode(`UnitNode:1`),
                  pk: 1,
                  ...generateNameFragment("UnitNode"),
                },
                applicationRoundTimeSlots: [
                  {
                    id: base64encode(`ApplicationRoundTimeSlotNode:1`),
                    weekday: 1,
                    closed: false,
                    reservableTimes: [
                      {
                        begin: "08:00",
                        end: "16:00",
                      },
                    ],
                  },
                ],
              },
            },
          ]
        : [],
  };
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
    if (
      page1Data.appliedReservationsPerWeek !==
      page1Data.reservationUnitOptions.length
    ) {
      throw new Error(
        "AppliedReservationsPerWeek must match the number of reservationUnitOptions"
      );
    }
  }

  return {
    id: base64encode(`ApplicationSectionNode:${pk}`),
    pk,
    // status: null, // (or Unallocated)
    ...page1Data,
    ...page2Data,
  };
}

export type PageOptions = "page0" | "page1" | "page2" | "page3" | "preview";

export type CreateMockApplicationFragmentProps = {
  pk?: number;
  // completed page
  page?: PageOptions;
};
export function createMockApplicationFragment({
  pk = 1,
  page = "page0",
}: CreateMockApplicationFragmentProps = {}): ApplicationFormFragment {
  const now = new Date();
  // TODO use page to generate the form values (applicationSections)
  // so it's filled with the correct values for that page
  const status =
    page === "preview"
      ? ApplicationStatusChoice.Received
      : ApplicationStatusChoice.Draft;

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

  const MockApplicationForm: Omit<ApplicationFormFragment, "applicationRound"> =
    {
      id: base64encode(`ApplicationNode:${pk}`),
      pk,
      status,
      // TODO this can't be combined with the other Fragment
      // colliding with the same name (spread syntax)
      applicationSections:
        page === "page0" ? [] : [createMockApplicationSection({ page })],
      ...(page === "page3" || page === "preview" ? page3Data : {}),
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
      notesWhenApplyingFi: "Notes when applying FI",
      notesWhenApplyingEn: "Notes when applying EN",
      notesWhenApplyingSv: "Notes when applying SV",
      reservationPeriodBegin: addDays(now, 1).toISOString(),
      reservationPeriodEnd: addDays(now, 30 + 1).toISOString(),
      pk: 1,
      reservationUnits,
      ...generateNameFragment("ApplicationRoundNode"),
    },
  };
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
  status,
  applicationPeriodEnd,
  applicationPeriodBegin,
}: {
  pk?: number;
  status: ApplicationRoundStatusChoice;
  applicationPeriodEnd: Date;
  applicationPeriodBegin: Date;
}): Readonly<ApplicationRoundFieldsFragment> {
  return {
    id: base64encode(`ApplicationRoundNode:${pk}`),
    pk,
    nameFi: `ApplicationRound ${pk} FI`,
    nameSv: `ApplicationRound ${pk} SV`,
    nameEn: `ApplicationRound ${pk} EN`,
    status,
    reservationPeriodBegin: "2024-02-01T00:00:00Z",
    reservationPeriodEnd: "2025-01-01T00:00:00Z",
    publicDisplayBegin: "2024-02-01T00:00:00Z",
    publicDisplayEnd: "2025-01-01T00:00:00Z",
    applicationPeriodBegin: applicationPeriodBegin.toISOString(),
    applicationPeriodEnd: applicationPeriodEnd.toISOString(),
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
