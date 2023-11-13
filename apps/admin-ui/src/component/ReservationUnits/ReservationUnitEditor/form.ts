import { filterNonNullable } from "common/src/helpers";
import { fromApiDate, toUIDate } from "common/src/common/util";
import {
  ReservationUnitsReservationUnitReservationStartIntervalChoices,
  ReservationUnitsReservationUnitAuthenticationChoices,
  ReservationUnitByPkType,
  ReservationUnitsReservationUnitPricingPricingTypeChoices,
  ReservationUnitsReservationUnitReservationKindChoices,
  ReservationUnitsReservationUnitPricingStatusChoices,
  ReservationUnitsReservationUnitPricingPriceUnitChoices,
  ReservationUnitPricingType,
} from "common/types/gql-types";
import { addDays, format } from "date-fns";

export type PricingFormValues = {
  // pk === 0 means new pricing good decission?
  // pk === 0 fails silently on the backend, but undefined creates a new pricing
  pk: number,
  taxPercentage: {
    pk?: number,
    value: number,
  },
  lowestPrice: number,
  lowestPriceNet: number,
  highestPrice: number,
  highestPriceNet: number,
  pricingType: ReservationUnitsReservationUnitPricingPricingTypeChoices,
  priceUnit?: ReservationUnitsReservationUnitPricingPriceUnitChoices,
  status: ReservationUnitsReservationUnitPricingStatusChoices,
  // TODO this has to be a string because of HDS date input
  // in ui format: "d.M.yyyy"
  begins: string,
}

export type ReservationEditFormValues = {
  // This is actually a choice Weak or Strong
  authentication: ReservationUnitsReservationUnitAuthenticationChoices,
  bufferTimeAfter: number;
  bufferTimeBefore: number;
  maxReservationsPerUser: number;
  maxPersons: number;
  minPersons: number;
  maxReservationDuration: number;
  minReservationDuration: number;
  pk: number;
  // priceUnit: string;
  // Date in string format
  publishBeginsDate: string;
  publishBeginsTime: string;
  publishEndsDate: string;
  publishEndsTime: string;
  // Date in string format
  reservationBeginsDate: string;
  reservationBeginsTime: string;
  reservationEndsDate: string;
  reservationEndsTime: string;
  requireIntroduction: boolean;
  requireReservationHandling: boolean;
  reservationStartInterval: ReservationUnitsReservationUnitReservationStartIntervalChoices;
  unitPk: number;
  canApplyFreeOfCharge: boolean;
  reservationsMinDaysBefore: number;
  reservationsMaxDaysBefore: number;
  reservationKind: ReservationUnitsReservationUnitReservationKindChoices;
  contactInformation: string;
  reservationPendingInstructionsFi: string;
  reservationPendingInstructionsEn: string;
  reservationPendingInstructionsSv: string;
  reservationConfirmedInstructionsFi: string;
  reservationConfirmedInstructionsEn: string;
  reservationConfirmedInstructionsSv: string;
  reservationCancelledInstructionsFi: string;
  reservationCancelledInstructionsEn: string;
  reservationCancelledInstructionsSv: string;
  descriptionFi: string;
  descriptionEn: string;
  descriptionSv: string;
  nameFi: string;
  nameEn: string;
  nameSv: string;
  termsOfUseFi: string;
  termsOfUseEn: string;
  termsOfUseSv: string;
  spacePks:number[];
  resourcePks:number[];
  equipmentPks:number[];
  purposePks: number[];
  qualifierPks: number[];
  paymentTypes: string[];
  // TODO this can be undefined because we are registering / unregistering these
  pricings: PricingFormValues[];
  reservationUnitTypePk?: number;
  cancellationRulePk?: number;
  // Terms pks are actually slugs
  paymentTermsPk?: string;
  pricingTerms?: string;
  cancellationTermsPk?: string;
  serviceSpecificTermsPk?: string;
  metadataSetPk?: number;
  surfaceArea: number;
  // internal values
  isDraft: boolean;
  isArchived: boolean;
  hasFuturePricing: boolean;
}

