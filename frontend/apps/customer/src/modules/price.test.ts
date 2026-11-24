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
    highestAmount: "20.00",
    priceUnit: PriceUnit.PerHour,
    canApplyForDiscount: false,
    materialPriceDescriptionFi: "",
    materialPriceDescriptionEn: "",
    materialPriceDescriptionSv: "",
    ...overrides,
  };
}

describe("getPriceSummaryString", () => {
  test("returns null without a price summary", () => {
    expect(getPriceSummaryString(t, null, "fi")).toBeNull();
  });

  test("returns free of charge for a free reservation unit", () => {
    expect(
      getPriceSummaryString(t, createPriceSummary({ isFree: true, lowestAmount: "0.00", highestAmount: "0.00" }), "fi")
    ).toBe("prices:priceFree");
  });

  test("returns the price with its unit", () => {
    expect(getPriceSummaryString(t, createPriceSummary(), "fi")).toBe("20,00 € / prices:priceUnits.PER_HOUR");
  });

  test("adds the material price to a paid price", () => {
    const priceSummary = createPriceSummary({ materialPriceDescriptionFi: "<p>Materiaalit</p>" });
    expect(getPriceSummaryString(t, priceSummary, "fi")).toBe(
      "20,00\u00A0€ / prices:priceUnits.PER_HOUR + prices:materialPrice"
    );
  });

  test("returns the material price for a free reservation unit with a material price", () => {
    const priceSummary = createPriceSummary({
      isFree: true,
      lowestAmount: "0.00",
      highestAmount: "0.00",
      materialPriceDescriptionFi: "<p>Materiaalit</p>",
    });
    expect(getPriceSummaryString(t, priceSummary, "fi")).toBe("Prices:materialPrice");
  });

  test("does not add a material price that has only empty HTML", () => {
    const priceSummary = createPriceSummary({ materialPriceDescriptionFi: "<p></p>" });
    expect(getPriceSummaryString(t, priceSummary, "fi")).toBe("20,00\u00A0€ / prices:priceUnits.PER_HOUR");
  });

  test("returns the price without a unit for a fixed price", () => {
    expect(getPriceSummaryString(t, createPriceSummary({ priceUnit: PriceUnit.Fixed }), "fi")).toBe("20,00 €");
  });

  test("formats the price in the language of the page", () => {
    expect(getPriceSummaryString(t, createPriceSummary({ priceUnit: PriceUnit.Fixed }), "en")).toBe("€20.00");
  });

  test("adds the material price when the page language has a description", () => {
    const priceSummary = createPriceSummary({
      priceUnit: PriceUnit.Fixed,
      materialPriceDescriptionEn: "<p>Materials</p>",
    });
    expect(getPriceSummaryString(t, priceSummary, "en")).toBe("€20.00 + prices:materialPrice");
    expect(getPriceSummaryString(t, priceSummary, "fi")).toBe("20,00\u00A0€");
  });

  test("returns a range from zero when the customer can apply for a discount", () => {
    expect(getPriceSummaryString(t, createPriceSummary({ canApplyForDiscount: true }), "fi")).toBe(
      "0 - 20,00 € / prices:priceUnits.PER_HOUR"
    );
  });
  test("returns a range from zero to the highest price when the customer can apply for a discount", () => {
    const priceSummary = createPriceSummary({
      lowestAmount: "10.00",
      highestAmount: "20.00",
      canApplyForDiscount: true,
    });
    expect(getPriceSummaryString(t, priceSummary, "fi")).toBe("0 - 20,00\u00A0€ / prices:priceUnits.PER_HOUR");
  });

  test("returns a range from the lowest to the highest price when the prices differ", () => {
    const priceSummary = createPriceSummary({ lowestAmount: "10.00", highestAmount: "20.00" });
    expect(getPriceSummaryString(t, priceSummary, "fi")).toBe("10,00 - 20,00\u00A0€ / prices:priceUnits.PER_HOUR");
  });

  test("returns a range from zero when only some prices are free", () => {
    const priceSummary = createPriceSummary({ lowestAmount: "0.00", highestAmount: "20.00" });
    expect(getPriceSummaryString(t, priceSummary, "fi")).toBe("0 - 20,00\u00A0€ / prices:priceUnits.PER_HOUR");
  });
});
