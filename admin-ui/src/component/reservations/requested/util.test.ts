import { get } from "lodash";
import {
  ReservationType,
  ReservationUnitPricingType,
  ReservationUnitsReservationUnitPricingPriceUnitChoices,
  ReservationUnitsReservationUnitPricingPricingTypeChoices,
  ReservationUnitsReservationUnitPricingStatusChoices,
  ReservationUnitType,
} from "common/types/gql-types";
import { getReservatinUnitPricing, getReservationPriceDetails } from "./util";

describe("pricingDetails", () => {
  test("renders fixed price", () => {
    const r = {
      begin: "2022-01-01T10:00:00Z",
      end: "2022-01-01T11:00:00Z",
      reservationUnits: [
        {
          pricings: [
            {
              begins: "2022-01-01",
              pricingType:
                ReservationUnitsReservationUnitPricingPricingTypeChoices.Paid,
              id: 1,
              priceUnit:
                ReservationUnitsReservationUnitPricingPriceUnitChoices.Fixed,
              lowestPrice: 120,
              lowestPriceNet: 120 / 1.24,
              highestPrice: 120,
              highestPriceNet: 120 / 1.24,
              taxPercentage: {
                id: "1",
                value: 2,
              },
              status:
                ReservationUnitsReservationUnitPricingStatusChoices.Active,
            } as ReservationUnitPricingType,
          ],
        } as ReservationUnitType,
      ],
    } as ReservationType;

    expect(getReservationPriceDetails(r, (t) => t)).toEqual("120 €");
  });

  test("renders price in hours", () => {
    const reservation = {
      begin: "2022-01-01T10:00:00Z",
      end: "2022-01-01T11:30:00Z",
      reservationUnits: [
        {
          pricings: [
            {
              begins: "2021-01-01",
              pricingType:
                ReservationUnitsReservationUnitPricingPricingTypeChoices.Paid,
              id: 1,
              priceUnit:
                ReservationUnitsReservationUnitPricingPriceUnitChoices.PerHour,
              lowestPrice: 120,
              lowestPriceNet: 120 / 1.24,
              highestPrice: 120,
              highestPriceNet: 120 / 1.24,
              taxPercentage: {
                id: "1",
                value: 24,
              },
              status:
                ReservationUnitsReservationUnitPricingStatusChoices.Active,
            } as ReservationUnitPricingType,
          ],
        } as ReservationUnitType,
      ],
    } as ReservationType;

    expect(
      getReservationPriceDetails(reservation, (t, a) => get(a, "price"))
    ).toEqual("180 €");
    expect(
      getReservationPriceDetails(reservation, (t, a) => get(a, "volume"))
    ).toEqual("1,5");
  });
});

describe("getReservatinUnitPricing", () => {
  test("returns correct pricing based on reservation date", () => {
    const reservationUnit = {
      pricings: [
        {
          begins: "2021-01-01",
          pricingType:
            ReservationUnitsReservationUnitPricingPricingTypeChoices.Free,
          id: 1,
          priceUnit:
            ReservationUnitsReservationUnitPricingPriceUnitChoices.PerHour,
          lowestPrice: 120,
          lowestPriceNet: 120 / 1.24,
          highestPrice: 120,
          highestPriceNet: 120 / 1.24,
          taxPercentage: {
            id: "1",
            value: 24,
          },
          status: ReservationUnitsReservationUnitPricingStatusChoices.Active,
        } as ReservationUnitPricingType,
        {
          begins: "2022-01-01",
          pricingType:
            ReservationUnitsReservationUnitPricingPricingTypeChoices.Paid,
          id: 1,
          priceUnit:
            ReservationUnitsReservationUnitPricingPriceUnitChoices.PerHour,
          lowestPrice: 120,
          lowestPriceNet: 120 / 1.24,
          highestPrice: 120,
          highestPriceNet: 120 / 1.24,
          taxPercentage: {
            id: "1",
            value: 24,
          },
          status: ReservationUnitsReservationUnitPricingStatusChoices.Future,
        } as ReservationUnitPricingType,
      ],
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
