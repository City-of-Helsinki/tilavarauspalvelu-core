import { describe, expect, it } from "vitest";
import { getOpeningHoursUrl } from "./urls";

const API_BASE_URL = "https://api.test.hel.ninja";

function getReservationUnits(url: string): string | null {
  return new URL(url).searchParams.get("reservation_units");
}

describe("getOpeningHoursUrl", () => {
  it("builds the opening hours url for a single reservation unit", () => {
    const url = getOpeningHoursUrl(API_BASE_URL, 5);
    expect(new URL(url).pathname).toBe("/v1/edit_opening_hours/");
    expect(getReservationUnits(url)).toBe("5");
  });

  it("keeps only the positive pks in a list", () => {
    const url = getOpeningHoursUrl(API_BASE_URL, [1, 0, -2, 3]);
    expect(getReservationUnits(url)).toBe("1,3");
  });

  it("returns an empty string when none of the pks in a list are positive", () => {
    expect(getOpeningHoursUrl(API_BASE_URL, [0, -2])).toBe("");
  });

  it("returns an empty string for an empty list", () => {
    expect(getOpeningHoursUrl(API_BASE_URL, [])).toBe("");
  });

  it.each([null, 0, -1])("returns an empty string for the pk %s", (pk) => {
    expect(getOpeningHoursUrl(API_BASE_URL, pk)).toBe("");
  });

  it("adds the error url as a redirect target", () => {
    const errorUrl = "https://staff.test.hel.ninja/units/5";
    const url = getOpeningHoursUrl(API_BASE_URL, 5, errorUrl);
    expect(new URL(url).searchParams.get("redirect_on_error")).toBe(errorUrl);
  });
});
