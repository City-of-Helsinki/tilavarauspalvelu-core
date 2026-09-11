import React from "react";
import { useForm } from "react-hook-form";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ReservationUnitEditUnitFragment } from "@gql/gql-types";
import { ResourceLocationType } from "@gql/gql-types";
import { BasicSection } from "./BasicSection";
import { convertReservationUnit } from "./form";
import type { ReservationUnitEditFormValues } from "./form";

type Spaces = ReservationUnitEditUnitFragment["spaces"];

const SPACE_WITH_RESOURCES: Spaces[number] = {
  id: "space-1",
  pk: 1,
  nameFi: "Space 1",
  maxPersons: 15,
  surfaceArea: 30,
  resources: [{ id: "resource-1", pk: 1, nameFi: "Resource 1", locationType: ResourceLocationType.Fixed }],
};

const SPACE_WITHOUT_RESOURCES: Spaces[number] = {
  id: "space-2",
  pk: 2,
  nameFi: "Space 2",
  maxPersons: 5,
  surfaceArea: 10,
  resources: [],
};

// HDS appends a trailing " *" to the accessible name of required fields.
function nameLike(base: string): RegExp {
  const escaped = base.replaceAll(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${escaped}(\\s\\*)?$`);
}

// HDS multiselect buttons compose their accessible name from label + placeholder + selection count.
function selectButtonNameLike(base: string): RegExp {
  const escaped = base.replaceAll(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${escaped}`);
}

function Harness({
  spaces,
  overrideSpaces,
}: {
  spaces: Spaces;
  overrideSpaces?: ReservationUnitEditFormValues["spaces"];
}) {
  const base = convertReservationUnit(undefined);
  const form = useForm<ReservationUnitEditFormValues>({
    defaultValues: {
      ...base,
      ...(overrideSpaces ? { spaces: overrideSpaces } : {}),
    },
  });
  return <BasicSection form={form} spaces={spaces} />;
}

describe("BasicSection", () => {
  it("is open by default and renders the required fields", () => {
    render(<Harness spaces={[SPACE_WITHOUT_RESOURCES]} />);

    expect(screen.getByRole("textbox", { name: nameLike("reservationUnitEditor:label.nameFi") })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: nameLike("reservationUnitEditor:label.nameEn") })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: nameLike("reservationUnitEditor:label.nameSv") })).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: "reservationUnitEditor:label.options.reservationKind.DIRECT" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("spinbutton", { name: nameLike("reservationUnitEditor:label.surfaceArea") })
    ).toBeInTheDocument();
  });

  it("defaults min surface area to 1 and max persons to 20 when no spaces are selected", () => {
    render(<Harness spaces={[SPACE_WITH_RESOURCES, SPACE_WITHOUT_RESOURCES]} overrideSpaces={[]} />);

    expect(
      screen.getByRole("spinbutton", { name: nameLike("reservationUnitEditor:label.surfaceArea") })
    ).toHaveAttribute("min", "1");
    expect(
      screen.getByRole("spinbutton", { name: nameLike("reservationUnitEditor:label.maxPersons") })
    ).toHaveAttribute("max", "20");
  });

  it("derives min surface area and max persons from the currently selected spaces", () => {
    render(<Harness spaces={[SPACE_WITH_RESOURCES, SPACE_WITHOUT_RESOURCES]} overrideSpaces={[1, 2]} />);

    // 30 + 10 surface area, 15 + 5 max persons, summed across selected spaces.
    expect(
      screen.getByRole("spinbutton", { name: nameLike("reservationUnitEditor:label.surfaceArea") })
    ).toHaveAttribute("min", "40");
    expect(
      screen.getByRole("spinbutton", { name: nameLike("reservationUnitEditor:label.maxPersons") })
    ).toHaveAttribute("max", "20");
  });

  it("disables the resources select when no space has any resources", () => {
    render(<Harness spaces={[SPACE_WITHOUT_RESOURCES]} />);

    expect(
      screen.getByRole("button", { name: selectButtonNameLike("reservationUnitEditor:label.resources") })
    ).toHaveAttribute("aria-disabled", "true");
  });

  it("enables the resources select when a space has resources", () => {
    render(<Harness spaces={[SPACE_WITH_RESOURCES]} />);

    expect(
      screen.getByRole("button", { name: selectButtonNameLike("reservationUnitEditor:label.resources") })
    ).toHaveAttribute("aria-disabled", "false");
  });

  it("caps minPersons at the current maxPersons form value, defaulting to 1", () => {
    render(<Harness spaces={[SPACE_WITHOUT_RESOURCES]} />);

    expect(
      screen.getByRole("spinbutton", { name: nameLike("reservationUnitEditor:label.minPersons") })
    ).toHaveAttribute("max", "1");
  });
});
