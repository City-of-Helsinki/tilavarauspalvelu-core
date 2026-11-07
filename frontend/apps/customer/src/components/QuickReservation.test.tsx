import React from "react";
import { useForm } from "react-hook-form";
import { MockedProvider } from "@apollo/client/testing";
import { render, screen, waitFor } from "@testing-library/react";
import { addHours } from "date-fns";
import { describe, test, expect, vi, beforeEach } from "vitest";
import type { MockedResponse } from "@apollo/client/testing";
import type { ReservationTimePickerFieldsFragment } from "@gql/gql-types";
import type { PendingReservationFormType } from "@/modules/schemas/reservationUnit";
import { createReservationPriceLine, createReservationPriceQueryMock } from "@test/reservation.mocks";
import { QuickReservation } from "./QuickReservation";

vi.mock("@/modules/reservationUnit", () => ({
  getLastPossibleReservationDate: vi.fn(() => new Date("2026-12-31")),
}));

const SLOT_START = new Date("2026-11-10T09:00:00Z");

function createMockReservationUnit(
  overrides: Partial<ReservationTimePickerFieldsFragment> = {}
): ReservationTimePickerFieldsFragment {
  return {
    id: "ru-1",
    pk: 1,
    pricings: [],
    ...overrides,
  } as ReservationTimePickerFieldsFragment;
}

function createPriceMock({
  total = "40.00",
  canApplyForDiscount = false,
  beginsAt = SLOT_START,
  delay = 0,
}: {
  total?: string;
  canApplyForDiscount?: boolean;
  beginsAt?: Date;
  delay?: number;
} = {}): MockedResponse {
  const mock = createReservationPriceQueryMock({
    beginsAt,
    endsAt: addHours(beginsAt, 1),
    price: { total, canApplyForDiscount, lines: [createReservationPriceLine({ amount: total })] },
  });
  return { ...mock, delay };
}

function QuickReservationWrapper({
  focusSlot,
  showSubmit = true,
  slotStart = SLOT_START,
}: {
  focusSlot?: { isReservable: boolean };
  showSubmit?: boolean;
  slotStart?: Date;
}) {
  const form = useForm<PendingReservationFormType>({
    defaultValues: { date: "", duration: 60, time: "" },
  });

  const resolvedFocusSlot = focusSlot?.isReservable
    ? {
        start: slotStart,
        end: addHours(slotStart, 1),
        durationMinutes: 60,
        isReservable: true as const,
      }
    : { isReservable: false as const };

  return (
    <QuickReservation
      reservationUnit={createMockReservationUnit()}
      subventionSuffix={<span>Subvention</span>}
      reservationForm={form}
      durationOptions={[{ label: "60 min", value: 60 }]}
      startingTimeOptions={
        showSubmit
          ? [
              { label: "09:00", value: "09:00" },
              { label: "10:00", value: "10:00" },
            ]
          : []
      }
      focusSlot={resolvedFocusSlot}
      nextAvailableTime={null}
      submitReservation={vi.fn()}
      LoginAndSubmit={<button type="submit">Submit</button>}
    />
  );
}

function customRender({
  focusSlot,
  showSubmit,
  mocks = [createPriceMock()],
}: {
  focusSlot?: { isReservable: boolean };
  showSubmit?: boolean;
  mocks?: ReadonlyArray<MockedResponse>;
}): ReturnType<typeof render> {
  return render(
    <MockedProvider mocks={mocks}>
      <QuickReservationWrapper focusSlot={focusSlot} showSubmit={showSubmit} />
    </MockedProvider>
  );
}

describe("QuickReservation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders the quick reservation form", () => {
    customRender({ focusSlot: { isReservable: true } });

    const form_element = document.querySelector("#quick-reservation");
    expect(form_element).toBeInTheDocument();
  });

  test("renders form heading", () => {
    customRender({ focusSlot: { isReservable: true } });

    expect(screen.getByText("reservationCalendar:quickReservation.heading")).toBeInTheDocument();
  });

  test("renders submit button when slot is reservable", () => {
    customRender({ focusSlot: { isReservable: true } });

    expect(screen.getByRole("button", { name: "Submit" })).toBeInTheDocument();
  });

  test("does not render submit button when slot is not reservable", () => {
    customRender({ focusSlot: { isReservable: false }, showSubmit: false });

    expect(screen.queryByRole("button", { name: "Submit" })).not.toBeInTheDocument();
  });

  test("shows the price of the selected time from the backend", async () => {
    customRender({ focusSlot: { isReservable: true } });

    expect(await screen.findByText("40,00 €")).toBeInTheDocument();
    expect(screen.queryByText("Subvention")).not.toBeInTheDocument();
  });

  test("shows the price as a range and the subvention text when the customer can apply for a discount", async () => {
    customRender({ focusSlot: { isReservable: true }, mocks: [createPriceMock({ canApplyForDiscount: true })] });

    expect(await screen.findByText("0 - 40,00 €")).toBeInTheDocument();
    expect(screen.getByText("Subvention")).toBeInTheDocument();
  });

  test("shows free of charge for a free time", async () => {
    customRender({ focusSlot: { isReservable: true }, mocks: [createPriceMock({ total: "0.00" })] });

    expect(await screen.findByText("prices:priceFree")).toBeInTheDocument();
  });

  test("shows a loading text until the first price loads", async () => {
    customRender({ focusSlot: { isReservable: true }, mocks: [createPriceMock({ delay: 20 })] });

    expect(screen.getByText("prices:loading")).toBeInTheDocument();
    expect(await screen.findByText("40,00 €")).toBeInTheDocument();
    expect(screen.queryByText("prices:loading")).not.toBeInTheDocument();
  });

  test("keeps the previous price grayed out while the price of a new time loads", async () => {
    const nextStart = new Date("2026-11-10T11:00:00Z");
    const mocks = [createPriceMock(), createPriceMock({ total: "50.00", beginsAt: nextStart, delay: 20 })];
    const view = render(
      <MockedProvider mocks={mocks}>
        <QuickReservationWrapper focusSlot={{ isReservable: true }} />
      </MockedProvider>
    );
    expect(await screen.findByText("40,00 €")).toHaveAttribute("aria-busy", "false");

    view.rerender(
      <MockedProvider mocks={mocks}>
        <QuickReservationWrapper focusSlot={{ isReservable: true }} slotStart={nextStart} />
      </MockedProvider>
    );

    expect(screen.getByText("40,00 €")).toHaveAttribute("aria-busy", "true");
    expect(await screen.findByText("50,00 €")).toHaveAttribute("aria-busy", "false");
  });

  test("keeps an empty price cell next to the button when the price fails to load", async () => {
    const { request } = createPriceMock();
    customRender({ focusSlot: { isReservable: true }, mocks: [{ request, error: new Error("Network error") }] });

    const priceCell = screen.getByTestId("quick-reservation__price");
    await waitFor(() => expect(priceCell).toBeEmptyDOMElement());
    expect(screen.getByRole("button", { name: "Submit" })).toBeInTheDocument();
  });
});
