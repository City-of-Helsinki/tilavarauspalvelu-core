import { describe, expect, it } from "vitest";
import type { TFunction } from "next-i18next";
import type { TagOptionsList } from "./search";
import {
  ApplicationSectionStatusChoice,
  ApplicationStatusChoice,
  MunicipalityChoice,
  OrderStatusWithFree,
  Priority,
  ReservationStateChoice,
  ReservationTypeChoice,
  ReservationUnitPublishingState,
  ReserveeType,
} from "@gql/gql-types";
import { translateTag } from "./search";

const mockT = ((key: string, options?: Record<string, unknown>) => {
  if (options) {
    return `${key} (${JSON.stringify(options)})`;
  }
  return key;
}) as TFunction;

const mockOptions: TagOptionsList = {
  stateChoices: [
    { value: ReservationStateChoice.Confirmed, label: "Confirmed" },
    { value: ReservationStateChoice.Denied, label: "Denied" },
  ],
  reservationUnits: [
    { value: 1, label: "Unit 1" },
    { value: 2, label: "Unit 2" },
  ],
  unitGroups: [
    { value: 1, label: "Group 1" },
    { value: 2, label: "Group 2" },
  ],
  reservationUnitStates: [
    { value: ReservationUnitPublishingState.Published, label: "Published" },
    { value: ReservationUnitPublishingState.Draft, label: "Draft" },
  ],
  priorityChoices: [
    { value: Priority.Primary, label: "Primary" },
    { value: Priority.Secondary, label: "Secondary" },
  ],
  orderChoices: [
    { value: 1, label: "Order 1" },
    { value: 2, label: "Order 2" },
  ],
  orderStatus: [
    { value: OrderStatusWithFree.Paid, label: "Paid" },
    { value: OrderStatusWithFree.Unpaid, label: "Unpaid" },
  ],
  reservationTypeChoices: [
    { value: ReservationTypeChoice.Normal, label: "Normal" },
    { value: ReservationTypeChoice.Blocked, label: "Blocked" },
  ],
  recurringChoices: [
    { value: "only", label: "Only recurring" },
    { value: "onlyNot", label: "Only non-recurring" },
  ],
  reserveeTypes: [
    { value: ReserveeType.Individual, label: "Individual" },
    { value: ReserveeType.Company, label: "Company" },
  ],
  reservationPurposes: [
    { value: 1, label: "Purpose 1" },
    { value: 2, label: "Purpose 2" },
  ],
  ageGroups: [
    { value: 1, label: "Age Group 1" },
    { value: 2, label: "Age Group 2" },
  ],
  reservationUnitTypes: [
    { value: 1, label: "Type 1" },
    { value: 2, label: "Type 2" },
  ],
  units: [
    { value: 1, label: "Unit 1" },
    { value: 2, label: "Unit 2" },
  ],
};

