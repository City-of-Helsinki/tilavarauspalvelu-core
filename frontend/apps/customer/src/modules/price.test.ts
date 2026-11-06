import { describe, expect, test } from "vitest";
import type { TFunction } from "i18next";
import { PriceUnit } from "@gql/gql-types";
import { getPriceSummaryString } from "./price";

const t = ((key: string) => key) as TFunction;

function createPriceSummary(
  overrides: Partial<NonNullable<Parameters<typeof getPriceSummaryString>[1]>> = {}
): NonNullable<Parameters<typeof getPriceSummaryString>[1]> {
  return {
    isFree: false,
    lowestAmount: "20.00",
    priceUnit: PriceUnit.PerHour,
    canApplyForDiscount: false,
    ...overrides,
  };
}

describe("getPriceSummaryString", () => {
  test("returns null without a price summary", () => {
    expect(getPriceSummaryString(t, null)).toBeNull();
  });

  test("returns free of charge for a free reservation unit", () => {
    expect(getPriceSummaryString(t, createPriceSummary({ isFree: true, lowestAmount: "0.00" }))).toBe(
      "prices:priceFree"
    );
  });

  test("returns the price with its unit", () => {
    expect(getPriceSummaryString(t, createPriceSummary())).toBe("20,00 € / prices:priceUnits.PER_HOUR");
  });

  test("returns the price without a unit for a fixed price", () => {
    expect(getPriceSummaryString(t, createPriceSummary({ priceUnit: PriceUnit.Fixed }))).toBe("20,00 €");
  });

  test("returns a range from zero when the customer can apply for a discount", () => {
    expect(getPriceSummaryString(t, createPriceSummary({ canApplyForDiscount: true }))).toBe(
      "0 - 20,00 € / prices:priceUnits.PER_HOUR"
    );
  });
});
