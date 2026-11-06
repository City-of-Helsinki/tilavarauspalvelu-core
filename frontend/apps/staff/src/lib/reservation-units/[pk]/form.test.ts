import { addDays } from "date-fns";
import { describe, expect, it } from "vitest";
import { formatApiDate, formatDate } from "ui/src/modules/date-utils";
import {
  AccessType,
  PaymentType,
  PriceUnit,
  ReservationFormType,
  ReservationKind,
  ReservationStartInterval,
  TermsOfUseTypeChoices,
  Weekday,
} from "@gql/gql-types";
import type { ReservationUnitEditQuery } from "@gql/gql-types";
import {
  BUFFER_TIME_OPTIONS,
  convertReservationUnit,
  ReservationUnitEditSchema,
  transformReservationUnit,
} from "./form";
import type { ReservationUnitEditFormValues } from "./form";

type QueryData = NonNullable<ReservationUnitEditQuery["reservationUnit"]>;

const TAX_OPTIONS = [{ label: "Yleinen (25,5 %)", pk: 1, percentage: 25.5 }];

// Non-null array access helper: avoids `!` (banned by lint) while still failing loudly
// (instead of silently continuing with `undefined`) if the index doesn't exist.
function at<T>(arr: T[], index: number): T {
  const item = arr[index];
  if (item == null) {
    throw new Error(`Expected an item at index ${index}`);
  }
  return item;
}

// A minimal (but publish-ready) set of values for the schema: names/descriptions in all
// languages, at least one space, an access type, a reservation unit type and reservation
// duration bounds that are valid multiples of the (default 15 minute) start interval.
function createValidFormValues(overrides: Partial<ReservationUnitEditFormValues> = {}): ReservationUnitEditFormValues {
  const base = convertReservationUnit(undefined);
  return {
    ...base,
    nameFi: "Nimi",
    nameEn: "Name",
    nameSv: "Namn",
    descriptionFi: "Kuvaus",
    descriptionEn: "Description",
    descriptionSv: "Beskrivning",
    spaces: [1],
    reservationUnitType: 1,
    reservationForm: ReservationFormType.ReserveeInfoForm,
    minReservationDuration: 3600,
    maxReservationDuration: 7200,
    reservationsMaxDaysBefore: 180,
    accessTypes: [{ pk: 1, accessType: AccessType.Unrestricted, beginDate: formatDate(new Date()) }],
    ...overrides,
  };
}

describe("BUFFER_TIME_OPTIONS", () => {
  it("does not include blocksWholeDay (not supported by the customer ui)", () => {
    expect(BUFFER_TIME_OPTIONS).toEqual(["noBuffer", "bufferTimesSet"]);
  });
});

