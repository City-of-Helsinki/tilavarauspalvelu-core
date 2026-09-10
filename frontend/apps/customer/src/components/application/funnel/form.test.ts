import { createMockApplicationFragment } from "@test/application.mocks";
import { describe, expect, test } from "vitest";
import { MunicipalityChoice, Priority, ReserveeType, Weekday } from "@gql/gql-types";
import {
  ApplicationPage2Schema,
  ApplicationPage3Schema,
  ApplicationPage1SchemaRefined,
  convertApplicationPage1,
  convertApplicationPage2,
  convertApplicationPage3,
  createDefaultPage1Section,
  transformApplicationPage1,
  transformApplicationPage2,
  transformPage3Application,
  validateApplication,
} from "./form";

function createValidPage1Section() {
  return {
    name: "Choir rehearsal",
    formKey: "event-NEW",
    numPersons: 25,
    ageGroup: 1,
    purpose: 2,
    minDuration: 3600,
    maxDuration: 7200,
    begin: "2.2.2099",
    end: "3.2.2099",
    appliedReservationsPerWeek: 1,
    reservationUnits: [7, 9],
    isAccordionOpen: false,
  };
}

describe("ApplicationPage1SchemaRefined", () => {
  const round = {
    begin: new Date(2099, 1, 1),
    end: new Date(2099, 1, 10),
  };

  test("requires at least one section", () => {
    const result = ApplicationPage1SchemaRefined(round).safeParse({
      pk: 1,
      applicantType: ReserveeType.Company,
      applicationSections: [],
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path.join("."))).toContain("applicationSections");
  });

  test("validates section dates against the application round", () => {
    const result = ApplicationPage1SchemaRefined(round).safeParse({
      pk: 1,
      applicantType: ReserveeType.Company,
      applicationSections: [
        {
          ...createValidPage1Section(),
          begin: "31.1.2099",
          end: "11.2.2099",
        },
      ],
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => `${issue.path.join(".")}:${issue.message}`)).toEqual(
      expect.arrayContaining([
        "applicationSections.0.begin:begin date must be after application round begin date",
        "applicationSections.0.end:end date must be before application round end date",
      ])
    );
  });
});

describe("page 1 conversions", () => {
  test("transformApplicationPage1 serializes section order and omits new-section pk", () => {
    expect(
      transformApplicationPage1({
        pk: 5,
        applicantType: ReserveeType.Company,
        applicationSections: [
          {
            ...createValidPage1Section(),
            reservationUnits: [9, 7],
            pk: undefined,
          },
        ],
      })
    ).toEqual({
      pk: 5,
      applicantType: ReserveeType.Company,
      applicationSections: [
        {
          name: "Choir rehearsal",
          numPersons: 25,
          ageGroup: 1,
          purpose: 2,
          reservationMinDuration: 3600,
          reservationMaxDuration: 7200,
          appliedReservationsPerWeek: 1,
          reservationsBeginDate: "2099-02-02",
          reservationsEndDate: "2099-02-03",
          reservationUnitOptions: [
            { preferredOrder: 0, reservationUnit: 9 },
            { preferredOrder: 1, reservationUnit: 7 },
          ],
        },
      ],
    });
  });

  test("transformApplicationPage1 keeps existing section pk and drops invalid dates", () => {
    expect(
      transformApplicationPage1({
        pk: 6,
        applicantType: undefined,
        applicationSections: [
          {
            ...createValidPage1Section(),
            pk: 123,
            begin: "not-a-date",
            end: "",
          },
        ],
      })
    ).toEqual({
      pk: 6,
      applicationSections: [
        {
          pk: 123,
          name: "Choir rehearsal",
          numPersons: 25,
          ageGroup: 1,
          purpose: 2,
          reservationMinDuration: 3600,
          reservationMaxDuration: 7200,
          appliedReservationsPerWeek: 1,
          reservationUnitOptions: [
            { preferredOrder: 0, reservationUnit: 7 },
            { preferredOrder: 1, reservationUnit: 9 },
          ],
        },
      ],
    });
  });

  test("convertApplicationPage1 sorts reservation units and falls back to a default section", () => {
    const application = createMockApplicationFragment({
      page: "page1",
      nReservationUnitOptions: 2,
    });
    const reorderedOptions = application.applicationSections?.[0]?.reservationUnitOptions.map((option, index) => ({
      ...option,
      preferredOrder: 2 - index,
    }));
    const convertedExisting = convertApplicationPage1(
      {
        ...application,
        applicationSections: (application.applicationSections ?? []).map((section, index) =>
          index === 0 && reorderedOptions != null ? { ...section, reservationUnitOptions: reorderedOptions } : section
        ),
      },
      [99]
    );

    expect(convertedExisting.applicationSections?.[0]?.reservationUnits).toEqual([2, 1]);
    expect(convertApplicationPage1({ ...application, applicationSections: [] }, [99])).toEqual({
      pk: 1,
      applicantType: undefined,
      applicationSections: [createDefaultPage1Section([99])],
    });
  });

  test("createDefaultPage1Section creates an open draft section", () => {
    expect(createDefaultPage1Section([1, 2])).toEqual({
      name: "",
      formKey: "event-NEW",
      numPersons: undefined,
      ageGroup: 0,
      purpose: 0,
      minDuration: 0,
      maxDuration: 0,
      begin: "",
      end: "",
      appliedReservationsPerWeek: 1,
      reservationUnits: [1, 2],
      isAccordionOpen: true,
    });
  });
});

