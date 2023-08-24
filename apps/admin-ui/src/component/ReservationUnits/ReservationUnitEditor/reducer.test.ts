import { reducer } from "./reducer";
import { Action, State } from "./types";

test("minDaysBefore is zeroed if it does not exist", () => {
  const state = {
    reservationUnitEdit: {},
  } as Partial<State>;

  expect(
    reducer(state as State, {
      type: "setReservationsMaxDaysBefore",
      reservationsMaxDaysBefore: 10,
    }).reservationUnitEdit.reservationsMinDaysBefore
  ).toEqual(0);
});

test("minDaysBefore is capped if it exists", () => {
  const state = {
    reservationUnitEdit: { reservationsMinDaysBefore: 20 },
  } as Partial<State>;

  expect(
    reducer(state as State, {
      type: "setReservationsMaxDaysBefore",
      reservationsMaxDaysBefore: 10,
    }).reservationUnitEdit.reservationsMinDaysBefore
  ).toEqual(10);
});

const taxPercentageOptions = [
  { label: "0", value: 0 },
  { label: "10", value: 1 },
  { label: "14", value: 2 },
  { label: "24", value: 3 },
];
test("netPrice is calculated when price is changed", () => {
  const state = {
    taxPercentageOptions,
    reservationUnitEdit: {
      pricings: [{ lowestPrice: 124, lowestPriceNet: 100, taxPercentagePk: 3 }],
    },
  } as Partial<State>;

  const reducedState = reducer(
    state as State,
    {
      type: "updatePricingType",
      pricingType: {
        lowestPrice: 10,
        taxPercentagePk: 3,
      },
      changeField: "lowestPrice",
    } as Action
  );

  const editedPricing = reducedState.reservationUnitEdit?.pricings?.[0];

  expect(editedPricing?.lowestPrice).toEqual(10);
  expect(editedPricing?.lowestPriceNet).toEqual(8.064516129032258);
});

test("price is calculated when net price is changed", () => {
  const state = {
    taxPercentageOptions,
    reservationUnitEdit: {
      pricings: [{ lowestPrice: 124, lowestPriceNet: 100, taxPercentagePk: 3 }],
    },
  } as Partial<State>;

  const reducedState = reducer(
    state as State,
    {
      type: "updatePricingType",
      pricingType: {
        lowestPriceNet: 10,
        taxPercentagePk: 3,
      },
      changeField: "lowestPriceNet",
    } as Action
  );

  const editedPricing = reducedState.reservationUnitEdit?.pricings?.[0];

  expect(editedPricing?.lowestPriceNet).toEqual(10);
  expect(editedPricing?.lowestPrice).toEqual(12.4);
});

test("price is recalculated when tax percentage changes", () => {
  const state = {
    taxPercentageOptions,
    reservationUnitEdit: {
      pricings: [{ lowestPrice: 124, lowestPriceNet: 100, taxPercentagePk: 3 }],
    },
  } as Partial<State>;

  const reducedState = reducer(
    state as State,
    {
      type: "updatePricingType",
      pricingType: {
        lowestPrice: 10,
        taxPercentagePk: 0,
      },
      changeField: "taxPercentagePk",
    } as Action
  );

  const editedPricing = reducedState.reservationUnitEdit?.pricings?.[0];

  expect(editedPricing?.lowestPriceNet).toEqual(10);
  expect(editedPricing?.lowestPrice).toEqual(10);
});
