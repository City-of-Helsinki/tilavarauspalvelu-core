import type { TFunction } from "i18next";
import {
  type CreateTagStringFragment,
  PaymentType,
  PriceUnit,
  type PricingFieldsFragment,
  type ReservationUnitPricingFieldsFragment,
} from "@gql/gql-types";
import { createTagString, getReservatinUnitPricing } from "./util";
import { addHours, addMonths } from "date-fns";
import { toApiDate } from "common/src/common/util";
import { describe, expect, test } from "vitest";
import { base64encode } from "common/src/helpers";

const mockT = ((x: string) => x) as TFunction;

function constructPricing({
  lowestPrice,
  highestPrice,
  begin,
}: {
  lowestPrice: number;
  highestPrice: number;
  begin: Date;
}): PricingFieldsFragment {
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
    paymentType: PaymentType.Online,
  };
}

function constructFreePricing(): PricingFieldsFragment {
  return constructPricing({
    lowestPrice: 0,
    highestPrice: 0,
    begin: new Date("2021-01-01"),
  });
}
function constructPaidPricing(): PricingFieldsFragment {
  return constructPricing({
    lowestPrice: 120,
    highestPrice: 120,
    begin: new Date("2022-03-01"),
  });
}

function constructReservation({
  begin,
  end,
  enableRecurrence,
}: {
  begin: Date;
  end: Date;
  enableRecurrence?: boolean;
}): CreateTagStringFragment {
  return {
    id: base64encode("ReservationNode:1"),
    begin: begin.toISOString(),
    end: end.toISOString(),
    recurringReservation: enableRecurrence
      ? {
          id: base64encode("RecurringReservationNode:1"),
          beginTime: "12:00",
          endTime: "14:00",
          beginDate: toApiDate(begin),
          endDate: toApiDate(addMonths(end, 3)),
          weekdays: [0, 1, 3],
        }
      : null,
    reservationUnits: [
      {
        id: base64encode("ReservationUnitNode:1"),
        nameFi: "Reservation unit 1",
        unit: {
          id: base64encode("UnitNode:1"),
          nameFi: "Unit 1",
        },
      },
    ],
  };
}

describe("getReservatinUnitPricing", () => {
  test("returns correct pricing based on reservation date", () => {
    const input: ReservationUnitPricingFieldsFragment = {
      id: "1",
      pricings: [constructFreePricing(), constructPaidPricing()],
    };

    const first = getReservatinUnitPricing(input, new Date("2021-02-01T00:00:01Z"));
    const second = getReservatinUnitPricing(input, new Date("2022-04-01T00:00:01Z"));
    expect(first?.lowestPrice).toBe("0");
    expect(second?.lowestPrice).toBe("120");
  });
});

describe("createTag", () => {
  test("recurring has a tag with a date range and multiple weekdays days", () => {
    const begin = new Date("2023-04-01T09:00:00Z");
    const end = addHours(begin, 2);
    const input = constructReservation({ begin, end, enableRecurrence: true });

    const tag = createTagString(input, mockT);
    expect(tag).toContain("dayShort.0, dayShort.1, dayShort.3 12:00–14:00, common:abbreviations:hour");
    expect(tag).toContain("1.4.2023–1.7.2023");
    expect(tag).toContain("Reservation unit 1");
  });

  test("no recurring defaults to reservation tag", () => {
    const input = constructReservation({
      begin: new Date("2023-04-01T09:00:00Z"),
      end: new Date("2023-04-01T11:00:00Z"),
    });

    const tag = createTagString(input, mockT);
    expect(tag).not.toContain("dayShort.0, dayShort.1, dayShort.3");
    expect(tag).toContain("1.4.2023");
    expect(tag).toContain("12:00–14:00, common:abbreviations:hour");
    expect(tag).toContain("dayShort.5");
    expect(tag).toContain("Reservation unit 1");
  });
});
