import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import { useForm } from "react-hook-form";
import type { PendingReservationFormType } from "@/modules/schemas/reservationUnit";
import type { ReservationTimePickerFieldsFragment } from "@gql/gql-types";
import { QuickReservation } from "./QuickReservation";

vi.mock("@/modules/reservationUnit", () => ({
  isReservationUnitFreeOfCharge: vi.fn(() => false),
  getReservationUnitPrice: vi.fn(() => "€100"),
  getLastPossibleReservationDate: vi.fn(() => new Date("2026-12-31")),
}));

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

function QuickReservationWrapper({
  focusSlot,
  showSubmit = true,
}: {
  focusSlot: { isReservable: boolean };
  showSubmit?: boolean;
}) {
  const form = useForm<PendingReservationFormType>({
    defaultValues: { date: "", duration: 60, time: "" },
  });

  return (
    <QuickReservation
      reservationUnit={createMockReservationUnit()}
      subventionSuffix={undefined}
      reservationForm={form}
      durationOptions={[{ label: "60 min", value: 60 }]}
      startingTimeOptions={
        showSubmit ? [
          { label: "09:00", value: "09:00" },
          { label: "10:00", value: "10:00" },
        ] : []
      }
      focusSlot={focusSlot}
      nextAvailableTime={null}
      submitReservation={vi.fn()}
      LoginAndSubmit={<button type="submit">Submit</button>}
    />
  );
}

describe("QuickReservation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders the quick reservation form", () => {
    render(<QuickReservationWrapper focusSlot={{ isReservable: true }} />);

    const form_element = document.querySelector("#quick-reservation");
    expect(form_element).toBeInTheDocument();
  });

  test("renders form heading", () => {
    render(<QuickReservationWrapper focusSlot={{ isReservable: true }} />);

    expect(screen.getByText("reservationCalendar:quickReservation.heading")).toBeInTheDocument();
  });

  test("renders submit button when slot is reservable", () => {
    render(<QuickReservationWrapper focusSlot={{ isReservable: true }} />);

    expect(screen.getByRole("button", { name: "Submit" })).toBeInTheDocument();
  });

  test("does not render submit button when slot is not reservable", () => {
    render(<QuickReservationWrapper focusSlot={{ isReservable: false }} showSubmit={false} />);

    expect(screen.queryByRole("button", { name: "Submit" })).not.toBeInTheDocument();
  });
});
