import { generateNameFragment } from "@test/test.gql.utils";
import { createNodeId } from "ui/src/modules/helpers";
import {
  AccessType,
  ReservationUnitImageType,
  type ReservationFormFieldsFragment,
  MunicipalityChoice,
  OrderStatus,
  type PaymentOrderNode,
  PaymentType,
  PriceUnit,
  ReservationCancelReasonChoice,
  type ReservationPageQuery,
  ReservationStateChoice,
  ReservationTypeChoice,
  ReserveeType,
  TermsOfUseTypeChoices,
  ReservationFormType,
} from "@gql/gql-types";

export function generateTextFragment(text: string) {
  return {
    textFi: `${text} FI`,
    textSv: `${text} SV`,
    textEn: `${text} EN`,
  };
}

export function generateDescriptionFragment(description: string) {
  return {
    descriptionFi: `${description} FI`,
    descriptionSv: `${description} SV`,
    descriptionEn: `${description} EN`,
  };
}

export function generatePurposeFragment(name: string) {
  return {
    id: createNodeId("PurposeNode", 1),
    pk: 1,
    ...generateNameFragment(name),
  };
}

export function generateAgeGroupFragment(props: { id: number; min: number; max: number }) {
  const { id, min, max } = props;
  return {
    id: createNodeId("AgeGroupNode", id),
    pk: id,
    minimum: min,
    maximum: max,
  };
}

export type MockReservationProps = {
  pk?: number;
  state?: ReservationStateChoice;
  beginsAt?: string;
  endsAt?: string;
  isHandled?: boolean;
  type?: ReservationTypeChoice;
  price?: string;
  paymentOrder?: ReservationPaymentOrderFragment & { handledPaymentDueBy: string };
  appliedPricing?: { highestPrice: string; taxPercentage: string };
  cancellable?: boolean;
  canApplyFreeOfCharge?: boolean;
  applyingForFreeOfCharge?: boolean;
  reservationConfirmedInstructions?: string;
  cancellationTerms?: {
    id: string;
    textFi: string;
    textSv: string;
    textEn: string;
  } | null;
  paymentTerms?: {
    id: string;
    textFi: string;
    textSv: string;
    textEn: string;
  } | null;
  pricingTerms?: {
    id: string;
    nameFi: string;
    nameSv: string;
    nameEn: string;
    textFi: string;
    textSv: string;
    textEn: string;
  } | null;
  serviceSpecificTerms?: {
    id: string;
    textFi: string;
    textSv: string;
    textEn: string;
  } | null;
};

export type ReservationPaymentOrderFragment = Pick<
  PaymentOrderNode,
  "id" | "reservationPk" | "status" | "paymentType" | "receiptUrl" | "checkoutUrl"
>;

