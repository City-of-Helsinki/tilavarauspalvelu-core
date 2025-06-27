import { getReservationApplicationFields } from "./util";
import { ReserveeType } from "./../../gql/gql-types";
import { describe, expect, test } from "vitest";

describe("getReservationApplicationFields", () => {
  test("with empty input", () => {
    expect(
      getReservationApplicationFields({
        supportedFields: [],
        reserveeType: ReserveeType.Individual,
      })
    ).toEqual([]);
  });

  const fields = ["reservee_identifier", "reservee_organisation_name", "name"].map((field) => ({
    fieldName: field,
  }));

  test("with individual input", () => {
    expect(
      getReservationApplicationFields({
        supportedFields: fields,
        reserveeType: ReserveeType.Individual,
      })
    ).toEqual([]);
  });

  test("with common input", () => {
    expect(
      getReservationApplicationFields({
        supportedFields: fields,
        reserveeType: "common",
      })
    ).toEqual(["name"]);
  });

  test("with business input", () => {
    expect(
      getReservationApplicationFields({
        supportedFields: fields,
        reserveeType: ReserveeType.Company,
      })
    ).toEqual(["reserveeOrganisationName", "reserveeIdentifier"]);
  });

  test("with nonprofit input", () => {
    expect(
      getReservationApplicationFields({
        supportedFields: fields,
        reserveeType: ReserveeType.Nonprofit,
      })
    ).toEqual(["reserveeOrganisationName", "reserveeIdentifier"]);
  });
});
