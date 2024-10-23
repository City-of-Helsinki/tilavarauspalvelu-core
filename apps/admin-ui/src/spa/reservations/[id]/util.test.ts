import type { TFunction } from "i18next";
import {
  PriceUnit,
  PricingType,
  Status,
  ReservationStateChoice,
  ReservationQuery,
  Authentication,
  ReservationStartInterval,
} from "@gql/gql-types";
import { createTagString, getReservatinUnitPricing } from "./util";
import { addHours, addMonths } from "date-fns";
import { toApiDate } from "common/src/common/util";

type ReservationNodeT = NonNullable<ReservationQuery["reservation"]>;
type ReservationUnitNodeT = NonNullable<
  ReservationNodeT["reservationUnits"]
>[0];
type PricingNodeT = ReservationUnitNodeT["pricings"][0];

const mockT = ((x: string) => x) as TFunction;

const PRICING_FREE: PricingNodeT = {
  begins: "2021-01-01",
  pricingType: PricingType.Free,
  id: "1",
  priceUnit: PriceUnit.PerHour,
  lowestPrice: "120",
  highestPrice: "120",
  taxPercentage: {
    id: "1",
    value: "24",
  },
  status: Status.Active,
};
const PRICING_PAID: PricingNodeT = {
  ...PRICING_FREE,
  begins: "2022-01-01",
  pricingType: PricingType.Paid,
  status: Status.Future,
};

function constructReservation(
  begin: string,
  end: string,
  pricings: PricingNodeT[]
): ReservationNodeT {
  return {
    begin,
    end,
    id: "1",
    bufferTimeBefore: 0,
    bufferTimeAfter: 0,
    state: ReservationStateChoice.Confirmed,
    paymentOrder: [],
    reservationUnits: [
      {
        bufferTimeAfter: 0,
        bufferTimeBefore: 0,
        authentication: Authentication.Weak,
        reservationStartInterval: ReservationStartInterval.Interval_15Mins,
        id: "1",
        nameFi: "Foobar",
        pricings,
      },
    ],
  };
}

describe("getReservatinUnitPricing", () => {
  test("returns correct pricing based on reservation date", () => {
    const input = {
      pricings: [PRICING_FREE, PRICING_PAID],
    };

    expect(
      getReservatinUnitPricing(input, "2021-02-01T00:00:01Z")?.pricingType
    ).toBe(PricingType.Free);

    expect(
      getReservatinUnitPricing(input, "2022-02-01T00:00:01Z")?.pricingType
    ).toBe(PricingType.Paid);
  });
});

describe("createTag", () => {
  test("recurring has a tag with a date range and multiple weekdays days", () => {
    const start = new Date("2023-04-01T09:00:00Z");
    const end = addHours(start, 2);
    const res: ReservationNodeT = {
      ...constructReservation(start.toISOString(), end.toISOString(), []),
      recurringReservation: {
        id: "1",
        name: "Foobar",
        description: "Foobar",
        beginTime: "12:00",
        endTime: "14:00",
        beginDate: toApiDate(start),
        endDate: toApiDate(addMonths(end, 3)),
        weekdays: [0, 1, 3],
      },
    };

    const tag = createTagString(res, mockT);
    expect(tag).toContain(
      "dayShort.0, dayShort.1, dayShort.3 12:00–14:00, common:abbreviations.hour"
    );
    expect(tag).toContain("1.4.2023–1.7.2023");
    expect(tag).toContain("Foobar");
  });

  test("no recurring defaults to reservation tag", () => {
    const res: ReservationNodeT = constructReservation(
      "2023-04-01T09:00:00Z",
      "2023-04-01T11:00:00Z",
      []
    );

    const tag = createTagString(res, mockT);
    expect(tag).not.toContain("dayShort.0, dayShort.1, dayShort.3");
    expect(tag).toContain("1.4.2023");
    expect(tag).toContain("12:00–14:00, common:abbreviations.hour");
    expect(tag).toContain("dayShort.5");
    expect(tag).toContain("Foobar");
  });
});