export function createMockReservation(
  props: MockReservationProps
): Readonly<NonNullable<ReservationPageQuery["reservation"]>> {
  const {
    applyingForFreeOfCharge = false,
    reservationConfirmedInstructions = "Test confirmed instructions",
    beginsAt = new Date(2024, 0, 1, 10, 0, 0, 0).toISOString(),
    canApplyFreeOfCharge = true,
    cancellable = false,
    cancellationTerms = {
      id: createNodeId("CancellationTermsNode", 1),
      ...generateTextFragment("Test cancellation terms"),
    },
    endsAt = new Date(2024, 0, 1, 12, 0, 0, 0).toISOString(),
    isHandled = true,
    paymentOrder = {
      id: "1",
      reservationPk: `${1}`,
      status: OrderStatus.PaidManually,
      paymentType: PaymentType.OnSite,
      receiptUrl: "https://example.com/receipt",
      checkoutUrl: "https://example.com/checkout",
      handledPaymentDueBy: new Date(2024, 0, 1, 12, 0, 0, 0).toISOString(),
    },
    paymentTerms = {
      id: createNodeId("PaymentTermsNode", 1),
      ...generateTextFragment("Test payment terms"),
    },
    appliedPricing = {
      id: createNodeId("AppliedPricingNode", 1),
      begins: new Date(2000, 0, 1, 0, 0, 0, 0).toISOString(),
      priceUnit: PriceUnit.PerHour,
      paymentType: PaymentType.Online,
      highestPrice: "10.0",
      lowestPrice: "0.0",
      taxPercentage: "24.5",
    },
    pk = 1,
    price = "10.0",
    pricingTerms = {
      id: createNodeId("PricingTermsNode", 1),
      ...generateNameFragment("Test Pricing Terms"),
      ...generateTextFragment("Test pricing terms text"),
    },
    serviceSpecificTerms = {
      id: createNodeId("ServiceSpecificTermsNode", 1),
      ...generateTextFragment("Test service specific terms"),
    },
    state = ReservationStateChoice.Confirmed,
    type = ReservationTypeChoice.Normal,
  } = props;
  return {
    accessType: AccessType.Unrestricted,
    ageGroup: {
      ...generateAgeGroupFragment({ id: 1, min: 0, max: 100 }),
    },
    applyingForFreeOfCharge: applyingForFreeOfCharge,
    beginsAt: beginsAt,
    calendarUrl: "https://example.com/calendar.ics",
    description: "Test reservation description",
    name: "Name",
    endsAt: endsAt,
    freeOfChargeReason: "Test free of charge reason",
    municipality: MunicipalityChoice.Helsinki,
    id: createNodeId("ReservationNode", pk),
    isHandled: cancellable ? false : isHandled,
    numPersons: 5,
    appliedPricing: appliedPricing,
    paymentOrder: paymentOrder,
    pindoraInfo: null,
    pk: pk,
    price: price,
    cancelReason: ReservationCancelReasonChoice.NotPaid,
    purpose: {
      ...generatePurposeFragment("Test Purpose"),
    },
    reservationSeries: null,
    reservationUnit: {
      id: createNodeId("ReservationUnitNode", 1),
      pk: 1,
      ...generateNameFragment("Test Reservation Unit"),
      ...generateDescriptionFragment("Test reservation unit description"),
      images: [
        {
          id: createNodeId("ReservationUnitImageNode", 1),
          largeUrl: "https://example.com/image-large.jpg",
          mediumUrl: "https://example.com/image-medium.jpg",
          smallUrl: "https://example.com/image-small.jpg",
          imageUrl: "https://example.com/image-image.jpg",
          imageType: ReservationUnitImageType.Main,
        },
      ],
      unit: {
        id: createNodeId("UnitNode", 1),
        pk: 1,
        tprekId: "123456",
        addressZip: "00100",
        addressStreetFi: "Varausyksikkökatu 1",
        addressStreetEn: "Reservation Unit Street 1",
        addressStreetSv: "Varausyksikkögatan 1",
        addressCityFi: "Helsinki",
        addressCityEn: "Helsinki",
        addressCitySv: "Helsingfors",
        ...generateNameFragment("Test Unit"),
      },
      canApplyFreeOfCharge: canApplyFreeOfCharge,
      reservationForm: ReservationFormType.PurposeForm,
      reservationPendingInstructionsFi: "Test pending instructions FI",
      reservationPendingInstructionsEn: "Test pending instructions EN",
      reservationPendingInstructionsSv: "Test pending instructions SV",
      reservationConfirmedInstructionsFi: `${reservationConfirmedInstructions} FI`,
      reservationConfirmedInstructionsEn: `${reservationConfirmedInstructions} EN`,
      reservationConfirmedInstructionsSv: `${reservationConfirmedInstructions} SV`,
      reservationCancelledInstructionsFi: "Test cancelled instructions FI",
      reservationCancelledInstructionsEn: "Test cancelled instructions EN",
      reservationCancelledInstructionsSv: "Test cancelled instructions SV",
      notesWhenApplyingFi: "Test terms of use FI",
      notesWhenApplyingEn: "Test terms of use EN",
      notesWhenApplyingSv: "Test terms of use SV",
      serviceSpecificTerms: serviceSpecificTerms,
      cancellationTerms: cancellationTerms,
      paymentTerms: paymentTerms,
      pricingTerms: pricingTerms,
      reservationBeginsAt: null,
      reservationEndsAt: null,
      pricings: [
        {
          id: createNodeId("PricingNode", 1),
          begins: new Date(2000, 0, 1, 0, 0, 0, 0).toISOString(),
          priceUnit: PriceUnit.PerHour,
          paymentType: PaymentType.Online,
          highestPrice: price,
          lowestPrice: "0.0",
          taxPercentage: {
            id: createNodeId("TaxPercentageNode", 1),
            pk: 1,
            value: "24.5",
          },
          materialPriceDescriptionFi: "Testimateriaali FI",
          materialPriceDescriptionEn: "Test material EN",
          materialPriceDescriptionSv: "Testmaterial SV",
        },
      ],
      cancellationRule: cancellable
        ? {
            id: createNodeId("ReservationUnitCancellationRuleNode", 1),
            canBeCancelledTimeBefore: 0,
            ...generateNameFragment("Test cancelation rule"),
          }
        : null,
    },
    reserveeEmail: "teppo.testaaja@hel.fi",
    reserveeFirstName: "Teppo",
    reserveeLastName: "Testaaja",
    reserveeIdentifier: "1",
    reserveeOrganisationName: "Test Organisation",
    reserveePhone: "0401234567",
    reserveeType: ReserveeType.Individual,
    state: state,
    taxPercentageValue: "24.5",
    type: type,
  } as const;
}

