import { filterNonNullable } from "common/src/helpers";
import { fromApiDate } from "common/src/common/util";
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
import { format } from "date-fns";

export type PricingFormValues = {
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
  begins: Date,
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
    pricings: convertPricings(filterNonNullable(data?.pricings)),
    isDraft: false,
    isArchived: false,
  };
}

// Always return at least one active or future pricing
// TODO? should we return one active always (not counting the future ones)
// Don't return past pricings (they can't be saved to backend)
const convertPricings = (pricings: ReservationUnitPricingType[]): PricingFormValues[] => {
  const notPast = pricings?.filter((p) => p?.status !== ReservationUnitsReservationUnitPricingStatusChoices.Past)
  if (notPast.length > 0) {
    return notPast.map((p) => ({
      pk: p?.pk ?? 0,
      taxPercentage: {
        pk: p?.taxPercentage.pk ?? undefined,
        value: p?.taxPercentage.value ?? 0,
      },
      lowestPrice: p?.lowestPrice ?? 0,
      lowestPriceNet: p?.lowestPriceNet ?? 0,
      highestPrice: p?.highestPrice ?? 0,
      highestPriceNet: p?.highestPriceNet ?? 0,
      pricingType: p?.pricingType ?? ReservationUnitsReservationUnitPricingPricingTypeChoices.Free,
      priceUnit: p?.priceUnit ?? undefined,
      status: p?.status ?? ReservationUnitsReservationUnitPricingStatusChoices.Active,
      begins: p?.begins ? fromApiDate(p.begins) : new Date(),
    }))
  }

  return [{
    pk: 0,
    taxPercentage: {
      pk: undefined,
      value: 0,
    },
    lowestPrice: 0,
    lowestPriceNet: 0,
    highestPrice: 0,
    highestPriceNet: 0,
    pricingType: ReservationUnitsReservationUnitPricingPricingTypeChoices.Free,
    priceUnit: undefined,
    status: ReservationUnitsReservationUnitPricingStatusChoices.Active,
    begins: new Date(),
  }]
}