describe("page 2 conversions", () => {
  test("convertApplicationPage2 and transformApplicationPage2 preserve time ranges", () => {
    const application = createMockApplicationFragment({
      page: "page2",
    });
    const converted = convertApplicationPage2(application);

    expect(converted).toEqual({
      pk: 1,
      applicationSections: [
        {
          pk: 1,
          name: "foobar",
          suitableTimeRanges: [
            {
              pk: 1,
              beginTime: "08:00",
              endTime: "16:00",
              dayOfTheWeek: Weekday.Wednesday,
              priority: Priority.Primary,
            },
          ],
          minDuration: 7200,
          appliedReservationsPerWeek: 1,
          reservationUnitPk: 1,
          priority: "primary",
        },
      ],
    });

    expect(transformApplicationPage2(converted)).toEqual({
      pk: 1,
      applicationSections: [
        {
          pk: 1,
          suitableTimeRanges: [
            {
              pk: 1,
              beginTime: "08:00",
              endTime: "16:00",
              dayOfTheWeek: Weekday.Wednesday,
              priority: Priority.Primary,
            },
          ],
        },
      ],
    });
  });

  test("page 2 validation accepts midnight end times as full-day ranges", () => {
    const values = {
      pk: 1,
      applicationSections: [
        {
          pk: 1,
          name: "foobar",
          minDuration: 3600,
          reservationUnitPk: 1,
          priority: "primary" as const,
          appliedReservationsPerWeek: 1,
          suitableTimeRanges: [
            {
              beginTime: "23:00",
              endTime: "00:00",
              dayOfTheWeek: Weekday.Monday,
              priority: Priority.Primary,
            },
          ],
        },
      ],
    };

    expect(ApplicationPage2Schema.safeParse(values).success).toBe(true);
    expect(transformApplicationPage2(values).applicationSections?.[0]?.suitableTimeRanges?.[0]).toEqual({
      beginTime: "23:00",
      endTime: "00:00",
      dayOfTheWeek: Weekday.Monday,
      priority: Priority.Primary,
    });
  });
});