export function createTermsOfUseMock() {
  return {
    genericTerms: {
      id: createNodeId("TermsOfUseNode", 1),
      pk: "1",
      termsType: TermsOfUseTypeChoices.Generic,
      ...generateNameFragment("TermsOfUse name"),
      ...generateTextFragment("Test terms of use"),
    },
  };
}

export const future1hReservation = () => ({
  beginsAt: new Date(2024, 0, 7, 9, 0, 0).toISOString(),
  endsAt: new Date(2024, 0, 7, 10, 0, 0).toISOString(),
});

export const reservationRenderProps = (
  variant:
    | "default"
    | "inThePast"
    | "canBeCancelled"
    | "canBeMoved"
    | "cancelled"
    | "denied"
    | "confirmed"
    | "requiresHandling"
    | "waitingForPayment" = "default",
  paymentStatus: OrderStatus = OrderStatus.Paid,
  receiptUrl: string | null = "https://example.com/receipt"
) => {
  switch (variant) {
    case "inThePast":
      return {
        state: ReservationStateChoice.Confirmed,
        begin: new Date(2023, 0, 1, 9, 0, 0).toISOString(),
        end: new Date(2023, 0, 1, 10, 0, 0).toISOString(),
      };
    case "canBeCancelled":
      return {
        state: ReservationStateChoice.Confirmed,
        ...future1hReservation(),
        isHandled: false,
        type: ReservationTypeChoice.Normal,
        cancellable: true,
      };
    case "canBeMoved":
      return {
        state: ReservationStateChoice.Confirmed,
        ...future1hReservation(),
        isHandled: false,
        type: ReservationTypeChoice.Normal,
        price: "0",
      };
    case "cancelled":
      return {
        state: ReservationStateChoice.Cancelled,
        ...future1hReservation(),
      };
    case "denied":
      return {
        state: ReservationStateChoice.Denied,
        ...future1hReservation(),
      };
    case "confirmed":
      return {
        state: ReservationStateChoice.Confirmed,
        ...future1hReservation(),
      };
    case "requiresHandling":
      return {
        state: ReservationStateChoice.RequiresHandling,
        ...future1hReservation(),
        isHandled: false,
      };
    case "waitingForPayment":
      return {
        state: ReservationStateChoice.WaitingForPayment,
        ...future1hReservation(),
        price: "40.0",
        paymentOrder: {
          id: "1",
          reservationPk: "1",
          status: paymentStatus,
          paymentType: PaymentType.OnlineOrInvoice,
          receiptUrl: receiptUrl,
          checkoutUrl: "https://example.com/checkout",
          handledPaymentDueBy: new Date(2024, 0, 1, 12, 0, 0).toISOString(),
        },
      };
    case "default":
    default:
      // Set all available attribute defaults
      return {
        pk: 1,
        state: ReservationStateChoice.Confirmed,
        begin: new Date(2024, 0, 1, 9, 0, 0).toISOString(),
        end: new Date(2024, 0, 1, 10, 0, 0).toISOString(),
        isHandled: true,
        type: ReservationTypeChoice.Normal,
        price: "10.0",
        cancellable: false,
        paymentOrder: {
          id: "1",
          reservationPk: "1",
          status: paymentStatus,
          paymentType: PaymentType.OnlineOrInvoice,
          receiptUrl: receiptUrl,
          checkoutUrl: "https://example.com/checkout",
          handledPaymentDueBy: new Date(2024, 0, 1, 12, 0, 0).toISOString(),
        },
      };
  }
};

