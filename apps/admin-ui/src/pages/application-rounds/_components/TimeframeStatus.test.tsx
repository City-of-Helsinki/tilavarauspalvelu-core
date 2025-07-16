import React from "react";
import { render } from "@testing-library/react";
import { endOfTomorrow, endOfYesterday } from "date-fns";
import { TimeframeStatus } from "./TimeframeStatus";
import { test, expect } from "vitest";

const pastDate = endOfYesterday().toISOString();
const today = new Date().toISOString();
const futureDate = endOfTomorrow().toISOString();

test("Past times ok", () => {
  const view = render(<TimeframeStatus applicationPeriodBeginsAt={pastDate} applicationPeriodEndsAt={pastDate} />);

  expect(view.getByText("application:timeframePast")).toBeInTheDocument();
});

test("Today ending time ok", () => {
  const view = render(<TimeframeStatus applicationPeriodBeginsAt={pastDate} applicationPeriodEndsAt={today} />);

  expect(view.getByText("application:timeframePast (common:today)")).toBeInTheDocument();
});

test("Future times ok", () => {
  const view = render(
    <TimeframeStatus applicationPeriodBeginsAt={futureDate} applicationPeriodEndsAt={futureDate} isResolved={false} />
  );

  expect(view.getByText("application:timeframeFuture")).toBeInTheDocument();
});

test("Resolution done", () => {
  const view = render(
    <TimeframeStatus
      applicationPeriodBeginsAt={futureDate}
      applicationPeriodEndsAt={futureDate}
      isResolved
      resolutionDate="2021-05-18T09:59:24.575633Z"
    />
  );

  expect(view.getByText("applicationRound:resolutionDate")).toBeInTheDocument();
});
