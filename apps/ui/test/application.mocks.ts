import {
  type AgeGroupNode,
  ApplicantTypeChoice,
  type ApplicationPage2Query,
  type ApplicationRoundNode,
  ApplicationRoundReservationCreationStatusChoice,
  ApplicationRoundStatusChoice,
  type ApplicationRoundTimeSlotNode,
  ApplicationSectionStatusChoice,
  ApplicationStatusChoice,
  type ApplicationViewFragment,
  Authentication,
  CreateApplicationDocument,
  type CreateApplicationMutation,
  type CreateApplicationMutationVariables,
  CurrentUserDocument,
  type CurrentUserQuery,
  ImageType,
  OptionsDocument,
  type OptionsQuery,
  OrganizationTypeChoice,
  Priority,
  type PurposeNode,
  ReservationKind,
  ReservationPurposeOrderingChoices,
  ReservationStartInterval,
  type ReservationUnitNode,
  ReservationUnitOrderingChoices,
  ReservationUnitPublishingState,
  ReservationUnitReservationState,
  ReservationUnitTypeOrderingChoices,
  SearchReservationUnitsDocument,
  type SearchReservationUnitsQuery,
  type SearchReservationUnitsQueryVariables,
  TermsType,
  type UnitNode,
  UpdateApplicationDocument,
  type UpdateApplicationMutation,
  Weekday,
} from "@/gql/gql-types";
import { base64encode } from "common/src/helpers";
import { addDays, addMonths, addYears } from "date-fns";
import {
  createMockReservationUnitType,
  createOptionQueryMock,
  generateDescriptionFragment,
  generateNameFragment,
  generateTextFragment,
  type ICreateGraphQLMock,
  type CreateGraphQLMockProps,
  type CreateGraphQLMocksReturn,
} from "./test.gql.utils";

export function createGraphQLMocks({
  noUser = false,
  isSearchError = false,
}: CreateGraphQLMockProps = {}): CreateGraphQLMocksReturn {
  return [
    ...createSearchQueryMocks({ isSearchError }),
    ...createOptionsQueryMocks(),
    ...createCurrentUserQueryMocks({ noUser }),
    ...createApplicationMutationMocks(),
  ];
}

function createApplicationMutationMocks(): CreateGraphQLMocksReturn {
  const createVariables: CreateApplicationMutationVariables = {
    input: {
      applicationRound: 1,
    },
  };
  const updateMutation: UpdateApplicationMutation = {
    updateApplication: {
      pk: 1,
    },
  };
  const createMutation: CreateApplicationMutation = {
    createApplication: {
      pk: 1,
    },
  };

  return [
    {
      request: {
        query: UpdateApplicationDocument,
      },
      variableMatcher: () => true,
      result: {
        data: updateMutation,
      },
    },
    {
      request: {
        query: CreateApplicationDocument,
        variables: createVariables,
      },
      result: {
        data: createMutation,
      },
    },
  ];
}

interface CurrentUserQueryMocksProps extends ICreateGraphQLMock {
  noUser: boolean;
}

