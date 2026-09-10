import React from "react";
import { MockedProvider } from "@apollo/client/testing";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GraphQLError } from "graphql";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DeleteSpaceDocument } from "@gql/gql-types";
import type { SpacesTableFragment } from "@gql/gql-types";
import { SpacesTable } from "./SpacesTable";

const mockPush = vi.fn();
vi.mock("next/router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockSetModalContent = vi.fn();
vi.mock("@/context/ModalContext", () => ({
  useModal: () => ({ isOpen: true, setModalContent: mockSetModalContent, modalContent: { content: null } }),
}));

const mockErrorToast = vi.fn();
vi.mock("ui/src/components/toast", () => ({
  errorToast: (...args: unknown[]) => mockErrorToast(...args),
}));

vi.mock("./new-space-modal/NewSpaceModal", () => ({
  NewSpaceModal: () => <div>new-space-modal</div>,
}));

function createUnit(overrides: Partial<SpacesTableFragment> = {}): SpacesTableFragment {
  return {
    id: "unit-1",
    pk: 1,
    nameFi: "Unit 1",
    addressStreetFi: "Street 1",
    addressCityFi: "City",
    addressZip: "00100",
    spaces: [
      {
        id: "space-1",
        pk: 10,
        code: "A1",
        surfaceArea: 25,
        maxPersons: 10,
        nameFi: "Space one",
        resources: [],
        children: [],
      },
    ],
    ...overrides,
  } as SpacesTableFragment;
}

beforeEach(() => {
  mockPush.mockReset();
  mockSetModalContent.mockReset();
  mockErrorToast.mockReset();
});

async function openPopupMenu() {
  const user = userEvent.setup();
  const toggle = screen.getByRole("button", { name: "common:show" });
  await user.click(toggle);
  return user;
}

describe("SpacesTable", () => {
  it("renders space rows with name, code, sub-space count, surface area and max persons", () => {
    const unit = createUnit();
    render(
      <MockedProvider mocks={[]}>
        <SpacesTable unit={unit} refetch={vi.fn()} />
      </MockedProvider>
    );

    expect(screen.getByRole("link", { name: "Space one" })).toBeInTheDocument();
    expect(screen.getByText("A1")).toBeInTheDocument();
    expect(screen.getByText("25m²")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
  });

  it("counts nested sub-spaces recursively", () => {
    const unit = createUnit({
      spaces: [
        {
          id: "space-1",
          pk: 10,
          code: "A1",
          surfaceArea: 25,
          maxPersons: 10,
          nameFi: "Space one",
          resources: [],
          // @ts-expect-error -- recursive graphql query doesn't work, matches component's own cast
          children: [
            { id: "c1", children: [{ id: "c2", children: [] }] },
            { id: "c3", children: [] },
          ],
        },
      ],
    });
    render(
      <MockedProvider mocks={[]}>
        <SpacesTable unit={unit} refetch={vi.fn()} />
      </MockedProvider>
    );

    // 3 sub-spaces total: c1, its child c2, and c3
    expect(screen.getByText(/^3 /)).toBeInTheDocument();
  });

  it("navigates to the edit page when 'edit space' is clicked", async () => {
    render(
      <MockedProvider mocks={[]}>
        <SpacesTable unit={createUnit()} refetch={vi.fn()} />
      </MockedProvider>
    );

    const user = await openPopupMenu();
    await user.click(screen.getByRole("button", { name: "spaces:SpaceTable.menuEditSpace" }));

    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("/10"));
  });

  it("opens the new-space modal when 'add sub space' is clicked", async () => {
    render(
      <MockedProvider mocks={[]}>
        <SpacesTable unit={createUnit()} refetch={vi.fn()} />
      </MockedProvider>
    );

    const user = await openPopupMenu();
    await user.click(screen.getByRole("button", { name: "spaces:SpaceTable.menuAddSubSpace" }));

    expect(mockSetModalContent).toHaveBeenCalled();
  });

  it("shows a conflict error toast instead of the confirmation dialog when the space has resources", async () => {
    const unit = createUnit({
      spaces: [
        {
          id: "space-1",
          pk: 10,
          code: "A1",
          surfaceArea: 25,
          maxPersons: 10,
          nameFi: "Space one",
          resources: [{ id: "r1" }],
          children: [],
        },
      ],
    });
    render(
      <MockedProvider mocks={[]}>
        <SpacesTable unit={unit} refetch={vi.fn()} />
      </MockedProvider>
    );

    const user = await openPopupMenu();
    await user.click(screen.getByRole("button", { name: "spaces:SpaceTable.menuRemoveSpace" }));

    expect(mockErrorToast).toHaveBeenCalledWith({
      text: "spaces:SpaceTable.removeConflictMessage",
      label: "spaces:SpaceTable.removeConflictTitle",
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("deletes the space and refetches after confirmation", async () => {
    const refetch = vi.fn().mockResolvedValue(undefined);
    const mocks = [
      {
        request: {
          query: DeleteSpaceDocument,
          variables: { input: { pk: "10" } },
        },
        result: { data: { deleteSpace: { deleted: true } } },
      },
    ];

    render(
      <MockedProvider mocks={mocks}>
        <SpacesTable unit={createUnit()} refetch={refetch} />
      </MockedProvider>
    );

    const user = await openPopupMenu();
    await user.click(screen.getByRole("button", { name: "spaces:SpaceTable.menuRemoveSpace" }));

    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByText("spaces:SpaceTable.removeConfirmationAccept"));

    await waitFor(() => expect(refetch).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows an error toast when the delete mutation returns a GraphQL error", async () => {
    const mocks = [
      {
        request: {
          query: DeleteSpaceDocument,
          variables: { input: { pk: "10" } },
        },
        result: { errors: [new GraphQLError("Error")] },
      },
    ];

    render(
      <MockedProvider mocks={mocks}>
        <SpacesTable unit={createUnit()} refetch={vi.fn()} />
      </MockedProvider>
    );

    const user = await openPopupMenu();
    await user.click(screen.getByRole("button", { name: "spaces:SpaceTable.menuRemoveSpace" }));
    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByText("spaces:SpaceTable.removeConfirmationAccept"));

    await waitFor(() => expect(mockErrorToast).toHaveBeenCalled());
  });
});
