import type { TFunction } from "i18next";
import {
  PriceUnit,
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

function constructPricing({
  lowestPrice,
  highestPrice,
  begin,
}: {
  lowestPrice: number;
  highestPrice: number;
  begin: Date;
}) {
  return {
    begins: toApiDate(begin) ?? "",
    id: "1",
    priceUnit: PriceUnit.PerHour,
    lowestPrice: lowestPrice.toString(),
    highestPrice: highestPrice.toString(),
    taxPercentage: {
      id: "1",
      pk: 1,
      value: "24",
    },
  };
}

function constructFreePricing(): PricingNodeT {
  return constructPricing({
    lowestPrice: 0,
    highestPrice: 0,
    begin: new Date("2021-01-01"),
  });
}
function constructPaidPricing(): PricingNodeT {
  return constructPricing({
    lowestPrice: 120,
    highestPrice: 120,
    begin: new Date("2022-01-01"),
  });
}

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
      pricings: [constructFreePricing(), constructPaidPricing()],
    };

    const first = getReservatinUnitPricing(
      input,
      new Date("2021-02-01T00:00:01Z")
    );
    const second = getReservatinUnitPricing(
      input,
      new Date("2022-02-01T00:00:01Z")
    );
    expect(first?.lowestPrice).toBe("0");
    expect(second?.lowestPrice).toBe("120");
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