describe("convertReservationUnit", () => {
  it("returns sane defaults when there is no data", () => {
    const values = convertReservationUnit(undefined);
    expect(values.pk).toBe(0);
    expect(values.bufferType).toBe("noBuffer");
    expect(values.isDraft).toBe(false);
    expect(values.accessTypes).toEqual([]);
    // always at least 2 pricings: one active and one future
    expect(values.pricings).toHaveLength(2);
    expect(values.pricings.some((p) => p.isFuture)).toBe(true);
    // always all 7 weekdays, each with a single empty (unregistered) time slot
    expect(values.seasons).toHaveLength(7);
    for (const season of values.seasons) {
      expect(season.reservableTimes).toEqual([{ begin: "", end: "" }]);
      expect(season.closed).toBe(false);
    }
  });

  it("derives bufferType from reservationBlockWholeDay and the individual buffers", () => {
    const blocksWholeDay = convertReservationUnit({ reservationBlockWholeDay: true } as QueryData);
    expect(blocksWholeDay.bufferType).toBe("blocksWholeDay");

    const bufferTimesSet = convertReservationUnit({ bufferTimeBefore: 900 } as QueryData);
    expect(bufferTimesSet.bufferType).toBe("bufferTimesSet");

    const noBuffer = convertReservationUnit({} as QueryData);
    expect(noBuffer.bufferType).toBe("noBuffer");
  });

  it("splits publish/reservation datetimes into separate date and time fields and sets the has* flags", () => {
    const values = convertReservationUnit({
      publishBeginsAt: "2024-01-01T10:00:00+02:00",
      reservationEndsAt: "2024-06-15T18:30:00+03:00",
    } as QueryData);
    expect(values.publishBeginsDate).toBe(formatDate(new Date("2024-01-01T10:00:00+02:00")));
    expect(values.publishBeginsTime).not.toBe("");
    expect(values.hasScheduledPublish).toBe(true);
    expect(values.hasPublishBegins).toBe(true);
    expect(values.hasPublishEnds).toBe(false);
    expect(values.hasScheduledReservation).toBe(true);
    expect(values.hasReservationEnds).toBe(true);
    expect(values.hasReservationBegins).toBe(false);
  });

  it("keeps only the latest active pricing plus any future pricings, always at least 2 total", () => {
    const values = convertReservationUnit({
      pricings: [
        {
          pk: 1,
          begins: "2020-01-01",
          highestPrice: "0",
          lowestPrice: "0",
          taxLevel: { pk: 1 },
        },
        {
          pk: 2,
          begins: "2021-01-01",
          highestPrice: "10",
          lowestPrice: "5",
          taxLevel: { pk: 3 },
        },
      ],
    } as unknown as QueryData);
    // only the most recent active pricing (pk 2) is kept, a future one is synthesized
    expect(values.pricings.filter((p) => !p.isFuture)).toHaveLength(1);
    expect(values.pricings.find((p) => !p.isFuture)?.pk).toBe(2);
    expect(values.pricings.find((p) => !p.isFuture)?.taxLevel).toBe(3);
    expect(values.pricings.some((p) => p.isFuture)).toBe(true);
  });

  it("converts access types and application round time slots", () => {
    const values = convertReservationUnit({
      accessTypes: [{ pk: 5, accessType: AccessType.AccessCode, beginDate: "2024-05-01" }],
      applicationRoundTimeSlots: [
        {
          weekday: Weekday.Monday,
          isClosed: false,
          reservableTimes: [{ begin: "08:00:00", end: "10:00:00" }],
        },
      ],
    } as unknown as QueryData);
    expect(values.accessTypes).toEqual([
      { pk: 5, accessType: AccessType.AccessCode, beginDate: formatDate(new Date("2024-05-01")) },
    ]);
    const monday = values.seasons.find((s) => s.weekday === Weekday.Monday);
    expect(monday?.reservableTimes).toEqual([{ begin: "08:00", end: "10:00" }]);
  });

  it("records no terms of the wrong type when all terms have the correct type", () => {
    const values = convertReservationUnit({
      pricingTerms: { id: "1", pk: "pricing_a", termsType: TermsOfUseTypeChoices.Pricing },
      paymentTerms: { id: "2", pk: "payment_a", termsType: TermsOfUseTypeChoices.Payment },
      serviceSpecificTerms: { id: "3", pk: "service_a", termsType: TermsOfUseTypeChoices.Service },
      cancellationTerms: { id: "4", pk: "cancel_a", termsType: TermsOfUseTypeChoices.Cancellation },
    } as unknown as QueryData);
    expect(values.pricingTerms).toBe("pricing_a");
    expect(values.paymentTerms).toBe("payment_a");
    expect(values.serviceSpecificTerms).toBe("service_a");
    expect(values.cancellationTerms).toBe("cancel_a");
    expect(values.termsWithWrongType).toEqual({
      pricingTerms: null,
      paymentTerms: null,
      serviceSpecificTerms: null,
      cancellationTerms: null,
    });
  });

  it("keeps terms of the wrong type and records them", () => {
    const values = convertReservationUnit({
      pricingTerms: { id: "1", pk: "pricing_nupa", termsType: TermsOfUseTypeChoices.Payment },
      paymentTerms: { id: "2", pk: "payment_a", termsType: TermsOfUseTypeChoices.Pricing },
      serviceSpecificTerms: { id: "3", pk: "service_a", termsType: TermsOfUseTypeChoices.Payment },
      cancellationTerms: { id: "4", pk: "cancel_a", termsType: TermsOfUseTypeChoices.Service },
    } as unknown as QueryData);
    expect(values.pricingTerms).toBe("pricing_nupa");
    expect(values.paymentTerms).toBe("payment_a");
    expect(values.serviceSpecificTerms).toBe("service_a");
    expect(values.cancellationTerms).toBe("cancel_a");
    expect(values.termsWithWrongType).toEqual({
      pricingTerms: "pricing_nupa",
      paymentTerms: "payment_a",
      serviceSpecificTerms: "service_a",
      cancellationTerms: "cancel_a",
    });
  });
});

