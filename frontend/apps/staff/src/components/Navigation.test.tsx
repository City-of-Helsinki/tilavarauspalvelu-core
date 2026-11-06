import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import { createNodeId } from "ui/src/modules/helpers";
import type { CurrentUserQuery } from "@gql/gql-types";
import { Navigation } from "./Navigation";

const mockUseSession = vi.fn();
const mockUseHandling = vi.fn();
const mockPush = vi.fn();

vi.mock("@/hooks", () => ({
  useSession: () => mockUseSession(),
  useHandling: () => mockUseHandling(),
}));

vi.mock("next/router", () => ({
  useRouter: () => ({
    push: mockPush,
    pathname: "/",
  }),
}));

vi.mock("react-use", () => ({
  useLocation: () => ({
    pathname: "/",
  }),
}));

vi.mock("ui/src/modules/browserHelpers", () => ({
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

function createMockUser(overrides: Partial<NonNullable<CurrentUserQuery["currentUser"]>> = {}) {
  return {
    id: createNodeId("User", 1),
    pk: 1,
    username: "testuser",
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    isSuperuser: false,
    isAdAuthenticated: false,
    unitRoles: [],
    generalRoles: [],
    ...overrides,
  } as NonNullable<CurrentUserQuery["currentUser"]>;
}

beforeEach(() => {
  mockPush.mockReset();
  window.innerWidth = 1024;
  mockUseSession.mockReturnValue({
    user: createMockUser(),
    isAuthenticated: true,
    error: null,
  });

  mockUseHandling.mockReturnValue({
    handlingCount: 0,
    hasOwnUnits: true,
    refetch: vi.fn(),
  });
});

describe("Navigation", () => {
  test("renders navigation header", () => {
    render(<Navigation apiBaseUrl="http://localhost:3000" />);

    const header = screen.getByRole("banner");
    expect(header).toBeInTheDocument();
  });

  test("renders user name in menu", () => {
    render(<Navigation apiBaseUrl="http://localhost:3000" />);

    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  test("renders user name placeholder when name is not available", () => {
    mockUseSession.mockReturnValue({
      user: createMockUser({
        firstName: "",
        lastName: "",
      }),
      isAuthenticated: true,
      error: null,
    });

    render(<Navigation apiBaseUrl="http://localhost:3000" />);

    expect(screen.getByText("navigation:noName")).toBeInTheDocument();
  });

  test("renders navigation menu when user has own units", () => {
    mockUseHandling.mockReturnValue({
      handlingCount: 0,
      hasOwnUnits: true,
      refetch: vi.fn(),
    });

    render(<Navigation apiBaseUrl="http://localhost:3000" />);

    // My Units menu item should be rendered
    expect(screen.getByText("navigation:myUnits")).toBeInTheDocument();
  });

  test("does not render navigation menu when user has no menu items", () => {
    mockUseSession.mockReturnValue({
      user: createMockUser(),
      isAuthenticated: true,
      error: null,
    });

    mockUseHandling.mockReturnValue({
      handlingCount: 0,
      hasOwnUnits: false,
      refetch: vi.fn(),
    });

    render(<Navigation apiBaseUrl="http://localhost:3000" />);

    // Navigation header should still be present
    expect(screen.getByRole("banner")).toBeInTheDocument();
    // My Units menu item should be absent
    expect(screen.queryByText("navigation:myUnits")).not.toBeInTheDocument();
  });

  // HDS wraps each menu link in an <li>. A nested <li> is invalid HTML and causes a hydration error.
  test.each([
    ["desktop", 1024],
    ["mobile", 400],
  ])("does not nest list items on %s", (_name, width) => {
    window.innerWidth = width;
    const { container } = render(<Navigation apiBaseUrl="http://localhost:3000" />);

    expect(screen.getByText("navigation:myUnits")).toBeInTheDocument();
    expect(container.querySelector("li li")).toBeNull();
  });

  test("shows the handling count in the requested reservations link", () => {
    mockUseSession.mockReturnValue({
      user: createMockUser({ isSuperuser: true }),
      isAuthenticated: true,
      error: null,
    });
    mockUseHandling.mockReturnValue({
      handlingCount: 7,
      hasOwnUnits: false,
      refetch: vi.fn(),
    });

    render(<Navigation apiBaseUrl="http://localhost:3000" />);

    const link = screen.getByRole("link", { name: "navigation:requestedReservations" });
    expect(link).toHaveTextContent("7");
  });

  test("navigates with the router when a menu link is clicked", () => {
    render(<Navigation apiBaseUrl="http://localhost:3000" />);

    fireEvent.click(screen.getByRole("link", { name: "navigation:myUnits" }));

    expect(mockPush).toHaveBeenCalledWith("/my-units");
  });
});
