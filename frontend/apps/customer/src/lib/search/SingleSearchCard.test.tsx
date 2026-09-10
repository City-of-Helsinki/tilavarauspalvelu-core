import React from "react";
import { render, screen } from "@testing-library/react";
import { addDays } from "date-fns";
import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { getActivePricing } from "@/modules/reservationUnit";
import { AccessType } from "@gql/gql-types";
import type { SingleSearchCardFragment } from "@gql/gql-types";
import { SingleSearchCard } from "./SingleSearchCard";

const { mockedSearchParams, useSearchParams } = vi.hoisted(() => {
  const params = vi.fn();
  return { useSearchParams: params, mockedSearchParams: params };
});

vi.mock("next/navigation", () => ({
  useSearchParams,
}));

const { constState } = vi.hoisted(() => ({ constState: { isBrowser: true } }));
vi.mock("@/modules/const", () => ({
  get isBrowser() {
    return constState.isBrowser;
  },
}));

vi.mock("@/modules/reservationUnit", () => ({
  getActivePricing: vi.fn(() => undefined),
  getPriceString: vi.fn(() => "10,00 - 20,00 € / tunti"),
}));

vi.mock("@/modules/urls", () => ({
  getReservationUnitPath: (pk: number) => `/reservation-unit/${pk}`,
}));

vi.mock("ui/src/modules/helpers", () => ({
  getLocalizationLang: () => "fi",
  getTranslation: (obj: unknown) =>
    typeof obj === "object" && obj != null && "nameFi" in obj ? (obj as { nameFi: unknown }).nameFi : null,
  getImageSource: (img: unknown) => (img ? "https://example.com/image.jpg" : undefined),
  getMainImage: (ru: { images?: ReadonlyArray<unknown> }) => ru?.images?.[0] ?? null,
}));

function createMockReservationUnit(overrides: Partial<SingleSearchCardFragment> = {}): SingleSearchCardFragment {
  return {
    id: "ru-1",
    pk: 1,
    nameFi: "Test Reservation Unit",
    nameEn: "Test Reservation Unit",
    nameSv: "Test Reservation Unit",
    reservationBeginsAt: null,
    reservationEndsAt: null,
    isClosed: false,
    firstReservableDatetime: null,
    currentAccessType: null,
    effectiveAccessType: null,
    maxPersons: null,
    pricings: [],
    accessTypes: [],
    reservationUnitType: null,
    images: [],
    unit: {
      id: "unit-1",
      nameFi: "Test Unit Name",
      nameEn: "Test Unit Name",
      nameSv: "Test Unit Name",
    },
    ...overrides,
  } as SingleSearchCardFragment;
}

