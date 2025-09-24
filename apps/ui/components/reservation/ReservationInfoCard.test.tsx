import { ReservationInfoCard } from "./";
import { render, screen } from "@testing-library/react";
import { future1hReservation } from "@test/reservation.mocks";
import { describe, expect, it } from "vitest";
import {
  AccessType,
  ReservationUnitImageType,
  PaymentType,
  PriceUnit,
  type ReservationInfoCardFragment,
  ReservationStateChoice,
} from "@gql/gql-types";
import { type CreateGraphQLMockProps, generateNameFragment } from "@/test/test.gql.utils";
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
    expect(screen.getByTestId("reservation__reservation-info-card__content")).toBeInTheDocument();
  });

  it("should show reservation unit name according to the reservation unit for the reservation", () => {
    customRender();
    const mockReservationData = createMockReservationInfoCard();
    const reservationUnit = mockReservationData.reservationUnit;
    expect(screen.getByText(reservationUnit.nameFi ?? "Test Reservation Unit FI")).toBeInTheDocument();
  });

  it("should show the reservation id", () => {
    customRender();
    const mockReservationData = createMockReservationInfoCard();
    expect(screen.getByText(`${mockReservationData.pk ?? "1"}`)).toBeInTheDocument();
  });

  it("should show the reservation duration", () => {
    customRender();
    const durationText =
      'Common:dateWithWeekday {"date":"2024-01-07T07:00:00.000Z","formatParams":{"date":{"weekday":"short"}}} common:dateWithWeekday ' +
      '{"date":"2024-01-07T07:00:00.000Z","formatParams":{"date":{"year":"numeric","month":"numeric","day":"numeric","locale":"fi"}}}common:dayTimeSeparator common:dateWithWeekday ' +
      '{"date":"2024-01-07T07:00:00.000Z","formatParams":{"date":{"hour":"numeric","minute":"numeric","hour12":false,"locale":"en-GB"}}}–common:dateWithWeekday ' +
      '{"date":"2024-01-07T08:00:00.000Z","formatParams":{"date":{"hour":"numeric","minute":"numeric","hour12":false,"locale":"en-GB"}}}, common:abbreviations:hour {"count":1}';
    expect(screen.getByText(durationText)).toBeInTheDocument();
  });

  it("should show the a text for being free of charge when the price is 0", () => {
    customRender({
      reservation: createMockReservationInfoCard("0"),
    });
    expect(
      screen.getByText((_, element) => {
        return element?.textContent?.trim() === "common:price: prices:priceFree";
      })
    ).toBeInTheDocument();
  });

  it("should show the reservation price if it's defined", () => {
    customRender({
      reservation: createMockReservationInfoCard("10"),
    });
    expect(
      screen.getByText((_, element) => {
        return element?.textContent?.trim() === 'common:price: 10,00 € (common:inclTax {"taxPercentage":"25,5"})';
      })
    ).toBeInTheDocument();
  });
});

describe("Access code", () => {
  it.todo("should show the access code if the reservationType is ACCESS_CODE and it exists", () => {});
});

function createMockReservationInfoCard(price?: string): ReservationInfoCardFragment {
  return {
    accessType: AccessType.Unrestricted,
    applyingForFreeOfCharge: false,
    ...future1hReservation(),
    id: "1",
    pindoraInfo: {
      accessCode: "1234",
    },
    pk: 1,
    price: price ?? "10",
    appliedPricing: {
      highestPrice: price ?? "10.0",
      taxPercentage: "25.5",
    },
    reservationUnit: {
      id: base64encode("ReservationUnitNode:2"),
      images: [
        {
          id: base64encode(`ReservationUnitImageNode:1`),
          imageUrl: "https://example.com/image-image.jpg",
          imageType: ReservationUnitImageType.Main,
          largeUrl: "https://example.com/image-large.jpg",
          mediumUrl: "https://example.com/image-medium.jpg",
          smallUrl: "https://example.com/image-small.jpg",
        },
      ],
      pk: 2,
      pricings: [
        {
          id: "3",
          begins: new Date(2024, 0, 0, 0, 0).toISOString(),
          highestPrice: "10.0",
          lowestPrice: "0.0",
          priceUnit: PriceUnit.PerHour,
          paymentType: PaymentType.OnlineOrInvoice,
          taxPercentage: {
            id: "123",
            pk: 123,
            value: "25.5",
          },
        },
      ],
      reservationBeginsAt: new Date(2024, 0, 0, 0, 0).toISOString(),
      reservationEndsAt: new Date(2025, 0, 0, 0, 0).toISOString(),
      ...generateNameFragment("Test reservation unit"),
      unit: {
        id: "3",
        ...generateNameFragment("Test unit"),
      },
    },
    state: ReservationStateChoice.Confirmed,
    taxPercentageValue: "25.5",
  };
}

function createInfoCardReservationMock(): Readonly<NonNullable<ReservationInfoCardFragment>> {
  return createMockReservationInfoCard();
}