describe("page 3 conversions", () => {
  test("ApplicationPage3Schema validates applicant-specific required fields", () => {
    const emptyIndividual = ApplicationPage3Schema.safeParse({
      pk: 1,
      applicantType: ReserveeType.Individual,
      contactPersonFirstName: "Ada",
      contactPersonLastName: "Lovelace",
      contactPersonEmail: "ada@example.com",
      contactPersonPhoneNumber: "12345",
      hasBillingAddress: true,
      isRegisteredAssociation: true,
      additionalInformation: "   ",
    });
    expect(emptyIndividual.success).toBe(false);
    expect(emptyIndividual.error?.issues.map((issue) => `${issue.path.join(".")}:${issue.message}`)).toContain(
      "additionalInformation:Required"
    );

    const tooLongIndividual = ApplicationPage3Schema.safeParse({
      pk: 1,
      applicantType: ReserveeType.Individual,
      contactPersonFirstName: "Ada",
      contactPersonLastName: "Lovelace",
      contactPersonEmail: "ada@example.com",
      contactPersonPhoneNumber: "12345",
      hasBillingAddress: true,
      isRegisteredAssociation: true,
      additionalInformation: "x".repeat(255),
    });
    expect(tooLongIndividual.success).toBe(false);
    expect(tooLongIndividual.error?.issues.map((issue) => `${issue.path.join(".")}:${issue.message}`)).toContain(
      "additionalInformation:Too big. expected string to have <=255 characters"
    );

    const nonprofitWithoutId = ApplicationPage3Schema.safeParse({
      pk: 2,
      applicantType: ReserveeType.Nonprofit,
      organisationName: "Association",
      organisationIdentifier: "",
      organisationCoreBusiness: "Culture",
      organisationStreetAddress: "Street",
      organisationCity: "Helsinki",
      organisationPostCode: "00100",
      contactPersonFirstName: "Grace",
      contactPersonLastName: "Hopper",
      contactPersonEmail: "grace@example.com",
      contactPersonPhoneNumber: "67890",
      hasBillingAddress: false,
      isRegisteredAssociation: true,
      municipality: undefined,
    });
    expect(nonprofitWithoutId.success).toBe(false);
    expect(nonprofitWithoutId.error?.issues.map((issue) => `${issue.path.join(".")}:${issue.message}`)).toEqual(
      expect.arrayContaining(["organisationIdentifier:Required", "municipality:Required"])
    );
  });

  test("convertApplicationPage3 strips organisation fields for individuals", () => {
    expect(
      convertApplicationPage3({
        ...createMockApplicationFragment({ page: "page3" }),
        applicantType: ReserveeType.Individual,
        organisationName: "Should disappear",
        organisationIdentifier: "123",
        organisationCoreBusiness: "Should disappear",
        organisationStreetAddress: "Should disappear",
        organisationCity: "Should disappear",
        organisationPostCode: "Should disappear",
      })
    ).toMatchObject({
      applicantType: ReserveeType.Individual,
      organisationName: undefined,
      organisationIdentifier: undefined,
      hasBillingAddress: true,
      isRegisteredAssociation: true,
    });
  });

  test("convertApplicationPage3 detects unregistered associations", () => {
    expect(
      convertApplicationPage3({
        ...createMockApplicationFragment({ page: "page3" }),
        applicantType: ReserveeType.Nonprofit,
        organisationIdentifier: "",
        billingStreetAddress: "",
        billingPostCode: "",
        billingCity: "",
      })
    ).toMatchObject({
      applicantType: ReserveeType.Nonprofit,
      hasBillingAddress: false,
      isRegisteredAssociation: false,
    });
  });

  test("transformPage3Application clears irrelevant fields and validates addresses", () => {
    expect(
      transformPage3Application({
        pk: 1,
        applicantType: ReserveeType.Individual,
        organisationName: "Ignore me",
        organisationIdentifier: "ignore",
        organisationCoreBusiness: "ignore",
        organisationStreetAddress: "ignore",
        organisationCity: "ignore",
        organisationPostCode: "ignore",
        contactPersonFirstName: "Ada",
        contactPersonLastName: "Lovelace",
        contactPersonEmail: "ada@example.com",
        contactPersonPhoneNumber: "12345",
        hasBillingAddress: true,
        isRegisteredAssociation: true,
        billingStreetAddress: "Street 1",
        billingCity: "Helsinki",
        billingPostCode: "00100",
        additionalInformation: "Info",
        municipality: MunicipalityChoice.Helsinki,
      })
    ).toEqual({
      pk: 1,
      applicantType: ReserveeType.Individual,
      contactPersonFirstName: "Ada",
      contactPersonLastName: "Lovelace",
      contactPersonEmail: "ada@example.com",
      contactPersonPhoneNumber: "12345",
      organisationName: "",
      organisationIdentifier: "",
      organisationCoreBusiness: "",
      organisationStreetAddress: "",
      organisationPostCode: "",
      organisationCity: "",
      billingStreetAddress: "Street 1",
      billingPostCode: "00100",
      billingCity: "Helsinki",
      additionalInformation: "Info",
      municipality: MunicipalityChoice.Helsinki,
    });

    expect(
      transformPage3Application({
        pk: 2,
        applicantType: ReserveeType.Nonprofit,
        organisationName: "Association",
        organisationIdentifier: "1234567-8",
        organisationCoreBusiness: "Culture",
        organisationStreetAddress: "Street 2",
        organisationCity: "",
        organisationPostCode: "00100",
        contactPersonFirstName: "Grace",
        contactPersonLastName: "Hopper",
        contactPersonEmail: "grace@example.com",
        contactPersonPhoneNumber: "67890",
        hasBillingAddress: false,
        isRegisteredAssociation: false,
        billingStreetAddress: "Unused",
        billingCity: "Unused",
        billingPostCode: "Unused",
        additionalInformation: undefined,
        municipality: MunicipalityChoice.Other,
      })
    ).toEqual({
      pk: 2,
      applicantType: ReserveeType.Nonprofit,
      contactPersonFirstName: "Grace",
      contactPersonLastName: "Hopper",
      contactPersonEmail: "grace@example.com",
      contactPersonPhoneNumber: "67890",
      organisationName: "Association",
      organisationIdentifier: "",
      organisationCoreBusiness: "Culture",
      organisationStreetAddress: undefined,
      organisationPostCode: undefined,
      organisationCity: undefined,
      billingStreetAddress: "",
      billingPostCode: "",
      billingCity: "",
      municipality: MunicipalityChoice.Other,
    });
  });
});

describe("validateApplication", () => {
  test("returns the first invalid page and accepts a complete application", () => {
    expect(
      validateApplication({
        ...createMockApplicationFragment({ page: "page3" }),
        applicationRound: {
          ...createMockApplicationFragment({ page: "page3" }).applicationRound,
          reservationPeriodBeginDate: "not-a-date",
        },
      })
    ).toEqual({
      valid: false,
      page: 1,
    });
    expect(validateApplication(createMockApplicationFragment({ page: "page0" }))).toEqual({
      valid: false,
      page: 1,
    });
    expect(validateApplication(createMockApplicationFragment({ page: "page1" }))).toEqual({
      valid: false,
      page: 2,
    });
    expect(validateApplication(createMockApplicationFragment({ page: "page2" }))).toEqual({
      valid: false,
      page: 3,
    });
    expect(validateApplication(createMockApplicationFragment({ page: "page3" }))).toEqual({
      valid: true,
    });
  });
});
