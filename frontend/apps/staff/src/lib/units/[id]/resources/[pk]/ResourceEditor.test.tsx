import React from "react";
import { MockedProvider } from "@apollo/client/testing";
import type { MockedResponse } from "@apollo/client/testing";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GraphQLError } from "graphql";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createNodeId } from "ui/src/modules/helpers";
import { ResourceDocument, ResourceLocationType, UnitSpacesDocument, UpdateResourceDocument } from "@gql/gql-types";
import { ResourceEditor } from "./ResourceEditor";

const mockRouterReplace = vi.fn();
vi.mock("next/router", () => ({
  useRouter: () => ({ replace: mockRouterReplace }),
}));

const mockErrorToast = vi.fn();
const mockSuccessToast = vi.fn();
vi.mock("ui/src/components/toast", () => ({
  errorToast: (...args: unknown[]) => mockErrorToast(...args),
  successToast: (...args: unknown[]) => mockSuccessToast(...args),
}));

const RESOURCE_PK = 5;
const UNIT_PK = 1;

function unitFragment(overrides: Record<string, unknown> = {}) {
  return {
    id: createNodeId("UnitNode", UNIT_PK),
    pk: UNIT_PK,
    nameFi: "Unit A",
    addressStreetFi: "Street 1",
    addressCityFi: "City",
    addressZip: "00100",
    ...overrides,
  };
}

function resourceFragment(overrides: Record<string, unknown> = {}) {
  return {
    id: createNodeId("ResourceNode", RESOURCE_PK),
    pk: RESOURCE_PK,
    nameFi: "Resource A",
    nameSv: "Resurssi A",
    nameEn: "Resource EN",
    space: { id: createNodeId("SpaceNode", 2), pk: 2 },
    ...overrides,
  };
}

function resourceQueryMock({
  resourcePk = RESOURCE_PK,
  unitPk = UNIT_PK,
  resource = resourceFragment(),
  unit = unitFragment(),
}: {
  resourcePk?: number;
  unitPk?: number;
  resource?: ReturnType<typeof resourceFragment> | null;
  unit?: ReturnType<typeof unitFragment> | null;
} = {}) {
  return {
    request: {
      query: ResourceDocument,
      variables: { id: createNodeId("ResourceNode", resourcePk), unitId: createNodeId("UnitNode", unitPk) },
    },
    result: { data: { resource, unit } },
  };
}

function unitSpacesMock(unitPk = UNIT_PK) {
  return {
    request: { query: UnitSpacesDocument, variables: { id: createNodeId("UnitNode", unitPk) } },
    result: {
      data: {
        unit: {
          id: createNodeId("UnitNode", unitPk),
          spaces: [{ id: createNodeId("SpaceNode", 2), pk: 2, nameFi: "Space A", parent: null }],
        },
      },
    },
  };
}

beforeEach(() => {
  mockRouterReplace.mockReset();
  mockErrorToast.mockReset();
  mockSuccessToast.mockReset();
});

function renderEditor(mocks: ReadonlyArray<MockedResponse>, props: { resourcePk?: number; unitPk?: number } = {}) {
  return render(
    <MockedProvider
      mocks={mocks}
      defaultOptions={{
        watchQuery: { fetchPolicy: "no-cache" },
        query: { fetchPolicy: "no-cache" },
        mutate: { fetchPolicy: "no-cache" },
      }}
    >
      <ResourceEditor resourcePk={RESOURCE_PK} unitPk={UNIT_PK} {...props} />
    </MockedProvider>
  );
}