describe("translateTag", () => {
  const translate = translateTag(mockT, mockOptions);

  describe("allocation-round/[id]/allocation/Filters tags", () => {
    it("translates municipality tag", () => {
      const result = translate("municipality", MunicipalityChoice.Helsinki);
      expect(result).toBe("common:municipalities.HELSINKI");
    });

    it("translates applicantType tag", () => {
      const result = translate("applicantType", ReserveeType.Individual);
      expect(result).toBe("translation:reserveeType.INDIVIDUAL");
    });

    it("translates purpose tag", () => {
      const result = translate("purpose", "1");
      expect(result).toBe("Purpose 1");
    });

    it("translates ageGroup tag", () => {
      const result = translate("ageGroup", "2");
      expect(result).toBe("Age Group 2");
    });

    it("returns empty string for unknown purpose", () => {
      const result = translate("purpose", "999");
      expect(result).toBe("");
    });

    it("translates priority tag", () => {
      const result = translate("priority", Priority.Primary);
      expect(result).toBe("Primary");
    });

    it("translates order tag", () => {
      const result = translate("order", "2");
      expect(result).toBe("Order 2");
    });
  });

  describe("application-round/[id]/Filters tags", () => {
    it("translates unitGroup tag", () => {
      const result = translate("unitGroup", "1");
      expect(result).toBe("Group 1");
    });

    it("returns dash for unknown unitGroup", () => {
      const result = translate("unitGroup", "999");
      expect(result).toBe("-");
    });

    it("translates status tag", () => {
      const result = translate("status", ApplicationStatusChoice.Handled);
      expect(result).toBe(`application:statuses.${ApplicationStatusChoice.Handled}`);
    });

    it("translates applicant tag", () => {
      const result = translate("applicant", ReserveeType.Company);
      expect(result).toBe("translation:reserveeType.COMPANY");
    });

    it("translates weekday tag", () => {
      const result = translate("weekday", "1");
      expect(result).toBe("translation:dayLong.1");
    });

    it("translates sectionStatus tag", () => {
      const result = translate("sectionStatus", ApplicationSectionStatusChoice.Handled);
      expect(result).toBe(
        `translation:ApplicationSectionStatusChoice.${ApplicationSectionStatusChoice.Handled}`
      );
    });

    it("translates accessCodeState tag", () => {
      const result = translate("accessCodeState", "CREATED");
      expect(result).toBe("accessType:accessCodeState.CREATED");
    });
  });

  describe("reservation-units/Filters tags", () => {
    it("translates reservationUnitState tag", () => {
      const result = translate("reservationUnitState", ReservationUnitPublishingState.Published);
      expect(result).toBe("Published");
    });

    it("returns value for unknown reservationUnitState", () => {
      const result = translate("reservationUnitState", "UNKNOWN");
      expect(result).toBe("UNKNOWN");
    });

    it("translates maxPersonsGte tag with template", () => {
      const result = translate("maxPersonsGte", "10");
      expect(result).toContain("filters:tag.maxPersonsGte");
      expect(result).toContain("10");
    });

    it("translates maxPersonsLte tag with template", () => {
      const result = translate("maxPersonsLte", "50");
      expect(result).toContain("filters:tag.maxPersonsLte");
      expect(result).toContain("50");
    });

    it("translates surfaceAreaGte tag with template", () => {
      const result = translate("surfaceAreaGte", "100");
      expect(result).toContain("filters:tag.surfaceAreaGte");
      expect(result).toContain("100");
    });

    it("translates surfaceAreaLte tag with template", () => {
      const result = translate("surfaceAreaLte", "500");
      expect(result).toContain("filters:tag.surfaceAreaLte");
      expect(result).toContain("500");
    });
  });

  describe("reservation/Filters tags", () => {
    it("translates reservationType tag", () => {
      const result = translate("reservationType", ReservationTypeChoice.Blocked);
      expect(result).toContain("filters:tag.reservationType");
    });

    it("translates reservationUnitType tag", () => {
      const result = translate("reservationUnitType", "1");
      expect(result).toContain("filters:tag.reservationUnitType");
      expect(result).toContain("Type 1");
    });

    it("translates state tag", () => {
      const result = translate("state", ReservationStateChoice.Confirmed);
      expect(result).toContain("filters:tag.state");
      expect(result).toContain("Confirmed");
    });

    it("translates reservationUnit tag", () => {
      const result = translate("reservationUnit", "2");
      expect(result).toBe("Unit 2");
    });

    it("translates unit tag", () => {
      const result = translate("unit", "1");
      expect(result).toBe("Unit 1");
    });

    it("translates minPrice tag", () => {
      const result = translate("minPrice", "50");
      expect(result).toContain("filters:tag.minPrice");
      expect(result).toContain("50");
    });

    it("translates maxPrice tag", () => {
      const result = translate("maxPrice", "100");
      expect(result).toContain("filters:tag.maxPrice");
      expect(result).toContain("100");
    });

    it("returns empty string for unknown state", () => {
      const result = translate("state", "UNKNOWN");
      expect(result).toContain("filters:tag.state");
      expect(result).toContain('""');
    });
  });

  describe("date filters", () => {
    it("returns empty string for invalid date format", () => {
      expect(translate("dateGte", "invalid")).toBe("");
      expect(translate("dateLte", "bad-date")).toBe("");
      expect(translate("createdAtGte", "not-a-date")).toBe("");
      expect(translate("createdAtLte", "invalid")).toBe("");
    });
  });

  describe("orderStatus filter", () => {
    it("translates orderStatus with dash for no payment", () => {
      const result = translate("orderStatus", "-");
      expect(result).toBe("filters:noPaymentStatus");
    });

    it("translates orderStatus with paid status", () => {
      const result = translate("orderStatus", OrderStatusWithFree.Paid);
      expect(result).toContain("filters:tag.orderStatus");
    });
  });

  describe("recurring and freeOfCharge filters", () => {
    it("translates recurring tag for 'only' value", () => {
      const result = translate("recurring", "only");
      expect(result).toBe("Only recurring");
    });

    it("translates recurring tag for 'onlyNot' value", () => {
      const result = translate("recurring", "onlyNot");
      expect(result).toBe("Only non-recurring");
    });

    it("returns empty string for unknown recurring value", () => {
      const result = translate("recurring", "unknown");
      expect(result).toBe("");
    });

    it("translates freeOfCharge tag for 'true' value", () => {
      const result = translate("freeOfCharge", "true");
      expect(result).toBe("filters:label.freeOfCharge");
    });

    it("returns empty string for freeOfCharge 'false' value", () => {
      const result = translate("freeOfCharge", "false");
      expect(result).toBe("");
    });
  });

  describe("search filter", () => {
    it("translates search tag", () => {
      const result = translate("search", "query123");
      expect(result).toContain("filters:tag.search");
      expect(result).toContain("query123");
    });
  });

  describe("unknown tag", () => {
    it("returns the value unchanged for unknown tag", () => {
      const result = translate("unknownTag", "someValue");
      expect(result).toBe("someValue");
    });
  });
});
