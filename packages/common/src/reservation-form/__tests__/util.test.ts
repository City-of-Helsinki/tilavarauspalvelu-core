import { getReservationApplicationFields } from "../util";
import { CustomerTypeChoice } from "../../../gql/gql-types";

describe("getReservationApplicationFields", () => {
  test("with empty input", () => {
    expect(
      getReservationApplicationFields({
        supportedFields: [],
        reserveeType: CustomerTypeChoice.Individual,
      })
    ).toEqual([]);
  });

  const fields = ["reservee_id", "reservee_organisation_name", "name"].map(
    (field) => ({
      fieldName: field,
    })
  );

  test("with individual input", () => {
    expect(
      getReservationApplicationFields({
        supportedFields: fields,
        reserveeType: CustomerTypeChoice.Individual,
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
        reserveeType: CustomerTypeChoice.Business,
      })
    ).toEqual(["reserveeOrganisationName", "reserveeId"]);
  });

  test("with nonprofit input", () => {
    expect(
      getReservationApplicationFields({
        supportedFields: fields,
        reserveeType: CustomerTypeChoice.Nonprofit,
      })
    ).toEqual(["reserveeOrganisationName", "reserveeId"]);
  });
});
