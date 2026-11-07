import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createNodeId } from "ui/src/modules/helpers";
import { AccessType, PriceUnit, ReservationUnitImageType, ReservationStateChoice } from "@gql/gql-types";
import type { ReservationInfoCardFragment, ReservationPriceCalculationFieldsFragment } from "@gql/gql-types";
import { createGraphQLMocks } from "@test/gql.mocks";
import { createReservationPriceLine, future1hReservation, generateDescriptionFragment } from "@test/reservation.mocks";
import { generateNameFragment } from "@test/test.gql.utils";
import type { CreateGraphQLMockProps } from "@test/test.gql.utils";
import { MockedGraphQLProvider } from "@test/test.react.utils";
import { ReservationInfoCard } from "./";

interface CustomRenderProps extends CreateGraphQLMockProps {
  reservation?: ReservationInfoCardFragment;
  reservationPrice?: ReservationPriceCalculationFieldsFragment;
  isDiscountRange?: boolean;
}

const customRender = (
  { reservation, reservationPrice, isDiscountRange, ...mockProps }: CustomRenderProps = {
    reservation: createMockReservationInfoCard(),
  }
) => {
  const renderReservation = reservation ?? createInfoCardReservationMock();
  return render(
    <MockedGraphQLProvider mocks={createGraphQLMocks(mockProps)}>
      <ReservationInfoCard
        reservation={renderReservation}
        reservationPrice={reservationPrice}
        isDiscountRange={isDiscountRange}
      />
    </MockedGraphQLProvider>
  );
};

function getPriceText(): string {
  const text = screen.getByTestId("reservation__reservation-info-card__price").textContent ?? "";
  return text.replaceAll(/\s+/g, " ").trim();
}

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
    const durationText = "7.1.2024 klo 09:00–10:00";
    const durationHoursText = 'common:abbreviations:hour {"count":1}';
    expect(screen.getByTestId("reservation__reservation-info-card__duration").textContent).toContain(durationText);
    expect(screen.getByTestId("reservation__reservation-info-card__duration").textContent).toContain(durationHoursText);
  });

  it("shows free of charge when the price is 0", () => {
    customRender({
      reservation: createMockReservationInfoCard("0"),
    });
    expect(getPriceText()).toBe("common:price: prices:priceFree");
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

  describe("with the price lines of the reservation", () => {
    it("shows the override amount of the handler instead of the amount", () => {
      customRender({
        reservation: createMockReservationInfoCard("10", {
          priceLines: [createPriceLine({ amount: "10.00", overrideAmount: "4.00" })],
        }),
      });
      expect(getPriceText()).toBe('common:price: 4,00 € (common:inclTax {"taxPercentage":"25,5"})');
    });

    it("shows the price as a range from 0 while the discount is pending", () => {
      customRender({
        reservation: createMockReservationInfoCard("10", {
          applyingForFreeOfCharge: true,
          state: ReservationStateChoice.RequiresHandling,
        }),
      });
      expect(getPriceText()).toBe('common:price: 0 - 10,00 € (common:inclTax {"taxPercentage":"25,5"})');
    });

    it("uses the price of the reservation when the reservation has no price lines", () => {
      customRender({
        reservation: createMockReservationInfoCard("12", { priceLines: [], taxPercentageValue: "24" }),
      });
      expect(getPriceText()).toBe('common:price: 12,00 € (common:inclTax {"taxPercentage":"24"})');
    });

    it("adds the material price of the reservation unit as it is today", () => {
      const reservation = createMockReservationInfoCard("10");
      customRender({
        reservation: {
          ...reservation,
          reservationUnit: {
            ...reservation.reservationUnit,
            priceSummary: {
              isFree: false,
              lowestAmount: "10.00",
              priceUnit: PriceUnit.PerHour,
              canApplyForDiscount: false,
              materialPriceDescriptionFi: "<p>Materiaali</p>",
              materialPriceDescriptionEn: "<p>Material</p>",
              materialPriceDescriptionSv: "<p>Material</p>",
            },
          },
        },
      });
      expect(getPriceText()).toBe(
        'common:price: 10,00 € + prices:materialPrice (common:inclTax {"taxPercentage":"25,5"})'
      );
    });

    it("lists the price lines when there are more than one", () => {
      customRender({
        reservation: createMockReservationInfoCard("15", {
          priceLines: [
            createPriceLine({ descriptionFi: "Tilan vuokra", amount: "10.00" }),
            createPriceLine({ id: "2", descriptionFi: "Siivous", amount: "5.00" }),
          ],
        }),
      });
      expect(screen.getByText("Tilan vuokra: 10,00 €")).toBeInTheDocument();
      expect(screen.getByText("Siivous: 5,00 €")).toBeInTheDocument();
    });
  });

  describe("with the price calculation of the backend", () => {
    it("shows the total price and the tax percentage", () => {
      customRender({
        reservation: createMockReservationInfoCard(),
        reservationPrice: { total: "40.00", canApplyForDiscount: false, lines: [createReservationPriceLine()] },
      });
      expect(getPriceText()).toBe('common:price: 40,00 € (common:inclTax {"taxPercentage":"25,5"})');
    });

    it("shows the price as a range from 0 when the customer applies for a discount", () => {
      customRender({
        reservation: createMockReservationInfoCard(),
        reservationPrice: { total: "40.00", canApplyForDiscount: true, lines: [createReservationPriceLine()] },
        isDiscountRange: true,
      });
      expect(getPriceText()).toBe('common:price: 0 - 40,00 € (common:inclTax {"taxPercentage":"25,5"})');
    });

    it("shows free of charge without the tax percentage", () => {
      customRender({
        reservation: createMockReservationInfoCard(),
        reservationPrice: {
          total: "0.00",
          canApplyForDiscount: false,
          lines: [createReservationPriceLine({ amount: "0.00" })],
        },
      });
      expect(getPriceText()).toBe("common:price: prices:priceFree");
    });

    it("adds the material price when a line has a material price description", () => {
      customRender({
        reservation: createMockReservationInfoCard(),
        reservationPrice: {
          total: "40.00",
          canApplyForDiscount: false,
          lines: [createReservationPriceLine({ materialPriceDescriptionFi: "<p>Materiaali</p>" })],
        },
      });
      expect(getPriceText()).toBe(
        'common:price: 40,00 € + prices:materialPrice (common:inclTax {"taxPercentage":"25,5"})'
      );
    });

    it("lists the price lines when there are more than one", () => {
      customRender({
        reservation: createMockReservationInfoCard(),
        reservationPrice: {
          total: "50.00",
          canApplyForDiscount: false,
          lines: [
            createReservationPriceLine({ descriptionFi: "Tilan vuokra", amount: "40.00" }),
            createReservationPriceLine({ descriptionFi: "Siivous", amount: "10.00" }),
          ],
        },
      });
      expect(screen.getByText("Tilan vuokra: 40,00 €")).toBeInTheDocument();
      expect(screen.getByText("Siivous: 10,00 €")).toBeInTheDocument();
    });
  });
});

