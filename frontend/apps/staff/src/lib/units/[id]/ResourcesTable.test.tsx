import React from "react";
import { MockedProvider } from "@apollo/client/testing";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GraphQLError } from "graphql";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DeleteResourceDocument, ResourceLocationType } from "@gql/gql-types";
import type { ResourceTableFragment } from "@gql/gql-types";
import { ResourcesTable } from "./ResourcesTable";

const mockPush = vi.fn();
vi.mock("next/router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockSuccessToast = vi.fn();
const mockErrorToast = vi.fn();
vi.mock("ui/src/components/toast", () => ({
  successToast: (...args: unknown[]) => mockSuccessToast(...args),
  errorToast: (...args: unknown[]) => mockErrorToast(...args),
}));

function createUnit(overrides: Partial<ResourceTableFragment> = {}): ResourceTableFragment {
  return {
    id: "unit-1",
    pk: 1,
    spaces: [
      {
        id: "space-1",
        resources: [{ id: "resource-1", pk: 20, nameFi: "Resource one", locationType: ResourceLocationType.Fixed }],
      },
    ],
    ...overrides,
  } as ResourceTableFragment;
}

beforeEach(() => {
  mockPush.mockReset();
  mockSuccessToast.mockReset();
  mockErrorToast.mockReset();
});

async function openPopupMenu() {
  const user = userEvent.setup();
  const toggle = screen.getByRole("button", { name: "common:show" });
  await user.click(toggle);
  return user;
}

describe("ResourcesTable", () => {
  it("renders resource rows from all spaces, with name link and location type", () => {
    const unit = createUnit({
      spaces: [
        {
          id: "space-1",
          resources: [{ id: "r1", pk: 20, nameFi: "Resource one", locationType: ResourceLocationType.Fixed }],
        },
        {
          id: "space-2",
          resources: [{ id: "r2", pk: 21, nameFi: "Resource two", locationType: ResourceLocationType.Movable }],
        },
      ],
    });
    render(
      <MockedProvider mocks={[]}>
        <ResourcesTable unit={unit} refetch={vi.fn()} />
      </MockedProvider>
    );

    expect(screen.getByRole("link", { name: "Resource one" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Resource two" })).toBeInTheDocument();
    expect(screen.getByText("translation:locationType.FIXED")).toBeInTheDocument();
    expect(screen.getByText("translation:locationType.MOVABLE")).toBeInTheDocument();
  });

  it("renders a placeholder name for resources without a name", () => {
    render(
      <MockedProvider mocks={[]}>
        <ResourcesTable
          unit={createUnit({
            spaces: [
              {
                id: "space-1",
                resources: [{ id: "r1", pk: 20, nameFi: null, locationType: ResourceLocationType.Fixed }],
              },
            ],
          })}
          refetch={vi.fn()}
        />
      </MockedProvider>
    );

    expect(screen.getByRole("link", { name: "-" })).toBeInTheDocument();
  });

  it("navigates to the edit page when 'edit resource' is clicked", async () => {
    render(
      <MockedProvider mocks={[]}>
        <ResourcesTable unit={createUnit()} refetch={vi.fn()} />
      </MockedProvider>
    );

    const user = await openPopupMenu();
    await user.click(screen.getByRole("button", { name: "spaces:ResourceTable.menuEditResource" }));

    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("/20"));
  });

  it("deletes the resource and refetches after confirmation", async () => {
    const refetch = vi.fn().mockResolvedValue(undefined);
    const mocks = [
      {
        request: {
          query: DeleteResourceDocument,
          variables: { input: { pk: "20" } },
        },
        result: { data: { deleteResource: { deleted: true } } },
      },
    ];

    render(
      <MockedProvider mocks={mocks}>
        <ResourcesTable unit={createUnit()} refetch={refetch} />
      </MockedProvider>
    );

    const user = await openPopupMenu();
    await user.click(screen.getByRole("button", { name: "spaces:ResourceTable.menuRemoveResource" }));

    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByText("spaces:ResourceTable.removeConfirmationAccept"));

    await waitFor(() => expect(refetch).toHaveBeenCalledTimes(1));
    expect(mockSuccessToast).toHaveBeenCalledWith({ text: "spaces:ResourceTable.removeSuccess" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("does not delete or refetch when the confirmation is cancelled", async () => {
    const refetch = vi.fn();
    render(
      <MockedProvider mocks={[]}>
        <ResourcesTable unit={createUnit()} refetch={refetch} />
      </MockedProvider>
    );

    const user = await openPopupMenu();
    await user.click(screen.getByRole("button", { name: "spaces:ResourceTable.menuRemoveResource" }));

    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByText("spaces:ResourceTable.removeConfirmationCancel"));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(refetch).not.toHaveBeenCalled();
  });

  it("displays an error and does not refetch when the delete mutation returns a GraphQL error", async () => {
    const refetch = vi.fn();
    const mocks = [
      {
        request: {
          query: DeleteResourceDocument,
          variables: { input: { pk: "20" } },
        },
        result: { errors: [new GraphQLError("Error")] },
      },
    ];

    render(
      <MockedProvider mocks={mocks}>
        <ResourcesTable unit={createUnit()} refetch={refetch} />
      </MockedProvider>
    );

    const user = await openPopupMenu();
    await user.click(screen.getByRole("button", { name: "spaces:ResourceTable.menuRemoveResource" }));
    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByText("spaces:ResourceTable.removeConfirmationAccept"));

    await waitFor(() => expect(mockErrorToast).toHaveBeenCalled());
    expect(screen.queryByRole("dialog")).toBeInTheDocument();
    expect(refetch).not.toHaveBeenCalled();
  });
});
