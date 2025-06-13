import { ReservationInfoCard } from "./";
import { render, screen } from "@testing-library/react";
import { future1hReservation } from "@test/reservation.mocks";
import { describe, expect, it } from "vitest";
import {
  AccessType,
  ImageType,
  PaymentType,
  PriceUnit,
  type ReservationInfoCardFragment,
  ReservationStateChoice,
} from "@gql/gql-types";
import {
  type CreateGraphQLMockProps,
  generateNameFragment,
} from "@/test/test.gql.utils";
import { base64encode } from "common/src/helpers";
import { createGraphQLMocks } from "@test/gql.mocks";
import { MockedGraphQLProvider } from "@test/test.react.utils";

interface CustomRenderProps extends CreateGraphQLMockProps {
  reservation?: ReservationInfoCardFragment;
}

const customRender = (
  { reservation, ...mockProps }: CustomRenderProps = {
    reservation: createMockReservationInfoCard(),
  }
) => {
  const renderReservation = reservation ?? createInfoCardReservationMock();
  // TODO: replace with new helper
  return render(
    <MockedGraphQLProvider mocks={createGraphQLMocks(mockProps)}>
      <ReservationInfoCard reservation={renderReservation} />
    </MockedGraphQLProvider>
  );
};

describe("Component: ReservationInfoCard", () => {
  it("should render the component", () => {
    customRender();
    const contentSection = screen.getByTestId(
      "reservation__reservation-info-card__content"
    );
    expect(contentSection).toBeInTheDocument();
  });

  it("should show reservation unit name according to the reservation unit for the reservation", () => {
    customRender();
    const mockReservationData = createMockReservationInfoCard();
    const reservationUnit = mockReservationData.reservationUnits[0];
    expect(
      screen.getByText(reservationUnit?.nameFi ?? "Test Reservation Unit FI")
    ).toBeInTheDocument();
  });

  it("should show the reservation id", () => {
    customRender();
    const mockReservationData = createMockReservationInfoCard();
    expect(
      screen.getByText(`${mockReservationData.pk ?? "1"}`)
    ).toBeInTheDocument();
  });

  it("should show the reservation duration", () => {
    customRender();
    const durationText =
      "Common:dateWithWeekday common:dateWithWeekdaycommon:dayTimeSeparator common:dateWithWeekday–common:dateWithWeekday, common:abbreviations:hour";

    expect(
      screen.getByTestId("reservation__reservation-info-card__duration")
    ).toHaveTextContent(durationText);
  });

  it("should show the a text for being free of charge when the price is 0", () => {
    customRender({
      reservation: createMockReservationInfoCard("0"),
    });

    expect(
      screen.getByText((_, element) => {
        return (
          element?.textContent?.trim() === "common:price: prices:priceFree"
        );
      })
    ).toBeInTheDocument();
  });

  it("should show the reservation price if it's defined", () => {
    customRender({
      reservation: createMockReservationInfoCard("10"),
    });

    expect(
      screen.getByText((_, element) => {
        return (
          element?.textContent?.trim() ===
          "common:price: 10,00 € (common:inclTax)"
        );
      })
    ).toBeInTheDocument();
  });
});

describe("Access code", () => {
  it.todo(
    "should show the access code if the reservationType is ACCESS_CODE and it exists",
    () => {}
  );
});

function createMockReservationInfoCard(
  price?: string
): ReservationInfoCardFragment {
  return {
    id: "1",
    pk: 1,
    price: price ?? "10",
    ...future1hReservation(),
    applyingForFreeOfCharge: false,
    taxPercentageValue: "25.5",
    state: ReservationStateChoice.Confirmed,
    accessType: AccessType.Unrestricted,
    pindoraInfo: {
      accessCode: "1234",
    },
    reservationUnits: [
      {
        id: base64encode("ReservationUnitNode:2"),
        pk: 2,
        reservationBegins: new Date(2024, 0, 0, 0, 0).toISOString(),
        reservationEnds: new Date(2025, 0, 0, 0, 0).toISOString(),
        pricings: [
          {
            id: "3",
            begins: new Date(2024, 0, 0, 0, 0).toISOString(),
            priceUnit: PriceUnit.PerHour,
            paymentType: PaymentType.OnlineOrInvoice,
            lowestPrice: "0.0",
            highestPrice: "10.0",
            taxPercentage: {
              id: "123",
              pk: 123,
              value: "25.5",
            },
          },
        ],
        ...generateNameFragment("Test reservation unit"),
        images: [
          {
            id: base64encode(`ReservationUnitImageNode:1`),
            largeUrl: "https://example.com/image-large.jpg",
            mediumUrl: "https://example.com/image-medium.jpg",
            smallUrl: "https://example.com/image-small.jpg",
            imageUrl: "https://example.com/image-image.jpg",
            imageType: ImageType.Main,
          },
        ],
        unit: {
          id: "3",
          ...generateNameFragment("Test unit"),
        },
      },
    ],
  };
}

function createInfoCardReservationMock(): Readonly<
  NonNullable<ReservationInfoCardFragment>
> {
  return createMockReservationInfoCard();
}
