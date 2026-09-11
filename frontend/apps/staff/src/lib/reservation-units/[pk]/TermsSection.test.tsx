import React from "react";
import { useForm } from "react-hook-form";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { TermsSection } from "./TermsSection";
import { convertReservationUnit } from "./form";
import type { ReservationUnitEditFormValues } from "./form";

const OPTIONS = {
  service: [{ value: "service-1", label: "Service terms 1" }],
  payment: [{ value: "payment-1", label: "Payment terms 1" }],
  cancellation: [{ value: "cancellation-1", label: "Cancellation terms 1" }],
};

function Harness() {
  const form = useForm<ReservationUnitEditFormValues>({
    defaultValues: convertReservationUnit(undefined),
  });
  return <TermsSection form={form} options={OPTIONS} />;
}

async function openAccordion() {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: /reservationUnitEditor:termsInstructions/ }));
  return user;
}

// The terms selects use enableSearch, which makes HDS render them as a "button"
// that opens a picker dialog rather than a native "combobox".
function selectButtonNameLike(base: string): RegExp {
  const escaped = base.replaceAll(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${escaped}`);
}

describe("TermsSection", () => {
  it("is closed by default and renders the three term selects and rich text fields once opened", async () => {
    render(<Harness />);
    expect(
      screen.queryByRole("button", { name: /reservationUnitEditor:label\.serviceSpecificTerms/ })
    ).not.toBeInTheDocument();

    await openAccordion();

    expect(
      screen.getByRole("button", { name: selectButtonNameLike("reservationUnitEditor:label.serviceSpecificTerms") })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: selectButtonNameLike("reservationUnitEditor:label.paymentTerms") })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: selectButtonNameLike("reservationUnitEditor:label.cancellationTerms") })
    ).toBeInTheDocument();
    expect(
      await screen.findByText("reservationUnitEditor:label.notesWhenApplyingFi", { exact: false, selector: "label" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("reservationUnitEditor:label.notesWhenApplyingEn", { exact: false, selector: "label" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("reservationUnitEditor:label.notesWhenApplyingSv", { exact: false, selector: "label" })
    ).toBeInTheDocument();
  });

  it("lists the given options for each terms select", async () => {
    render(<Harness />);
    const user = await openAccordion();

    await user.click(
      screen.getByRole("button", { name: selectButtonNameLike("reservationUnitEditor:label.serviceSpecificTerms") })
    );
    const listbox = await screen.findByRole("listbox");
    expect(within(listbox).getByRole("option", { name: "Service terms 1" })).toBeInTheDocument();
  });
});
