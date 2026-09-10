import React from "react";
import { useForm } from "react-hook-form";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { PricingSection } from "./PricingSection";
import type { TaxOption } from "./PricingSection";
import { convertReservationUnit } from "./form";
import type { ReservationUnitEditFormValues } from "./form";

const TAX_OPTIONS: TaxOption[] = [{ label: "25.5 %", pk: 1, value: 25.5 }];
const PRICING_TERMS_OPTIONS = [{ value: "terms-1", label: "Terms 1" }];

// HDS appends a trailing " *" to the accessible name of required fields.
function nameLike(base: string): RegExp {
  const escaped = base.replaceAll(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${escaped}(\\s\\*)?$`);
}

function Harness() {
  const form = useForm<ReservationUnitEditFormValues>({
    defaultValues: convertReservationUnit(undefined),
  });
  return <PricingSection form={form} taxPercentageOptions={TAX_OPTIONS} pricingTermsOptions={PRICING_TERMS_OPTIONS} />;
}

async function openAccordion() {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: /label\.pricings/ }));
  return user;
}

async function switchToPaid(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("radio", { name: "reservationUnitEditor:label.pricingTypes.paid" }));
}

async function selectComboOption(user: ReturnType<typeof userEvent.setup>, comboName: RegExp, optionName: string) {
  await user.click(screen.getByRole("combobox", { name: comboName }));
  await user.click(await screen.findByRole("option", { name: optionName }));
}

describe("PricingSection", () => {
  it("defaults to free pricing with canApplyFreeOfCharge disabled", async () => {
    render(<Harness />);
    await openAccordion();

    expect(screen.getByRole("radio", { name: "reservationUnitEditor:label.pricingTypes.free" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "reservationUnitEditor:label.pricingTypes.paid" })).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: "label.canApplyFreeOfCharge" })).toBeDisabled();
    expect(screen.queryByRole("spinbutton", { name: nameLike("label.lowestPrice") })).not.toBeInTheDocument();
  });

  it("switching to paid reveals price fields and enables canApplyFreeOfCharge", async () => {
    render(<Harness />);
    const user = await openAccordion();

    await switchToPaid(user);

    expect(screen.getByRole("radio", { name: "reservationUnitEditor:label.pricingTypes.paid" })).toBeChecked();
    expect(screen.getByRole("spinbutton", { name: nameLike("label.lowestPrice") })).toBeInTheDocument();
    expect(screen.getByRole("spinbutton", { name: nameLike("label.highestPrice") })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "label.hasMaterialPrice" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "label.canApplyFreeOfCharge" })).toBeEnabled();
  });

  it("computes the net price from the gross price and selected tax percentage", async () => {
    render(<Harness />);
    const user = await openAccordion();
    await switchToPaid(user);

    const lowestPrice = screen.getByRole("spinbutton", { name: nameLike("label.lowestPrice") });
    await user.clear(lowestPrice);
    await user.type(lowestPrice, "100");

    await selectComboOption(user, /^label\.taxPercentage/, "25.5 %");

    const lowestPriceNet = screen.getByRole("spinbutton", { name: nameLike("label.lowestPriceNet") });
    expect(lowestPriceNet).toHaveValue(79.68);
  });

  it("shows the material price description fields when hasMaterialPrice is checked", async () => {
    render(<Harness />);
    const user = await openAccordion();
    await switchToPaid(user);

    await user.click(screen.getByRole("checkbox", { name: "label.hasMaterialPrice" }));

    // RichTextInput is a next/dynamic (ssr: false) import, so wait for it to resolve.
    // It wraps the Quill editor (no native textbox role), so assert on its <label> text instead.
    expect(
      await screen.findByText("label.materialPriceDescriptionFi", { exact: false, selector: "label" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("label.materialPriceDescriptionSv", { exact: false, selector: "label" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("label.materialPriceDescriptionEn", { exact: false, selector: "label" })
    ).toBeInTheDocument();
  });

  it("shows the pricingTerms select once canApplyFreeOfCharge is checked while paid", async () => {
    render(<Harness />);
    const user = await openAccordion();
    await switchToPaid(user);

    expect(screen.queryByRole("button", { name: /^label\.pricingTerms/ })).not.toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: "label.canApplyFreeOfCharge" }));

    expect(screen.getByRole("button", { name: /^label\.pricingTerms/ })).toBeInTheDocument();
  });

  it("reveals the future pricing section (with a begins date) when hasFuturePricing is toggled", async () => {
    render(<Harness />);
    const user = await openAccordion();

    expect(
      screen.queryByRole("textbox", { name: nameLike("reservationUnitEditor:label.begins") })
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: "label.hasFuturePrice" }));

    expect(screen.getByRole("textbox", { name: nameLike("reservationUnitEditor:label.begins") })).toBeInTheDocument();
    expect(screen.getAllByRole("radio", { name: "reservationUnitEditor:label.pricingTypes.free" })).toHaveLength(2);
  });
});
