import React from "react";
import { useForm } from "react-hook-form";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { convertReservationUnit } from "./form";
import type { ReservationUnitEditFormValues } from "./form";
import { formatNetPrice, PricingSection } from "./PricingSection";
import type { TaxLevelOption } from "./PricingSection";

const TAX_LEVEL_OPTIONS: TaxLevelOption[] = [
  { label: "Yleinen (25,5 %)", pk: 1, percentage: 25.5 },
  { label: "Alennettu (14 %)", pk: 2, percentage: 14 },
];
const PRICING_TERMS_OPTIONS = [{ value: "terms-1", label: "Terms 1" }];

// HDS appends a trailing " *" to the accessible name of required fields.
function nameLike(base: string): RegExp {
  const escaped = base.replaceAll(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${escaped}(\\s\\*)?$`);
}

function Harness({ taxLevel, pricingTerms }: { taxLevel?: number; pricingTerms?: string }) {
  const defaultValues = convertReservationUnit(undefined);
  if (taxLevel != null) {
    defaultValues.pricings = defaultValues.pricings.map((p) => ({ ...p, taxLevel }));
  }
  if (pricingTerms != null) {
    defaultValues.pricingTerms = pricingTerms;
  }
  const form = useForm<ReservationUnitEditFormValues>({ defaultValues });
  return <PricingSection form={form} taxLevelOptions={TAX_LEVEL_OPTIONS} pricingTermsOptions={PRICING_TERMS_OPTIONS} />;
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

  it("shows the net price in the helper text once the price and the tax level are set", async () => {
    render(<Harness />);
    const user = await openAccordion();
    await switchToPaid(user);

    const lowestPrice = screen.getByRole("spinbutton", { name: nameLike("label.lowestPrice") });
    await user.clear(lowestPrice);
    await user.type(lowestPrice, "100");
    // No tax level is selected yet
    expect(lowestPrice).not.toHaveAccessibleDescription("label.netPrice");

    await selectComboOption(user, /^label\.taxLevel/, "Yleinen (25,5 %)");
    expect(lowestPrice).toHaveAccessibleDescription("label.netPrice");
  }, 10_000);

  it("shows no net price when the price is empty", async () => {
    render(<Harness taxLevel={2} />);
    const user = await openAccordion();
    await switchToPaid(user);

    const highestPrice = screen.getByRole("spinbutton", { name: nameLike("label.highestPrice") });
    await user.clear(highestPrice);
    expect(highestPrice).not.toHaveAccessibleDescription("label.netPrice");
  });

  it("has no input for the net price or the activation flag", async () => {
    render(<Harness />);
    const user = await openAccordion();
    await switchToPaid(user);

    expect(screen.getAllByRole("spinbutton")).toHaveLength(2);
    expect(screen.queryByRole("checkbox", { name: "label.isActivatedOnBegins" })).not.toBeInTheDocument();
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

  // Several sequential HDS interactions; give it headroom over the 5s default under parallel test load.
  it("shows the pricingTerms select once canApplyFreeOfCharge is checked while paid", async () => {
    render(<Harness />);
    const user = await openAccordion();
    await switchToPaid(user);

    expect(screen.queryByRole("button", { name: /^label\.pricingTerms/ })).not.toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: "label.canApplyFreeOfCharge" }));

    expect(screen.getByRole("button", { name: /^label\.pricingTerms/ })).toBeInTheDocument();
  }, 10_000);

  it("shows saved pricing terms when canApplyFreeOfCharge is not checked, and hides them once cleared", async () => {
    render(<Harness pricingTerms="terms-1" />);
    const user = await openAccordion();

    expect(screen.getByRole("button", { name: /^label\.pricingTerms\..*"Terms 1"/ })).toBeInTheDocument();

    // The clear button has a localized HDS name that ends with the selected label
    await user.click(screen.getByRole("button", { name: /^(?!label\.pricingTerms).*"Terms 1"\.$/ }));

    expect(screen.queryByRole("button", { name: /^label\.pricingTerms/ })).not.toBeInTheDocument();
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

describe("formatNetPrice", () => {
  it("removes the tax from the price", () => {
    expect(formatNetPrice(100, 25.5)).toMatch(/^79,68\s€$/);
    expect(formatNetPrice(57, 14)).toMatch(/^50,00\s€$/);
  });

  it("returns an empty string without a price or a tax percentage", () => {
    expect(formatNetPrice(null, 25.5)).toBe("");
    expect(formatNetPrice(Number.NaN, 25.5)).toBe("");
    expect(formatNetPrice(100, undefined)).toBe("");
  });
});
