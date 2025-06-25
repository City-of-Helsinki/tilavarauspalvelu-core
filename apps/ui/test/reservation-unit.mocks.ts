import {
  type ApplicationRoundTimeSlotNode,
  Authentication,
  ImageType,
  type IsReservableFieldsFragment,
  ReservationKind,
  ReservationStartInterval,
  type ReservationUnitNode,
  ReservationUnitPublishingState,
  ReservationUnitReservationState,
  type UnitNode,
} from "@/gql/gql-types";
import { ReservableMap, type RoundPeriod } from "@/modules/reservable";
import { base64encode } from "common/src/helpers";
import { addDays, addYears, endOfDay, format, startOfDay, startOfToday } from "date-fns";
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
    const key = format(date, "yyyy-MM-dd");
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

export function createMockReservationUnit({ pk }: { pk: number }): ReservationUnitNode {
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
