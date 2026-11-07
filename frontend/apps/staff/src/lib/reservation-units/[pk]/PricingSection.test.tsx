import React from "react";
import { useForm } from "react-hook-form";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { addDays } from "date-fns";
import { describe, expect, it } from "vitest";
import { formatDate } from "ui/src/modules/date-utils";
import { PaymentType, PriceUnit } from "@gql/gql-types";
import { convertReservationUnit } from "./form";
import type { ReservationUnitEditFormValues } from "./form";
import { formatNetPrice, PricingSection } from "./PricingSection";
import type { SalesItemOption, TaxLevelOption } from "./PricingSection";

const TAX_LEVEL_OPTIONS: TaxLevelOption[] = [
  { label: "Yleinen (25,5 %)", pk: 1, percentage: 25.5 },
  { label: "Alennettu (14 %)", pk: 2, percentage: 14 },
];
const SALES_ITEM_OPTIONS: SalesItemOption[] = [
  { label: "Tilavuokra", pk: 5, taxLevel: 1 },
  { label: "Laitevuokra", pk: 6, taxLevel: 2 },
];
const PRICING_TERMS_OPTIONS = [{ value: "terms-1", label: "Terms 1" }];

// HDS appends a trailing " *" to the accessible name of required fields.
function nameLike(base: string): RegExp {
  const escaped = base.replaceAll(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${escaped}(\\s\\*)?$`);
}

function Harness({
  taxLevel,
  overrides = {},
}: {
  taxLevel?: number;
  overrides?: Partial<ReservationUnitEditFormValues>;
}) {
  const defaultValues = { ...convertReservationUnit(undefined), ...overrides };
  if (taxLevel != null) {
    defaultValues.pricings = defaultValues.pricings.map((p) => ({ ...p, taxLevel }));
  }
  const form = useForm<ReservationUnitEditFormValues>({ defaultValues });
  return (
    <PricingSection
      form={form}
      taxLevelOptions={TAX_LEVEL_OPTIONS}
      salesItemOptions={SALES_ITEM_OPTIONS}
      pricingTermsOptions={PRICING_TERMS_OPTIONS}
    />
  );
}

/// A saved paid price in effect today, and a new future price
function createReadOnlyPricingList(): ReservationUnitEditFormValues["pricings"] {
  const [current, future] = convertReservationUnit(undefined).pricings;
  if (current == null || future == null) {
    throw new Error("Expected a current and a future price");
  }
  return [
    {
      ...current,
      pk: 1,
      isReadOnly: true,
      isPaid: true,
      price: 20,
      priceUnit: PriceUnit.PerHour,
      taxLevel: 1,
      salesItem: 5,
      begins: "1.1.2020",
    },
    future,
  ];
}

async function openAccordion() {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: /label\.pricings/ }));
  return user;
}

async function switchToPaid(user: ReturnType<typeof userEvent.setup>, group: HTMLElement) {
  await user.click(within(group).getByRole("radio", { name: "label.pricingTypes.paid" }));
}

async function selectComboOption(user: ReturnType<typeof userEvent.setup>, comboName: RegExp, optionName: string) {
  await user.click(screen.getByRole("combobox", { name: comboName }));
  await user.click(await screen.findByRole("option", { name: optionName }));
}

function getCurrentPricing(): HTMLElement {
  return screen.getByRole("group", { name: "label.currentPricing" });
}

describe("PricingSection for a reservation unit without saved prices", () => {
  it("shows the current pricing without a choice of paid or free, beginning today by default", async () => {
    render(<Harness />);
    await openAccordion();

    const current = getCurrentPricing();
    expect(within(current).getByRole("radio", { name: "label.pricingTypes.free" })).not.toBeChecked();
    expect(within(current).getByRole("radio", { name: "label.pricingTypes.paid" })).not.toBeChecked();
    expect(within(current).getByRole("textbox", { name: nameLike("label.begins") })).toHaveValue(
      formatDate(new Date())
    );
    expect(within(current).getByText("label.beginsCurrentHelperText")).toBeInTheDocument();
    expect(within(current).queryByRole("spinbutton")).not.toBeInTheDocument();
    expect(within(current).queryByRole("checkbox", { name: "label.canApplyFreeOfCharge" })).not.toBeInTheDocument();
  });

  it("shows the price, the payment type and the discount choice of a paid price", async () => {
    render(<Harness />);
    const user = await openAccordion();
    const current = getCurrentPricing();
    await switchToPaid(user, current);

    expect(within(current).getAllByRole("spinbutton")).toHaveLength(1);
    expect(within(current).getByRole("spinbutton", { name: nameLike("label.price") })).toBeInTheDocument();
    expect(within(current).getByRole("combobox", { name: /^label\.paymentType/ })).toBeInTheDocument();
    expect(within(current).getByRole("checkbox", { name: "label.canApplyFreeOfCharge" })).toBeInTheDocument();
    expect(within(current).queryByRole("checkbox", { name: "label.isActivatedOnBegins" })).not.toBeInTheDocument();
  });

  it("shows the net price in the helper text once the price and the tax level are set", async () => {
    render(<Harness />);
    const user = await openAccordion();
    await switchToPaid(user, getCurrentPricing());

    const price = screen.getByRole("spinbutton", { name: nameLike("label.price") });
    await user.clear(price);
    await user.type(price, "100");
    // No tax level is selected yet
    expect(price).not.toHaveAccessibleDescription("label.netPrice");

    await selectComboOption(user, /^label\.taxLevel/, "Yleinen (25,5 %)");
    expect(price).toHaveAccessibleDescription("label.netPrice");
  }, 10_000);

  it("shows no net price when the price is empty", async () => {
    render(<Harness taxLevel={2} />);
    const user = await openAccordion();
    await switchToPaid(user, getCurrentPricing());

    const price = screen.getByRole("spinbutton", { name: nameLike("label.price") });
    await user.clear(price);
    expect(price).not.toHaveAccessibleDescription("label.netPrice");
  });

  it("shows the material price description fields when hasMaterialPrice is checked", async () => {
    render(<Harness />);
    const user = await openAccordion();

    await user.click(within(getCurrentPricing()).getByRole("checkbox", { name: "label.hasMaterialPrice" }));

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
  it("shows the pricing terms once the customer can apply for a discount", async () => {
    render(<Harness />);
    const user = await openAccordion();
    await switchToPaid(user, getCurrentPricing());

    expect(screen.queryByRole("button", { name: /^label\.pricingTerms/ })).not.toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: "label.canApplyFreeOfCharge" }));

    expect(screen.getByRole("button", { name: /^label\.pricingTerms/ })).toBeInTheDocument();
  }, 10_000);

  it("shows the future pricing as a copy of the current price, beginning tomorrow", async () => {
    render(<Harness />);
    const user = await openAccordion();
    await switchToPaid(user, getCurrentPricing());
    const currentPrice = within(getCurrentPricing()).getByRole("spinbutton", { name: nameLike("label.price") });
    await user.type(currentPrice, "30");

    await user.click(screen.getByRole("checkbox", { name: "label.hasFuturePrice" }));

    const future = screen.getByRole("group", { name: "label.futurePricing" });
    expect(within(future).getByRole("radio", { name: "label.pricingTypes.paid" })).toBeChecked();
    expect(within(future).getByRole("spinbutton", { name: nameLike("label.price") })).toHaveValue(30);
    expect(within(future).getByRole("textbox", { name: nameLike("label.begins") })).toHaveValue(
      formatDate(addDays(new Date(), 1))
    );
    expect(within(future).getByText("label.beginsFutureHelperText")).toBeInTheDocument();
  }, 10_000);

  it("copies the current price to the future pricing only once", async () => {
    render(<Harness />);
    const user = await openAccordion();
    await switchToPaid(user, getCurrentPricing());
    const futureToggle = screen.getByRole("checkbox", { name: "label.hasFuturePrice" });

    await user.click(futureToggle);
    const future = screen.getByRole("group", { name: "label.futurePricing" });
    const futurePrice = within(future).getByRole("spinbutton", { name: nameLike("label.price") });
    await user.type(futurePrice, "40");
    await user.click(futureToggle);
    await user.type(within(getCurrentPricing()).getByRole("spinbutton", { name: nameLike("label.price") }), "50");
    await user.click(futureToggle);

    expect(
      within(screen.getByRole("group", { name: "label.futurePricing" })).getByRole("spinbutton", {
        name: nameLike("label.price"),
      })
    ).toHaveValue(40);
  }, 10_000);

  it("offers only the sales items of the selected tax level", async () => {
    render(<Harness taxLevel={2} />);
    const user = await openAccordion();
    await switchToPaid(user, getCurrentPricing());

    await user.click(screen.getByRole("combobox", { name: /^label\.salesItem/ }));

    expect(await screen.findByRole("option", { name: "Laitevuokra" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Tilavuokra" })).not.toBeInTheDocument();
  });

  it("requires a sales item when the reservation unit is paid online", async () => {
    render(<Harness overrides={{ paymentType: PaymentType.Online }} />);
    const user = await openAccordion();
    await switchToPaid(user, getCurrentPricing());

    // HDS marks a required select in its accessible name
    expect(screen.getByRole("combobox", { name: /^label\.salesItem\..*Pakollinen\.$/ })).toBeInTheDocument();
  });
});

describe("PricingSection for a reservation unit with a saved price", () => {
  it("shows the current price as a summary that can not be changed", async () => {
    render(<Harness overrides={{ pricings: createReadOnlyPricingList(), pricingTerms: "terms-1" }} />);
    await openAccordion();

    const summary = screen.getByRole("region", { name: "label.currentPricing" });
    expect(within(summary).getByText("label.validFrom")).toBeInTheDocument();
    expect(within(summary).getByText("1.1.2020")).toBeInTheDocument();
    expect(within(summary).getByText("20,00 €")).toBeInTheDocument();
    expect(within(summary).getByText("translation:priceUnit.PER_HOUR")).toBeInTheDocument();
    expect(within(summary).getByText("Yleinen (25,5 %)")).toBeInTheDocument();
    expect(within(summary).getByText("Tilavuokra")).toBeInTheDocument();
    expect(within(summary).queryByRole("spinbutton")).not.toBeInTheDocument();
    expect(within(summary).queryByRole("radio")).not.toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "label.changePricing" })).not.toBeChecked();
  });

  it("shows the new pricing as a copy of the current price, and the validity of the current price", async () => {
    render(<Harness overrides={{ pricings: createReadOnlyPricingList() }} />);
    const user = await openAccordion();

    await user.click(screen.getByRole("checkbox", { name: "label.changePricing" }));

    const summary = screen.getByRole("region", { name: "label.currentPricing" });
    expect(within(summary).getByText("label.validRange")).toBeInTheDocument();
    expect(within(summary).getByText(`1.1.2020–${formatDate(new Date())}`)).toBeInTheDocument();

    const newPricing = screen.getByRole("group", { name: "label.newPricing" });
    expect(within(newPricing).getByRole("spinbutton", { name: nameLike("label.price") })).toHaveValue(20);
  });

  it("shows a notice and no prices for a shared pricing group", async () => {
    render(<Harness overrides={{ isSharedPricingGroup: true }} />);
    await openAccordion();

    expect(screen.getByText("label.sharedPricingGroupHelperText")).toBeInTheDocument();
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /^label\.paymentType/ })).toBeInTheDocument();
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
