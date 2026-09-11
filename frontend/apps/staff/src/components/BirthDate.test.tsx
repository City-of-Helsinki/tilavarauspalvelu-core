import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useReservationDateOfBirthQuery, useApplicationDateOfBirthQuery } from "@gql/gql-types";
import { BirthDate } from "./BirthDate";

vi.mock("@gql/gql-types");

describe("BirthDate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders masked date initially for reservation", () => {
    vi.mocked(useReservationDateOfBirthQuery).mockReturnValue({
      data: undefined,
      loading: false,
      error: null,
    } as never);
    vi.mocked(useApplicationDateOfBirthQuery).mockReturnValue({
      data: undefined,
      loading: false,
      error: null,
    } as never);

    render(<BirthDate reservationPk={1} />);
    expect(screen.getByText("XX.XX.XXXX")).toBeInTheDocument();
  });

  it("renders masked date initially for application", () => {
    vi.mocked(useReservationDateOfBirthQuery).mockReturnValue({
      data: undefined,
      loading: false,
      error: null,
    } as never);
    vi.mocked(useApplicationDateOfBirthQuery).mockReturnValue({
      data: undefined,
      loading: false,
      error: null,
    } as never);

    render(<BirthDate applicationPk={1} />);
    expect(screen.getByText("XX.XX.XXXX")).toBeInTheDocument();
  });

  it("shows loading state for reservation", () => {
    vi.mocked(useReservationDateOfBirthQuery).mockReturnValue({
      data: undefined,
      loading: true,
      error: null,
    } as never);
    vi.mocked(useApplicationDateOfBirthQuery).mockReturnValue({
      data: undefined,
      loading: false,
      error: null,
    } as never);

    render(<BirthDate reservationPk={1} />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("shows error state for reservation", () => {
    vi.mocked(useReservationDateOfBirthQuery).mockReturnValue({
      data: undefined,
      loading: false,
      error: new Error("Query failed"),
    } as never);
    vi.mocked(useApplicationDateOfBirthQuery).mockReturnValue({
      data: undefined,
      loading: false,
      error: null,
    } as never);

    render(<BirthDate reservationPk={1} />);
    expect(screen.getByText(/error/i)).toBeInTheDocument();
  });

  it("shows loading state for application", () => {
    vi.mocked(useReservationDateOfBirthQuery).mockReturnValue({
      data: undefined,
      loading: false,
      error: null,
    } as never);
    vi.mocked(useApplicationDateOfBirthQuery).mockReturnValue({
      data: undefined,
      loading: true,
      error: null,
    } as never);

    render(<BirthDate applicationPk={1} />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("shows error state for application", () => {
    vi.mocked(useReservationDateOfBirthQuery).mockReturnValue({
      data: undefined,
      loading: false,
      error: null,
    } as never);
    vi.mocked(useApplicationDateOfBirthQuery).mockReturnValue({
      data: undefined,
      loading: false,
      error: new Error("Query failed"),
    } as never);

    render(<BirthDate applicationPk={1} />);
    expect(screen.getByText(/error/i)).toBeInTheDocument();
  });

  it("toggles birth date visibility for reservation", async () => {
    const user = userEvent.setup();
    vi.mocked(useReservationDateOfBirthQuery).mockReturnValue({
      data: {
        reservation: {
          user: { dateOfBirth: "1990-01-15" },
        },
      },
      loading: false,
      error: null,
    } as never);
    vi.mocked(useApplicationDateOfBirthQuery).mockReturnValue({
      data: undefined,
      loading: false,
      error: null,
    } as never);

    render(<BirthDate reservationPk={1} />);
    expect(screen.getByText("XX.XX.XXXX")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /show/i }));
    // Date should not be masked anymore - just verify the mask is gone
    expect(screen.queryByText("XX.XX.XXXX")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /hide/i }));
    expect(screen.getByText("XX.XX.XXXX")).toBeInTheDocument();
  });

  it("toggles birth date visibility for application", async () => {
    const user = userEvent.setup();
    vi.mocked(useReservationDateOfBirthQuery).mockReturnValue({
      data: undefined,
      loading: false,
      error: null,
    } as never);
    vi.mocked(useApplicationDateOfBirthQuery).mockReturnValue({
      data: {
        application: {
          user: { dateOfBirth: "1985-06-20" },
        },
      },
      loading: false,
      error: null,
    } as never);

    render(<BirthDate applicationPk={1} />);
    expect(screen.getByText("XX.XX.XXXX")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /show/i }));
    // Date should not be masked anymore
    expect(screen.queryByText("XX.XX.XXXX")).not.toBeInTheDocument();
  });

  it("handles null birth date", async () => {
    const user = userEvent.setup();
    vi.mocked(useReservationDateOfBirthQuery).mockReturnValue({
      data: {
        reservation: {
          user: { dateOfBirth: null },
        },
      },
      loading: false,
      error: null,
    } as never);
    vi.mocked(useApplicationDateOfBirthQuery).mockReturnValue({
      data: undefined,
      loading: false,
      error: null,
    } as never);

    render(<BirthDate reservationPk={1} />);
    await user.click(screen.getByRole("button", { name: /show/i }));
    expect(screen.getByText("-")).toBeInTheDocument();
  });

  it("skips query when reservationPk is not visible", () => {
    vi.mocked(useReservationDateOfBirthQuery).mockReturnValue({
      data: undefined,
      loading: false,
      error: null,
    } as never);
    vi.mocked(useApplicationDateOfBirthQuery).mockReturnValue({
      data: undefined,
      loading: false,
      error: null,
    } as never);

    render(<BirthDate reservationPk={1} />);

    expect(useReservationDateOfBirthQuery).toHaveBeenCalledWith({
      variables: expect.any(Object),
      fetchPolicy: "no-cache",
      skip: true,
    });
  });
});
