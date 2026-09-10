import React, { useEffect } from "react";
import type { UseFormReturn } from "react-hook-form";
import { useForm } from "react-hook-form";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { convertReservationUnit } from "./form";
import type { ReservationUnitEditFormValues } from "./form";
import { ErrorInfo } from "./ErrorInfo";

function Harness({
  apply,
}: {
  apply?: (form: UseFormReturn<ReservationUnitEditFormValues>) => void;
}) {
  const form = useForm<ReservationUnitEditFormValues>({
    defaultValues: convertReservationUnit(undefined),
  });

  useEffect(() => {
    apply?.(form);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <ErrorInfo form={form} />;
}

describe("ErrorInfo", () => {
  it("renders nothing when there are no form errors", () => {
    const { container } = render(<Harness />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders a plain field error", async () => {
    render(
      <Harness apply={(form) => form.setError("nameFi", { type: "custom", message: "Required" })} />
    );

    expect(await screen.findByText("forms:ErrorSummary.label")).toBeInTheDocument();
    expect(screen.getByText("reservationUnitEditor:label.nameFi: forms:errors.Required")).toBeInTheDocument();
  });

  it("renders pricing errors from the pricings field array", async () => {
    render(
      <Harness
        apply={(form) => form.setError("pricings.0.lowestPrice", { type: "custom", message: "Required" })}
      />
    );

    expect(
      await screen.findByText("reservationUnitEditor:label.lowestPrice : forms:errors.Required")
    ).toBeInTheDocument();
  });

  it("renders per-item access type errors", async () => {
    render(
      <Harness
        apply={(form) => form.setError("accessTypes.0.accessType", { type: "custom", message: "Required" })}
      />
    );

    expect(
      await screen.findByText("reservationUnitEditor:label.accessType : forms:errors.Required")
    ).toBeInTheDocument();
  });

  it("renders a top-level accessTypes error", async () => {
    render(
      <Harness apply={(form) => form.setError("accessTypes", { type: "custom", message: "Required" })} />
    );

    expect(
      await screen.findByText("reservationUnitEditor:label.accessTypes : forms:errors.Required")
    ).toBeInTheDocument();
  });

  it("renders an accessTypes.root error (added then removed access type)", async () => {
    render(
      <Harness apply={(form) => form.setError("accessTypes" as const, { type: "custom", message: "Required" })} />
    );

    expect(
      await screen.findByText("reservationUnitEditor:label.accessTypes : forms:errors.Required")
    ).toBeInTheDocument();
  });

  it("renders multiple simultaneous errors together", async () => {
    render(
      <Harness
        apply={(form) => {
          form.setError("nameFi", { type: "custom", message: "Required" });
          form.setError("pricings.0.lowestPrice", { type: "custom", message: "Required" });
          form.setError("accessTypes", { type: "custom", message: "Required" });
        }}
      />
    );

    expect(await screen.findByText("reservationUnitEditor:label.nameFi: forms:errors.Required")).toBeInTheDocument();
    expect(
      screen.getByText("reservationUnitEditor:label.lowestPrice : forms:errors.Required")
    ).toBeInTheDocument();
    expect(
      screen.getByText("reservationUnitEditor:label.accessTypes : forms:errors.Required")
    ).toBeInTheDocument();
  });
});
