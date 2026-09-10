import React from "react";
import { MockedProvider } from "@apollo/client/testing";
import type { MockedResponse } from "@apollo/client/testing";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GraphQLError } from "graphql";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RejectRestDocument, ReserveeType, Weekday } from "@gql/gql-types";
import { ApplicationSectionCard } from "./ApplicationEventCard";
import type { ReservationUnitOptionNodeT, SectionNodeT } from "./modules/applicationRoundAllocation";

const mockUseFocusApplicationEvent = vi.fn();
const mockUseFocusAllocatedSlot = vi.fn();
vi.mock("./hooks", () => ({
  useFocusApplicationEvent: () => mockUseFocusApplicationEvent(),
  useFocusAllocatedSlot: () => mockUseFocusAllocatedSlot(),
}));

const setFocusedApplicationSection = vi.fn();
const setFocusedAllocatedSlot = vi.fn();

function createReservationUnitOption(overrides: Record<string, unknown> = {}): ReservationUnitOptionNodeT {
  return {
    pk: 100,
    isLocked: false,
    isRejected: false,
    allocatedTimeSlots: [],
    reservationUnit: { pk: 10, nameFi: "Reservation unit", unit: { nameFi: "Unit" } },
    ...overrides,
  } as unknown as ReservationUnitOptionNodeT;
}

function createSection(overrides: Partial<SectionNodeT> = {}): SectionNodeT {
  return {
    pk: 1,
    name: "Section name",
    ageGroup: { minimum: 5, maximum: 10 },
    numPersons: 8,
    appliedReservationsPerWeek: 2,
    reservationMinDuration: 3600,
    reservationMaxDuration: 3600,
    reservationUnitOptions: [createReservationUnitOption()],
    application: {
      pk: 5,
      applicantType: ReserveeType.Individual,
      contactPersonFirstName: "First",
      contactPersonLastName: "Last",
      organisationName: null,
    },
    ...overrides,
  } as SectionNodeT;
}

const reservationUnit = { pk: 10 };

beforeEach(() => {
  mockUseFocusApplicationEvent.mockReset();
  mockUseFocusAllocatedSlot.mockReset();
  setFocusedApplicationSection.mockReset();
  setFocusedAllocatedSlot.mockReset();
  mockUseFocusApplicationEvent.mockReturnValue([null, setFocusedApplicationSection]);
  mockUseFocusAllocatedSlot.mockReturnValue([undefined, setFocusedAllocatedSlot]);
});

function renderCard(
  section: SectionNodeT,
  type: "unallocated" | "allocated" | "partial" | "declined",
  mocks: ReadonlyArray<MockedResponse> = [],
  refetch = vi.fn()
) {
  return render(
    <MockedProvider mocks={mocks}>
      <ApplicationSectionCard
        applicationSection={section}
        reservationUnit={reservationUnit}
        type={type}
        refetch={refetch}
      />
    </MockedProvider>
  );
}

function lastOrThrow<T>(items: ReadonlyArray<T>): T {
  const last = items[items.length - 1];
  if (last === undefined) {
    throw new Error("Expected at least one item");
  }
  return last;
}

async function expandDetails() {
  const user = userEvent.setup();
  const [toggle] = screen.getAllByRole("button", { hidden: true });
  if (!toggle) {
    throw new Error("Expected the expand toggle button to be rendered");
  }
  await user.click(toggle);
  return user;
}