describe("transformReservationUnit", () => {
  it("does not include pk for a new (pk <= 0) reservation unit", () => {
    const values = createValidFormValues({ pk: 0 });
    const result = transformReservationUnit(values, TAX_OPTIONS);
    expect(result.pk).toBeUndefined();
  });

  it("does not send the record of terms of the wrong type", () => {
    const result = transformReservationUnit(createValidFormValues(), TAX_OPTIONS);
    expect(result).not.toHaveProperty("termsWithWrongType");
  });

  it("sends null for cleared pricing terms, so that the saved value is removed", () => {
    const cleared = createValidFormValues({ pricingTerms: undefined });
    expect(transformReservationUnit(cleared, TAX_OPTIONS).pricingTerms).toBeNull();

    const selected = createValidFormValues({ pricingTerms: "pricing_a" });
    expect(transformReservationUnit(selected, TAX_OPTIONS).pricingTerms).toBe("pricing_a");
  });

  it("includes pk for an existing reservation unit and trims the fi name", () => {
    const values = createValidFormValues({ pk: 5, nameFi: "  Nimi  " });
    const result = transformReservationUnit(values, TAX_OPTIONS);
    expect(result.pk).toBe(5);
    expect(result.name).toBe("Nimi");
  });

  it("nulls out the surface area when zero or negative, floors otherwise", () => {
    expect(transformReservationUnit(createValidFormValues({ surfaceArea: 0 }), TAX_OPTIONS).surfaceArea).toBeNull();
    expect(transformReservationUnit(createValidFormValues({ surfaceArea: 12.9 }), TAX_OPTIONS).surfaceArea).toBe(12);
  });

  it("only sends scheduled publish/reservation datetimes when both the scheduling and the specific has* flag are set", () => {
    const values = createValidFormValues({
      hasScheduledPublish: true,
      hasPublishBegins: true,
      publishBeginsDate: "1.1.2030",
      publishBeginsTime: "10:00",
      hasPublishEnds: false,
      hasScheduledReservation: false,
      hasReservationBegins: true,
      reservationBeginsDate: "1.1.2030",
      reservationBeginsTime: "10:00",
    });
    const result = transformReservationUnit(values, TAX_OPTIONS);
    expect(result.publishBeginsAt).not.toBeNull();
    expect(result.publishEndsAt).toBeNull();
    // hasScheduledReservation is false so neither reservation datetime is sent
    expect(result.reservationBeginsAt).toBeNull();
  });

  it("nulls min/max reservation duration when the reservation kind is Season", () => {
    const values = createValidFormValues({ reservationKind: ReservationKind.Season });
    const result = transformReservationUnit(values, TAX_OPTIONS);
    expect(result.minReservationDuration).toBeNull();
    expect(result.maxReservationDuration).toBeNull();
    expect(result.reservationKind).toBe(ReservationKind.Season);
  });

  it("keeps min/max reservation duration for non-Season reservation kinds", () => {
    const values = createValidFormValues({ reservationKind: ReservationKind.Direct });
    const result = transformReservationUnit(values, TAX_OPTIONS);
    expect(result.minReservationDuration).toBe(3600);
    expect(result.maxReservationDuration).toBe(7200);
  });

  it("only sends buffer times when bufferType is bufferTimesSet and the has* flag is set", () => {
    const values = createValidFormValues({
      bufferType: "bufferTimesSet",
      hasBufferTimeBefore: true,
      bufferTimeBefore: 900,
      hasBufferTimeAfter: false,
      bufferTimeAfter: 900,
    });
    const result = transformReservationUnit(values, TAX_OPTIONS);
    expect(result.bufferTimeBefore).toBe(900);
    expect(result.bufferTimeAfter).toBe(0);
    expect(result.reservationBlockWholeDay).toBe(false);
  });

  it("sets reservationBlockWholeDay when bufferType is blocksWholeDay", () => {
    const values = createValidFormValues({ bufferType: "blocksWholeDay" });
    const result = transformReservationUnit(values, TAX_OPTIONS);
    expect(result.reservationBlockWholeDay).toBe(true);
  });

  it("nulls the cancellation rule unless hasCancellationRule is set", () => {
    const values = createValidFormValues({ hasCancellationRule: false, cancellationRule: 7 });
    expect(transformReservationUnit(values, TAX_OPTIONS).cancellationRule).toBeNull();

    const withRule = createValidFormValues({ hasCancellationRule: true, cancellationRule: 7 });
    expect(transformReservationUnit(withRule, TAX_OPTIONS).cancellationRule).toBe(7);
  });

  it("only sends non-closed, non-empty seasonal time slots", () => {
    const values = createValidFormValues();
    values.seasons[0] = {
      ...at(values.seasons, 0),
      closed: false,
      reservableTimes: [{ begin: "08:00", end: "10:00" }, undefined],
    };
    values.seasons[1] = { ...at(values.seasons, 1), closed: true, reservableTimes: [] };
    values.seasons[2] = { ...at(values.seasons, 2), closed: false, reservableTimes: [{ begin: "", end: "" }] };
    const result = transformReservationUnit(values, TAX_OPTIONS);
    // the empty (unregistered) season is dropped entirely
    expect(result.applicationRoundTimeSlots).toHaveLength(2);
    expect(result.applicationRoundTimeSlots?.[0]).toEqual({
      weekday: at(values.seasons, 0).weekday,
      isClosed: false,
      reservableTimes: [{ begin: "08:00", end: "10:00" }],
    });
    expect(result.applicationRoundTimeSlots?.[1]).toEqual({
      weekday: at(values.seasons, 1).weekday,
      isClosed: true,
      reservableTimes: [],
    });
  });

  it("converts access types back into api dates and drops pk when not present", () => {
    const values = createValidFormValues({
      accessTypes: [
        { accessType: AccessType.PhysicalKey, beginDate: "1.6.2024" },
        { pk: 9, accessType: AccessType.Unrestricted, beginDate: "1.7.2024" },
      ],
    });
    const result = transformReservationUnit(values, TAX_OPTIONS);
    expect(result.accessTypes).toEqual([
      { accessType: AccessType.PhysicalKey, beginDate: formatApiDate(new Date(2024, 5, 1)) },
      { pk: 9, accessType: AccessType.Unrestricted, beginDate: formatApiDate(new Date(2024, 6, 1)) },
    ]);
  });

  it("transforms pricings, dropping future pricings not yet active unless hasFuturePricing is set", () => {
    const futureDate = formatDate(addDays(new Date(), 5));
    const values = createValidFormValues({
      hasFuturePricing: false,
      pricings: [
        {
          pk: 1,
          taxLevel: 0,
          lowestPrice: 0,
          highestPrice: 10,
          priceUnit: PriceUnit.PerHour,
          paymentType: PaymentType.Online,
          begins: formatDate(new Date()),
          isFuture: false,
          isPaid: true,
          hasMaterialPrice: false,
          materialPriceDescriptionFi: "",
          materialPriceDescriptionEn: "",
          materialPriceDescriptionSv: "",
        },
        {
          pk: -1,
          taxLevel: 0,
          lowestPrice: 0,
          highestPrice: 0,
          priceUnit: null,
          paymentType: null,
          begins: futureDate,
          isFuture: true,
          isPaid: false,
          hasMaterialPrice: false,
          materialPriceDescriptionFi: "",
          materialPriceDescriptionEn: "",
          materialPriceDescriptionSv: "",
        },
      ],
    });
    const result = transformReservationUnit(values, TAX_OPTIONS);
    // the future (not-yet-active) free pricing is dropped since hasFuturePricing is false
    expect(result.pricings).toHaveLength(1);
    expect(result.pricings?.[0]).toMatchObject({
      pk: 1,
      taxLevel: 1,
      highestPrice: "10",
      lowestPrice: "0",
      priceUnit: PriceUnit.PerHour,
      paymentType: PaymentType.Online,
    });
  });

  it("sends the selected tax level of a pricing", () => {
    const values = createValidFormValues();
    values.pricings[0] = { ...at(values.pricings, 0), isPaid: true, taxLevel: 2, highestPrice: 10 };
    const result = transformReservationUnit(values, TAX_OPTIONS);
    expect(result.pricings?.[0]).toMatchObject({ taxLevel: 2, highestPrice: "10" });
    expect(result.pricings?.[0]).not.toHaveProperty("isActivatedOnBegins");
  });

  it("throws when a paid pricing has no valid tax level available", () => {
    const values = createValidFormValues({
      pricings: [
        {
          pk: 1,
          taxLevel: 0,
          lowestPrice: 5,
          highestPrice: 10,
          priceUnit: null,
          paymentType: null,
          begins: formatDate(new Date()),
          isFuture: false,
          isPaid: true,
          hasMaterialPrice: false,
          materialPriceDescriptionFi: "",
          materialPriceDescriptionEn: "",
          materialPriceDescriptionSv: "",
        },
      ],
    });
    expect(() => transformReservationUnit(values, [])).toThrow("Tax level is required for pricing");
  });
});

