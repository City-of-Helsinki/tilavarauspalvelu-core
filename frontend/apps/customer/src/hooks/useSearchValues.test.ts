import { describe, expect, it } from "vitest";
import { removeEmptyParams } from "./useSearchValues";

describe("removeEmptyParams", () => {
  it("removes empty values from URLSearchParams", () => {
    const params = new URLSearchParams("textSearch=&units=1&units=&units=2&sort=");
    expect(removeEmptyParams(params).toString()).toBe("units=1&units=2");
  });

  it("removes empty values from a query object", () => {
    const query = {
      textSearch: "",
      sort: null,
      order: undefined,
      units: ["1", "", "2"],
      equipments: [],
      intendedUses: [""],
      personsAllowed: 0,
      showOnlyReservable: false,
      id: "12",
    };
    expect(removeEmptyParams(query)).toEqual({
      units: ["1", "2"],
      personsAllowed: 0,
      showOnlyReservable: false,
      id: "12",
    });
  });
});
