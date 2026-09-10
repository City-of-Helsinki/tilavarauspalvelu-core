import React from "react";
import { MockedProvider } from "@apollo/client/testing";
import { render, screen } from "@testing-library/react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import { ApplicationStatusChoice } from "@gql/gql-types";
import type { ApplicationCardFragment } from "@gql/gql-types";
import { ApplicationCard } from "./ApplicationCard";

const mockCancelApplicationMutation = vi.fn();

vi.mock("@gql/gql-types", async (importOriginal) => ({
  ...(await importOriginal()),
  useCancelApplicationMutation: () => [mockCancelApplicationMutation, { loading: false }],
}));

vi.mock("@/modules/urls", () => ({
  getApplicationPath: vi.fn((pk, page) => `/applications/${pk}/${page}`),
}));

vi.mock("ui/src/components/statuses", () => ({
  ApplicationStatusLabel: ({ status }: { status: ApplicationStatusChoice }) => (
    <span>ApplicationStatusLabel: {status}</span>
  ),
}));

vi.mock("ui/src/components/ConfirmationDialog", () => ({
  ConfirmationDialog: ({ isOpen, heading }: { isOpen: boolean; heading: string }) =>
    isOpen ? <div>{heading}</div> : null,
}));

function createMockApplication(overrides: Partial<ApplicationCardFragment> = {}): ApplicationCardFragment {
  return {
    id: "app-1",
    pk: 1,
    status: ApplicationStatusChoice.Draft,
    updatedAt: "2026-01-01T10:00:00Z",
    applicationRound: {
      id: "round-1",
      nameFi: "Test Round",
      nameEn: "Test Round",
      nameSv: "Test Round",
    },
    organisationName: null,
    applicantType: "INDIVIDUAL",
    contactPersonFirstName: "John",
    ...overrides,
  } as ApplicationCardFragment;
}

describe("ApplicationCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders application card with application round name", () => {
    const mockApp = createMockApplication();

    render(
      <MockedProvider>
        <ApplicationCard application={mockApp} actionCallback={vi.fn()} />
      </MockedProvider>
    );

    expect(screen.getByText("Test Round")).toBeInTheDocument();
  });

  test("renders applicant type", () => {
    const mockApp = createMockApplication();

    render(
      <MockedProvider>
        <ApplicationCard application={mockApp} actionCallback={vi.fn()} />
      </MockedProvider>
    );

    expect(screen.getByText(/reserveeTypes.labels/)).toBeInTheDocument();
  });

  test("renders status label", () => {
    const mockApp = createMockApplication();

    render(
      <MockedProvider>
        <ApplicationCard application={mockApp} actionCallback={vi.fn()} />
      </MockedProvider>
    );

    expect(screen.getByText(`ApplicationStatusLabel: ${ApplicationStatusChoice.Draft}`)).toBeInTheDocument();
  });

  test("renders view button", () => {
    const mockApp = createMockApplication();

    render(
      <MockedProvider>
        <ApplicationCard application={mockApp} actionCallback={vi.fn()} />
      </MockedProvider>
    );

    expect(screen.getByText("applicationCard:view")).toBeInTheDocument();
  });

  test("renders edit and cancel buttons when application is editable", () => {
    const mockApp = createMockApplication({ status: ApplicationStatusChoice.Draft });

    render(
      <MockedProvider>
        <ApplicationCard application={mockApp} actionCallback={vi.fn()} />
      </MockedProvider>
    );

    expect(screen.getByRole("button", { name: "common:cancel" })).toBeInTheDocument();
    const links = screen.getAllByRole("link");
    expect(links.length).toBeGreaterThan(0);
  });

  test("disables cancel button when application is not editable", () => {
    const mockApp = createMockApplication({ status: ApplicationStatusChoice.Handled });

    render(
      <MockedProvider>
        <ApplicationCard application={mockApp} actionCallback={vi.fn()} />
      </MockedProvider>
    );

    const cancelButton = screen.getByRole("button", { name: "common:cancel" });
    expect(cancelButton).toBeDisabled();
  });
});