type PriceLine = NonNullable<ReservationInfoCardFragment["priceLines"]>[number];

function createPriceLine(overrides: Partial<PriceLine> = {}): PriceLine {
  return {
    id: createNodeId("ReservationPriceLineNode", 1),
    ...generateDescriptionFragment("Space rent"),
    amount: "10.00",
    overrideAmount: null,
    taxPercentage: "25.5",
    ...overrides,
  };
}

function createMockReservationInfoCard(
  price?: string,
  overrides: Partial<ReservationInfoCardFragment> = {}
): ReservationInfoCardFragment {
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
    taxPercentageValue: "25.5",
    priceLines: [createPriceLine({ amount: price ?? "10.00" })],
    reservationUnit: {
      id: createNodeId("ReservationUnitNode", 2),
      priceSummary: null,
      images: [
        {
          id: createNodeId("ReservationUnitImageNode", 1),
          imageUrl: "https://example.com/image-image.jpg",
          imageType: ReservationUnitImageType.Main,
          largeUrl: "https://example.com/image-large.jpg",
          mediumUrl: "https://example.com/image-medium.jpg",
          smallUrl: "https://example.com/image-small.jpg",
        },
      ],
      pk: 2,
      ...generateNameFragment("Test reservation unit"),
      unit: {
        id: "3",
        ...generateNameFragment("Test unit"),
      },
    },
    state: ReservationStateChoice.Confirmed,
    ...overrides,
  };
}

function createInfoCardReservationMock(): Readonly<NonNullable<ReservationInfoCardFragment>> {
  return createMockReservationInfoCard();
}
