import React from "react";
import type { ReactElement } from "react";
import { MockedProvider } from "@apollo/client/testing";
import { act, render, renderHook, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GraphQLError } from "graphql";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { WeekdayInterval } from "@ui/components/WeeklyPatternCalendar/types";
import { CreateAllocatedTimeSlotDocument, DeleteAllocatedTimeSlotDocument, Weekday } from "@gql/gql-types";
import {
  useAcceptSlotMutation,
  useFocusAllocatedSlot,
  useFocusApplicationEvent,
  useRefreshApplications,
  useRemoveAllocation,
  useSlotSelection,
} from "./hooks";
import type { AllocatedTimeSlotNodeT, SectionNodeT } from "./modules/applicationRoundAllocation";
import { SelectedSlotsContextProvider, useSelectedSlots } from "./SelectedSlotsContext";

const { mockedSearchParams, useSearchParams } = vi.hoisted(() => {
  const params = vi.fn();
  return { useSearchParams: params, mockedSearchParams: params };
});

vi.mock("next/navigation", () => ({
  useSearchParams,
}));

const { mockedRouterReplace, useRouter } = vi.hoisted(() => {
  const mockedRouterReplace = vi.fn();
  return {
    mockedRouterReplace,
    useRouter: () => ({
      replace: mockedRouterReplace,
      query: { id: "1" },
      pathname: "/application-rounds/[id]/allocation",
    }),
  };
});

vi.mock("next/router", () => ({
  useRouter,
}));

function createSection(overrides: Partial<SectionNodeT> = {}): SectionNodeT {
  return {
    name: "Section name",
    ...overrides,
  } as SectionNodeT;
}

beforeEach(() => {
  mockedRouterReplace.mockReset();
  mockedSearchParams.mockReturnValue(new URLSearchParams());
});

describe("useFocusApplicationEvent", () => {
  it("reads the selected pk from the aes search param", () => {
    mockedSearchParams.mockReturnValue(new URLSearchParams("aes=5"));
    const { result } = renderHook(() => useFocusApplicationEvent());
    expect(result.current[0]).toBe(5);
  });

  it("returns null when there is no aes param", () => {
    const { result } = renderHook(() => useFocusApplicationEvent());
    expect(result.current[0]).toBeNull();
  });

  it("sets the aes param and clears the allocated param when focusing a section", () => {
    const { result } = renderHook(() => useFocusApplicationEvent());
    act(() => {
      result.current[1](createSection({ pk: 7 }));
    });
    expect(mockedRouterReplace).toHaveBeenCalledWith(
      expect.objectContaining({ query: "aes=7&id=1" }),
      undefined,
      expect.objectContaining({ shallow: true })
    );
  });

  it("clears the aes param when focusing nothing", () => {
    mockedSearchParams.mockReturnValue(new URLSearchParams("aes=7"));
    const { result } = renderHook(() => useFocusApplicationEvent());
    act(() => {
      result.current[1](undefined);
    });
    expect(mockedRouterReplace).toHaveBeenCalledWith(
      expect.objectContaining({ query: "id=1" }),
      undefined,
      expect.anything()
    );
  });
});

describe("useFocusAllocatedSlot", () => {
  it("reads the allocated pk from the search params", () => {
    mockedSearchParams.mockReturnValue(new URLSearchParams("allocated=3"));
    const { result } = renderHook(() => useFocusAllocatedSlot());
    expect(result.current[0]).toBe(3);
  });

  it("is undefined when there is no allocated param", () => {
    const { result } = renderHook(() => useFocusAllocatedSlot());
    expect(result.current[0]).toBeUndefined();
  });

  it("sets the allocated param and clears the aes param", () => {
    const { result } = renderHook(() => useFocusAllocatedSlot());
    act(() => {
      result.current[1]({ pk: 9 });
    });
    expect(mockedRouterReplace).toHaveBeenCalledWith(
      expect.objectContaining({ query: "allocated=9&id=1" }),
      undefined,
      expect.anything()
    );
  });

  it("clears the allocated param when unfocusing", () => {
    mockedSearchParams.mockReturnValue(new URLSearchParams("allocated=9"));
    const { result } = renderHook(() => useFocusAllocatedSlot());
    act(() => {
      result.current[1](undefined);
    });
    expect(mockedRouterReplace).toHaveBeenCalledWith(
      expect.objectContaining({ query: "id=1" }),
      undefined,
      expect.anything()
    );
  });
});

function Wrapper({ children }: { children: React.ReactNode }) {
  return <SelectedSlotsContextProvider>{children}</SelectedSlotsContextProvider>;
}

