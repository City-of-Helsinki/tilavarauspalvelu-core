import React from "react";
import { MockedProvider } from "@apollo/client/testing";
import type { MockedResponse } from "@apollo/client/testing";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GraphQLError } from "graphql";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createNodeId } from "ui/src/modules/helpers";
import { SpaceDocument, UnitSpacesDocument, UpdateSpaceDocument } from "@gql/gql-types";
import { SpaceEditor } from "./SpaceEditor";

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

const SPACE_PK = 10;
const UNIT_PK = 1;

function unitFragment(overrides: Record<string, unknown> = {}) {
  return {
    id: createNodeId("UnitNode", UNIT_PK),
    pk: UNIT_PK,
    nameFi: "Unit A",
    addressStreetFi: "Street 1",
    addressCityFi: "City",
    addressZip: "00100",
    descriptionFi: "desc",
    spaces: [{ id: createNodeId("SpaceNode", SPACE_PK), pk: SPACE_PK, nameFi: "Space A" }],
    ...overrides,
  };
}

function spaceFragment(overrides: Record<string, unknown> = {}) {
  return {
    id: createNodeId("SpaceNode", SPACE_PK),
    pk: SPACE_PK,
    nameFi: "Space A",
    nameSv: "Utrymme A",
    nameEn: "Space EN",
    code: "A1",
    surfaceArea: 20,
    maxPersons: 10,
    unit: unitFragment(),
    parent: null,
    ...overrides,
  };
}

function spaceQueryMock({
  spacePk = SPACE_PK,
  space = spaceFragment(),
}: { spacePk?: number; space?: ReturnType<typeof spaceFragment> | null } = {}) {
  return {
    request: { query: SpaceDocument, variables: { id: createNodeId("SpaceNode", spacePk) } },
    result: { data: { space } },
  };
}

function unitSpacesMock(unitPk = UNIT_PK) {
  return {
    request: { query: UnitSpacesDocument, variables: { id: createNodeId("UnitNode", unitPk) } },
    result: {
      data: {
        unit: {
          id: createNodeId("UnitNode", unitPk),
          spaces: [{ id: createNodeId("SpaceNode", SPACE_PK), pk: SPACE_PK, nameFi: "Space A", parent: null }],
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

function renderEditor(mocks: ReadonlyArray<MockedResponse>, props: { space?: number; unit?: number } = {}) {
  return render(
    <MockedProvider
      mocks={mocks}
      defaultOptions={{
        watchQuery: { fetchPolicy: "no-cache" },
        query: { fetchPolicy: "no-cache" },
        mutate: { fetchPolicy: "no-cache" },
      }}
    >
      <SpaceEditor space={SPACE_PK} unit={UNIT_PK} {...props} />
    </MockedProvider>
  );
}

describe("SpaceEditor", () => {
  it("shows a spinner while the space query is loading", () => {
    renderEditor([spaceQueryMock(), unitSpacesMock()]);
    expect(screen.queryByRole("heading", { name: "spaces:SpaceEditor.details" })).not.toBeInTheDocument();
  });

  it("renders the editor once the query resolves", async () => {
    renderEditor([spaceQueryMock(), unitSpacesMock()]);
    expect(await screen.findByRole("heading", { name: "spaces:SpaceEditor.details" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "spaces:noParent" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Unit A" })).toBeInTheDocument();
  });

  it("navigates back to the unit's spaces-resources page on cancel", async () => {
    renderEditor([spaceQueryMock(), unitSpacesMock()]);
    await screen.findByRole("heading", { name: "spaces:SpaceEditor.details" });

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "common:cancel" }));

    expect(mockRouterReplace).toHaveBeenCalledWith(`/units/${UNIT_PK}/spaces-resources`);
  });

  it("disables the save button while the form is pristine", async () => {
    renderEditor([spaceQueryMock(), unitSpacesMock()]);
    await screen.findByRole("heading", { name: "spaces:SpaceEditor.details" });

    expect(screen.getByRole("button", { name: "common:save" })).toBeDisabled();
  });

  it("submits the update and shows a success toast", async () => {
    const mocks = [
      spaceQueryMock(),
      unitSpacesMock(),
      // refetch after a successful submit
      spaceQueryMock(),
      {
        request: {
          query: UpdateSpaceDocument,
          variables: {
            input: {
              nameFi: "Space B",
              nameSv: "Utrymme A",
              nameEn: "Space EN",
              maxPersons: 10,
              unit: UNIT_PK,
              code: "A1",
              pk: SPACE_PK,
              parent: null,
              surfaceArea: 20,
            },
          },
        },
        result: { data: { updateSpace: { pk: SPACE_PK } } },
      },
    ];
    renderEditor(mocks);
    await screen.findByRole("heading", { name: "spaces:SpaceEditor.details" });

    const user = userEvent.setup();
    const nameFiInput = screen.getByLabelText(/spaces:SpaceEditor\.label\.nameFi/);
    await user.clear(nameFiInput);
    await user.type(nameFiInput, "Space B");

    await user.click(screen.getByRole("button", { name: "common:save" }));

    await waitFor(() =>
      expect(mockSuccessToast).toHaveBeenCalledWith({ text: "spaces:SpaceEditor.spaceUpdatedNotification" })
    );
    expect(mockRouterReplace).toHaveBeenCalledWith(`/units/${UNIT_PK}/spaces-resources`);
  });

  it("shows an error toast when the mutation fails", async () => {
    const mocks = [
      spaceQueryMock(),
      unitSpacesMock(),
      {
        request: {
          query: UpdateSpaceDocument,
          variables: {
            input: {
              nameFi: "Space B",
              nameSv: "Utrymme A",
              nameEn: "Space EN",
              maxPersons: 10,
              unit: UNIT_PK,
              code: "A1",
              pk: SPACE_PK,
              parent: null,
              surfaceArea: 20,
            },
          },
        },
        result: { errors: [new GraphQLError("Error")] },
      },
    ];
    renderEditor(mocks);
    await screen.findByRole("heading", { name: "spaces:SpaceEditor.details" });

    const user = userEvent.setup();
    const nameFiInput = screen.getByLabelText(/spaces:SpaceEditor\.label\.nameFi/);
    await user.clear(nameFiInput);
    await user.type(nameFiInput, "Space B");

    await user.click(screen.getByRole("button", { name: "common:save" }));

    await waitFor(() => expect(mockErrorToast).toHaveBeenCalled());
    expect(mockSuccessToast).not.toHaveBeenCalled();
    expect(mockRouterReplace).not.toHaveBeenCalledWith(`/units/${UNIT_PK}/spaces-resources`);
  });
});