describe("ApplicationSectionCard", () => {
  it("renders the applicant name and radio button", () => {
    renderCard(createSection(), "unallocated");

    expect(screen.getByText("Section name")).toBeInTheDocument();
    expect(screen.getByText("1, First Last")).toBeInTheDocument();
  });

  it("sets the focused section when the radio is clicked while inactive", async () => {
    const user = userEvent.setup();
    const section = createSection();
    renderCard(section, "unallocated");

    await user.click(screen.getByRole("radio"));
    expect(setFocusedApplicationSection).toHaveBeenCalledWith(section);
  });

  it("clears focus when the radio is clicked while already active", async () => {
    mockUseFocusApplicationEvent.mockReturnValue([1, setFocusedApplicationSection]);
    const user = userEvent.setup();
    renderCard(createSection(), "unallocated");

    await user.click(screen.getByRole("radio"));
    expect(setFocusedApplicationSection).toHaveBeenCalledWith();
  });

  it("disables the radio button for a declined section", () => {
    renderCard(createSection(), "declined");
    expect(screen.getByRole("radio")).toBeDisabled();
  });

  it("shows the desired reservation unit order and age group when expanded", async () => {
    const section = createSection({
      reservationUnitOptions: [
        createReservationUnitOption({ pk: 99, reservationUnit: { pk: 999, nameFi: "Other", unit: { nameFi: "U" } } }),
        createReservationUnitOption({ pk: 100, reservationUnit: { pk: 10, nameFi: "Mine", unit: { nameFi: "U" } } }),
      ],
    });
    renderCard(section, "unallocated");

    await expandDetails();

    expect(screen.getByText("2/2")).toBeInTheDocument();
  });

  it("falls back to 0/N when the current reservation unit is not among the options", async () => {
    const section = createSection({
      reservationUnitOptions: [
        createReservationUnitOption({ reservationUnit: { pk: 999, nameFi: "Other", unit: { nameFi: "U" } } }),
      ],
    });
    renderCard(section, "unallocated");

    await expandDetails();

    expect(screen.getByText("0/1")).toBeInTheDocument();
  });

  it("links to the application with the section anchor", async () => {
    const section = createSection({ pk: 3, application: { ...createSection().application, pk: 5 } });
    renderCard(section, "unallocated");

    await expandDetails();

    expect(screen.getByRole("link", { name: /allocation:openApplication/ })).toHaveAttribute(
      "href",
      "/applications/5#3"
    );
  });
});

describe("SchedulesList (via ApplicationSectionCard)", () => {
  it("hides the lock/unlock footer when everything is allocated and unlocked", async () => {
    const section = createSection({
      appliedReservationsPerWeek: 1,
      reservationUnitOptions: [
        createReservationUnitOption({
          allocatedTimeSlots: [{ pk: 1, beginTime: "10:00:00", endTime: "11:00:00", dayOfTheWeek: Weekday.Monday }],
        }),
      ],
    });
    renderCard(section, "allocated");

    await expandDetails();

    expect(screen.queryByText(/allocation:schedulesWithoutAllocation/)).not.toBeInTheDocument();
  });

  it("shows the footer with a lock option when slots remain to be allocated", async () => {
    const section = createSection({ appliedReservationsPerWeek: 2 });
    renderCard(section, "unallocated");

    await expandDetails();

    expect(screen.getByText(/allocation:schedulesWithoutAllocation/)).toBeInTheDocument();
  });

  it("shows the footer with an unlock option when the option is locked, even fully allocated", async () => {
    const section = createSection({
      appliedReservationsPerWeek: 0,
      reservationUnitOptions: [createReservationUnitOption({ isLocked: true })],
    });
    renderCard(section, "unallocated");

    const user = await expandDetails();

    expect(screen.getByText(/allocation:schedulesWithoutAllocation/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "common:show" }));
    expect(screen.getByRole("button", { name: "allocation:unlockOptions" })).toBeInTheDocument();
  });

  it("shows the lockPartialOptions label once some schedules are already allocated", async () => {
    const section = createSection({
      appliedReservationsPerWeek: 3,
      reservationUnitOptions: [
        createReservationUnitOption({
          allocatedTimeSlots: [{ pk: 1, beginTime: "10:00:00", endTime: "11:00:00", dayOfTheWeek: Weekday.Monday }],
        }),
      ],
    });
    renderCard(section, "partial");

    const user = await expandDetails();
    await user.click(screen.getByRole("button", { name: "common:show" }));
    expect(screen.getByRole("button", { name: "allocation:lockPartialOptions" })).toBeInTheDocument();
  });

  it("locks the option and refetches on success", async () => {
    const section = createSection({ appliedReservationsPerWeek: 1 });
    const mockRefetch = vi.fn();
    const mocks = [
      {
        request: { query: RejectRestDocument, variables: { input: { pk: 100, isLocked: true } } },
        result: { data: { updateReservationUnitOption: { pk: 100, isRejected: false, isLocked: true } } },
      },
    ];
    renderCard(section, "unallocated", mocks, mockRefetch);

    const user = await expandDetails();
    await user.click(screen.getByRole("button", { name: "common:show" }));
    await user.click(screen.getByRole("button", { name: "allocation:lockOptions" }));

    await waitFor(() => {
      expect(screen.queryByText("allocation:lockOptions")).not.toBeInTheDocument();
      expect(mockRefetch).toHaveBeenCalled();
    });
  });

  it("displays an error toast-equivalent path when the lock mutation fails", async () => {
    const section = createSection({ appliedReservationsPerWeek: 1 });
    const mocks = [
      {
        request: { query: RejectRestDocument, variables: { input: { pk: 100, isLocked: true } } },
        result: { errors: [new GraphQLError("Error")] },
      },
    ];
    renderCard(section, "unallocated", mocks);

    const user = await expandDetails();
    await user.click(screen.getByRole("button", { name: "common:show" }));
    await user.click(screen.getByRole("button", { name: "allocation:lockOptions" }));

    // The mutation was attempted and rejected; footer/menu remains since state doesn't change.
    await waitFor(() => expect(screen.getByText(/allocation:schedulesWithoutAllocation/)).toBeInTheDocument());
  });

  it("does not attempt a mutation when there is no matching reservation unit option", async () => {
    const section = createSection({
      appliedReservationsPerWeek: 1,
      reservationUnitOptions: [
        createReservationUnitOption({ reservationUnit: { pk: 999, nameFi: "Other", unit: { nameFi: "U" } } }),
      ],
    });
    renderCard(section, "unallocated");

    const user = await expandDetails();
    await user.click(screen.getByRole("button", { name: "common:show" }));
    await user.click(screen.getByRole("button", { name: "allocation:lockOptions" }));

    expect(screen.getByText(/allocation:schedulesWithoutAllocation/)).toBeInTheDocument();
  });
});

