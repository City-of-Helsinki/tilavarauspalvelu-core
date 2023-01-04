import { getReservationApplicationFields } from "../util";
import { ReservationsReservationReserveeTypeChoices } from "../../../types/gql-types";

describe("getReservationApplicationFields", () => {
  test("with emrty input", () => {
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
    ).toEqual(["reservee_organisation_name", "reservee_id"]);
  });

  test("with nonprofit input, camelCased", () => {
    expect(
      getReservationApplicationFields({
        supportedFields: fields,
        reserveeType: ReservationsReservationReserveeTypeChoices.Nonprofit,
        camelCaseOutput: true,
      })
    ).toEqual(["reserveeOrganisationName", "reserveeId"]);
  });
});