// The hook is a string key adapter over the interval the context holds, so a test needs to see both shapes.
function useSlotSelectionBridge() {
  const [slots, setSlots] = useSlotSelection();
  const { selection } = useSelectedSlots();
  return { slots, setSlots, selection };
}

function renderSlotSelection() {
  return renderHook(() => useSlotSelectionBridge(), { wrapper: Wrapper });
}

describe("useSlotSelection", () => {
  it("starts with no selected slots", () => {
    const { result } = renderSlotSelection();
    expect(result.current.slots).toEqual([]);
    expect(result.current.selection).toBeNull();
  });

  it("generates every half hour slot between the first and last selected slot", () => {
    const { result } = renderSlotSelection();
    act(() => {
      result.current.setSlots(["1-10-00", "1-11-00"]);
    });
    expect(result.current.slots).toEqual(["1-10-00", "1-10-30", "1-11-00"]);
  });

  it("clears the selection when given an empty list", () => {
    const { result } = renderSlotSelection();
    act(() => {
      result.current.setSlots(["1-10-00", "1-11-00"]);
    });
    act(() => {
      result.current.setSlots([]);
    });
    expect(result.current.slots).toEqual([]);
    expect(result.current.selection).toBeNull();
  });

  it("stores the keys as an interval whose end is exclusive", () => {
    const { result } = renderSlotSelection();
    act(() => {
      result.current.setSlots(["1-10-00", "1-11-00"]);
    });
    // the last key starts the 11:00 slot, so the Selection ends at 11:30
    expect(result.current.selection).toEqual({
      weekday: Weekday.Tuesday,
      beginMinutes: 10 * 60,
      endMinutes: 11 * 60 + 30,
    });
  });

  it("stores one key as an interval of one slot", () => {
    const { result } = renderSlotSelection();
    act(() => {
      result.current.setSlots(["3-7-00"]);
    });
    expect(result.current.selection).toEqual({
      weekday: Weekday.Thursday,
      beginMinutes: 7 * 60,
      endMinutes: 7 * 60 + 30,
    });
    expect(result.current.slots).toEqual(["3-7-00"]);
  });

  it("ends the last slot of the day at midnight and round trips it", () => {
    const { result } = renderSlotSelection();
    act(() => {
      result.current.setSlots(["0-23-00", "0-23-30"]);
    });
    expect(result.current.selection).toEqual({
      weekday: Weekday.Monday,
      beginMinutes: 23 * 60,
      endMinutes: 24 * 60,
    });
    expect(result.current.slots).toEqual(["0-23-00", "0-23-30"]);
  });

  it("round trips a selection that covers the whole day", () => {
    const wholeDay = Array.from({ length: 48 }, (_, i) => `2-${Math.floor(i / 2)}-${i % 2 === 0 ? "00" : "30"}`);
    const { result } = renderSlotSelection();
    act(() => {
      result.current.setSlots(["2-0-00", "2-23-30"]);
    });
    expect(result.current.selection).toEqual({
      weekday: Weekday.Wednesday,
      beginMinutes: 0,
      endMinutes: 24 * 60,
    });
    expect(result.current.slots).toEqual(wholeDay);
  });

  it("keeps the selection when a key cannot be read", () => {
    const { result } = renderSlotSelection();
    act(() => {
      result.current.setSlots(["1-10-00", "1-11-00"]);
    });
    act(() => {
      result.current.setSlots(["9-10-00"]);
    });
    expect(result.current.slots).toEqual(["1-10-00", "1-10-30", "1-11-00"]);
  });
});

describe("useRefreshApplications", () => {
  it("calls the fetch callback and toggles the loading state", async () => {
    const fetchCallback = vi.fn().mockResolvedValue({});
    const { result } = renderHook(() => useRefreshApplications(fetchCallback), { wrapper: Wrapper });

    expect(result.current[1]).toBe(false);

    await act(async () => {
      await result.current[0]();
    });

    expect(fetchCallback).toHaveBeenCalledTimes(1);
    expect(result.current[1]).toBe(false);
  });
});

function AcceptSlotTestComponent({
  reservationUnitOptionPk,
  selection,
  refresh,
}: {
  reservationUnitOptionPk: number;
  selection: WeekdayInterval | null;
  refresh: () => void;
}): ReactElement {
  const [handleAcceptSlot] = useAcceptSlotMutation({
    applicationSection: createSection({ pk: 1 }),
    reservationUnitOptionPk,
    selection,
    refresh,
  });

  return (
    <button type="button" onClick={() => handleAcceptSlot()}>
      accept
    </button>
  );
}

