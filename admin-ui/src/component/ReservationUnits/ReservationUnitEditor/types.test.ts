import { schema } from "./types";

test("conditional validation", () => {
  const reservationUnit = {
    nameFi: "fi",
    nameSv: "sv",
    nameEn: "en",
    spacePks: [1],
    surfaceArea: 1,
    maxPersons: 1,
    reservationUnitTypePk: 1,
    minReservationDuration: 1,
    maxReservationDuration: 1,
    reservationStartInterval: "foo",
    descriptionFi: "fi",
    descriptionSv: "sv",
    descriptionEn: "en",
  };

  // kind not set
  expect(schema.validate(reservationUnit).error).not.toBeDefined();

  expect(
    schema.validate({ ...reservationUnit, reservationKind: "SEASON" }).error
  ).not.toBeDefined();

  // with kind set
  expect(
    schema.validate({ ...reservationUnit, reservationKind: "DIRECT" }).error
  ).toBeDefined();
  expect(
    schema.validate({
      ...reservationUnit,
      reservationKind: "DIRECT_AND_SEASON",
    }).error
  ).toBeDefined();
});
