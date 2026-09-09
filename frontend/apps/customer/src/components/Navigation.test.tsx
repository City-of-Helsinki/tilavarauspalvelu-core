import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import type { CurrentUserQuery } from "@gql/gql-types";
import { Navigation } from "./Navigation";

const mockUseSession = vi.fn();
const mockUseRouter = vi.fn();
const mockUseLocation = vi.fn();
const mockSignIn = vi.fn();
const mockSignOut = vi.fn();

vi.mock("@/hooks", () => ({
  useSession: () => mockUseSession(),
}));

vi.mock("next/router", () => ({
  useRouter: () => mockUseRouter(),
}));

vi.mock("react-use", () => ({
  useLocation: () => mockUseLocation(),
}));

vi.mock("ui/src/modules/browserHelpers", () => ({
  signIn: (...args: unknown[]) => mockSignIn(...args),
  signOut: (...args: unknown[]) => mockSignOut(...args),
}));

function createMockUser(
  overrides: Partial<NonNullable<CurrentUserQuery["currentUser"]>> = {}
): NonNullable<CurrentUserQuery["currentUser"]> {
  return {
    id: "user-1",
    pk: 1,
    firstName: "John",
    lastName: "Doe",
    isAdAuthenticated: false,
    ...overrides,
  } as NonNullable<CurrentUserQuery["currentUser"]>;
}

describe("Navigation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSession.mockReturnValue({
      user: createMockUser(),
      isAuthenticated: true,
    });
    mockUseRouter.mockReturnValue({
      push: vi.fn(),
      pathname: "/",
      locale: "fi",
    });
    mockUseLocation.mockReturnValue({
      pathname: "/",
    });
  });

  test("renders navigation header", () => {
    render(<Navigation apiBaseUrl="http://localhost:3000" profileLink="http://profile.example.com" />);

    expect(screen.getByRole("banner")).toBeInTheDocument();
  });

  test("renders user name when authenticated", () => {
    render(<Navigation apiBaseUrl="http://localhost:3000" profileLink="http://profile.example.com" />);

    const userMenu = screen.getByLabelText("John Doe");
    expect(userMenu).toBeInTheDocument();
  });

  test("renders navigation menu with home link", () => {
    render(<Navigation apiBaseUrl="http://localhost:3000" profileLink="http://profile.example.com" />);

    expect(screen.getByText("navigation:Item.home")).toBeInTheDocument();
  });

  test("renders reservation unit search link", () => {
    render(<Navigation apiBaseUrl="http://localhost:3000" profileLink="http://profile.example.com" />);

    expect(screen.getByText("navigation:Item.reservationUnitSearch")).toBeInTheDocument();
  });

  test("renders space reservation link", () => {
    render(<Navigation apiBaseUrl="http://localhost:3000" profileLink="http://profile.example.com" />);

    expect(screen.getByText("navigation:Item.spaceReservation")).toBeInTheDocument();
  });

  test("renders logo and application name", () => {
    render(<Navigation apiBaseUrl="http://localhost:3000" profileLink="http://profile.example.com" />);

    expect(screen.getByAltText("common:helsinkiCity")).toBeInTheDocument();
    expect(screen.getByText("common:applicationName")).toBeInTheDocument();
  });

  test("renders login button when not authenticated", () => {
    mockUseSession.mockReturnValue({
      user: null,
      isAuthenticated: false,
    });

    render(<Navigation apiBaseUrl="http://localhost:3000" profileLink="http://profile.example.com" />);

    expect(screen.getByRole("button", { name: "common:login" })).toBeInTheDocument();
  });

  test("shows reservations link only when authenticated", () => {
    mockUseSession.mockReturnValue({
      user: null,
      isAuthenticated: false,
    });

    render(<Navigation apiBaseUrl="http://localhost:3000" profileLink="http://profile.example.com" />);

    expect(screen.queryByText("navigation:Item.reservations")).not.toBeInTheDocument();
  });

  test("shows applications link only when authenticated", () => {
    mockUseSession.mockReturnValue({
      user: null,
      isAuthenticated: false,
    });

    render(<Navigation apiBaseUrl="http://localhost:3000" profileLink="http://profile.example.com" />);

    expect(screen.queryByText("navigation:Item.applications")).not.toBeInTheDocument();
  });
});
