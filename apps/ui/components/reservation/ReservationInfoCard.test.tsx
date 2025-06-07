import { ReservationInfoCard } from "./";
import { render } from "@testing-library/react";
import { future1hReservation } from "@/components/reservation/reservation.gql.utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
  createGraphQLMocks,
  generateNameFragment,
} from "@/test/test.gql.utils";
import { MockedProvider } from "@apollo/client/testing";
import { base64encode } from "common/src/helpers";

interface CustomRenderProps extends CreateGraphQLMockProps {
  reservation?: ReservationInfoCardFragment;
}

const { useRouter } = vi.hoisted(() => {
  const mockedRouterReplace = vi.fn();
  const query = {
    id: "1",
  };
  return {
    useRouter: () => ({
      replace: mockedRouterReplace,
      query,
    }),
    mockedRouterReplace,
  };
});

vi.mock("next/router", () => ({
  useRouter,
}));

const customRender = (
  { reservation, ...mockProps }: CustomRenderProps = {
    reservation: createMockInfoCardReservation(),
  }
) => {
  const renderReservation = reservation ?? createInfoCardReservationMock();
  return render(
    <MockedProvider
      mocks={createGraphQLMocks(mockProps)}
      defaultOptions={{
        watchQuery: { fetchPolicy: "no-cache" },
        query: { fetchPolicy: "no-cache" },
        mutate: { fetchPolicy: "no-cache" },
      }}
    >
      <ReservationInfoCard reservation={renderReservation} />
    </MockedProvider>
  );
};

beforeEach(() => {
  vi.useFakeTimers({
    now: new Date(2024, 0, 1, 0, 0, 0),
  });
});
afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
});

describe("Component: ReservationInfoCard", () => {
  it("should render the component", async () => {
    const view = customRender();
    await waitForPrice(view);

    const contentSection = view.getByTestId(
      "reservation__reservation-info-card__content"
    );
    expect(contentSection).toBeInTheDocument();
  });

  it("should show reservation unit name according to the reservation unit for the reservation", () => {
    const view = customRender();
    const mockReservationData = createMockInfoCardReservation();
    const reservationUnit = mockReservationData.reservationUnits[0];
    const reservationUnitNameElement = view.getByTestId(
      "reservation__reservation-info-card__reservationUnit"
    );

    expect(reservationUnitNameElement).toHaveTextContent(
      reservationUnit?.nameFi ?? "Test Reservation Unit FI"
    );
  });

  it("should show the reservation id", () => {
    const view = customRender();
    const mockReservationData = createMockInfoCardReservation();
    const reservationIdElement = view.getByTestId(
      "reservation__reservation-info-card__reservationNumber"
    );

    expect(reservationIdElement).toHaveTextContent(
      `${mockReservationData.pk ?? "1"}`
    );
  });

  it("should show the reservation duration", () => {
    const view = customRender();
    const reservationDurationElement = view.getByTestId(
      "reservation__reservation-info-card__duration"
    );

    expect(reservationDurationElement).toHaveTextContent(
      "Common:dateWithWeekday common:dateWithWeekdaycommon:dayTimeSeparator common:dateWithWeekday–common:dateWithWeekday, common:abbreviations.hour"
    );
  });

  it("should show the reservation price if it's defined and exceeds 0€, otherwise a text for being free of charge", () => {
    const view = customRender({
      reservation: createMockInfoCardReservation("0"),
    });
    const reservationPriceElement = view.getByTestId(
      "reservation__reservation-info-card__price"
    );

    expect(reservationPriceElement).toHaveTextContent(
      "common:price: prices:priceFree"
    );
  });
  it("should show the reservation price if it's defined", () => {
    const view = customRender();
    const reservationPriceElement = view.getByTestId(
      "reservation__reservation-info-card__price"
    );

    // default reservationRenderProps has a price of 10 €
    expect(reservationPriceElement).toHaveTextContent(
      `common:price: 10,00 € (common:inclTax)`
    );
  });
});

function createMockInfoCardReservation(
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

async function waitForPrice(
  view: ReturnType<typeof customRender>
): Promise<HTMLElement> {
  const priceSection = view.getByTestId(
    "reservation__reservation-info-card__duration"
  );
  await expect.poll(() => priceSection).toBeInTheDocument();
  return priceSection;
}

function createInfoCardReservationMock(): Readonly<
  NonNullable<ReservationInfoCardFragment>
> {
  return createMockInfoCardReservation();
}