export function createReservationPageMock({
  pk = reservationRenderProps().pk,
  state = reservationRenderProps().state,
  begin = reservationRenderProps().begin,
  end = reservationRenderProps().end,
  isHandled = reservationRenderProps().isHandled,
  type = reservationRenderProps().type,
  price = reservationRenderProps().price,
  paymentOrder = reservationRenderProps().paymentOrder,
  cancellable = reservationRenderProps().cancellable,
}: {
  pk?: number;
  state?: ReservationStateChoice;
  begin?: string;
  end?: string;
  isHandled?: boolean;
  type?: ReservationTypeChoice;
  price?: string;
  paymentOrder?: ReservationPaymentOrderFragment & { handledPaymentDueBy: string };
  cancellable?: boolean;
}): Readonly<NonNullable<ReservationPageQuery["reservation"]>> {
  return createMockReservation({
    pk,
    state: state,
    beginsAt: begin,
    endsAt: end,
    isHandled: isHandled,
    type: type,
    price: price,
    paymentOrder: paymentOrder,
    cancellable: cancellable,
  });
}

export function createOptionsMock() {
  return {
    purpose: [
      {
        label: "Test purpose FI",
        value: 1,
      },
      {
        label: "Another purpose FI",
        value: 2,
      },
      {
        label: "Third purpose FI",
        value: 3,
      },
    ],
    ageGroup: [
      {
        label: "1 - 15",
        value: 1,
      },
      {
        label: "16 - 30",
        value: 2,
      },
      {
        label: "31 - 50",
        value: 3,
      },
      {
        label: "51+",
        value: 4,
      },
    ],
    municipality: [
      {
        label: "Helsinki",
        value: MunicipalityChoice.Helsinki,
      },
      {
        label: "Muu",
        value: MunicipalityChoice.Other,
      },
    ],
  };
}

export function createMetaFieldsFragment(type: ReserveeType = ReserveeType.Company): ReservationFormFieldsFragment {
  return {
    id: "1",
    description: "Test description",
    name: "Name",
    numPersons: 4,
    purpose: { ...generatePurposeFragment("Test purpose") },
    ageGroup: { ...generateAgeGroupFragment({ id: 1, min: 1, max: 15 }) },
    applyingForFreeOfCharge: false,
    freeOfChargeReason: null,
    reserveeType: type,
    reserveeFirstName: "Teppo",
    reserveeLastName: "Testicle",
    reserveePhone: "123456789",
    reserveeEmail: "teppo.testicle@hel.fi",
    reserveeIdentifier: type === ReserveeType.Company ? "1234567-8" : null,
    reserveeOrganisationName: "Test Organisation",
    municipality: MunicipalityChoice.Helsinki,
    reservationUnit: {
      reservationForm: ReservationFormType.PurposeForm,
    },
  };
}

// TODO use ReservationFormType (getFormFields)
export function createSupportedFieldsMock(type: ReserveeType | "reservation" = "reservation") {
  // We need to include the reserveeType field in the supported fields
  // so that the application fields can be rendered correctly.
  if (type === "reservation") {
    return ["reserveeType", "numPersons", "purpose", "ageGroup"] as const;
  }
  const baseReserveeFields = [
    "reserveeType",
    "reserveeFirstName",
    "reserveeLastName",
    "reserveePhone",
    "reserveeEmail",
  ] as const;
  switch (type) {
    case ReserveeType.Nonprofit:
      return [...baseReserveeFields, "reserveeOrganisationName"] as const;
    case ReserveeType.Company:
      return [...baseReserveeFields, "reserveeOrganisationName", "reserveeIdentifier"] as const;
    case ReserveeType.Individual:
      return baseReserveeFields;
  }
}