export const convert = (data?: ReservationUnitByPkType): ReservationEditFormValues => {
  return {
    bufferTimeAfter: data?.bufferTimeAfter ?? 0,
    bufferTimeBefore: data?.bufferTimeBefore ?? 0,
    maxReservationsPerUser: data?.maxReservationsPerUser ?? 0,
    maxPersons: data?.maxPersons ?? 0,
    minPersons: data?.minPersons ?? 0,
    maxReservationDuration: data?.maxReservationDuration ?? 0,
    minReservationDuration: data?.minReservationDuration ?? 0,
    pk: data?.pk ?? 0,
    // TODO
    // priceUnit: "", // data?.priceUnit ?? "",
    // Date split for ui components
    publishBeginsDate: data?.publishBegins ? format(new Date(data.publishBegins), "d.M.yyyy") : "",
    publishBeginsTime: data?.publishBegins ? format(new Date(data.publishBegins), "h:mm") : "",
    publishEndsDate: data?.publishEnds ? format(new Date(data.publishEnds), "d.M.yyyy") : "",
    publishEndsTime: data?.publishEnds ? format(new Date(data.publishEnds), "H:mm") : "",
    reservationBeginsDate: data?.reservationBegins ? format(new Date(data.reservationBegins), "d.M.yyyy") : "",
    reservationBeginsTime: data?.reservationBegins ? format(new Date(data.reservationBegins), "H:mm") : "",
    reservationEndsDate: data?.reservationEnds ? format(new Date(data.reservationEnds), "d.M.yyyy") : "",
    reservationEndsTime: data?.reservationEnds ? format(new Date(data.reservationEnds), "H:mm") : "",
    requireIntroduction: data?.requireIntroduction ?? false,
    requireReservationHandling: data?.requireReservationHandling ?? false,
    reservationStartInterval: data?.reservationStartInterval ?? ReservationUnitsReservationUnitReservationStartIntervalChoices.Interval_15Mins,
    unitPk: data?.unit?.pk ?? 0,
    canApplyFreeOfCharge: data?.canApplyFreeOfCharge ?? false,
    reservationsMinDaysBefore: data?.reservationsMinDaysBefore ?? 0,
    reservationsMaxDaysBefore: data?.reservationsMaxDaysBefore ?? 0,
    reservationKind: data?.reservationKind ?? ReservationUnitsReservationUnitReservationKindChoices.DirectAndSeason,
    contactInformation: data?.contactInformation ?? "",
    reservationPendingInstructionsFi: data?.reservationPendingInstructionsFi ?? "",
    reservationPendingInstructionsEn: data?.reservationPendingInstructionsEn ?? "",
    reservationPendingInstructionsSv: data?.reservationPendingInstructionsSv ?? "",
    reservationConfirmedInstructionsFi: data?.reservationConfirmedInstructionsFi ?? "",
    reservationConfirmedInstructionsEn: data?.reservationConfirmedInstructionsEn ?? "",
    reservationConfirmedInstructionsSv: data?.reservationConfirmedInstructionsSv ?? "",
    reservationCancelledInstructionsFi: data?.reservationCancelledInstructionsFi ?? "",
    reservationCancelledInstructionsEn: data?.reservationCancelledInstructionsEn ?? "",
    reservationCancelledInstructionsSv: data?.reservationCancelledInstructionsSv ?? "",
    descriptionFi: data?.descriptionFi ?? "",
    descriptionEn: data?.descriptionEn ?? "",
    descriptionSv: data?.descriptionSv ?? "",
    nameFi: data?.nameFi ?? "",
    nameEn: data?.nameEn ?? "",
    nameSv: data?.nameSv ?? "",
    termsOfUseFi: data?.termsOfUseFi ?? "",
    termsOfUseEn: data?.termsOfUseEn ?? "",
    termsOfUseSv: data?.termsOfUseSv ?? "",
    // spacePks: data?.spaces?.map((s) => s?.pk) ?? [],
    spacePks: filterNonNullable(data?.spaces?.map((s) => s?.pk)),
    // resourcePks: data?.resources?.map((r) => r?.pk) ?? [],
    resourcePks: filterNonNullable(data?.resources?.map((r) => r?.pk)),
    equipmentPks: filterNonNullable(data?.equipment?.map((e) => e?.pk)),
    purposePks: filterNonNullable(data?.purposes?.map((p) => p?.pk)),
    qualifierPks: filterNonNullable(data?.qualifiers?.map((q) => q?.pk)),
    // paymentTermsPk: data?.paymentTerms?.pk ?? undefined,
    paymentTermsPk: data?.paymentTerms?.pk ?? undefined,
    surfaceArea: data?.surfaceArea ?? 0,
    // paymentTypes: data?.paymentTerms?
    authentication: data?.authentication ?? ReservationUnitsReservationUnitAuthenticationChoices.Weak,
    reservationUnitTypePk: data?.reservationUnitType?.pk ?? undefined,
    metadataSetPk: data?.metadataSet?.pk ?? undefined,
    pricingTerms: data?.pricingTerms?.pk ?? undefined,
    cancellationTermsPk: data?.cancellationTerms?.pk ?? undefined,
    cancellationRulePk: data?.cancellationRule?.pk ?? undefined,
    paymentTypes: filterNonNullable(data?.paymentTypes?.map((pt) => pt?.code)),
    pricings: convertPricingList(filterNonNullable(data?.pricings)),
    isDraft: data?.isArchived ?? false,
    isArchived: data?.isArchived ?? false,
    hasFuturePricing: data?.pricings?.some((p) => p?.status != null && p?.status === ReservationUnitsReservationUnitPricingStatusChoices.Future) ?? false,
  };
}