describe("ReservationUnitEditSchema", () => {
  it("accepts a fully filled in, publish-ready set of values", () => {
    const result = ReservationUnitEditSchema.safeParse(createValidFormValues());
    expect(result.success).toBe(true);
  });

  it("skips most validation while the reservation unit is still a draft", () => {
    const values = createValidFormValues({
      isDraft: true,
      nameEn: "",
      nameSv: "",
      reservationUnitType: null,
      accessTypes: [],
    });
    expect(ReservationUnitEditSchema.safeParse(values).success).toBe(true);
  });

  it("requires english and finnish names, a reservation unit type, spaces/resources and access types to publish", () => {
    const values = createValidFormValues({
      nameEn: "",
      nameSv: "",
      spaces: [],
      resources: [],
      reservationUnitType: null,
      accessTypes: [],
    });
    const result = ReservationUnitEditSchema.safeParse(values);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."));
      expect(paths).toEqual(
        expect.arrayContaining(["nameEn", "nameSv", "spaces", "reservationUnitType", "accessTypes"])
      );
    }
  });

  it("requires min/max reservation duration to be multiples of, and at least, the start interval (unless Season)", () => {
    const values = createValidFormValues({
      reservationStartInterval: ReservationStartInterval.Interval_30Minutes,
      minReservationDuration: 600, // 10 minutes: less than the interval
      maxReservationDuration: 5000, // 83.3 minutes: not a multiple of 30
    });
    const result = ReservationUnitEditSchema.safeParse(values);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."));
      expect(paths).toContain("minReservationDuration");
      expect(paths).toContain("maxReservationDuration");
    }
  });

  it("rejects a pricing without a payment type, tax, or with lowest price greater than highest price", () => {
    const values = createValidFormValues();
    values.pricings[0] = {
      ...at(values.pricings, 0),
      isPaid: true,
      taxLevel: 0,
      paymentType: null,
      lowestPrice: 20,
      highestPrice: 10,
    };
    const result = ReservationUnitEditSchema.safeParse(values);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."));
      expect(paths).toContain("pricings.0.taxLevel");
      expect(paths).toContain("pricings.0.paymentType");
      expect(paths).toContain("pricings.0.lowestPrice");
    }
  });

  it("requires material price descriptions when hasMaterialPrice is set", () => {
    const values = createValidFormValues();
    values.pricings[0] = {
      ...at(values.pricings, 0),
      isPaid: true,
      taxLevel: 1,
      paymentType: PaymentType.Online,
      lowestPrice: 5,
      highestPrice: 10,
      hasMaterialPrice: true,
      materialPriceDescriptionFi: "",
    };
    const result = ReservationUnitEditSchema.safeParse(values);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."));
      expect(paths).toContain("pricings.0.materialPriceDescriptionFi");
    }
  });

  it("requires pricingTerms when canApplyFreeOfCharge is set and there is a paid pricing", () => {
    const values = createValidFormValues({ canApplyFreeOfCharge: true, pricingTerms: null });
    values.pricings[0] = { ...at(values.pricings, 0), isPaid: true, highestPrice: 10 };
    const result = ReservationUnitEditSchema.safeParse(values);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((i) => i.path.join("."))).toContain("pricingTerms");
    }
  });

  it("rejects terms of the wrong type until the user selects other terms", () => {
    const termsWithWrongType = {
      paymentTerms: "payment_wrong",
      pricingTerms: null,
      serviceSpecificTerms: "service_wrong",
      cancellationTerms: "cancel_wrong",
    };
    const loaded = createValidFormValues({
      paymentTerms: "payment_wrong",
      serviceSpecificTerms: "service_wrong",
      cancellationTerms: "cancel_wrong",
      termsWithWrongType,
    });
    const loadedResult = ReservationUnitEditSchema.safeParse(loaded);
    expect(loadedResult.success).toBe(false);
    if (!loadedResult.success) {
      const termsIssues = loadedResult.error.issues.filter((i) => i.message === "Terms of wrong type");
      expect(termsIssues.map((i) => i.path.join("."))).toEqual([
        "paymentTerms",
        "cancellationTerms",
        "serviceSpecificTerms",
      ]);
    }

    const fixed = createValidFormValues({
      paymentTerms: "payment_ok",
      serviceSpecificTerms: "",
      cancellationTerms: "cancel_ok",
      termsWithWrongType,
    });
    expect(ReservationUnitEditSchema.safeParse(fixed).success).toBe(true);
  });

  it("rejects pricing terms of the wrong type also when canApplyFreeOfCharge is not set", () => {
    const values = createValidFormValues({
      canApplyFreeOfCharge: false,
      pricingTerms: "pricing_nupa",
      termsWithWrongType: {
        paymentTerms: null,
        pricingTerms: "pricing_nupa",
        serviceSpecificTerms: null,
        cancellationTerms: null,
      },
    });
    const result = ReservationUnitEditSchema.safeParse(values);
    expect(result.success).toBe(false);
    if (!result.success) {
      const termsIssues = result.error.issues.filter((i) => i.message === "Terms of wrong type");
      expect(termsIssues.map((i) => i.path.join("."))).toEqual(["pricingTerms"]);
    }
  });

  it("accepts cleared pricing terms when they are not required", () => {
    const values = createValidFormValues({ canApplyFreeOfCharge: false, pricingTerms: undefined });
    expect(ReservationUnitEditSchema.safeParse(values).success).toBe(true);
  });

  it("rejects duplicate or unparseable access type begin dates", () => {
    const values = createValidFormValues({
      accessTypes: [
        { pk: 1, accessType: AccessType.Unrestricted, beginDate: "1.1.2024" },
        { pk: 2, accessType: AccessType.PhysicalKey, beginDate: "1.1.2024" },
        { pk: 3, accessType: AccessType.AccessCode, beginDate: "not-a-date" },
      ],
    });
    const result = ReservationUnitEditSchema.safeParse(values);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."));
      expect(paths).toContain("accessTypes.1.beginDate");
      expect(paths).toContain("accessTypes.2.beginDate");
    }
  });

  it("requires seasonal reservable times to be on 30 minute boundaries, in order, and contiguous", () => {
    const values = createValidFormValues({ reservationKind: ReservationKind.Season });
    values.seasons[0] = {
      ...at(values.seasons, 0),
      closed: false,
      reservableTimes: [
        { begin: "08:10", end: "10:00" },
        { begin: "09:00", end: "09:30" },
      ],
    };
    const result = ReservationUnitEditSchema.safeParse(values);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."));
      expect(paths).toContain("seasons[0].reservableTimes[0].begin");
      expect(paths).toContain("seasons[0].reservableTimes[1].begin");
    }
  });

  it("requires both a date and time when scheduling a publish/reservation window", () => {
    const values = createValidFormValues({
      hasScheduledPublish: true,
      hasPublishBegins: true,
      publishBeginsDate: "1.1.2030",
      publishBeginsTime: "",
    });
    const result = ReservationUnitEditSchema.safeParse(values);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((i) => i.path.join("."))).toContain("publishBeginsTime");
    }
  });

  it("requires the publish/reservation window begin to be before the end", () => {
    const values = createValidFormValues({
      hasScheduledReservation: true,
      hasReservationBegins: true,
      hasReservationEnds: true,
      reservationBeginsDate: "1.1.2030",
      reservationBeginsTime: "10:00",
      reservationEndsDate: "1.1.2020",
      reservationEndsTime: "10:00",
    });
    const result = ReservationUnitEditSchema.safeParse(values);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((i) => i.path.join("."))).toContain("reservationBeginsDate");
    }
  });

  it("requires maxPersons to be greater than or equal to minPersons", () => {
    const values = createValidFormValues({ minPersons: 10, maxPersons: 5 });
    const result = ReservationUnitEditSchema.safeParse(values);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((i) => i.path.join("."))).toContain("maxPersons");
    }
  });

  it("strips html and enforces the max length on rich text fields", () => {
    const values = createValidFormValues({
      descriptionFi: `<p>${"a".repeat(4001)}</p>`,
    });
    const result = ReservationUnitEditSchema.safeParse(values);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((i) => i.path.join("."))).toContain("descriptionFi");
    }
  });
});
