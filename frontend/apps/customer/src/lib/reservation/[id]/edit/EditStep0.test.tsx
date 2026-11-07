import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { MockedProvider } from "@apollo/client/testing";
import { zodResolver } from "@hookform/resolvers/zod";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MockedResponse } from "@apollo/client/testing";
import type { EditPageReservationFragment } from "@gql/gql-types";
import { transformReservation } from "@/modules/reservation";
import { PendingReservationFormSchema } from "@/modules/schemas/reservationUnit";
import type { PendingReservationFormType } from "@/modules/schemas/reservationUnit";
import { createMockReservation, createReservationPriceQueryMock } from "@test/reservation.mocks";
import { EditStep0 } from "./EditStep0";

// Heavy calendar/quick-reservation UI + polling hook are covered elsewhere -
// stub them so this test can focus on EditStep0's own submitReservation
// orchestration logic (early-return/throw branches chaining already-tested
// pure functions).
vi.mock("@/components/QuickReservation", () => ({
  QuickReservation: () => <div data-testid="mock-quick-reservation" />,
}));
vi.mock("@/components/reservation", async (importOriginal) => ({
  ...(await importOriginal()),
  ReservationTimePicker: () => <div data-testid="mock-time-picker" />,
}));
vi.mock("@/hooks/useBlockingReservations", () => ({
  useBlockingReservations: () => ({ blockingReservations: [] }),
}));
vi.mock("@/hooks", async (importOriginal) => ({
  ...(await importOriginal()),
  useAvailableTimes: () => ({ startingTimeOptions: [], nextAvailableTime: undefined }),
}));

const mockErrorToast = vi.fn();
vi.mock("ui/src/components/toast", () => ({
  errorToast: (...args: unknown[]) => mockErrorToast(...args),
}));

const mockConvertFormToFocustimeSlot = vi.fn();
const mockIsRangeReservable = vi.fn();
const mockIsReservationEditable = vi.fn();

vi.mock("@/modules/reservation", async (importOriginal) => ({
  ...(await importOriginal()),
  isReservationEditable: (...args: unknown[]) => mockIsReservationEditable(...args),
  convertFormToFocustimeSlot: (...args: unknown[]) => mockConvertFormToFocustimeSlot(...args),
}));
vi.mock("@/modules/reservable", async (importOriginal) => ({
  ...(await importOriginal()),
  isRangeReservable: (...args: unknown[]) => mockIsRangeReservable(...args),
}));

const SLOT_START = new Date(2024, 0, 1, 10, 0);
const SLOT_END = new Date(2024, 0, 1, 11, 0);

function createPriceMock(total: string): MockedResponse {
  return createReservationPriceQueryMock({
    beginsAt: SLOT_START,
    endsAt: SLOT_END,
    price: { total, canApplyForDiscount: false, lines: [] },
  });
}

function buildReservation(): EditPageReservationFragment {
  const base = createMockReservation({ pk: 1 });
  return {
    ...base,
    reservationUnit: {
      ...base.reservationUnit,
      applicationRounds: [],
      reservableTimeSpans: [],
      minReservationDuration: null,
      maxReservationDuration: null,
      reservationStartInterval: null,
    },
  } as unknown as EditPageReservationFragment;
}

function Wrapper({
  reservation,
  nextStep,
  mocks,
}: {
  reservation: EditPageReservationFragment;
  nextStep: () => void;
  mocks: ReadonlyArray<MockedResponse>;
}): React.ReactElement {
  const reservationForm = useForm<PendingReservationFormType>({
    defaultValues: transformReservation(reservation),
    mode: "onChange",
    resolver: zodResolver(PendingReservationFormSchema),
  });
  // The real form is dirtied by interacting with the (here stubbed) date/time
  // pickers - mark it dirty directly so the continue button reflects the
  // (mocked) focusSlot state instead of always being disabled.
  useEffect(() => {
    const currentDuration = reservationForm.getValues("duration");
    reservationForm.setValue("duration", currentDuration + 30, { shouldDirty: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <MockedProvider mocks={mocks}>
      <EditStep0 reservation={reservation} reservationForm={reservationForm} nextStep={nextStep} />
    </MockedProvider>
  );
}

function customRender({
  reservation = buildReservation(),
  nextStep = vi.fn(),
  mocks = [createPriceMock("0.00")],
}: {
  reservation?: EditPageReservationFragment;
  nextStep?: () => void;
  mocks?: ReadonlyArray<MockedResponse>;
} = {}): ReturnType<typeof render> {
  return render(<Wrapper reservation={reservation} nextStep={nextStep} mocks={mocks} />);
}

beforeEach(() => {
  mockConvertFormToFocustimeSlot.mockReset();
  mockIsRangeReservable.mockReset();
  mockIsReservationEditable.mockReset();
  mockErrorToast.mockReset();
  // sensible defaults, overridden per test
  mockConvertFormToFocustimeSlot.mockReturnValue({
    isReservable: true,
    start: SLOT_START,
    end: SLOT_END,
  });
  mockIsReservationEditable.mockReturnValue(true);
  mockIsRangeReservable.mockReturnValue(true);
});

describe("EditStep0", () => {
  it("renders a cancel link pointing back to the reservation", () => {
    const reservation = buildReservation();
    customRender({ reservation });
    expect(screen.getByTestId("reservation-edit__button--cancel")).toHaveAttribute(
      "href",
      `/reservations/${reservation.pk}`
    );
  });

  it("calls nextStep when the form is submitted and the new time is reservable", async () => {
    const nextStep = vi.fn();
    customRender({ nextStep });

    await userEvent.click(screen.getByTestId("reservation__button--continue"));

    await waitFor(() => expect(nextStep).toHaveBeenCalledTimes(1));
    expect(mockIsReservationEditable).toHaveBeenCalled();
    expect(mockIsRangeReservable).toHaveBeenCalled();
  });

  it("does not call nextStep when the new time is not free of charge", async () => {
    const nextStep = vi.fn();
    customRender({ nextStep, mocks: [createPriceMock("10.00")] });

    const form = screen.getByTestId("reservation__button--continue").closest("form");
    form?.requestSubmit();

    await waitFor(() =>
      expect(mockErrorToast).toHaveBeenCalledWith({ text: "reservationCalendar:errors.unavailable" })
    );
    expect(mockIsRangeReservable).not.toHaveBeenCalled();
    expect(nextStep).not.toHaveBeenCalled();
  });

  it("does not call nextStep when the computed slot is not reservable", async () => {
    mockConvertFormToFocustimeSlot.mockReturnValue({ isReservable: false });
    const nextStep = vi.fn();
    customRender({ nextStep });

    // the button is disabled based on the same (mocked) focusSlot, so
    // submit the underlying form directly to exercise submitReservation
    const form = screen.getByTestId("reservation__button--continue").closest("form");
    expect(form).toBeInTheDocument();
    form?.requestSubmit();

    await waitFor(() => expect(mockIsReservationEditable).toHaveBeenCalled());
    expect(mockIsRangeReservable).not.toHaveBeenCalled();
    expect(nextStep).not.toHaveBeenCalled();
  });

  it("does not call nextStep when the new range is not reservable", async () => {
    mockIsRangeReservable.mockReturnValue(false);
    const nextStep = vi.fn();
    customRender({ nextStep });

    await userEvent.click(screen.getByTestId("reservation__button--continue"));

    await waitFor(() => expect(mockIsRangeReservable).toHaveBeenCalled());
    expect(nextStep).not.toHaveBeenCalled();
  });
});
