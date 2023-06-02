import { get } from "lodash";
import { TFunction } from "i18next";
import {
  RecurringReservationType,
  ReservationType,
  ReservationUnitPricingType,
  ReservationUnitsReservationUnitPricingPriceUnitChoices,
  ReservationUnitsReservationUnitPricingPricingTypeChoices,
  ReservationUnitsReservationUnitPricingStatusChoices,
  ReservationUnitType,
} from "common/types/gql-types";
import {
  createTagString,
  getReservatinUnitPricing,
  getReservationPriceDetails,
} from "./util";

const PRICING_FREE: ReservationUnitPricingType = {
  begins: "2021-01-01",
  pricingType: ReservationUnitsReservationUnitPricingPricingTypeChoices.Free,
  pk: 1,
  priceUnit: ReservationUnitsReservationUnitPricingPriceUnitChoices.PerHour,
  lowestPrice: 120,
  lowestPriceNet: 120 / 1.24,
  highestPrice: 120,
  highestPriceNet: 120 / 1.24,
  taxPercentage: {
    id: "1",
    value: 24,
  },
  status: ReservationUnitsReservationUnitPricingStatusChoices.Active,
};
const PRICING_PAID = {
  ...PRICING_FREE,
  begins: "2022-01-01",
  pricingType: ReservationUnitsReservationUnitPricingPricingTypeChoices.Paid,
  status: ReservationUnitsReservationUnitPricingStatusChoices.Future,
};

describe("pricingDetails", () => {
  test("renders fixed price", () => {
    const r = {
      begin: "2022-01-01T10:00:00Z",
      end: "2022-01-01T11:00:00Z",
      reservationUnits: [
        {
          pricings: [
            {
              ...PRICING_PAID,
              priceUnit:
                ReservationUnitsReservationUnitPricingPriceUnitChoices.Fixed,
              status:
                ReservationUnitsReservationUnitPricingStatusChoices.Active,
            },
          ],
        } as ReservationUnitType,
      ],
    } as ReservationType;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(getReservationPriceDetails(r, (s: any) => s)).toEqual("120 €");
  });

  test("renders price in hours", () => {
    const reservation = {
      begin: "2022-01-01T10:00:00Z",
      end: "2022-01-01T11:30:00Z",
      reservationUnits: [
        {
          pricings: [
            {
              ...PRICING_FREE,
              pricingType:
                ReservationUnitsReservationUnitPricingPricingTypeChoices.Paid,
            },
          ],
        } as ReservationUnitType,
      ],
    } as ReservationType;

    const t1 = ((s: unknown, a: string) => get(a, "price") ?? "") as TFunction;
    const t2 = ((s: unknown, a: string) => get(a, "volume") ?? "") as TFunction;

    expect(getReservationPriceDetails(reservation, t1)).toEqual("180 €");
    expect(getReservationPriceDetails(reservation, t2)).toEqual("1,5");
  });
});

describe("getReservatinUnitPricing", () => {
  test("returns correct pricing based on reservation date", () => {
    const reservationUnit = {
      pricings: [PRICING_FREE, PRICING_PAID],
    } as ReservationUnitType;

    expect(
      getReservatinUnitPricing(reservationUnit, "2021-02-01T00:00:01Z")
        ?.pricingType
    ).toBe(ReservationUnitsReservationUnitPricingPricingTypeChoices.Free);

    expect(
      getReservatinUnitPricing(reservationUnit, "2022-02-01T00:00:01Z")
        ?.pricingType
    ).toBe(ReservationUnitsReservationUnitPricingPricingTypeChoices.Paid);
  });
});

describe("createTag", () => {
  test("recurring has a tag with a date range and multiple weekdays days", () => {
    const res = {
      begin: "2023-04-01T09:00:00Z",
      end: "2023-04-01T11:00:00Z",
      recurringReservation: {
        beginDate: "2023-04-01T09:00:00Z",
        endDate: "2023-07-01T09:00:00Z",
        weekdays: [0, 1, 3],
      } as RecurringReservationType,
      reservationUnits: [
        {
          nameFi: "Foobar",
        } as ReservationUnitType,
      ],
    } as ReservationType;

    const mockT = ((x: string) => x) as TFunction;
    const tag = createTagString(res, mockT);
    expect(tag).toContain("dayShort.0, dayShort.1, dayShort.3 12:00-14:00, 2t");
    expect(tag).toContain("1.4.2023-1.7.2023");
    expect(tag).toContain("Foobar");
  });

  test("no recurring defaults to reservation tag", () => {
    const res = {
      begin: "2023-04-01T09:00:00Z",
      end: "2023-04-01T11:00:00Z",
      recurringReservation: undefined,
      reservationUnits: [
        {
          nameFi: "Foobar",
        } as ReservationUnitType,
      ],
    } as ReservationType;

    const mockT = ((x: string) => x) as TFunction;
    const tag = createTagString(res, mockT);
    expect(tag).not.toContain("dayShort.0, dayShort.1, dayShort.3");
    expect(tag).toContain("1.4.2023");
    expect(tag).toContain("12:00-14:00, 2t");
    expect(tag).toContain("dayShort.5");
    expect(tag).toContain("Foobar");
  });
});
