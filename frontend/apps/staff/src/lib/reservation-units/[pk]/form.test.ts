import { addDays } from "date-fns";
import { describe, expect, it } from "vitest";
import { formatApiDate, formatDate } from "ui/src/modules/date-utils";
import {
  AccessType,
  PaymentType,
  PriceComponentKind,
  PriceUnit,
  ReservationFormType,
  ReservationKind,
  ReservationStartInterval,
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
import type { OwnPriceComponent } from "./pricing";

type QueryData = NonNullable<ReservationUnitEditQuery["reservationUnit"]>;

const TAX_OPTIONS = [{ label: "Yleinen (25,5 %)", pk: 1, percentage: 25.5 }];

const FUTURE_DATE = formatApiDate(addDays(new Date(), 30)) ?? "";

function createPriceComponent(overrides: Partial<OwnPriceComponent> = {}): OwnPriceComponent {
  return {
    id: "PriceComponentNode:1",
    pk: 1,
    kind: PriceComponentKind.Base,
    validFrom: "2020-01-01",
    validUntil: null,
    priceOption: null,
    amount: "10.00",
    priceUnit: PriceUnit.PerHour,
    canApplyForDiscount: true,
    materialPriceDescriptionFi: "",
    materialPriceDescriptionEn: "",
    materialPriceDescriptionSv: "",
    taxLevel: { id: "TaxLevelNode:1", pk: 1 },
    salesItem: { id: "SalesItemNode:5", pk: 5 },
    ...overrides,
  };
}

/// One own pricing group from 2020 with a current price that ends when a future price begins
function createPricingQueryData({
  isShared = false,
  hasFuturePrice = true,
}: { isShared?: boolean; hasFuturePrice?: boolean } = {}): QueryData {
  const current = createPriceComponent({ validUntil: hasFuturePrice ? FUTURE_DATE : null });
  const future = createPriceComponent({
    id: "PriceComponentNode:2",
    pk: 2,
    validFrom: FUTURE_DATE,
    amount: "20.00",
  });
  return {
    reservationUnitPricingGroups: [
      {
        id: "ReservationUnitPricingGroupNode:1",
        begins: "2020-01-01",
        pricingGroup: {
          id: "PricingGroupNode:1",
          unitGroup: isShared ? { id: "UnitGroupNode:1" } : null,
          components: hasFuturePrice ? [current, future] : [current],
        },
      },
    ],
  } as unknown as QueryData;
}

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
  // A new price has no choice of paid or free, so choose free for the current price
  const [current, ...futureList] = base.pricings;
  return {
    ...base,
    pricings: current != null ? [{ ...current, isPaid: false }, ...futureList] : futureList,
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
    const blocksWholeDay = convertReservationUnit({
      reservationBlockWholeDay: true,
      reservationUnitPricingGroups: [],
    } as unknown as QueryData);
    expect(blocksWholeDay.bufferType).toBe("blocksWholeDay");

    const bufferTimesSet = convertReservationUnit({
      bufferTimeBefore: 900,
      reservationUnitPricingGroups: [],
    } as unknown as QueryData);
    expect(bufferTimesSet.bufferType).toBe("bufferTimesSet");

    const noBuffer = convertReservationUnit({ reservationUnitPricingGroups: [] } as unknown as QueryData);
    expect(noBuffer.bufferType).toBe("noBuffer");
  });

  it("splits publish/reservation datetimes into separate date and time fields and sets the has* flags", () => {
    const values = convertReservationUnit({
      reservationUnitPricingGroups: [],
      publishBeginsAt: "2024-01-01T10:00:00+02:00",
      reservationEndsAt: "2024-06-15T18:30:00+03:00",
    } as unknown as QueryData);
    expect(values.publishBeginsDate).toBe(formatDate(new Date("2024-01-01T10:00:00+02:00")));
    expect(values.publishBeginsTime).not.toBe("");
    expect(values.hasScheduledPublish).toBe(true);
    expect(values.hasPublishBegins).toBe(true);
    expect(values.hasPublishEnds).toBe(false);
    expect(values.hasScheduledReservation).toBe(true);
    expect(values.hasReservationEnds).toBe(true);
    expect(values.hasReservationBegins).toBe(false);
  });

  it("reads the current price as read-only and the future prices from the own pricing group", () => {
    const values = convertReservationUnit(createPricingQueryData());
    expect(values.pricings).toHaveLength(2);
    expect(at(values.pricings, 0)).toMatchObject({
      pk: 1,
      isReadOnly: true,
      isFuture: false,
      isPaid: true,
      price: 10,
      taxLevel: 1,
      salesItem: 5,
    });
    expect(at(values.pricings, 1)).toMatchObject({ pk: 2, isReadOnly: false, isFuture: true, price: 20 });
    expect(values.hasFuturePricing).toBe(true);
    expect(at(values.pricings, 0).canApplyForDiscount).toBe(true);
    expect(values.isSharedPricingGroup).toBe(false);
  });

  it("adds a new future price when the reservation unit has only a current price", () => {
    const values = convertReservationUnit(createPricingQueryData({ hasFuturePrice: false }));
    expect(values.pricings.map((p) => [p.pk, p.isFuture, p.isReadOnly])).toEqual([
      [1, false, true],
      [-2, true, false],
    ]);
    expect(values.hasFuturePricing).toBe(false);
  });

  it("adds an editable current price and a future price when the reservation unit has no prices", () => {
    const values = convertReservationUnit({ reservationUnitPricingGroups: [] } as unknown as QueryData);
    expect(values.pricings.map((p) => [p.pk, p.isFuture, p.isReadOnly])).toEqual([
      [-1, false, false],
      [-2, true, false],
    ]);
  });

  it("does not read the prices of a shared pricing group", () => {
    const values = convertReservationUnit(createPricingQueryData({ isShared: true }));
    expect(values.isSharedPricingGroup).toBe(true);
    expect(values.pricings.every((p) => p.pk < 0)).toBe(true);
  });

  it("converts access types and application round time slots", () => {
    const values = convertReservationUnit({
      reservationUnitPricingGroups: [],
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
});

describe("transformReservationUnit", () => {
  it("does not include pk for a new (pk <= 0) reservation unit", () => {
    const values = createValidFormValues({ pk: 0 });
    const result = transformReservationUnit(values, TAX_OPTIONS);
    expect(result.pk).toBeUndefined();
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

  it("sends the current price unchanged and drops the future price unless hasFuturePricing is set", () => {
    const values = {
      ...createValidFormValues(),
      ...convertReservationUnit(createPricingQueryData()),
      hasFuturePricing: false,
    };
    const result = transformReservationUnit(values, TAX_OPTIONS);
    expect(result.ownPricings).toEqual([
      {
        pk: 1,
        begins: "2020-01-01",
        amount: "10",
        priceUnit: PriceUnit.PerHour,
        taxLevel: 1,
        salesItem: 5,
        canApplyForDiscount: true,
        materialPriceDescriptionFi: "",
        materialPriceDescriptionEn: "",
        materialPriceDescriptionSv: "",
      },
    ]);
    expect(result).not.toHaveProperty("pricings");
    expect(result).not.toHaveProperty("canApplyFreeOfCharge");
  });

  it("sends the discount choice of each price", () => {
    const values = {
      ...createValidFormValues(),
      ...convertReservationUnit(createPricingQueryData()),
    };
    values.pricings[1] = { ...at(values.pricings, 1), taxLevel: 2, salesItem: 7, canApplyForDiscount: false };
    const result = transformReservationUnit(values, TAX_OPTIONS);
    expect(result.ownPricings?.[1]).toMatchObject({
      pk: 2,
      begins: FUTURE_DATE,
      amount: "20",
      taxLevel: 2,
      salesItem: 7,
      canApplyForDiscount: false,
    });
  });

  it("does not send a price without the choice of paid or free", () => {
    const values = createValidFormValues();
    values.pricings[0] = { ...at(values.pricings, 0), isPaid: null };
    const result = transformReservationUnit(values, TAX_OPTIONS);
    expect(result.ownPricings).toEqual([]);
  });

  it("sends a free price without a sales item or a discount", () => {
    const values = createValidFormValues();
    values.pricings[0] = {
      ...at(values.pricings, 0),
      isPaid: false,
      salesItem: 7,
      price: 10,
      canApplyForDiscount: true,
    };
    const result = transformReservationUnit(values, TAX_OPTIONS);
    expect(result.ownPricings?.[0]).toMatchObject({
      amount: "0",
      priceUnit: PriceUnit.Fixed,
      taxLevel: 1,
      salesItem: null,
      canApplyForDiscount: false,
    });
    expect(result.ownPricings?.[0]).not.toHaveProperty("pk");
  });

  it("sends the payment type of the reservation unit", () => {
    const values = createValidFormValues({ paymentType: PaymentType.Online });
    const result = transformReservationUnit(values, TAX_OPTIONS);
    expect(result.paymentType).toBe(PaymentType.Online);
  });

  it("sends no prices for a shared pricing group, because the prices that are not sent are deleted", () => {
    const values = createValidFormValues({ isSharedPricingGroup: true });
    const result = transformReservationUnit(values, TAX_OPTIONS);
    expect(result).not.toHaveProperty("ownPricings");
  });

  it("throws when a paid pricing has no valid tax level available", () => {
    const values = createValidFormValues();
    values.pricings[0] = { ...at(values.pricings, 0), isPaid: true, taxLevel: 0, price: 10 };
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

  it("rejects a paid price without a tax level or a price unit, and a paid reservation unit without a payment type", () => {
    const values = createValidFormValues({ paymentType: null });
    values.pricings[0] = { ...at(values.pricings, 0), isPaid: true, taxLevel: 0, priceUnit: null, price: 10 };
    const result = ReservationUnitEditSchema.safeParse(values);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."));
      expect(paths).toEqual(expect.arrayContaining(["pricings.0.taxLevel", "pricings.0.priceUnit", "paymentType"]));
    }
  });

  it("requires a sales item for a paid price when the reservation unit is paid online", () => {
    const values = createValidFormValues({ paymentType: PaymentType.Online });
    values.pricings[0] = {
      ...at(values.pricings, 0),
      isPaid: true,
      taxLevel: 1,
      priceUnit: PriceUnit.PerHour,
      price: 10,
      salesItem: null,
    };
    const result = ReservationUnitEditSchema.safeParse(values);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((i) => i.path.join("."))).toEqual(["pricings.0.salesItem"]);
    }
  });

  it("does not require a sales item when the reservation unit is paid on site", () => {
    const values = createValidFormValues({ paymentType: PaymentType.OnSite });
    values.pricings[0] = {
      ...at(values.pricings, 0),
      isPaid: true,
      taxLevel: 1,
      priceUnit: PriceUnit.PerHour,
      price: 10,
      salesItem: null,
    };
    expect(ReservationUnitEditSchema.safeParse(values).success).toBe(true);
  });

  it("requires the choice of paid or free to publish", () => {
    const values = createValidFormValues();
    values.pricings[0] = { ...at(values.pricings, 0), isPaid: null };
    const result = ReservationUnitEditSchema.safeParse(values);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((i) => i.path.join("."))).toEqual(["pricings.0.isPaid"]);
    }
  });

  it("does not require the choice of paid or free in a draft", () => {
    const values = createValidFormValues({ isDraft: true });
    values.pricings[0] = { ...at(values.pricings, 0), isPaid: null };
    expect(ReservationUnitEditSchema.safeParse(values).success).toBe(true);
  });

  it("rejects a new current price that begins in the future", () => {
    const values = createValidFormValues();
    values.pricings[0] = { ...at(values.pricings, 0), begins: formatDate(addDays(new Date(), 1)) };
    const result = ReservationUnitEditSchema.safeParse(values);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((i) => [i.path.join("."), i.message])).toEqual([
        ["pricings.0.begins", "Begin can't be in the future"],
      ]);
    }
  });

  it("accepts a new current price that begins in the past", () => {
    const values = createValidFormValues();
    values.pricings[0] = { ...at(values.pricings, 0), begins: formatDate(addDays(new Date(), -30)) };
    expect(ReservationUnitEditSchema.safeParse(values).success).toBe(true);
  });

  it("does not validate the read-only current price", () => {
    const values = createValidFormValues({ paymentType: PaymentType.Online });
    values.pricings[0] = {
      ...at(values.pricings, 0),
      isReadOnly: true,
      isPaid: true,
      taxLevel: 0,
      priceUnit: null,
      price: 10,
      salesItem: null,
    };
    expect(ReservationUnitEditSchema.safeParse(values).success).toBe(true);
  });

  it("requires material price descriptions when hasMaterialPrice is set", () => {
    const values = createValidFormValues();
    values.pricings[0] = {
      ...at(values.pricings, 0),
      isPaid: true,
      taxLevel: 1,
      priceUnit: PriceUnit.PerHour,
      price: 10,
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

  it("requires pricingTerms when a paid price has a discount", () => {
    const values = createValidFormValues({ pricingTerms: null });
    values.pricings[0] = { ...at(values.pricings, 0), isPaid: true, price: 10, canApplyForDiscount: true };
    const result = ReservationUnitEditSchema.safeParse(values);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((i) => i.path.join("."))).toContain("pricingTerms");
    }
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
