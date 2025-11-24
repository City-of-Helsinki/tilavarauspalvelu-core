import { addDays, addYears, endOfDay, startOfDay, startOfToday } from "date-fns";
import { formatApiDateUnsafe } from "ui/src/modules/date-utils";
import { createNodeId } from "ui/src/modules/helpers";
import { ReservableMap } from "@/modules/reservable";
import type { RoundPeriod } from "@/modules/reservable";
import {
  AuthenticationType,
  ReservationUnitImageType,
  ReservationFormType,
  ReservationKind,
  ReservationStartInterval,
  ReservationUnitPublishingState,
  ReservationUnitReservationState,
  Weekday,
} from "@gql/gql-types";
import type {
  ApplicationRoundTimeSlotNode,
  IsReservableFieldsFragment,
  ReservationUnitNode,
  UnitNode,
} from "@gql/gql-types";
import { createMockReservationUnitType, generateDescriptionFragment, generateNameFragment } from "./test.gql.utils";

type ReservationUnitType = Omit<IsReservableFieldsFragment, "reservableTimeSpans">;
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

export function createMockReservableTimes(): ReservableMap {
  const map: ReservableMap = new Map();
  for (let i = 0; i < 30; i++) {
    const date = addDays(startOfToday(), i);
    const key = formatApiDateUnsafe(date);
    // TODO need to have holes in this
    const value = [{ start: startOfDay(date), end: endOfDay(date) }];
    map.set(key, value);
  }
  return map;
}

/// create a mock for IsReservableFragment (not a full reservation unit)
export function createMockIsReservableFieldsFragment({
  bufferTimeBefore = 0,
  bufferTimeAfter = 0,
  interval = ReservationStartInterval.Interval_15Minutes,
  maxReservationDuration = 0,
  minReservationDuration = 0,
  reservationsMinDaysBefore = 0,
  reservationsMaxDaysBefore = null,
}: MockReservationUnitProps): ReservationUnitType {
  return {
    id: "1",
    bufferTimeBefore: 60 * 60 * bufferTimeBefore,
    bufferTimeAfter: 60 * 60 * bufferTimeAfter,
    maxReservationDuration,
    minReservationDuration,
    reservationStartInterval: interval,
    reservationsMaxDaysBefore,
    reservationsMinDaysBefore,
    reservationBeginsAt: addDays(new Date(), -1).toISOString(),
    reservationEndsAt: addDays(new Date(), 180).toISOString(),
  };
}

export function createMockReservationUnit({ pk }: { pk: number }): ReservationUnitNode {
  const timeSelector: ApplicationRoundTimeSlotNode = {
    id: createNodeId("ApplicationRoundTimeSlotNode", 1),
    pk,
    weekday: Weekday.Tuesday,
    isClosed: false,
    reservableTimes: [
      {
        begin: "08:00",
        end: "16:00",
      },
    ],
  };
  return {
    id: createNodeId("ReservationUnitNode", pk),
    pk,
    ...generateNameFragment(`ReservationUnit ${pk}`),
    // TODO this is weird
    reservationBeginsAt: addYears(new Date(), -1 * pk).toISOString(),
    reservationEndsAt: addYears(new Date(), 1 * pk).toISOString(),
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
        id: createNodeId("Image", 1),
        pk: 1,
        imageUrl: "https://example.com/image1.jpg",
        largeUrl: "https://example.com/image1_large.jpg",
        mediumUrl: "https://example.com/image1_medium.jpg",
        smallUrl: "https://example.com/image1_small.jpg",
        imageType: ReservationUnitImageType.Main,
      },
    ] as const,
    accessTypes: [],
    // Everything below is only for completeness of the mock type (not used for application tests)
    // TODO this can be removed
    allowReservationsWithoutOpeningHours: false,
    // applicationRoundTimeSlots: [] as const, // ReadonlyArray<ApplicationRoundTimeSlotNode>;
    applicationRoundTimeSlots: [timeSelector],
    applicationRounds: [] as const, // ReadonlyArray<ApplicationRoundNode>;
    authentication: AuthenticationType.Weak,
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
    publishBeginsAt: null, // Maybe<Scalars["DateTime"]["output"]>;
    publishEndsAt: null, // Maybe<Scalars["DateTime"]["output"]>;
    publishingState: ReservationUnitPublishingState.Published,
    intendedUses: [] as const, // ReadonlyArray<IntendedUseNode>;
    rank: pk, // Scalars["Int"]["output"];
    requireAdultReservee: true, // Scalars["Boolean"]["output"];
    requireReservationHandling: false, // Scalars["Boolean"]["output"];
    reservableTimeSpans: [] as const, // Maybe<ReadonlyArray<ReservableTimeSpanType>>;
    reservationBlockWholeDay: false, // Scalars["Boolean"]["output"];
    reservationCancelledInstructionsEn: null /* Maybe< Scalars["String"]["output"] >;*/,
    reservationCancelledInstructionsFi: null, // Maybe< Scalars["String"]["output"] >;
    reservationCancelledInstructionsSv: null, // Maybe< Scalars["String"]["output"] >;
    reservationConfirmedInstructionsEn: null, // Maybe< Scalars["String"]["output"] >;
    reservationConfirmedInstructionsFi: null, // Maybe< Scalars["String"]["output"] >;
    reservationConfirmedInstructionsSv: null, // Maybe< Scalars["String"]["output"] >;
    reservationKind: ReservationKind.DirectAndSeason,
    reservationPendingInstructionsEn: null, // Maybe<Scalars["String"]["output"]>;
    reservationPendingInstructionsFi: null, // Maybe<Scalars["String"]["output"]>;
    reservationPendingInstructionsSv: null, // Maybe<Scalars["String"]["output"]>;
    reservationStartInterval: ReservationStartInterval.Interval_30Minutes,
    reservationState: ReservationUnitReservationState.Reservable,
    reservations: null, //Maybe<ReadonlyArray<ReservationNode>>;
    reservationsMaxDaysBefore: null, // Maybe<Scalars["Int"]["output"]>;
    reservationsMinDaysBefore: null, // Maybe<Scalars["Int"]["output"]>;
    resources: [] as const, // ReadonlyArray<ResourceNode>;
    searchTerms: [] as const, // ReadonlyArray<Scalars["String"]["output"]>;
    serviceSpecificTerms: null, // Maybe<TermsOfUseNode>;
    spaces: [] as const, // ReadonlyArray<SpaceNode>;
    surfaceArea: null, // Maybe<Scalars["Int"]["output"]>;
    notesWhenApplyingEn: null, // Maybe<Scalars["String"]["output"]>;
    notesWhenApplyingFi: null, // Maybe<Scalars["String"]["output"]>;
    notesWhenApplyingSv: null, // Maybe<Scalars["String"]["output"]>;
    extUuid: "dummy-uuid", // Scalars["UUID"]["output"];
    reservationForm: ReservationFormType.ReserveeInfoForm,
  };
}

function createMockUnit({ pk }: { pk: number }): UnitNode {
  return {
    id: createNodeId("UnitNode", 1),
    pk, // Maybe<Scalars["Int"]["output"]>;
    ...generateNameFragment(`Unit ${pk}`),
    ...generateDescriptionFragment(`Unit Description ${pk}`),
    email: "", // Scalars["String"]["output"];
    addressCityEn: null,
    addressCityFi: null,
    addressCitySv: null,
    addressStreetEn: null,
    addressStreetFi: null,
    addressStreetSv: null,
    addressZip: "",
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