describe("useAcceptSlotMutation", () => {
  // The Selection carries the weekday and both times, so the mutation reads them straight off it.
  const selection: WeekdayInterval = { weekday: Weekday.Tuesday, beginMinutes: 10 * 60, endMinutes: 11 * 60 };

  it("creates an allocated time slot and refreshes on success", async () => {
    const refresh = vi.fn();
    const mocks = [
      {
        request: {
          query: CreateAllocatedTimeSlotDocument,
          variables: {
            input: {
              reservationUnitOption: 1,
              dayOfTheWeek: Weekday.Tuesday,
              beginTime: "10:00:00",
              endTime: "11:00:00",
              force: true,
            },
          },
        },
        result: {
          data: {
            createAllocatedTimeslot: {
              beginTime: "10:00:00",
              dayOfTheWeek: Weekday.Tuesday,
              endTime: "11:00:00",
              pk: 1,
              reservationUnitOption: 1,
            },
          },
        },
      },
    ];

    const view = render(
      <MockedProvider mocks={mocks}>
        <AcceptSlotTestComponent reservationUnitOptionPk={1} selection={selection} refresh={refresh} />
      </MockedProvider>
    );
    const user = userEvent.setup();
    await user.click(view.getByRole("button", { name: /accept/i }));

    await waitFor(() => expect(refresh).toHaveBeenCalled());
  });

  it("does not call the mutation nor refresh when there is no Selection", async () => {
    const refresh = vi.fn();
    const view = render(
      <MockedProvider mocks={[]}>
        <AcceptSlotTestComponent reservationUnitOptionPk={1} selection={null} refresh={refresh} />
      </MockedProvider>
    );
    const user = userEvent.setup();
    await user.click(view.getByRole("button", { name: /accept/i }));

    expect(refresh).not.toHaveBeenCalled();
  });

  it("does not call refresh when the mutation returns a GraphQL error", async () => {
    const refresh = vi.fn();
    const mocks = [
      {
        request: {
          query: CreateAllocatedTimeSlotDocument,
          variables: {
            input: {
              reservationUnitOption: 1,
              dayOfTheWeek: Weekday.Tuesday,
              beginTime: "10:00:00",
              endTime: "11:00:00",
              force: true,
            },
          },
        },
        result: {
          errors: [new GraphQLError("Error")],
        },
      },
    ];

    const view = render(
      <MockedProvider mocks={mocks}>
        <AcceptSlotTestComponent reservationUnitOptionPk={1} selection={selection} refresh={refresh} />
      </MockedProvider>
    );
    const user = userEvent.setup();
    await user.click(view.getByRole("button", { name: /accept/i }));

    await waitFor(() => expect(view.getByRole("button", { name: /accept/i })).toBeEnabled());
    expect(refresh).not.toHaveBeenCalled();
  });
});

function RemoveAllocationTestComponent({
  allocatedTimeSlot,
  refresh,
}: {
  allocatedTimeSlot: AllocatedTimeSlotNodeT | null;
  refresh: () => void;
}): ReactElement {
  const [handleRemoveAllocation] = useRemoveAllocation({
    allocatedTimeSlot,
    applicationSection: createSection({ pk: 1 }),
    refresh,
  });

  return (
    <button type="button" onClick={() => handleRemoveAllocation()}>
      remove
    </button>
  );
}

describe("useRemoveAllocation", () => {
  it("deletes the allocated time slot and refreshes on success", async () => {
    const refresh = vi.fn();
    const mocks = [
      {
        request: {
          query: DeleteAllocatedTimeSlotDocument,
          variables: { input: { pk: "5" } },
        },
        result: {
          data: {
            deleteAllocatedTimeslot: {
              deleted: true,
            },
          },
        },
      },
    ];

    const view = render(
      <MockedProvider mocks={mocks}>
        <RemoveAllocationTestComponent allocatedTimeSlot={{ pk: 5 } as AllocatedTimeSlotNodeT} refresh={refresh} />
      </MockedProvider>
    );
    const user = userEvent.setup();
    await user.click(view.getByRole("button", { name: /remove/i }));

    await waitFor(() => expect(refresh).toHaveBeenCalled());
  });

  it("does not call refresh when there is no allocated time slot", async () => {
    const refresh = vi.fn();
    const view = render(
      <MockedProvider mocks={[]}>
        <RemoveAllocationTestComponent allocatedTimeSlot={null} refresh={refresh} />
      </MockedProvider>
    );
    const user = userEvent.setup();
    await user.click(view.getByRole("button", { name: /remove/i }));

    expect(refresh).not.toHaveBeenCalled();
  });
});
