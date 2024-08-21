import { getReservationPrice } from "./reservation-pricing";

describe("getReservationPrice", () => {
  test("with no price", () => {
    expect(getReservationPrice("0", "Maksuton", false)).toBe("Maksuton");
  });

  test("with a price", () => {
    expect(getReservationPrice("10", "Maksuton", false)).toBe("10 €"); // contains non-breaking space
  });

  test("with a price and a decimal", () => {
    expect(getReservationPrice("10.2", "Maksuton", false)).toBe("10,2 €"); // contains non-breaking space
  });

  test("with a price and a decimal and a forced leading one", () => {
    expect(getReservationPrice("10.2", "Maksuton", true)).toBe("10,20 €"); // contains non-breaking space
  });

  test("with a price and decimals", () => {
    expect(getReservationPrice("10.23", "Maksuton", false)).toBe("10,23 €"); // contains non-breaking space
  });

  test("with a price and forced decimals", () => {
    expect(getReservationPrice("10", "Maksuton", true)).toBe("10,00 €"); // contains non-breaking space
  });
});