// NOTE decimal type is incorrectly typed as number in codegen
const convertMaybeDecimal = (value?: unknown) => {
  if (value == null || value === "") {
    return undefined;
  }
  return Number(value);
}

const convertPricing = (p?: ReservationUnitPricingType): PricingFormValues => {
  const convertBegins = (begins?: string, status?: ReservationUnitsReservationUnitPricingStatusChoices) => {
    const d = begins != null && begins !== "" ? fromApiDate(begins) : undefined;
    const today = new Date();
    if (d != null) {
      return toUIDate(d);
    }
    if (status === ReservationUnitsReservationUnitPricingStatusChoices.Future) {
      return toUIDate(addDays(today, 1));
    }
    return toUIDate(today);
  }

  return {
    pk: p?.pk ?? 0,
    taxPercentage: {
      pk: p?.taxPercentage?.pk ?? undefined,
      value: convertMaybeDecimal(p?.taxPercentage?.value) ?? 0,
    },
    lowestPrice: convertMaybeDecimal(p?.lowestPrice) ?? 0,
    lowestPriceNet: convertMaybeDecimal(p?.lowestPriceNet) ?? 0,
    highestPrice: convertMaybeDecimal(p?.highestPrice) ?? 0,
    highestPriceNet: convertMaybeDecimal(p?.highestPriceNet) ?? 0,
    pricingType: p?.pricingType ?? ReservationUnitsReservationUnitPricingPricingTypeChoices.Free,
    priceUnit: p?.priceUnit ?? undefined,
    status: p?.status ?? ReservationUnitsReservationUnitPricingStatusChoices.Active,
    begins: convertBegins(p?.begins, p?.status),
  }
}

// Don't return past pricings (they can't be saved to backend)
// Always return one active pricing and one future pricing
// the boolean toggle in the form decides if the future one is shown or saved
const convertPricingList = (pricings: ReservationUnitPricingType[]): PricingFormValues[] => {
  // Past pricing can't be saved and is not displayed in the UI
  const notPast = pricings?.filter((p) => p?.status !== ReservationUnitsReservationUnitPricingStatusChoices.Past)
  // Only one active and one future pricing can be saved (and is actually shown)
  const active = notPast.find((p) => p?.status === ReservationUnitsReservationUnitPricingStatusChoices.Active)
  // TODO cleanup casting with a default values
  const future = notPast.find((p) => p?.status === ReservationUnitsReservationUnitPricingStatusChoices.Future)
    ?? { status: ReservationUnitsReservationUnitPricingStatusChoices.Future } as ReservationUnitPricingType;
  // allow undefined's here so we create two default values always
  const ret = [active, future].map(convertPricing);
  return ret
}
