import {
  type AgeGroupNode,
  ApplicantTypeChoice,
  type ApplicationPage2Query,
  type ApplicationRoundNode,
  ApplicationRoundReservationCreationStatusChoice,
  ApplicationRoundStatusChoice,
  ApplicationSectionStatusChoice,
  ApplicationStatusChoice,
  type ApplicationViewFragment,
  CreateApplicationDocument,
  type CreateApplicationMutation,
  type CreateApplicationMutationVariables,
  OrganizationTypeChoice,
  Priority,
  type PurposeNode,
  type ReservationUnitNode,
  TermsType,
  UpdateApplicationDocument,
  type UpdateApplicationMutation,
  Weekday,
} from "@/gql/gql-types";
import { base64encode } from "common/src/helpers";
import { addDays, addMonths, addYears } from "date-fns";
import { generateNameFragment, generateTextFragment, type CreateGraphQLMocksReturn } from "./test.gql.utils";
import { createMockReservationUnit } from "./reservation-unit.mocks";

export function createApplicationMutationMocks(): CreateGraphQLMocksReturn {
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

function createMockReservationUnits({
  nReservationUnits = 1,
}: {
  nReservationUnits?: number;
}): Array<ReservationUnitNode> {
  return Array.from({ length: nReservationUnits }, (_, i) => createMockReservationUnit({ pk: i + 1 }));
}

type ApplicationMockType = NonNullable<ApplicationPage2Query["application"]>;
type ApplicationSectionMockType = NonNullable<ApplicationMockType["applicationSections"]>[number];

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
      ? Array.from({ length: nReservationUnitOptions }).map((_, i) => createReservationUnitOption({ order: i + 1 }))
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

function createMockAgeGroupNode({ pk = 1 }: { pk?: number } = {}): AgeGroupNode {
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

type CreateReservationUnitOption = ApplicationSectionMockType["reservationUnitOptions"][0];
function createReservationUnitOption({ order }: { order: number }): CreateReservationUnitOption {
  const reservationUnit: CreateReservationUnitOption["reservationUnit"] = createMockReservationUnit({ pk: order });
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
  nSections?: number;
};

export function createMockApplicationFragment({
  pk = 1,
  page = "page0",
  notesWhenApplying = "Notes when applying",
  status = ApplicationStatusChoice.Draft,
  nReservationUnitOptions = 1,
  nSections = 1,
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
        : Array.from({ length: nSections }, (_, i) =>
            createMockApplicationSection({
              pk: i + 1,
              page,
              nReservationUnitOptions,
            })
          ),
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
    throw new Error("Application period millis should be 0. You most likely you forgot to set a mock date");
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
    reservationCreationStatus: ApplicationRoundReservationCreationStatusChoice.NotCompleted,
    reservationUnitCount: 10, // Scalars["Int"]["output"];
    sentDate: null, // Maybe<Scalars["DateTime"]["output"]>;
    statusTimestamp: null, // Maybe<Scalars["DateTime"]["output"]>;
    termsOfUse: null, // Maybe<TermsOfUseNode>;
  };
}

type ApplicationPage4 = ApplicationViewFragment;
export function createMockApplicationViewFragment(props: CreateMockApplicationFragmentProps = {}) {
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
