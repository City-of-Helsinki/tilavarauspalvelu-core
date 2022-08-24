import { reducer } from "./reducer";
import { State } from "./types";

test("minDaysBefore is zeroed if it does not exist", () => {
  const state = {
    reservationUnitEdit: {},
  } as unknown as State;

  expect(
    reducer(state, {
      type: "setReservationsMaxDaysBefore",
      reservationsMaxDaysBefore: 10,
    }).reservationUnitEdit.reservationsMinDaysBefore
  ).toEqual(0);
});

test("minDaysBefore is capped if it exists", () => {
  const state = {
    reservationUnitEdit: { reservationsMinDaysBefore: 20 },
  } as unknown as State;

  expect(
    reducer(state, {
      type: "setReservationsMaxDaysBefore",
      reservationsMaxDaysBefore: 10,
    }).reservationUnitEdit.reservationsMinDaysBefore
  ).toEqual(10);
});
