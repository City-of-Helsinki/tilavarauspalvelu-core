import type {
  ReservationInfoFragment,
  ReservationMetadataFieldNode,
} from "@gql/gql-types";
import { render, screen } from "@testing-library/react";
import { ReservationInfoSection } from "@/components/reservation/ReservationInfoSection";
import { describe, expect, it } from "vitest";
import {
  generateAgeGroupFragment,
  generatePurposeFragment,
} from "./reservation.gql.utils";

function customRender(proper = true): ReturnType<typeof render> {
  return render(
    <ReservationInfoSection
      reservation={createReservationInfoMock(proper)}
      supportedFields={createSupportedFieldsMock()}
    />
  );
}

describe("Component: ReservationInfoSection | With content", () => {
  it.for(createSupportedFieldsMock())(
    `should render %o with correct value`,
    (field) => {
      const view = customRender();
      const reservationInfo = createReservationInfoMock(true);
      const reservationValue = Object.entries(reservationInfo).find(
        (info) => info.find(() => true) === field.fieldName
      );
      expect(
        view.getByText(getFieldValue(reservationValue))
      ).toBeInTheDocument();
    }
  );
});

describe("Component: ReservationInfoSection | Missing value", () => {
  it.for(createSupportedFieldsMock())(
    "should show '-' if %o value is null",
    (field) => {
      const fields = createSupportedFieldsMock().map((f) => f.fieldName);
      const missingField = field.fieldName;

      // Generate mock data with the specific field missing
      const reservationInfo = fields.reduce((mock, fieldName) => {
        return {
          ...mock,
          [fieldName as keyof ReservationInfoFragment]:
            fieldName === missingField
              ? null
              : createReservationInfoMock(true)[
                  fieldName as keyof ReservationInfoFragment
                ],
        };
      }, {} as ReservationInfoFragment);

      render(
        <ReservationInfoSection
          reservation={reservationInfo}
          supportedFields={createSupportedFieldsMock()}
        />
      );

      expect(
        screen.getByText(`reservationApplication:label.common.${missingField}`)
      ).toBeInTheDocument();
      expect(
        screen.getByTestId(`reservation__${missingField}`)
      ).toHaveTextContent("-");
    }
  );

  it.for(createSupportedFieldsMock())(
    "should show '-' or nothing if %o value is an empty string",
    (field) => {
      const fields = createSupportedFieldsMock().map((f) => f.fieldName);
      const missingField = field.fieldName;

      // Generate mock data with the specific field missing
      const reservationInfo = fields.reduce((mock, fieldName) => {
        return {
          ...mock,
          [fieldName as keyof ReservationInfoFragment]:
            fieldName === missingField
              ? ""
              : createReservationInfoMock(true)[
                  fieldName as keyof ReservationInfoFragment
                ],
        };
      }, {} as ReservationInfoFragment);

      render(
        <ReservationInfoSection
          reservation={reservationInfo}
          supportedFields={createSupportedFieldsMock()}
        />
      );

      expect(
        screen.getByText(`reservationApplication:label.common.${missingField}`)
      ).toBeInTheDocument();
      if (missingField === "ageGroup") {
        expect(
          screen.getByTestId(`reservation__${missingField}`)
        ).toHaveTextContent("-");
      } else {
        expect(
          screen.getByTestId(`reservation__${missingField}`)
        ).toBeEmptyDOMElement();
      }
    }
  );
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getFieldValue(fieldObject: any): string {
  if (!fieldObject) return "";
  switch (fieldObject[0]) {
    case "purpose":
      return `${(fieldObject[1] as { nameFi: string })?.nameFi}`;
    case "ageGroup":
      const min = fieldObject[1]?.minimum;
      const max = fieldObject[1]?.maximum;
      return `${min} - ${max}`;
    default:
      return `${fieldObject[1]}`;
  }
}

function createReservationInfoMock(proper: boolean): ReservationInfoFragment {
  return {
    id: proper ? "1" : "",
    description: proper ? "" : null,
    numPersons: proper ? 4 : null,
    purpose: proper ? { ...generatePurposeFragment("Test purpose") } : null,
    ageGroup: proper
      ? { ...generateAgeGroupFragment({ id: 1, min: 1, max: 15 }) }
      : null,
  };
}

function createSupportedFieldsMock(): Pick<
  ReservationMetadataFieldNode,
  "fieldName"
>[] {
  return [
    {
      fieldName: "numPersons",
    },
    {
      fieldName: "purpose",
    },
    {
      fieldName: "ageGroup",
    },
  ];
}
