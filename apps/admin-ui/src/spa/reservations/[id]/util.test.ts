import { get } from "lodash";
import type { TFunction } from "i18next";
import {
  type RecurringReservationNode,
  type ReservationNode,
  type ReservationUnitPricingNode,
  PriceUnit,
  PricingType,
  Status,
  type ReservationUnitNode,
  ReservationStateChoice,
} from "@gql/gql-types";
import {
  createTagString,
  getReservatinUnitPricing,
  getReservationPriceDetails,
} from "./util";

const PRICING_FREE: ReservationUnitPricingNode = {
  begins: "2021-01-01",
  pricingType: PricingType.Free,
  pk: 1,
  id: "1",
  priceUnit: PriceUnit.PerHour,
  lowestPrice: "120",
  lowestPriceNet: (120 / 1.24).toString(),
  highestPrice: "120",
  highestPriceNet: (120 / 1.24).toString(),
  taxPercentage: {
    id: "1",
    value: "24",
  },
  status: Status.Active,
};
const PRICING_PAID = {
  ...PRICING_FREE,
  begins: "2022-01-01",
  pricingType: PricingType.Paid,
  status: Status.Future,
};

function constructReservation(
  begin: string,
  end: string,
  pricings: ReservationUnitPricingNode[]
): ReservationNode {
  return {
    begin,
    end,
    id: "1",
    bufferTimeBefore: 0,
    bufferTimeAfter: 0,
    state: ReservationStateChoice.Confirmed,
    reservationUnit: [
      {
        nameFi: "Foobar",
        pricings,
      } as ReservationUnitNode,
    ],
  } as ReservationNode;
}

describe("pricingDetails", () => {
  test("renders fixed price", () => {
    const reservation: ReservationNode = constructReservation(
      "2022-01-01T10:00:00Z",
      "2022-01-01T11:00:00Z",
      [
        {
          ...PRICING_PAID,
          priceUnit: PriceUnit.Fixed,
          status: Status.Active,
        },
      ]
    );
    const t1 = ((_s: unknown, a: string) => get(a, "price") ?? "") as TFunction;
    expect(getReservationPriceDetails(reservation, t1)).toEqual("120 €");
  });

  test("renders price in hours", () => {
    const reservation: ReservationNode = constructReservation(
      "2022-01-01T10:00:00Z",
      "2022-01-01T11:30:00Z",
      [
        {
          ...PRICING_FREE,
          pricingType: PricingType.Paid,
        },
      ]
    );

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
    const res: ReservationNode = {
      ...constructReservation(
        "2023-04-01T09:00:00Z",
        "2023-04-01T11:00:00Z",
        []
      ),
      recurringReservation: {
        beginDate: "2023-04-01T09:00:00Z",
        endDate: "2023-07-01T09:00:00Z",
        weekdays: [0, 1, 3],
      } as RecurringReservationNode,
    };

    const mockT = ((x: string) => x) as TFunction;
    const tag = createTagString(res, mockT);
    expect(tag).toContain(
      "dayShort.0, dayShort.1, dayShort.3 12:00–14:00, common:abbreviations.hour"
    );
    expect(tag).toContain("1.4.2023–1.7.2023");
    expect(tag).toContain("Foobar");
  });

  test("no recurring defaults to reservation tag", () => {
    const res: ReservationNode = constructReservation(
      "2023-04-01T09:00:00Z",
      "2023-04-01T11:00:00Z",
      []
    );

    const mockT = ((x: string) => x) as TFunction;
    const tag = createTagString(res, mockT);
    expect(tag).not.toContain("dayShort.0, dayShort.1, dayShort.3");
    expect(tag).toContain("1.4.2023");
    expect(tag).toContain("12:00–14:00, common:abbreviations.hour");
    expect(tag).toContain("dayShort.5");
    expect(tag).toContain("Foobar");
  });
});
