import { describe, expect, test } from "vitest";
import { ApplicationFormType, MunicipalityChoice, Priority, ReserveeType, Weekday } from "@gql/gql-types";
import { createMockApplicationFragment } from "@test/application.mocks";
import {
  ApplicationPage2Schema,
  ApplicationPage2SchemaRefined,
  ApplicationPage3Schema,
  ApplicationPage1SchemaRefined,
  clearPriceOptionsIfNoneOffered,
  convertApplicationPage1,
  convertApplicationPage2,
  convertApplicationPage3,
  createDefaultPage1Section,
  SPORT_OTHER_OPTION_VALUE,
  transformApplicationPage1,
  transformApplicationPage2,
  transformPage3Application,
  validateApplication,
} from "./form";
import type { ApplicationSectionPage1FormValues } from "./form";

function createValidPage1Section(): ApplicationSectionPage1FormValues {
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
    sport: 0,
    sportOther: "",
    participantGender: null,
    leagueLevel: "",
    reservationUnits: [7, 9],
    isAccordionOpen: false,
  };
}

describe("ApplicationPage1SchemaRefined", () => {
  const round = {
    begin: new Date(2099, 1, 1),
    end: new Date(2099, 1, 10),
    isSportsForm: false,
  };

  test("requires at least one section", () => {
    const result = ApplicationPage1SchemaRefined(round, { offeredPriceOptionPkList: [] }).safeParse({
      pk: 1,
      applicantType: ReserveeType.Company,
      applicationSections: [],
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path.join("."))).toContain("applicationSections");
  });

  test("validates section dates against the application round", () => {
    const result = ApplicationPage1SchemaRefined(round, { offeredPriceOptionPkList: [] }).safeParse({
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

  function priceOptionIssues(priceOption: number | undefined, offeredPriceOptionPkList: number[]) {
    const result = ApplicationPage1SchemaRefined(round, { offeredPriceOptionPkList }).safeParse({
      pk: 1,
      applicantType: ReserveeType.Company,
      applicationSections: [{ ...createValidPage1Section(), priceOption }],
    });
    return (result.error?.issues ?? [])
      .filter((issue) => issue.path.join(".") === "applicationSections.0.priceOption")
      .map((issue) => issue.message);
  }

  test.for([
    { name: "no options offered, none selected", priceOption: undefined, offered: [], expected: [] },
    { name: "offered option selected", priceOption: 2, offered: [1, 2], expected: [] },
    { name: "options offered, none selected", priceOption: undefined, offered: [1, 2], expected: ["Required"] },
    { name: "option no longer offered", priceOption: 3, offered: [1, 2], expected: ["priceOptionNotOffered"] },
    { name: "round offers no options anymore", priceOption: 3, offered: [], expected: ["priceOptionNotOffered"] },
  ])("price option: $name", ({ priceOption, offered, expected }) => {
    expect(priceOptionIssues(priceOption, offered)).toEqual(expected);
  });
});

describe("clearPriceOptionsIfNoneOffered", () => {
  const values = {
    pk: 1,
    applicantType: ReserveeType.Company,
    applicationSections: [{ ...createValidPage1Section(), priceOption: 3 }],
  };

  test("clears saved options when the round offers none", () => {
    expect(clearPriceOptionsIfNoneOffered(values, []).applicationSections?.[0]?.priceOption).toBeUndefined();
  });

  test("keeps saved options when the round offers some, so the validation can tell the user to choose again", () => {
    expect(clearPriceOptionsIfNoneOffered(values, [1, 2]).applicationSections?.[0]?.priceOption).toBe(3);
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
          sport: null,
          sportOther: "",
          participantGender: null,
          leagueLevel: "",
          reservationsBeginDate: "2099-02-02",
          reservationsEndDate: "2099-02-03",
          reservationUnitOptions: [
            { preferredOrder: 0, reservationUnit: 9 },
            { preferredOrder: 1, reservationUnit: 7 },
          ],
          priceOption: null,
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
          sport: null,
          sportOther: "",
          participantGender: null,
          leagueLevel: "",
          reservationUnitOptions: [
            { preferredOrder: 0, reservationUnit: 7 },
            { preferredOrder: 1, reservationUnit: 9 },
          ],
          priceOption: null,
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
      sport: 0,
      sportOther: "",
      participantGender: null,
      leagueLevel: "",
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
          priority: Priority.Primary,
          multipleReservationsPerDayWish: "",
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
          multipleReservationsPerDayWish: "",
        },
      ],
    });
  });

  describe("page 2 minimum duration", () => {
    const valuesWith = (suitableTimeRanges: Array<{ beginTime: string; endTime: string; priority: Priority }>) => ({
      pk: 1,
      applicationSections: [
        {
          pk: 1,
          name: "foobar",
          minDuration: 3600,
          reservationUnitPk: 1,
          priority: Priority.Primary,
          appliedReservationsPerWeek: 1,
          multipleReservationsPerDayWish: "",
          suitableTimeRanges: suitableTimeRanges.map((range) => ({ ...range, dayOfTheWeek: Weekday.Monday })),
        },
      ],
    });

    test("a secondary buffer counts towards the minimum, next to a long enough primary range", () => {
      const values = valuesWith([
        { beginTime: "10:00", endTime: "11:00", priority: Priority.Primary },
        { beginTime: "11:00", endTime: "11:30", priority: Priority.Secondary },
      ]);
      expect(ApplicationPage2Schema.safeParse(values).success).toBe(true);
    });

    test("a primary range must reach the minimum by itself, a secondary buffer does not lengthen it", () => {
      const values = valuesWith([
        { beginTime: "10:00", endTime: "10:30", priority: Priority.Primary },
        { beginTime: "10:30", endTime: "11:00", priority: Priority.Secondary },
      ]);
      expect(ApplicationPage2Schema.safeParse(values).success).toBe(false);
    });
  });

  describe("page 2 reservations per week", () => {
    // Three reservations of at least 1 h a week.
    const valuesWith = (suitableTimeRanges: Array<{ day: Weekday; beginTime: string; endTime: string }>) => ({
      pk: 1,
      applicationSections: [
        {
          pk: 1,
          name: "foobar",
          minDuration: 3600,
          reservationUnitPk: 1,
          priority: Priority.Primary,
          appliedReservationsPerWeek: 3,
          multipleReservationsPerDayWish: "",
          suitableTimeRanges: suitableTimeRanges.map(({ day, ...range }) => ({
            ...range,
            dayOfTheWeek: day,
            priority: Priority.Primary,
          })),
        },
      ],
    });
    const isValid = (values: ReturnType<typeof valuesWith>) => ApplicationPage2Schema.safeParse(values).success;

    test("all reservations can be on one day, in separate times", () => {
      expect(
        isValid(
          valuesWith([
            { day: Weekday.Monday, beginTime: "10:00", endTime: "11:00" },
            { day: Weekday.Monday, beginTime: "12:00", endTime: "13:00" },
            { day: Weekday.Monday, beginTime: "14:00", endTime: "15:00" },
          ])
        )
      ).toBe(true);
    });

    test("all reservations can be in one time long enough for them", () => {
      expect(isValid(valuesWith([{ day: Weekday.Monday, beginTime: "10:00", endTime: "13:00" }]))).toBe(true);
    });

    test("times on different days still count", () => {
      expect(
        isValid(
          valuesWith([
            { day: Weekday.Monday, beginTime: "10:00", endTime: "11:00" },
            { day: Weekday.Tuesday, beginTime: "10:00", endTime: "11:00" },
            { day: Weekday.Wednesday, beginTime: "10:00", endTime: "11:00" },
          ])
        )
      ).toBe(true);
    });

    test("times that fit fewer reservations than applied for are refused", () => {
      expect(isValid(valuesWith([{ day: Weekday.Monday, beginTime: "10:00", endTime: "12:00" }]))).toBe(false);
    });
  });

  describe("page 2 opening hours", () => {
    const openMonday = [
      { weekday: Weekday.Monday, isClosed: false, reservableTimes: [{ begin: "08:00:00", end: "16:00:00" }] },
    ];
    const schema = ApplicationPage2SchemaRefined([openMonday]);
    const valuesWith = (day: Weekday, beginTime: string, endTime: string, minDuration = 3600) => ({
      pk: 1,
      applicationSections: [
        {
          pk: 1,
          name: "foobar",
          minDuration,
          reservationUnitPk: 1,
          priority: Priority.Primary,
          appliedReservationsPerWeek: 1,
          multipleReservationsPerDayWish: "",
          suitableTimeRanges: [{ dayOfTheWeek: day, beginTime, endTime, priority: Priority.Primary }],
        },
      ],
    });
    const messages = (values: ReturnType<typeof valuesWith>) =>
      schema.safeParse(values).error?.issues.map(({ path, message }) => `${path.join(".")}: ${message}`) ?? [];
    const outside = "applicationSections.0.suitableTimeRanges: Suitable time range must be inside the opening hours";

    test("accepts times inside the section's opening hours", () => {
      expect(messages(valuesWith(Weekday.Monday, "08:00", "16:00"))).toEqual([]);
    });

    test("refuses times reaching outside them, or on a closed day", () => {
      expect(messages(valuesWith(Weekday.Monday, "15:00", "17:00"))).toEqual([outside]);
      expect(messages(valuesWith(Weekday.Tuesday, "10:00", "11:00"))).toEqual([outside]);
    });

    test("is checked alongside the section's other errors", () => {
      expect(messages(valuesWith(Weekday.Tuesday, "10:00", "10:30"))).toContain(outside);
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
          priority: Priority.Primary,
          appliedReservationsPerWeek: 1,
          multipleReservationsPerDayWish: "",
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

  const page2WithRanges = (appliedReservationsPerWeek: number, days: Weekday[]) => ({
    pk: 1,
    applicationSections: [
      {
        pk: 1,
        name: "foobar",
        minDuration: 3600,
        reservationUnitPk: 1,
        priority: Priority.Primary,
        appliedReservationsPerWeek,
        multipleReservationsPerDayWish: "",
        suitableTimeRanges: days.map((dayOfTheWeek, i) => ({
          beginTime: `${String(8 + i * 3).padStart(2, "0")}:00`,
          endTime: `${String(10 + i * 3).padStart(2, "0")}:00`,
          dayOfTheWeek,
          priority: Priority.Primary,
        })),
      },
    ],
  });

  test("page 2 validation counts several time ranges on the same day", () => {
    const values = page2WithRanges(3, [Weekday.Monday, Weekday.Monday, Weekday.Monday]);
    expect(ApplicationPage2Schema.safeParse(values).success).toBe(true);
  });

  const section2 = (
    appliedReservationsPerWeek: number,
    ranges: Array<[Weekday, string, string, Priority]>,
    minDuration = 3600
  ) => ({
    pk: 1,
    applicationSections: [
      {
        pk: 1,
        name: "foobar",
        minDuration,
        reservationUnitPk: 1,
        priority: Priority.Primary,
        appliedReservationsPerWeek,
        multipleReservationsPerDayWish: "",
        suitableTimeRanges: ranges.map(([dayOfTheWeek, beginTime, endTime, priority]) => ({
          beginTime,
          endTime,
          dayOfTheWeek,
          priority,
        })),
      },
    ],
  });

  test("page 2 validation fits reservations across adjacent ranges with different priorities", () => {
    // Separately 1 h 30 min each fits one 1 h reservation, joined 3 h fits three
    const values = section2(3, [
      [Weekday.Monday, "08:00", "09:30", Priority.Primary],
      [Weekday.Monday, "09:30", "11:00", Priority.Secondary],
    ]);
    expect(ApplicationPage2Schema.safeParse(values).success).toBe(true);
  });

  test("page 2 validation counts ranges with a gap between them separately", () => {
    const values = section2(2, [
      [Weekday.Monday, "08:00", "10:00", Priority.Primary],
      [Weekday.Monday, "11:00", "12:00", Priority.Secondary],
    ]);
    expect(ApplicationPage2Schema.safeParse(values).success).toBe(true);
  });

  test("page 2 validation does not let a secondary range lengthen a too short primary range", () => {
    const values = section2(
      1,
      [
        [Weekday.Monday, "08:00", "09:00", Priority.Primary],
        [Weekday.Monday, "09:00", "10:00", Priority.Secondary],
      ],
      2 * 3600
    );
    expect(ApplicationPage2Schema.safeParse(values).success).toBe(false);
  });

  test("page 2 validation does not join ranges on different days", () => {
    const values = section2(2, [
      [Weekday.Monday, "22:00", "00:00", Priority.Primary],
      [Weekday.Tuesday, "00:00", "02:00", Priority.Primary],
    ]);
    expect(ApplicationPage2Schema.safeParse(values).success).toBe(true);
  });

  test("page 2 validation fails when the times fit fewer reservations than applied per week", () => {
    // Two 2 h ranges fit four 1 h reservations
    const values = page2WithRanges(5, [Weekday.Monday, Weekday.Tuesday]);
    const result = ApplicationPage2Schema.safeParse(values);
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((i) => i.message)).toContain(
      "At least as many suitable time ranges as applied reservations per week"
    );
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
      convertApplicationPage3(
        {
          ...createMockApplicationFragment({ page: "page3" }),
          applicantType: ReserveeType.Individual,
          organisationName: "Should disappear",
          organisationIdentifier: "123",
          organisationCoreBusiness: "Should disappear",
          organisationStreetAddress: "Should disappear",
          organisationCity: "Should disappear",
          organisationPostCode: "Should disappear",
        },
        false
      )
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
      convertApplicationPage3(
        {
          ...createMockApplicationFragment({ page: "page3" }),
          applicantType: ReserveeType.Nonprofit,
          organisationIdentifier: "",
          billingStreetAddress: "",
          billingPostCode: "",
          billingCity: "",
        },
        false
      )
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
      organisationActiveMembers: null,
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
      organisationActiveMembers: null,
      billingStreetAddress: "",
      billingPostCode: "",
      billingCity: "",
      municipality: MunicipalityChoice.Other,
    });
  });
});

describe("validateApplication", () => {
  const noPriceOptions = { offeredPriceOptionPkList: [] };

  test("returns the first invalid page and accepts a complete application", () => {
    expect(
      validateApplication(
        {
          ...createMockApplicationFragment({ page: "page3" }),
          applicationRound: {
            ...createMockApplicationFragment({ page: "page3" }).applicationRound,
            reservationPeriodBeginDate: "not-a-date",
          },
        },
        noPriceOptions
      )
    ).toEqual({
      valid: false,
      page: 1,
    });
    expect(validateApplication(createMockApplicationFragment({ page: "page0" }), noPriceOptions)).toEqual({
      valid: false,
      page: 1,
    });
    expect(validateApplication(createMockApplicationFragment({ page: "page1" }), noPriceOptions)).toEqual({
      valid: false,
      page: 2,
    });
    expect(validateApplication(createMockApplicationFragment({ page: "page2" }), noPriceOptions)).toEqual({
      valid: false,
      page: 3,
    });
    expect(validateApplication(createMockApplicationFragment({ page: "page3" }), noPriceOptions)).toEqual({
      valid: true,
    });
  });

  // A draft saved before the round had price options has no price option in its sections.
  test("sends the user back to page 1 when the round offers price options but a section has none", () => {
    const application = createMockApplicationFragment({ page: "page3" });
    expect(validateApplication(application, { offeredPriceOptionPkList: [1, 2] })).toEqual({
      valid: false,
      page: 1,
    });
  });

  test("sends the user back to page 1 when a section has a price option that the round does not offer", () => {
    const application = withPriceOption(createMockApplicationFragment({ page: "page3" }), 3);
    expect(validateApplication(application, { offeredPriceOptionPkList: [1, 2] })).toEqual({
      valid: false,
      page: 1,
    });
  });

  test("accepts sections with an offered price option", () => {
    const application = withPriceOption(createMockApplicationFragment({ page: "page3" }), 2);
    expect(validateApplication(application, { offeredPriceOptionPkList: [1, 2] })).toEqual({ valid: true });
  });
});

function withPriceOption(
  application: ReturnType<typeof createMockApplicationFragment>,
  pk: number
): ReturnType<typeof createMockApplicationFragment> {
  return {
    ...application,
    applicationSections: (application.applicationSections ?? []).map((section) => ({
      ...section,
      priceOption: { id: `PriceOptionNode:${pk}`, pk, nameFi: "Aikuiset", nameEn: null, nameSv: null },
    })),
  };
}

describe("sports form", () => {
  const sportsRound = {
    begin: new Date(2099, 1, 1),
    end: new Date(2099, 1, 10),
    isSportsForm: true,
  };

  function parsePage1(section: ReturnType<typeof createValidPage1Section>, round = sportsRound) {
    const result = ApplicationPage1SchemaRefined(round, { offeredPriceOptionPkList: [] }).safeParse({
      pk: 1,
      applicantType: ReserveeType.Company,
      applicationSections: [section],
    });
    return result.error?.issues.map((issue) => `${issue.path.join(".")}:${issue.message}`) ?? [];
  }

  test("requires a sport on the sports form", () => {
    expect(parsePage1(createValidPage1Section())).toEqual(["applicationSections.0.sport:Required"]);
  });

  test("does not require a sport on the default form", () => {
    expect(parsePage1(createValidPage1Section(), { ...sportsRound, isSportsForm: false })).toEqual([]);
  });

  test("requires the sport text when the other sport is selected", () => {
    const section = { ...createValidPage1Section(), sport: SPORT_OTHER_OPTION_VALUE, sportOther: "  " };
    expect(parsePage1(section)).toEqual(["applicationSections.0.sportOther:Required"]);
  });

  test("accepts a sport with the optional fields empty", () => {
    expect(parsePage1({ ...createValidPage1Section(), sport: 3 })).toEqual([]);
  });

  test("transformApplicationPage1 sends only the selected sport", () => {
    const transform = (section: ReturnType<typeof createValidPage1Section>) =>
      transformApplicationPage1({ pk: 1, applicantType: undefined, applicationSections: [section] })
        .applicationSections?.[0];

    expect(
      transform({
        ...createValidPage1Section(),
        sport: 3,
        sportOther: "Left from an earlier choice",
        participantGender: 2,
        leagueLevel: " 3. divisioona ",
      })
    ).toMatchObject({ sport: 3, sportOther: "", participantGender: 2, leagueLevel: "3. divisioona" });

    expect(
      transform({ ...createValidPage1Section(), sport: SPORT_OTHER_OPTION_VALUE, sportOther: " Curling " })
    ).toMatchObject({ sport: null, sportOther: "Curling" });
  });

  test("convertApplicationPage1 selects the other sport option when the sport is written", () => {
    const application = createMockApplicationFragment({ page: "page1" });
    const section = application.applicationSections?.[0];
    if (section == null) {
      throw new Error("Mock application has no section");
    }
    const sport = { id: "SportNode:3", pk: 3, nameFi: "Futsal", nameEn: null, nameSv: null };
    const withSport = { ...section, sport };
    const withOtherSport = { ...section, sportOther: "Curling" };

    expect(convertApplicationPage1({ ...application, applicationSections: [withSport] }, [])).toMatchObject({
      applicationSections: [{ sport: 3, sportOther: "" }],
    });
    expect(convertApplicationPage1({ ...application, applicationSections: [withOtherSport] }, [])).toMatchObject({
      applicationSections: [{ sport: SPORT_OTHER_OPTION_VALUE, sportOther: "Curling" }],
    });
  });

  test("page 2 trims the wish for more than one reservation per day", () => {
    const converted = convertApplicationPage2(createMockApplicationFragment({ page: "page2" }));
    const section = converted.applicationSections[0];
    if (section == null) {
      throw new Error("Mock application has no section");
    }
    const values = {
      ...converted,
      applicationSections: [{ ...section, multipleReservationsPerDayWish: " Two in a row on Mondays " }],
    };

    expect(transformApplicationPage2(values).applicationSections?.[0]?.multipleReservationsPerDayWish).toBe(
      "Two in a row on Mondays"
    );
  });

  test("convertApplicationPage3 keeps the active members only on the sports form", () => {
    const application = { ...createMockApplicationFragment({ page: "page3" }), organisationActiveMembers: 1 };

    expect(convertApplicationPage3(application, true).organisationActiveMembers).toBe(1);
    expect(convertApplicationPage3(application, false).organisationActiveMembers).toBeUndefined();
    expect(transformPage3Application(convertApplicationPage3(application, false)).organisationActiveMembers).toBeNull();
  });

  test("validateApplication returns page 1 when a sports form section has no sport", () => {
    const application = createMockApplicationFragment({
      page: "page3",
      applicationForm: ApplicationFormType.SportsForm,
    });
    expect(validateApplication(application, { offeredPriceOptionPkList: [] })).toEqual({ valid: false, page: 1 });

    const sections = (application.applicationSections ?? []).map((section) => ({ ...section, sportOther: "Curling" }));
    expect(
      validateApplication({ ...application, applicationSections: sections }, { offeredPriceOptionPkList: [] })
    ).toEqual({
      valid: true,
    });
  });
});
