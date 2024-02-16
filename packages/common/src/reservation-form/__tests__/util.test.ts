import { getReservationApplicationFields } from "../util";
import { ReservationsReservationReserveeTypeChoices } from "../../../types/gql-types";

describe("getReservationApplicationFields", () => {
  test("with empty input", () => {
    expect(
      getReservationApplicationFields({
        supportedFields: [],
        reserveeType: ReservationsReservationReserveeTypeChoices.Individual,
      })
    ).toEqual([]);
  });

  const fields = ["reservee_id", "reservee_organisation_name", "name"];

  test("with individual input", () => {
    expect(
      getReservationApplicationFields({
        supportedFields: fields,
        reserveeType: ReservationsReservationReserveeTypeChoices.Individual,
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
        reserveeType: ReservationsReservationReserveeTypeChoices.Business,
      })
    ).toEqual(["reserveeOrganisationName", "reserveeId"]);
  });

  test("with nonprofit input", () => {
    expect(
      getReservationApplicationFields({
        supportedFields: fields,
        reserveeType: ReservationsReservationReserveeTypeChoices.Nonprofit,
      })
    ).toEqual(["reserveeOrganisationName", "reserveeId"]);
  });
});
