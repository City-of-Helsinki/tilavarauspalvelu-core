import { describe, expect, test } from "vitest";
import { combineAffectingReservations } from "./helpers";

const reservation = (id: string, pk: number, affectedReservationUnits: number[]) => ({
  id,
  pk,
  affectedReservationUnits,
});

describe("combineAffectingReservations", () => {
  test("returns nothing without data or a reservation unit", () => {
    expect(combineAffectingReservations(null, 1)).toEqual([]);
    expect(combineAffectingReservations({ reservationUnit: null, affectingReservations: [] }, undefined)).toEqual([]);
  });

  test("adds reservations of other units that affect the reservation unit", () => {
    const own = reservation("own", 1, [5]);
    const other = reservation("other", 2, [5, 6]);
    const unrelated = reservation("unrelated", 3, [7]);
    const result = combineAffectingReservations(
      { reservationUnit: { reservations: [own] }, affectingReservations: [other, unrelated] },
      5
    );
    expect(result.map((r) => r.id)).toEqual(["own", "other"]);
  });

  // The backend counts a unit as affecting itself, so its own reservations are in both lists.
  test("lists a reservation once when it is in both the unit's own and the affecting reservations", () => {
    const own = reservation("own", 1, [5]);
    const result = combineAffectingReservations(
      { reservationUnit: { reservations: [own] }, affectingReservations: [{ ...own }, reservation("other", 2, [5])] },
      5
    );
    expect(result.map((r) => r.id)).toEqual(["own", "other"]);
  });
});
