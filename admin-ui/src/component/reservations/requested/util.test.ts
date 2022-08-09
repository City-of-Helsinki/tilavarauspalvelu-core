import { get } from "lodash";
import { getReservationPriceDetails } from "./util";
import {
  ReservationType,
  ReservationUnitsReservationUnitPriceUnitChoices,
  ReservationUnitType,
} from "../../../common/gql-types";

describe("pricingDetails", () => {
  test("renders fixed price", () => {
    const r = {
      begin: "2022-01-01T10:00:00Z",
      end: "2022-01-01T11:00:00Z",
      reservationUnits: [
        {
          priceUnit: ReservationUnitsReservationUnitPriceUnitChoices.Fixed,
          highestPrice: 120,
        } as ReservationUnitType,
      ],
    } as ReservationType;

    expect(getReservationPriceDetails(r, (t) => t)).toEqual("120 €");
  });

  test("renders price in hours", () => {
    const r = {
      begin: "2022-01-01T10:00:00Z",
      end: "2022-01-01T11:30:00Z",
      taxPercentageValue: 24,
      reservationUnits: [
        {
          priceUnit: ReservationUnitsReservationUnitPriceUnitChoices.PerHour,
          highestPrice: 120,
        } as ReservationUnitType,
      ],
    } as ReservationType;

    expect(getReservationPriceDetails(r, (t, a) => get(a, "price"))).toEqual(
      "180 €"
    );
    expect(getReservationPriceDetails(r, (t, a) => get(a, "volume"))).toEqual(
      "1,5"
    );
  });
});
