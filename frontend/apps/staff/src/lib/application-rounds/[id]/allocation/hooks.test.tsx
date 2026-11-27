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
  clearHighlightParams,
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
  return <SelectedSlotsContextProvider reservationUnitPk={1}>{children}</SelectedSlotsContextProvider>;
}

describe("useSlotSelection", () => {
  function renderSlotSelection() {
    return renderHook(() => useSlotSelection(), { wrapper: Wrapper });
  }

  it("starts with no Selection", () => {
    const { result } = renderSlotSelection();
    expect(result.current[0]).toBeNull();
  });

  it("holds the Selection it is given, times included", () => {
    const { result } = renderSlotSelection();
    act(() => {
      result.current[1]({ weekday: Weekday.Tuesday, beginMinutes: 10 * 60, endMinutes: 10 * 60 + 45 });
    });
    expect(result.current[0]).toEqual({
      weekday: Weekday.Tuesday,
      beginMinutes: 10 * 60,
      endMinutes: 10 * 60 + 45,
    });
  });

  it("clears the Selection", () => {
    const { result } = renderSlotSelection();
    act(() => {
      result.current[1]({ weekday: Weekday.Monday, beginMinutes: 23 * 60, endMinutes: 24 * 60 });
    });
    act(() => {
      result.current[1](null);
    });
    expect(result.current[0]).toBeNull();
  });
});

describe("clearHighlightParams", () => {
  it("removes both Highlight params and leaves the rest alone", () => {
    const params = new URLSearchParams("unit=2&aes=5&allocated=3&priority=PRIMARY");
    clearHighlightParams(params);
    expect(params.toString()).toBe("unit=2&priority=PRIMARY");
  });

  it("does nothing when there is no Highlight", () => {
    const params = new URLSearchParams("unit=2");
    clearHighlightParams(params);
    expect(params.toString()).toBe("unit=2");
  });
});

/** Shows the Selection the context holds, and sets one on request. */
function SelectionProbe(): ReactElement {
  const { selection, setSelection } = useSelectedSlots();

  return (
    <>
      <button
        type="button"
        onClick={() =>
          setSelection({
            weekday: Weekday.Tuesday,
            beginMinutes: 10 * 60,
            endMinutes: 10 * 60 + 30,
          })
        }
      >
        select
      </button>
      <span data-testid="selection">
        {selection == null ? "none" : `${selection.weekday} ${selection.beginMinutes}`}
      </span>
    </>
  );
}

describe("SelectedSlotsContextProvider", () => {
  function renderWithUnit(reservationUnitPk: number) {
    const view = render(
      <SelectedSlotsContextProvider reservationUnitPk={reservationUnitPk}>
        <SelectionProbe />
      </SelectedSlotsContextProvider>
    );
    const showUnit = (pk: number) =>
      view.rerender(
        <SelectedSlotsContextProvider reservationUnitPk={pk}>
          <SelectionProbe />
        </SelectedSlotsContextProvider>
      );
    return { ...view, showUnit };
  }

  it("clears the Selection when the reservation unit changes", async () => {
    const view = renderWithUnit(1);
    const user = userEvent.setup();
    await user.click(view.getByRole("button", { name: /select/i }));
    expect(view.getByTestId("selection")).toHaveTextContent(`${Weekday.Tuesday} 600`);

    view.showUnit(2);

    expect(view.getByTestId("selection")).toHaveTextContent("none");
  });

  it("keeps the Selection when the reservation unit stays the same", async () => {
    const view = renderWithUnit(1);
    const user = userEvent.setup();
    await user.click(view.getByRole("button", { name: /select/i }));

    // a filter change renders the view again with the same unit
    view.showUnit(1);

    expect(view.getByTestId("selection")).toHaveTextContent(`${Weekday.Tuesday} 600`);
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
