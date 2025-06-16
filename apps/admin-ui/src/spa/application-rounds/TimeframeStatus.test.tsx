import React from "react";
import { render } from "@testing-library/react";
import { endOfTomorrow, endOfYesterday } from "date-fns";
import TimeframeStatus from "./TimeframeStatus";
import { test, expect } from "vitest";

const pastDate = endOfYesterday().toISOString();
const today = new Date().toISOString();
const futureDate = endOfTomorrow().toISOString();

test("Past times ok", () => {
  const view = render(<TimeframeStatus applicationPeriodBegin={pastDate} applicationPeriodEnd={pastDate} />);

  expect(view.getByText("Application.timeframePast")).toBeInTheDocument();
});

test("Today ending time ok", () => {
  const view = render(<TimeframeStatus applicationPeriodBegin={pastDate} applicationPeriodEnd={today} />);

  expect(view.getByText("Application.timeframePast (common.today)")).toBeInTheDocument();
});

test("Future times ok", () => {
  const view = render(
    <TimeframeStatus applicationPeriodBegin={futureDate} applicationPeriodEnd={futureDate} isResolved={false} />
  );

  expect(view.getByText("Application.timeframeFuture")).toBeInTheDocument();
});

test("Resolution done", () => {
  const view = render(
    <TimeframeStatus
      applicationPeriodBegin={futureDate}
      applicationPeriodEnd={futureDate}
      isResolved
      resolutionDate="2021-05-18T09:59:24.575633Z"
    />
  );

  expect(view.getByText("ApplicationRound.resolutionDate")).toBeInTheDocument();
});
