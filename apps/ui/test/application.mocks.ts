import {
  type AgeGroupNode,
  type ApplicationPage2Fragment,
  type ApplicationRoundNode,
  ApplicationRoundReservationCreationStatusChoice,
  ApplicationRoundStatusChoice,
  ApplicationSectionStatusChoice,
  ApplicationStatusChoice,
  type ApplicationViewFragment,
  CreateApplicationDocument,
  type CreateApplicationMutation,
  type CreateApplicationMutationVariables,
  MunicipalityChoice,
  Priority,
  type PurposeNode,
  type ReservationUnitNode,
  ReserveeType,
  TermsOfUseTypeChoices,
  UpdateApplicationDocument,
  type UpdateApplicationMutation,
  Weekday,
} from "@/gql/gql-types";
import { createNodeId } from "common/src/helpers";
import { addDays, addMonths, addYears, endOfYear, startOfDay } from "date-fns";
import { type CreateGraphQLMocksReturn, generateNameFragment, generateTextFragment } from "./test.gql.utils";
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

type ApplicationSectionMockType = NonNullable<ApplicationPage2Fragment["applicationSections"]>[number];

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
    id: createNodeId("ApplicationSectionNode", pk),
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
    id: createNodeId("AgeGroupNode", 1),
    pk,
    minimum: 1,
    maximum: null,
  };
}

function createMockPurposeNode({ pk = 1 }: { pk?: number } = {}): PurposeNode {
  return {
    id: createNodeId("PurposeNode", 1),
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
    id: createNodeId("ReservationUnitOptionNode", 1),
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
}: CreateMockApplicationFragmentProps = {}): ApplicationPage2Fragment {
  const page3Data = {
    applicantType: ReserveeType.Nonprofit,
    additionalInformation: "",
    contactPersonFirstName: "Test",
    contactPersonLastName: "User",
    contactPersonEmail: "test@user.fi",
    contactPersonPhoneNumber: "123456789",
    organisationName: "Organisation FI",
    organisationIdentifier: "1234567-8",
    organisationCoreBusiness: "Core business FI",
    organisationYearEstablished: 2020,
    organisationPostCode: "00000",
    organisationStreetAddress: "Street address FI",
    organisationCity: "City FI",
    municipality: MunicipalityChoice.Helsinki,
    billingPostCode: "00000",
    billingStreetAddress: "Street address FI",
    billingCity: "City FI",
  };

  const MockApplicationForm = {
    id: createNodeId("ApplicationNode", pk),
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
          additionalInformation: "",
          billingStreetAddress: "",
          billingPostCode: "",
          billingCity: "",
          contactPersonFirstName: "",
          contactPersonLastName: "",
          contactPersonEmail: "",
          contactPersonPhoneNumber: "",
          organisationName: "",
          organisationIdentifier: "",
          organisationCoreBusiness: "",
          organisationStreetAddress: "",
          organisationCity: "",
          organisationPostCode: "",
          organisationYearEstablished: null,
          municipality: null,
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
  applicationPeriodEndsAt = new Date(2024, 0, 1, 0, 0, 0),
  applicationPeriodBeginsAt = addYears(new Date(2024, 0, 1, 0, 0, 0), 1),
}: {
  pk?: number;
  status?: ApplicationRoundStatusChoice;
  notesWhenApplying?: string | null;
  applicationPeriodEndsAt?: Date;
  applicationPeriodBeginsAt?: Date;
} = {}): ApplicationRoundNode {
  // There is an implicit relation between reservationPeriodBeginDate and SearchQuery
  // so not mocking reservationPeriodBeginDate will break search query mock
  if (applicationPeriodBeginsAt.getMilliseconds() !== 0) {
    throw new Error("Application period millis should be 0. You most likely you forgot to set a mock date");
  }
  const reservationPeriodBeginDate = addMonths(applicationPeriodBeginsAt, 1);
  const reservationUnits = createMockReservationUnits({
    nReservationUnits: 10,
  });

  return {
    id: createNodeId("ApplicationRoundNode", pk),
    pk,
    ...generateNameFragment(`ApplicationRound ${pk}`),
    notesWhenApplyingFi: notesWhenApplying ? `${notesWhenApplying} FI` : null,
    notesWhenApplyingEn: notesWhenApplying ? `${notesWhenApplying} EN` : null,
    notesWhenApplyingSv: notesWhenApplying ? `${notesWhenApplying} SV` : null,
    reservationPeriodBeginDate: reservationPeriodBeginDate.toISOString(),
    reservationPeriodEndDate: startOfDay(endOfYear(reservationPeriodBeginDate)).toISOString(),
    publicDisplayBeginsAt: applicationPeriodBeginsAt.toISOString(),
    publicDisplayEndsAt: applicationPeriodEndsAt.toISOString(),
    applicationPeriodBeginsAt: applicationPeriodBeginsAt.toISOString(),
    applicationPeriodEndsAt: applicationPeriodEndsAt.toISOString(),
    status,
    reservationUnits,
    applicationsCount: 0,
    criteriaEn: null,
    criteriaFi: null,
    criteriaSv: null,
    handledAt: null,
    isSettingHandledAllowed: false,
    purposes: [] as const,
    reservationCreationStatus: ApplicationRoundReservationCreationStatusChoice.NotCompleted,
    reservationUnitCount: 10,
    sentAt: null,
    statusTimestamp: null,
    termsOfUse: null,
  };
}

type ApplicationPage4 = ApplicationViewFragment;

export function createMockApplicationViewFragment(props: CreateMockApplicationFragmentProps = {}) {
  const applicationRoundMock = {
    sentAt: new Date().toISOString(),
    status: ApplicationRoundStatusChoice.Open,
    ...generateNameFragment("ApplicationRound"),
    termsOfUse: {
      id: createNodeId("TermsOfUseNode", 1),
      pk: "recurring",
      termsType: TermsOfUseTypeChoices.RecurringTerms,
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
