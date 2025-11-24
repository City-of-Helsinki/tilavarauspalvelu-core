import { createMetaFieldsFragment, createOptionsMock, createSupportedFieldsMock } from "@test/reservation.mocks";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ReservationFormFieldsFragment, ReserveeType } from "@gql/gql-types";
import { SummaryGeneralFields, SummaryReserveeFields } from "./SummaryFields";

function renderGeneralFields(): ReturnType<typeof render> {
  return render(<SummaryGeneralFields reservation={createMetaFieldsFragment()} options={createOptionsMock()} />);
}

function renderReserveeFields(type = ReserveeType.Individual): ReturnType<typeof render> {
  return render(<SummaryReserveeFields reservation={createMetaFieldsFragment(type)} options={createOptionsMock()} />);
}

describe("Component: Reservation Details", () => {
  it.for(getFilteredSupportedFields())(
    `should render %s label and the correct value from the reservation`,
    (fieldName) => {
      renderGeneralFields();
      const reservationValue = Object.entries(createMetaFieldsFragment()).find(
        (info) => info.find(() => true) === fieldName
      );
      expect(screen.getByText(getFieldValue(reservationValue))).toBeInTheDocument();
    }
  );
});

describe("Component: Reservation Details", () => {
  it.for(getFilteredSupportedFields())("should not render %s or its label, if it is null", (fieldName) => {
    render(
      <SummaryGeneralFields
        reservation={createMockWithMissingField({
          mock: createMetaFieldsFragment(),
          missingField: fieldName,
          emptyValue: null,
        })}
        options={createOptionsMock()}
      />
    );

    expect(screen.queryByText(`reservationApplication:label.common.${fieldName}`)).not.toBeInTheDocument();
    expect(screen.queryByTestId(`reservation__${fieldName}`)).not.toBeInTheDocument();
  });

  it.for(getFilteredSupportedFields())("should not render %s or its label, if it is an empty string", (fieldName) => {
    render(
      <SummaryGeneralFields
        reservation={createMockWithMissingField({
          mock: createMetaFieldsFragment(),
          missingField: fieldName,
          emptyValue: "",
        })}
        options={createOptionsMock()}
      />
    );

    expect(screen.queryByText(`reservationApplication:label.common.${fieldName}`)).not.toBeInTheDocument();
  });
});

function constructTestId(fieldName: ReturnType<typeof getFilteredSupportedFields>[0]): string {
  return `reservation__summary-fields__${fieldName}`;
}

describe("Component: Reservee Details", () => {
  describe("Type: individual", () => {
    it.for(getFilteredSupportedFields(ReserveeType.Individual))(
      "should render the %s label and the correct value from the reservation",
      (fieldName) => {
        renderReserveeFields(ReserveeType.Individual);
        expect(screen.getByTestId(constructTestId(fieldName))).toBeInTheDocument();
        expect(screen.getByText(`reservationApplication:label.individual.${fieldName}`)).toBeInTheDocument();
      }
    );
  });

  describe("Type: Nonprofit", () => {
    it.for(getFilteredSupportedFields(ReserveeType.Nonprofit))(
      "should render the %s label and the correct value from the reservation",
      (fieldName) => {
        renderReserveeFields(ReserveeType.Nonprofit);
        expect(screen.getByTestId(constructTestId(fieldName))).toBeInTheDocument();
        expect(screen.getByText(`reservationApplication:label.nonprofit.${fieldName}`)).toBeInTheDocument();
      }
    );
  });

  describe("Type: Company", () => {
    it.for(getFilteredSupportedFields(ReserveeType.Company))(
      "should render the %s label and the correct value from the reservation",
      (fieldName) => {
        renderReserveeFields(ReserveeType.Company);
        expect(screen.getByTestId(constructTestId(fieldName))).toBeInTheDocument();
        expect(screen.getByText(`reservationApplication:label.company.${fieldName}`)).toBeInTheDocument();
      }
    );
  });

  describe("Missing values", () => {
    // Using ReserveeType.Company as it has the most fields
    it.for(Object.values(getFilteredSupportedFields(ReserveeType.Company)))(
      "should not render %s or its label, if it is null",
      (fieldName) => {
        render(
          <SummaryReserveeFields
            reservation={createMockWithMissingField({
              mock: createMetaFieldsFragment(ReserveeType.Company),
              missingField: fieldName,
              emptyValue: "",
            })}
            options={createOptionsMock()}
          />
        );

        const testedField = screen.queryByTestId(`reservation__${fieldName}`);
        expect(testedField).not.toBeInTheDocument();
      }
    );

    it.for(Object.values(getFilteredSupportedFields(ReserveeType.Company)))(
      "should not render %s or its label, if it is an empty string",
      (fieldName) => {
        render(
          <SummaryReserveeFields
            reservation={createMockWithMissingField({
              mock: createMetaFieldsFragment(ReserveeType.Company),
              missingField: fieldName,
              emptyValue: "",
            })}
            options={createOptionsMock()}
          />
        );

        const testedField = screen.queryByTestId(`reservation__${fieldName}`);
        expect(testedField).not.toBeInTheDocument();
      }
    );
  });
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getFieldValue(fieldObject: any): string {
  if (!fieldObject) return "";
  switch (fieldObject[0]) {
    case "purpose":
      return (fieldObject[1] as { nameFi: string })?.nameFi;
    case "ageGroup":
      return `${fieldObject[1]?.minimum} - ${fieldObject[1]?.maximum}`;
    default:
      return fieldObject[1];
  }
}

function createMockWithMissingField({
  mock,
  missingField,
  emptyValue,
}: {
  mock: ReservationFormFieldsFragment;
  missingField: keyof ReservationFormFieldsFragment;
  emptyValue: null | "";
}): ReservationFormFieldsFragment {
  return {
    ...mock,
    [missingField]: emptyValue,
  };
}

// We need to filter out the reserveeType field from the supported fields, to have it not be tested for being rendered
function getFilteredSupportedFields(type: ReserveeType | "reservation" = "reservation") {
  //: Omit<ReturnType<typeof createSupportedFieldsMock>, "reserveeType"> {
  return createSupportedFieldsMock(type).filter((field) => field !== "reserveeType");
}
