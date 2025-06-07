import { render, within, screen } from "@testing-library/react";
import {
  ReserveeInfoSection,
  formatReserveeName,
} from "@/components/reservation/ReserveeInfoSection";
import {
  CustomerTypeChoice,
  type ReservationMetadataFieldNode,
  type ReservationPageQuery,
} from "@gql/gql-types";
import { describe, it, expect } from "vitest";

type NodeT = NonNullable<ReservationPageQuery["reservation"]>;
type ReserveeInfoFields = Pick<
  NodeT,
  | "reserveeType"
  | "reserveeOrganisationName"
  | "reserveeId"
  | "reserveeFirstName"
  | "reserveeLastName"
  | "reserveePhone"
  | "reserveeEmail"
>;

function customRender({
  type,
}: {
  type?: "individual" | "nonprofit" | "business";
}): ReturnType<typeof render> {
  return render(
    <ReserveeInfoSection
      reservation={createReserveeMock(type)}
      supportedFields={createSupportedFieldsMock(type)}
    />
  );
}

function getTestedField(
  view: ReturnType<typeof render>,
  mockReservee: ReserveeInfoFields,
  field: { fieldName: string }
): HTMLElement {
  const fieldTestId = getFieldTestId(field.fieldName);
  const testedField = view.getByTestId(fieldTestId);
  const targetText =
    field.fieldName === "reserveeFirstName"
      ? formatReserveeName(mockReservee)
      : (mockReservee[field.fieldName as keyof ReserveeInfoFields] as string);
  return within(testedField).getByText(targetText);
}

describe("Component: Reservee info for reservation page", () => {
  describe("Individual", () => {
    it.for(createSupportedFieldsMock("individual"))(
      "should show the %o field with correct reservee info",
      (field) => {
        const view = customRender({ type: "nonprofit" });
        const mockReservee = createReserveeMock("nonprofit");
        expect(getTestedField(view, mockReservee, field)).toBeInTheDocument();
      }
    );
  });

  describe("Nonprofit", () => {
    it.for(createSupportedFieldsMock("nonprofit"))(
      "should show the %o field with correct reservee info",
      (field) => {
        const view = customRender({ type: "nonprofit" });
        const mockReservee = createReserveeMock("nonprofit");
        expect(getTestedField(view, mockReservee, field)).toBeInTheDocument();
      }
    );
  });

  describe("Business", () => {
    it.for(createSupportedFieldsMock("business"))(
      "should show the %o field with correct reservee info",
      (field) => {
        const view = customRender({ type: "business" });
        const mockReservee = createReserveeMock("business");
        expect(getTestedField(view, mockReservee, field)).toBeInTheDocument();
      }
    );
  });

  describe("Empty values", () => {
    // Using "business" as it has the most fields
    it.for(Object.values(createSupportedFieldsMock("business")))(
      "should show %o correctly if it is null",
      (field) => {
        render(
          <ReserveeInfoSection
            reservation={createMockWithMissingField(
              "business",
              field.fieldName,
              null
            )}
            supportedFields={createSupportedFieldsMock("business")}
          />
        );

        // Check that the missing field value is shown correctly ("-", or empty for name)
        const fieldTestId = getFieldTestId(field.fieldName);
        const testedField = screen.getByTestId(fieldTestId);
        expect(testedField).toBeInTheDocument();
        if (field.fieldName === "reserveeFirstName") {
          expect(testedField).toBeEmptyDOMElement();
        } else {
          expect(testedField).toHaveTextContent("-");
        }
      }
    );

    it.for(Object.values(createSupportedFieldsMock("business")))(
      "should show %o correctly if it is an empty string",
      (field) => {
        render(
          <ReserveeInfoSection
            reservation={createMockWithMissingField(
              "business",
              field.fieldName,
              ""
            )}
            supportedFields={createSupportedFieldsMock("business")}
          />
        );

        // Check that the missing field value is shown correctly ("-", or empty for name)
        const fieldTestId = getFieldTestId(field.fieldName);
        const testedField = screen.getByTestId(fieldTestId);
        expect(testedField).toBeInTheDocument();
        if (
          field.fieldName === "reserveeFirstName" ||
          field.fieldName === "reserveePhone" ||
          field.fieldName === "reserveeEmail"
        ) {
          expect(testedField).toBeEmptyDOMElement();
        } else {
          expect(testedField).toHaveTextContent("-");
        }
      }
    );
  });
});

function createMockWithMissingField(
  type: "individual" | "nonprofit" | "business",
  missingField: string,
  emptyValue: null | ""
): ReserveeInfoFields {
  const mockReservee = createReserveeMock(type);
  const fields = createSupportedFieldsMock(type).map((f) => f.fieldName);

  // Generate mock data with the specific field missing
  return fields.reduce(
    (mock, fieldName) => {
      return {
        ...mock,
        [fieldName as keyof ReserveeInfoFields]:
          fieldName === missingField
            ? emptyValue
            : mockReservee[fieldName as keyof ReserveeInfoFields],
      };
    },
    { reserveeType: mockReservee.reserveeType } as ReserveeInfoFields
  );
}

function getFieldTestId(fieldName: string): string {
  if (fieldName === "reserveeOrganisationName") {
    return "reservation__reservee-organisation-name";
  }
  if (fieldName === "reserveeId") {
    return "reservation__reservee-id";
  }
  if (fieldName === "reserveeFirstName") {
    return "reservation__reservee-name";
  }
  return `reservation__${fieldName.replace("reservee", "reservee-").toLowerCase()}`;
}

function createReserveeMock(type = "individual"): ReserveeInfoFields {
  switch (type) {
    case "individual":
      return {
        reserveeType: CustomerTypeChoice.Individual,
        reserveeId: null,
        reserveeOrganisationName: null,
        reserveeFirstName: "Teppo",
        reserveeLastName: "Testaaja",
        reserveePhone: "0401234567",
        reserveeEmail: "teppo.testaaja@hel.fi",
      };
    case "nonprofit":
      return {
        reserveeType: CustomerTypeChoice.Nonprofit,
        reserveeId: null,
        reserveeOrganisationName: "Test Nonprofit",
        reserveeFirstName: "Niilo",
        reserveeLastName: "Nonprofit",
        reserveePhone: "0441234567",
        reserveeEmail: "niilo.nonprofit@hel.fi",
      };
    case "business":
    default:
      return {
        reserveeType: CustomerTypeChoice.Business,
        reserveeOrganisationName: "Test Business",
        reserveeId: "1234567-8",
        reserveeFirstName: "Björn",
        reserveeLastName: "Business",
        reserveePhone: "0501234567",
        reserveeEmail: "björn.business@hel.fi",
      };
  }
}

function createSupportedFieldsMock(
  type = "individual"
): Pick<ReservationMetadataFieldNode, "fieldName">[] {
  const fieldNames = [
    {
      fieldName: "reserveeFirstName",
    },
    {
      fieldName: "reserveePhone",
    },
    {
      fieldName: "reserveeEmail",
    },
  ];
  if (type === "nonprofit") {
    fieldNames.push({
      fieldName: "reserveeOrganisationName",
    });
  }
  if (type === "business") {
    fieldNames.push(
      {
        fieldName: "reserveeOrganisationName",
      },
      {
        fieldName: "reserveeId",
      }
    );
  }
  return fieldNames;
}