describe("ResourceEditor", () => {
  it("shows a spinner while the resource query is loading", () => {
    renderEditor([resourceQueryMock(), unitSpacesMock()]);
    expect(screen.queryByRole("heading", { name: "Resource A" })).not.toBeInTheDocument();
  });

  it("renders Error404 when the resource is not found", async () => {
    renderEditor([resourceQueryMock({ resource: null })]);
    expect(await screen.findByTestId("error__404--title")).toBeInTheDocument();
  });

  it("renders Error404 when the unit is not found", async () => {
    renderEditor([resourceQueryMock({ unit: null })]);
    expect(await screen.findByTestId("error__404--title")).toBeInTheDocument();
  });

  it("renders Error404 when resourcePk is not provided (query skipped)", async () => {
    renderEditor([], { resourcePk: undefined });
    expect(await screen.findByTestId("error__404--title")).toBeInTheDocument();
  });

  it("renders the editor once the query resolves", async () => {
    renderEditor([resourceQueryMock(), unitSpacesMock()]);
    expect(await screen.findByRole("heading", { name: "Resource A" })).toBeInTheDocument();
    expect(screen.getByText("Unit A")).toBeInTheDocument();
  });

  it("navigates back to the unit's spaces-resources page on cancel", async () => {
    renderEditor([resourceQueryMock(), unitSpacesMock()]);
    await screen.findByRole("heading", { name: "Resource A" });

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "common:cancel" }));

    expect(mockRouterReplace).toHaveBeenCalledWith(`/units/${UNIT_PK}/spaces-resources`);
  });

  it("disables the save button while the form is pristine", async () => {
    renderEditor([resourceQueryMock(), unitSpacesMock()]);
    await screen.findByRole("heading", { name: "Resource A" });

    expect(screen.getByRole("button", { name: "common:save" })).toBeDisabled();
  });

  it("submits the update and shows a success toast", async () => {
    const mocks = [
      resourceQueryMock(),
      unitSpacesMock(),
      // updateResource() refetches once, then onSubmit refetches again
      resourceQueryMock(),
      resourceQueryMock(),
      {
        request: {
          query: UpdateResourceDocument,
          variables: {
            input: {
              nameFi: "Resource B",
              nameSv: "Resurssi A",
              nameEn: "Resource EN",
              space: 2,
              pk: RESOURCE_PK,
              locationType: ResourceLocationType.Fixed,
            },
          },
        },
        result: { data: { updateResource: { pk: RESOURCE_PK } } },
      },
    ];
    renderEditor(mocks);
    await screen.findByRole("heading", { name: "Resource A" });

    const user = userEvent.setup();
    const nameFiInput = screen.getByLabelText(/spaces:ResourceEditor\.label\.nameFi/);
    await user.clear(nameFiInput);
    await user.type(nameFiInput, "Resource B");

    await user.click(screen.getByRole("button", { name: "common:save" }));

    await waitFor(() => expect(mockSuccessToast).toHaveBeenCalledWith({ text: "spaces:resourceUpdatedNotification" }));
    expect(mockRouterReplace).toHaveBeenCalledWith(`/units/${UNIT_PK}/spaces-resources`);
  });

  it("shows an error toast when the mutation fails", async () => {
    const mocks = [
      resourceQueryMock(),
      unitSpacesMock(),
      {
        request: {
          query: UpdateResourceDocument,
          variables: {
            input: {
              nameFi: "Resource B",
              nameSv: "Resurssi A",
              nameEn: "Resource EN",
              space: 2,
              pk: RESOURCE_PK,
              locationType: ResourceLocationType.Fixed,
            },
          },
        },
        result: { errors: [new GraphQLError("Error")] },
      },
    ];
    renderEditor(mocks);
    await screen.findByRole("heading", { name: "Resource A" });

    const user = userEvent.setup();
    const nameFiInput = screen.getByLabelText(/spaces:ResourceEditor\.label\.nameFi/);
    await user.clear(nameFiInput);
    await user.type(nameFiInput, "Resource B");

    await user.click(screen.getByRole("button", { name: "common:save" }));

    await waitFor(() => expect(mockErrorToast).toHaveBeenCalled());
    expect(mockSuccessToast).not.toHaveBeenCalled();
    expect(mockRouterReplace).not.toHaveBeenCalledWith(`/units/${UNIT_PK}/spaces-resources`);
  });
});