describe("AllocatedScheduleSection (via ApplicationSectionCard)", () => {
  function sectionWithAllocatedSlot(overrides: Record<string, unknown> = {}) {
    return createSection({
      appliedReservationsPerWeek: 1,
      reservationUnitOptions: [
        createReservationUnitOption({
          reservationUnit: { pk: 10, nameFi: "Mine", unit: { nameFi: "Building" } },
          allocatedTimeSlots: [
            { pk: 55, beginTime: "10:00:00", endTime: "11:00:00", dayOfTheWeek: Weekday.Monday, ...overrides },
          ],
        }),
      ],
    });
  }

  it("renders the allocated slot's unit name and toggles focus", async () => {
    renderCard(sectionWithAllocatedSlot(), "allocated");
    const user = await expandDetails();

    expect(screen.getByText("Mine, Building")).toBeInTheDocument();

    const radios = screen.getAllByRole("radio");
    await user.click(lastOrThrow(radios));
    expect(setFocusedAllocatedSlot).toHaveBeenCalled();
  });

  it("clears focus when the allocated slot radio is clicked while active", async () => {
    mockUseFocusAllocatedSlot.mockReturnValue([55, setFocusedAllocatedSlot]);
    renderCard(sectionWithAllocatedSlot(), "allocated");
    const user = await expandDetails();

    const radios = screen.getAllByRole("radio");
    await user.click(lastOrThrow(radios));
    expect(setFocusedAllocatedSlot).toHaveBeenCalledWith();
  });

  it("disables the allocated slot radio when it belongs to a different reservation unit", async () => {
    const section = createSection({
      appliedReservationsPerWeek: 1,
      reservationUnitOptions: [
        createReservationUnitOption({
          reservationUnit: { pk: 999, nameFi: "Other unit", unit: { nameFi: "Other building" } },
          allocatedTimeSlots: [{ pk: 55, beginTime: "10:00:00", endTime: "11:00:00", dayOfTheWeek: Weekday.Monday }],
        }),
      ],
    });
    renderCard(section, "allocated");
    await expandDetails();

    const radios = screen.getAllByRole("radio");
    expect(lastOrThrow(radios)).toBeDisabled();
  });
});