describe("SingleSearchCard", () => {
  beforeEach(() => {
    mockedSearchParams.mockReturnValue(new URLSearchParams());
    constState.isBrowser = true;
    vi.mocked(getActivePricing).mockReturnValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test("renders reservation unit name and unit name", () => {
    render(<SingleSearchCard reservationUnit={createMockReservationUnit()} />);

    expect(screen.getByText("Test Reservation Unit")).toBeInTheDocument();
    expect(screen.getByText("Test Unit Name")).toBeInTheDocument();
  });

  test("renders optional infos when data is present", () => {
    vi.mocked(getActivePricing).mockReturnValue({} as ReturnType<typeof getActivePricing>);
    const reservationUnit = createMockReservationUnit({
      maxPersons: 5,
      effectiveAccessType: AccessType.AccessCode,
      reservationUnitType: {
        id: "type-1",
        nameFi: "Meeting room",
        nameEn: "Meeting room",
        nameSv: "Meeting room",
      },
    });

    render(<SingleSearchCard reservationUnit={reservationUnit} />);

    expect(screen.getByText("Meeting room")).toBeInTheDocument();
    expect(screen.getByText("10,00 - 20,00 € / tunti")).toBeInTheDocument();
    expect(screen.getByLabelText(/reservationUnitCard:maxPersons/)).toBeInTheDocument();
    expect(screen.getByText(/reservationUnitCard:maxPersons/)).toBeInTheDocument();
    expect(screen.getByLabelText("reservationUnit:accessType")).toBeInTheDocument();
    expect(screen.getByText(`reservationUnit:accessTypes.${AccessType.AccessCode}`)).toBeInTheDocument();
  });

  test("omits optional infos when data is absent", () => {
    render(<SingleSearchCard reservationUnit={createMockReservationUnit()} />);

    expect(screen.queryByLabelText("prices:reservationUnitPriceLabel")).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/reservationUnitCard:maxPersons/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText("reservationUnit:accessType")).not.toBeInTheDocument();
  });

  test("builds show link including query params from the URL", () => {
    const params = new URLSearchParams();
    params.set("startDate", "2026-09-15");
    params.set("timeBegin", "10:00");
    params.set("duration", "60");
    mockedSearchParams.mockReturnValue(params);

    render(<SingleSearchCard reservationUnit={createMockReservationUnit({ pk: 42 })} />);

    const link = screen.getByRole("link", { name: /common:show/i });
    const href = link.getAttribute("href") ?? "";
    expect(href).toContain("/reservation-unit/42");
    expect(href).toContain("duration=60");
    expect(href).toContain("date=2026-09-15");
    expect(href).toContain("time=10%3A00");
  });

  test("builds show link without extra params when none are present in the URL", () => {
    render(<SingleSearchCard reservationUnit={createMockReservationUnit({ pk: 42 })} />);

    const link = screen.getByText("common:show").closest("a");
    expect(link).toHaveAttribute("href", "http://localhost:3000/reservation-unit/42");
  });

  test("renders a disabled/empty link when reservation unit has no pk", () => {
    render(<SingleSearchCard reservationUnit={createMockReservationUnit({ pk: null })} />);

    const link = screen.getByText("common:show").closest("a");
    expect(link).not.toHaveAttribute("href");
  });

  test("renders a disabled/empty link outside the browser", () => {
    constState.isBrowser = false;

    render(<SingleSearchCard reservationUnit={createMockReservationUnit({ pk: 42 })} />);

    const link = screen.getByText("common:show").closest("a");
    expect(link).not.toHaveAttribute("href");
  });

  test("shows a closed tag when the reservation unit is closed", () => {
    render(<SingleSearchCard reservationUnit={createMockReservationUnit({ isClosed: true })} />);

    expect(screen.getByText("reservationUnitCard:closed")).toBeInTheDocument();
  });

  test("shows a noTimes tag when there is no valid first reservable datetime", () => {
    const { unmount } = render(
      <SingleSearchCard reservationUnit={createMockReservationUnit({ firstReservableDatetime: null })} />
    );
    expect(screen.getByText("reservationUnitCard:noTimes")).toBeInTheDocument();
    unmount();

    render(<SingleSearchCard reservationUnit={createMockReservationUnit({ firstReservableDatetime: "not-a-date" })} />);
    expect(screen.getByText("reservationUnitCard:noTimes")).toBeInTheDocument();
  });

  test("shows 'today' with time when first reservable slot is today", () => {
    const datetime = new Date();
    datetime.setHours(14, 30, 0, 0);

    render(
      <SingleSearchCard
        reservationUnit={createMockReservationUnit({ firstReservableDatetime: datetime.toISOString() })}
      />
    );

    expect(screen.getByText("common:today 14:30")).toBeInTheDocument();
    expect(screen.getByLabelText("reservationUnitCard:firstAvailableTime")).toBeInTheDocument();
  });

  test("shows 'tomorrow' with time when first reservable slot is tomorrow", () => {
    const datetime = addDays(new Date(), 1);
    datetime.setHours(9, 0, 0, 0);

    render(
      <SingleSearchCard
        reservationUnit={createMockReservationUnit({ firstReservableDatetime: datetime.toISOString() })}
      />
    );

    expect(screen.getByText("common:tomorrow 09:00")).toBeInTheDocument();
  });

  test("shows a formatted date with time when first reservable slot is further away", () => {
    const datetime = addDays(new Date(), 10);
    datetime.setHours(12, 15, 0, 0);
    const expectedDate = `${datetime.getDate()}.${datetime.getMonth() + 1}.${datetime.getFullYear()}`;

    render(
      <SingleSearchCard
        reservationUnit={createMockReservationUnit({ firstReservableDatetime: datetime.toISOString() })}
      />
    );

    expect(screen.getByText(`${expectedDate} 12:15`)).toBeInTheDocument();
  });
});
