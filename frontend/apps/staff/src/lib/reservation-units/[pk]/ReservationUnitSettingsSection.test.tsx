import React from "react";
import { useForm } from "react-hook-form";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ReservationKind } from "@gql/gql-types";
import { ReservationUnitSettingsSection } from "./ReservationUnitSettingsSection";
import { convertReservationUnit } from "./form";
import type { ReservationUnitEditFormValues } from "./form";

const CANCELLATION_RULE_OPTIONS = [{ value: 1, label: "Rule 1" }];

function Harness({ overrides }: { overrides?: Partial<ReservationUnitEditFormValues> }) {
  const base = convertReservationUnit(undefined);
  const form = useForm<ReservationUnitEditFormValues>({
    defaultValues: { ...base, ...overrides },
  });
  return <ReservationUnitSettingsSection form={form} cancellationRuleOptions={CANCELLATION_RULE_OPTIONS} />;
}

async function openAccordion() {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: /reservationUnitEditor:settings/ }));
  return user;
}

describe("ReservationUnitSettingsSection", () => {
  it("hides direct-only reservation settings when reservationKind is Season", async () => {
    render(<Harness overrides={{ reservationKind: ReservationKind.Season }} />);
    await openAccordion();

    expect(screen.queryByText("reservationUnitEditor:scheduledPublishing")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("checkbox", { name: "reservationUnitEditor:requireAdultReserveeLabel" })
    ).not.toBeInTheDocument();
    // The start interval select isn't direct-only and should always be present.
    expect(
      screen.getByRole("combobox", { name: /^reservationUnitEditor:label\.reservationStartInterval/ })
    ).toBeInTheDocument();
  });

  it("shows direct-only reservation settings when reservationKind is Direct", async () => {
    render(<Harness overrides={{ reservationKind: ReservationKind.Direct }} />);
    await openAccordion();

    expect(screen.getByText("reservationUnitEditor:scheduledPublishing")).toBeInTheDocument();
    expect(screen.getByText("reservationUnitEditor:scheduledReservation")).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: /^reservationUnitEditor:label\.minReservationDuration/ })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: /^reservationUnitEditor:label\.maxReservationDuration/ })
    ).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /^reservationUnitEditor:label\.reservationForm/ })).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: "reservationUnitEditor:requireAdultReserveeLabel" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: "reservationUnitEditor:requireReservationHandling" })
    ).toBeInTheDocument();
  });

  it("reveals begin/end date-time inputs as scheduled publishing sub-toggles are enabled", async () => {
    render(
      <Harness
        overrides={{
          reservationKind: ReservationKind.Direct,
          hasScheduledPublish: true,
          hasPublishBegins: true,
        }}
      />
    );
    const user = await openAccordion();

    expect(screen.getAllByRole("textbox", { name: "common:date" })).toHaveLength(1);

    await user.click(screen.getByRole("checkbox", { name: "reservationUnitEditor:publishEndsAt" }));

    expect(screen.getAllByRole("textbox", { name: "common:date" })).toHaveLength(2);
  });

  it("reveals buffer-time selects once bufferTimesSet and a direction toggle are enabled", async () => {
    render(<Harness />);
    const user = await openAccordion();

    expect(screen.queryByText("reservationUnitEditor:bufferTimeBefore")).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("radio", { name: "reservationUnitEditor:label.options.bufferType.bufferTimesSet" })
    );

    expect(screen.getByText("reservationUnitEditor:bufferTimeBefore")).toBeInTheDocument();
    expect(screen.getByText("reservationUnitEditor:bufferTimeAfter")).toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: "reservationUnitEditor:bufferTimeBefore" }));

    expect(
      screen.getByRole("combobox", { name: /^reservationUnitEditor:bufferTimeBeforeDuration/ })
    ).toBeInTheDocument();
  });

  it("reveals the cancellation rule options once hasCancellationRule is enabled", async () => {
    render(<Harness />);
    const user = await openAccordion();

    expect(screen.queryByRole("radio", { name: "Rule 1" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: "reservationUnitEditor:cancellationIsPossible" }));

    expect(screen.getByRole("radio", { name: "Rule 1" })).toBeInTheDocument();
  });
});
