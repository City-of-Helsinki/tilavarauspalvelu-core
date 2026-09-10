import React from "react";
import type { UseFormReturn } from "react-hook-form";
import { useForm } from "react-hook-form";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SeasonalSection } from "./SeasonalSection";
import { convertReservationUnit } from "./form";
import type { ReservationUnitEditFormValues } from "./form";

const mockLogError = vi.fn();
vi.mock("@ui/modules/errors", () => ({
  logError: (...args: unknown[]) => mockLogError(...args),
}));

function Harness({ overrideSeasons }: { overrideSeasons?: ReservationUnitEditFormValues["seasons"] }) {
  const base = convertReservationUnit(undefined);
  const form: UseFormReturn<ReservationUnitEditFormValues> = useForm<ReservationUnitEditFormValues>({
    defaultValues: {
      ...base,
      ...(overrideSeasons ? { seasons: overrideSeasons } : {}),
    },
  });
  return <SeasonalSection form={form} />;
}

beforeEach(() => {
  mockLogError.mockReset();
});

async function openAccordion() {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: /seasonalTimesTitle/ }));
  return user;
}

describe("SeasonalSection", () => {
  it("renders all 7 weekdays with one reservable time slot each", async () => {
    render(<Harness />);
    await openAccordion();

    expect(screen.getAllByText(/translation:dayLong\./).length).toBe(7);
    expect(screen.getAllByPlaceholderText("tt:mm")).toHaveLength(14);
    expect(screen.getAllByRole("button", { name: "reservationUnitEditor:addSeasonalTime" })).toHaveLength(7);
  });

  it("logs an error when seasons doesn't contain exactly 7 days", () => {
    const base = convertReservationUnit(undefined);
    render(<Harness overrideSeasons={base.seasons.slice(0, 3)} />);

    expect(mockLogError).toHaveBeenCalledWith("Seasons should always have 7 days");
  });

  it("disables the time inputs for a day once marked as closed", async () => {
    render(<Harness />);
    const user = await openAccordion();

    const [firstClosedCheckbox] = screen.getAllByRole("checkbox");
    expect(firstClosedCheckbox).toBeDefined();
    if (!firstClosedCheckbox) throw new Error("expected a checkbox");

    const inputsBefore = screen.getAllByPlaceholderText("tt:mm");
    expect(inputsBefore[0]).not.toBeDisabled();

    await user.click(firstClosedCheckbox);

    const inputsAfter = screen.getAllByPlaceholderText("tt:mm");
    expect(inputsAfter[0]).toBeDisabled();
    expect(inputsAfter[1]).toBeDisabled();
  });

  // Several sequential HDS interactions; give it headroom over the 5s default under parallel test load.
  it("adds and removes a second reservable time slot for a day", async () => {
    render(<Harness />);
    const user = await openAccordion();

    const [addButtonForMonday] = screen.getAllByRole("button", { name: "reservationUnitEditor:addSeasonalTime" });
    expect(addButtonForMonday).toBeDefined();
    if (!addButtonForMonday) throw new Error("expected an add button");

    await user.click(addButtonForMonday);

    expect(screen.getAllByPlaceholderText("tt:mm")).toHaveLength(16);
    expect(screen.getAllByRole("button", { name: "reservationUnitEditor:addSeasonalTime" })).toHaveLength(6);
    const [removeButtonForMonday] = screen.getAllByRole("button", {
      name: "reservationUnitEditor:removeSeasonalTime",
    });
    expect(removeButtonForMonday).toBeDefined();
    if (!removeButtonForMonday) throw new Error("expected a remove button");

    await user.click(removeButtonForMonday);

    expect(screen.getAllByPlaceholderText("tt:mm")).toHaveLength(14);
    expect(screen.getAllByRole("button", { name: "reservationUnitEditor:addSeasonalTime" })).toHaveLength(7);
  }, 10_000);

  it("resets all days to default when Clear is clicked", async () => {
    render(<Harness />);
    const user = await openAccordion();

    const [firstClosedCheckbox] = screen.getAllByRole("checkbox");
    if (!firstClosedCheckbox) throw new Error("expected a checkbox");
    await user.click(firstClosedCheckbox);
    expect(firstClosedCheckbox).toBeChecked();

    await user.click(screen.getByRole("button", { name: "reservationUnitEditor:clearSeasonalTimes" }));

    const [firstClosedCheckboxAfterClear] = screen.getAllByRole("checkbox");
    expect(firstClosedCheckboxAfterClear).not.toBeChecked();
    expect(screen.getAllByPlaceholderText("tt:mm")).toHaveLength(14);
  });
});
