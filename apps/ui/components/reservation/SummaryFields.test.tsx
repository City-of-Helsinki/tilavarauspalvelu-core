import { render, screen } from "@testing-library/react";
import { ApplicationFields, GeneralFields } from "@/components/reservation/SummaryFields";
import { MetaFieldsFragment, ReserveeType } from "@gql/gql-types";
import { createMetaFieldsFragment, createOptionsMock, createSupportedFieldsMock } from "@test/reservation.mocks";
import { type FieldName } from "common/src/metaFieldsHelpers";
import { describe, expect, it } from "vitest";

function renderGeneralFields(): ReturnType<typeof render> {
  return render(
    <GeneralFields
      reservation={createMetaFieldsFragment()}
      supportedFields={createSupportedFieldsMock("reservation")}
      options={createOptionsMock()}
    />
  );
}

function renderApplicationFields(type = ReserveeType.Individual): ReturnType<typeof render> {
  return render(
    <ApplicationFields
      reservation={createMetaFieldsFragment(type)}
      supportedFields={createSupportedFieldsMock(type)}
      options={createOptionsMock()}
    />
  );
}

describe("Component: Reservation Details", () => {
  it.for(getFilteredSupportedFields())(
    `should render $fieldName label and the correct value from the reservation`,
    ({ fieldName }) => {
      renderGeneralFields();
      const reservationValue = Object.entries(createMetaFieldsFragment()).find(
        (info) => info.find(() => true) === fieldName
      );
      expect(screen.getByText(getFieldValue(reservationValue))).toBeInTheDocument();
    }
  );
});

describe("Component: Reservation Details", () => {
  it.for(getFilteredSupportedFields())("should not render $fieldName or its label, if it is null", ({ fieldName }) => {
    render(
      <GeneralFields
        reservation={createMockWithMissingField({
          mock: createMetaFieldsFragment(),
          supportedFields: getFilteredSupportedFields(),
          missingField: fieldName,
          emptyValue: null,
        })}
        supportedFields={getFilteredSupportedFields()}
        options={createOptionsMock()}
      />
    );

    expect(screen.queryByText(`reservationApplication:label.common.${fieldName}`)).not.toBeInTheDocument();
    expect(screen.queryByTestId(`reservation__${fieldName}`)).not.toBeInTheDocument();
  });

  it.for(getFilteredSupportedFields())(
    "should not render $fieldName or its label, if it is an empty string",
    ({ fieldName }) => {
      render(
        <GeneralFields
          reservation={createMockWithMissingField({
            mock: createMetaFieldsFragment(),
            supportedFields: getFilteredSupportedFields(),
            missingField: fieldName,
            emptyValue: "",
          })}
          supportedFields={getFilteredSupportedFields()}
          options={createOptionsMock()}
        />
      );

      expect(screen.queryByText(`reservationApplication:label.common.${fieldName}`)).not.toBeInTheDocument();
    }
  );
});

describe("Component: Reservee Details", () => {
  describe("Type: individual", () => {
    it.for(getFilteredSupportedFields(ReserveeType.Individual))(
      "should render the $fieldName label and the correct value from the reservation",
      ({ fieldName }) => {
        renderApplicationFields(ReserveeType.Individual);
        expect(screen.getByTestId(`reservation__${fieldName}`)).toBeInTheDocument();
        expect(screen.getByText(`reservationApplication:label.individual.${fieldName}`)).toBeInTheDocument();
      }
    );
  });

  describe("Type: Nonprofit", () => {
    it.for(getFilteredSupportedFields(ReserveeType.Nonprofit))(
      "should render the $fieldName label and the correct value from the reservation",
      ({ fieldName }) => {
        renderApplicationFields(ReserveeType.Nonprofit);
        expect(screen.getByTestId(`reservation__${fieldName}`)).toBeInTheDocument();
        expect(screen.getByText(`reservationApplication:label.nonprofit.${fieldName}`)).toBeInTheDocument();
      }
    );
  });

  describe("Type: Company", () => {
    it.for(getFilteredSupportedFields(ReserveeType.Company))(
      "should render the $fieldName label and the correct value from the reservation",
      ({ fieldName }) => {
        renderApplicationFields(ReserveeType.Company);
        expect(screen.getByTestId(`reservation__${fieldName}`)).toBeInTheDocument();
        expect(screen.getByText(`reservationApplication:label.company.${fieldName}`)).toBeInTheDocument();
      }
    );
  });

  describe("Missing values", () => {
    // Using ReserveeType.Company as it has the most fields
    it.for(Object.values(getFilteredSupportedFields(ReserveeType.Company)))(
      "should not render $fieldName or its label, if it is null",
      ({ fieldName }) => {
        render(
          <ApplicationFields
            reservation={createMockWithMissingField({
              mock: createMetaFieldsFragment(ReserveeType.Company),
              supportedFields: getFilteredSupportedFields(ReserveeType.Company),
              missingField: fieldName,
              emptyValue: "",
            })}
            supportedFields={getFilteredSupportedFields(ReserveeType.Company)}
            options={createOptionsMock()}
          />
        );

        const testedField = screen.queryByTestId(`reservation__${fieldName}`);
        expect(testedField).not.toBeInTheDocument();
      }
    );

    it.for(Object.values(getFilteredSupportedFields(ReserveeType.Company)))(
      "should not render $fieldName or its label, if it is an empty string",
      ({ fieldName }) => {
        render(
          <ApplicationFields
            reservation={createMockWithMissingField({
              mock: createMetaFieldsFragment(ReserveeType.Company),
              supportedFields: getFilteredSupportedFields(ReserveeType.Company),
              missingField: fieldName,
              emptyValue: "",
            })}
            supportedFields={getFilteredSupportedFields(ReserveeType.Company)}
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
      return `${(fieldObject[1] as { nameFi: string })?.nameFi}`;
    case "ageGroup":
      return `${fieldObject[1]?.minimum} - ${fieldObject[1]?.maximum}`;
    default:
      return `${fieldObject[1]}`;
  }
}

function createMockWithMissingField({
  mock,
  supportedFields,
  missingField,
  emptyValue,
}: {
  mock: MetaFieldsFragment;
  supportedFields: FieldName[];
  missingField: string;
  emptyValue: null | "";
}): MetaFieldsFragment {
  const fields = supportedFields.map((f) => f.fieldName);

  // Generate mock data with the specific field missing
  return fields.reduce(
    (mockWithMissingField, fieldName) => {
      return {
        ...mockWithMissingField,
        [fieldName as keyof MetaFieldsFragment]:
          fieldName === missingField ? emptyValue : mock[fieldName as keyof MetaFieldsFragment],
      };
    },
    { reserveeType: mock.reserveeType } as MetaFieldsFragment
  );
}

// We need to filter out the reserveeType field from the supported fields, to have it not be tested for being rendered
function getFilteredSupportedFields(type: ReserveeType | "reservation" = "reservation"): FieldName[] {
  return createSupportedFieldsMock(type).filter((field) => field.fieldName !== "reserveeType");
}