function createCurrentUserQueryMocks({
  noUser,
}: CurrentUserQueryMocksProps): CreateGraphQLMocksReturn {
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

  return [
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

function createOptionsQueryMocks(): CreateGraphQLMocksReturn {
  const OptionsMock: OptionsQuery = createOptionQueryMock();
  return [
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

interface SearchQueryProps extends ICreateGraphQLMock {
  isSearchError: boolean;
}
function createSearchQueryMocks({
  isSearchError,
}: SearchQueryProps): CreateGraphQLMocksReturn {
  // TODO this should enforce non nullable for the query
  // it can be null when the query is loading, but when we mock it it should be non nullable
  // Q: what about failed queries? (though they should have different type)
  const SearchReservationUnitsQueryMock: SearchReservationUnitsQuery = {
    reservationUnits: {
      totalCount: 10,
      edges: Array.from({ length: 10 }, (_, i) => i + 1).map((pk) => ({
        node: createMockReservationUnit({ pk }),
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
            node: createMockReservationUnit({ pk: 1 }),
          },
        ],
        pageInfo: {
          // TOOD how to mock this?
          endCursor: null,
          hasNextPage: false,
        },
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
  ];
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

export function createMockReservationUnit({
  pk,
}: {
  pk: number;
}): ReservationUnitNode {
  const timeSelector: ApplicationRoundTimeSlotNode = {
    id: base64encode(`ApplicationRoundTimeSlotNode:1`),
    pk,
    weekday: 1,
    closed: false,
    reservableTimes: [
      {
        begin: "08:00",
        end: "16:00",
      },
    ],
  };
  return {
    id: base64encode(`ReservationUnitNode:${pk}`),
    pk,
    ...generateNameFragment(`ReservationUnit ${pk}`),
    // TODO this is weird
    reservationBegins: addYears(new Date(), -1 * pk).toISOString(),
    reservationEnds: addYears(new Date(), 1 * pk).toISOString(),
    isClosed: false,
    // TODO implement though for Seasonal this doesn't matter
    firstReservableDatetime: null,
    currentAccessType: null,
    effectiveAccessType: null,
    maxPersons: null,
    // TODO implement though for Seasonal this doesn't matter
    pricings: [],
    unit: createMockUnit({ pk }),
    reservationUnitType: createMockReservationUnitType({
      name: "ReservationUnitType",
    }),
    images: [
      {
        id: base64encode("Image:1"),
        pk: 1,
        imageUrl: "https://example.com/image1.jpg",
        largeUrl: "https://example.com/image1_large.jpg",
        mediumUrl: "https://example.com/image1_medium.jpg",
        smallUrl: "https://example.com/image1_small.jpg",
        imageType: ImageType.Main,
      },
    ] as const,
    accessTypes: [],
    // Everything below is only for completeness of the mock type (not used for application tests)
    // TODO this can be removed
    allowReservationsWithoutOpeningHours: false,
    // applicationRoundTimeSlots: [] as const, // ReadonlyArray<ApplicationRoundTimeSlotNode>;
    applicationRoundTimeSlots: [timeSelector],
    applicationRounds: [] as const, // ReadonlyArray<ApplicationRoundNode>;
    authentication: Authentication.Weak,
    bufferTimeAfter: 0, //Scalars["Duration"]["output"];
    bufferTimeBefore: 0, // Scalars["Duration"]["output"];
    calculatedSurfaceArea: 0, // Scalars["Int"]["output"];
    canApplyFreeOfCharge: false, // Scalars["Boolean"]["output"];
    cancellationRule: null, // Maybe<ReservationUnitCancellationRuleNode>;
    cancellationTerms: null, // Maybe<TermsOfUseNode>;
    contactInformation: "", // admin-ui only feature
    descriptionEn: "Description EN",
    descriptionFi: "Description FI",
    descriptionSv: "Description SV",
    equipments: [] as const, // ReadonlyArray<EquipmentNode>;
    haukiUrl: null, // Maybe<Scalars["String"]["output"]>;
    isArchived: false,
    isDraft: false,
    location: null,
    maxReservationDuration: null, // Maybe<Scalars["Duration"]["output"]>;
    maxReservationsPerUser: null, //Maybe<Scalars["Int"]["output"]>;
    metadataSet: null, //Maybe<ReservationMetadataSetNode>;
    minPersons: null, //Maybe<Scalars["Int"]["output"]>;
    minReservationDuration: null, // Maybe<Scalars["Duration"]["output"]>;
    numActiveUserReservations: 0, // Scalars["Int"]["output"];
    paymentMerchant: null, //Maybe<PaymentMerchantNode>;
    paymentProduct: null, //Maybe<PaymentProductNode>;
    paymentTerms: null, // Maybe<TermsOfUseNode>;
    pricingTerms: null, //Maybe<TermsOfUseNode>;
    publishBegins: null, // Maybe<Scalars["DateTime"]["output"]>;
    publishEnds: null, // Maybe<Scalars["DateTime"]["output"]>;
    publishingState: ReservationUnitPublishingState.Published,
    purposes: [] as const, // ReadonlyArray<PurposeNode>;
    qualifiers: [] as const, // ReadonlyArray<QualifierNode>;
    rank: pk, // Scalars["Int"]["output"];
    requireAdultReservee: true, // Scalars["Boolean"]["output"];
    requireReservationHandling: false, // Scalars["Boolean"]["output"];
    reservableTimeSpans: [] as const, // Maybe<ReadonlyArray<ReservableTimeSpanType>>;
    reservationBlockWholeDay: false, // Scalars["Boolean"]["output"];
    reservationCancelledInstructionsEn:
      null /* Maybe< Scalars["String"]["output"] >;*/,
    reservationCancelledInstructionsFi: null, // Maybe< Scalars["String"]["output"] >;
    reservationCancelledInstructionsSv: null, // Maybe< Scalars["String"]["output"] >;
    reservationConfirmedInstructionsEn: null, // Maybe< Scalars["String"]["output"] >;
    reservationConfirmedInstructionsFi: null, // Maybe< Scalars["String"]["output"] >;
    reservationConfirmedInstructionsSv: null, // Maybe< Scalars["String"]["output"] >;
    reservationKind: ReservationKind.DirectAndSeason,
    reservationPendingInstructionsEn: null, // Maybe<Scalars["String"]["output"]>;
    reservationPendingInstructionsFi: null, // Maybe<Scalars["String"]["output"]>;
    reservationPendingInstructionsSv: null, // Maybe<Scalars["String"]["output"]>;
    reservationStartInterval: ReservationStartInterval.Interval_30Mins,
    reservationState: ReservationUnitReservationState.Reservable,
    reservations: null, //Maybe<ReadonlyArray<ReservationNode>>;
    reservationsMaxDaysBefore: null, // Maybe<Scalars["Int"]["output"]>;
    reservationsMinDaysBefore: null, // Maybe<Scalars["Int"]["output"]>;
    resources: [] as const, // ReadonlyArray<ResourceNode>;
    searchTerms: [] as const, // ReadonlyArray<Scalars["String"]["output"]>;
    serviceSpecificTerms: null, // Maybe<TermsOfUseNode>;
    spaces: [] as const, // ReadonlyArray<SpaceNode>;
    surfaceArea: null, // Maybe<Scalars["Int"]["output"]>;
    termsOfUseEn: null, // Maybe<Scalars["String"]["output"]>;
    termsOfUseFi: null, // Maybe<Scalars["String"]["output"]>;
    termsOfUseSv: null, // Maybe<Scalars["String"]["output"]>;
    uuid: "dummy-uuid", // Scalars["UUID"]["output"];
  };
}

function createMockUnit({ pk }: { pk: number }): UnitNode {
  return {
    id: base64encode(`UnitNode:${pk}`),
    pk, // Maybe<Scalars["Int"]["output"]>;
    ...generateNameFragment(`Unit ${pk}`),
    ...generateDescriptionFragment(`Unit Description ${pk}`),
    email: "", // Scalars["String"]["output"];
    location: null, // Maybe<LocationNode>;
    paymentMerchant: null, // Maybe<PaymentMerchantNode>;
    phone: "", // Scalars["String"]["output"];
    reservationUnits: [] as const, // ReadonlyArray<ReservationUnitNode>;
    shortDescriptionEn: `Short description ${pk} EN`, // Scalars["String"]["output"];
    shortDescriptionFi: `Short description ${pk} FI`, // Scalars["String"]["output"];
    shortDescriptionSv: `Short description ${pk} SV`, // Scalars["String"]["output"];
    spaces: [] as const, //; ReadonlyArray<SpaceNode>;
    tprekId: null, // Maybe<Scalars["String"]["output"]>;
    unitGroups: [] as const, // ReadonlyArray<UnitGroupNode>;
    webPage: "", // Scalars["String"]["output"];
  };
}

function createMockReservationUnits({
  nReservationUnits = 1,
}: {
  nReservationUnits?: number;
}): Array<ReservationUnitNode> {
  return Array.from({ length: nReservationUnits }, (_, i) =>
    createMockReservationUnit({ pk: i + 1 })
  );
}

type ApplicationMockType = NonNullable<ApplicationPage2Query["application"]>;
type ApplicationSectionMockType = NonNullable<
  ApplicationMockType["applicationSections"]
>[number];

/// @param page which page is valid (page0 => nothing is valid), preview => it's sent
function createMockApplicationSection({
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
          createReservationUnitOption({ order: i + 1 })
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
    ageGroup: createMockAgeGroupNode(),
    purpose: createMockPurposeNode(),
    reservationUnitOptions,
    ...page2Data,
  };
}

function createMockAgeGroupNode({
  pk = 1,
}: { pk?: number } = {}): AgeGroupNode {
  return {
    id: base64encode(`AgeGroupNode:1`),
    pk,
    minimum: 1,
    maximum: null,
  };
}

function createMockPurposeNode({ pk = 1 }: { pk?: number } = {}): PurposeNode {
  return {
    id: base64encode(`PurposeNode:1`),
    pk,
    rank: pk,
    ...generateNameFragment("PurposeNode"),
    imageUrl: null,
    smallUrl: null,
  };
}

type CreateReservationUnitOption =
  ApplicationSectionMockType["reservationUnitOptions"][0];
function createReservationUnitOption({
  order,
}: {
  order: number;
}): CreateReservationUnitOption {
  const reservationUnit: CreateReservationUnitOption["reservationUnit"] =
    createMockReservationUnit({ pk: order });
  return {
    id: base64encode(`ReservationUnitOptionNode:1`),
    pk: order,
    preferredOrder: order,
    reservationUnit,
  };
}

type PageOptions = "page0" | "page1" | "page2" | "page3" | "page4";
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
  return {
    ...MockApplicationForm,
    applicationRound: createMockApplicationRound({ pk, notesWhenApplying }),
  };
}

export function createMockApplicationRound({
  pk = 1,
  notesWhenApplying,
  status = ApplicationRoundStatusChoice.Open,
  applicationPeriodEnd = new Date(2024, 0, 1, 0, 0, 0),
  applicationPeriodBegin = addYears(new Date(2024, 0, 1, 0, 0, 0), 1),
}: {
  pk?: number;
  status?: ApplicationRoundStatusChoice;
  notesWhenApplying?: string | null;
  applicationPeriodEnd?: Date;
  applicationPeriodBegin?: Date;
} = {}): ApplicationRoundNode {
  // There is an implicit relation between reservationPeriodBegin and SearchQuery
  // so not mocking reservationPeriodBegin will break search query mock
  if (applicationPeriodBegin.getMilliseconds() !== 0) {
    throw new Error(
      "Application period millis should be 0. You most likely you forgot to set a mock date"
    );
  }
  const reservationPeriodBegin = addMonths(applicationPeriodBegin, 1);
  const reservationUnits = createMockReservationUnits({
    nReservationUnits: 10,
  });

  return {
    id: base64encode(`ApplicationRoundNode:${pk}`),
    pk,
    ...generateNameFragment(`ApplicationRound ${pk}`),
    notesWhenApplyingFi: notesWhenApplying ? `${notesWhenApplying} FI` : null,
    notesWhenApplyingEn: notesWhenApplying ? `${notesWhenApplying} EN` : null,
    notesWhenApplyingSv: notesWhenApplying ? `${notesWhenApplying} SV` : null,
    reservationPeriodBegin: reservationPeriodBegin.toISOString(),
    reservationPeriodEnd: addYears(reservationPeriodBegin, 1).toISOString(),
    publicDisplayBegin: applicationPeriodBegin.toISOString(),
    publicDisplayEnd: applicationPeriodEnd.toISOString(),
    applicationPeriodBegin: applicationPeriodBegin.toISOString(),
    applicationPeriodEnd: applicationPeriodEnd.toISOString(),
    status,
    reservationUnits,
    applicationsCount: 0, // Scalars["Int"]["output"];
    criteriaEn: null, // Maybe<Scalars["String"]["output"]>;
    criteriaFi: null, // Maybe<Scalars["String"]["output"]>;
    criteriaSv: null, // Maybe<Scalars["String"]["output"]>;
    handledDate: null, // Maybe<Scalars["DateTime"]["output"]>;
    isSettingHandledAllowed: false, // Scalars["Boolean"]["output"];
    purposes: [] as const, // ReadonlyArray<ReservationPurposeNode>;
    reservationCreationStatus:
      ApplicationRoundReservationCreationStatusChoice.NotCompleted,
    reservationUnitCount: 10, // Scalars["Int"]["output"];
    sentDate: null, // Maybe<Scalars["DateTime"]["output"]>;
    statusTimestamp: null, // Maybe<Scalars["DateTime"]["output"]>;
    termsOfUse: null, // Maybe<TermsOfUseNode>;
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
