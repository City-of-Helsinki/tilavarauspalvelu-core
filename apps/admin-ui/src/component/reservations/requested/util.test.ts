import { get } from "lodash";
import type { TFunction } from "i18next";
import {
  type RecurringReservationNode,
  type ReservationNode,
  type ReservationUnitPricingNode,
  PriceUnit,
  type PricingType,
  Status,
  type ReservationUnitNode,
} from "common/types/gql-types";
import {
  createTagString,
  getReservatinUnitPricing,
  getReservationPriceDetails,
} from "./util";

const PRICING_FREE: ReservationUnitPricingNode = {
  begins: "2021-01-01",
  pricingType: PricingType.Free,
  pk: 1,
  priceUnit: PriceUnit.PerHour,
  lowestPrice: 120,
  lowestPriceNet: 120 / 1.24,
  highestPrice: 120,
  highestPriceNet: 120 / 1.24,
  taxPercentage: {
    id: "1",
    value: 24,
  },
  status: Status.Active,
};
const PRICING_PAID = {
  ...PRICING_FREE,
  begins: "2022-01-01",
  pricingType: PricingType.Paid,
  status: Status.Future,
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
              priceUnit: PriceUnit.Fixed,
              status: Status.Active,
            },
          ],
        } as ReservationUnitNode,
      ],
    } as ReservationNode;

    const t1 = ((_s: unknown, a: string) => get(a, "price") ?? "") as TFunction;
    expect(getReservationPriceDetails(r, t1)).toEqual("120 €");
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
              pricingType: PricingType.Paid,
            },
          ],
        } as ReservationUnitNode,
      ],
    } as ReservationNode;

    const t1 = ((_s: unknown, a: string) => get(a, "price") ?? "") as TFunction;
    const t2 = ((_s: unknown, a: string) =>
      get(a, "volume") ?? "") as TFunction;

    expect(getReservationPriceDetails(reservation, t1)).toEqual("180 €");
    expect(getReservationPriceDetails(reservation, t2)).toEqual("1,5");
  });
});

describe("getReservatinUnitPricing", () => {
  test("returns correct pricing based on reservation date", () => {
    const reservationUnit = {
      pricings: [PRICING_FREE, PRICING_PAID],
    } as ReservationUnitNode;

    expect(
      getReservatinUnitPricing(reservationUnit, "2021-02-01T00:00:01Z")
        ?.pricingType
    ).toBe(PricingType.Free);

    expect(
      getReservatinUnitPricing(reservationUnit, "2022-02-01T00:00:01Z")
        ?.pricingType
    ).toBe(PricingType.Paid);
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
      } as RecurringReservationNode,
      reservationUnits: [
        {
          nameFi: "Foobar",
        } as ReservationUnitNode,
      ],
    } as ReservationNode;

    const mockT = ((x: string) => x) as TFunction;
    const tag = createTagString(res, mockT);
    expect(tag).toContain(
      "dayShort.0, dayShort.1, dayShort.3 12:00-14:00, common:abbreviations.hour"
    );
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
        } as ReservationUnitNode,
      ],
    } as ReservationNode;

    const mockT = ((x: string) => x) as TFunction;
    const tag = createTagString(res, mockT);
    expect(tag).not.toContain("dayShort.0, dayShort.1, dayShort.3");
    expect(tag).toContain("1.4.2023");
    expect(tag).toContain("12:00-14:00, common:abbreviations.hour");
    expect(tag).toContain("dayShort.5");
    expect(tag).toContain("Foobar");
  });
});
