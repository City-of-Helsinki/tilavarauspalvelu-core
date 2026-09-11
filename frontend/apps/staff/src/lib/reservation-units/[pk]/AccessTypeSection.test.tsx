import React from "react";
import { useForm } from "react-hook-form";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import type { ReservationUnitEditQuery } from "@gql/gql-types";
import { AccessType } from "@gql/gql-types";
import { AccessTypeSection } from "./AccessTypeSection";
import { convertReservationUnit } from "./form";
import type { ReservationUnitEditFormValues } from "./form";

type AccessTypes = NonNullable<ReservationUnitEditQuery["reservationUnit"]>["accessTypes"];

function Harness({ accessTypes }: { accessTypes: AccessTypes }) {
  const form = useForm<ReservationUnitEditFormValues>({
    defaultValues: convertReservationUnit(undefined),
  });
  return <AccessTypeSection form={form} accessTypes={accessTypes} />;
}

async function openAccordion() {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: /accessType:accessTypeLabel/ }));
  return user;
}

describe("AccessTypeSection", () => {
  it("shows an inactive placeholder when there is no currently active access type", async () => {
    render(<Harness accessTypes={[]} />);
    await openAccordion();

    expect(screen.getByText("accessType:status.inactive")).toBeInTheDocument();
    expect(screen.getAllByText("-")).toHaveLength(2);
  });

  it("shows the currently active access type and its start date", async () => {
    render(
      <Harness accessTypes={[{ id: "at-1", pk: 1, accessType: AccessType.PhysicalKey, beginDate: "2020-01-15" }]} />
    );
    await openAccordion();

    expect(screen.getByText("accessType:type.PHYSICAL_KEY")).toBeInTheDocument();
    expect(screen.getByText("15.1.2020")).toBeInTheDocument();
    expect(screen.getByText("accessType:status.active")).toBeInTheDocument();
  });

  it("adds a new access type, excluding ACCESS_CODE for a new (pk 0) reservation unit", async () => {
    render(<Harness accessTypes={[]} />);
    const user = await openAccordion();

    await user.click(screen.getByRole("button", { name: "accessType:actions.addNewAccessType" }));

    const combobox = screen.getByRole("combobox", { name: /accessType:accessTypeLabel/ });
    await user.click(combobox);
    const listbox = await screen.findByRole("listbox");
    const options = within(listbox).getAllByRole("option");
    expect(options.map((o) => o.textContent)).toEqual([
      "accessType:type.OPENED_BY_STAFF",
      "accessType:type.PHYSICAL_KEY",
      "accessType:type.UNRESTRICTED",
    ]);
  });

  it("removes a newly-added access type via its remove button", async () => {
    render(<Harness accessTypes={[]} />);
    const user = await openAccordion();

    await user.click(screen.getByRole("button", { name: "accessType:actions.addNewAccessType" }));
    expect(screen.getByRole("combobox", { name: /accessType:accessTypeLabel/ })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "common:remove" }));

    expect(screen.queryByRole("combobox", { name: /accessType:accessTypeLabel/ })).not.toBeInTheDocument();
  });
});
