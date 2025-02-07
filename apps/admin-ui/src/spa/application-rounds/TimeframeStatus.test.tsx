import React from "react";
import { render } from "@testing-library/react";
import { endOfTomorrow, endOfYesterday } from "date-fns";
import { axe } from "jest-axe";
import TimeframeStatus from "./TimeframeStatus";

const pastDate = endOfYesterday().toISOString();
const today = new Date().toISOString();
const futureDate = endOfTomorrow().toISOString();

test("Past times ok", async () => {
  const component = render(
    <TimeframeStatus
      applicationPeriodBegin={pastDate}
      applicationPeriodEnd={pastDate}
    />
  );

  expect(component.getByText("Application.timeframePast")).toBeTruthy();
  expect(await axe(component.container)).toHaveNoViolations();
});

test("Today ending time ok", async () => {
  const component = render(
    <TimeframeStatus
      applicationPeriodBegin={pastDate}
      applicationPeriodEnd={today}
    />
  );

  expect(
    component.getByText("Application.timeframePast (common.today)")
  ).toBeTruthy();
  expect(await axe(component.container)).toHaveNoViolations();
});

test("Future times ok", async () => {
  const component = render(
    <TimeframeStatus
      applicationPeriodBegin={futureDate}
      applicationPeriodEnd={futureDate}
      isResolved={false}
    />
  );

  expect(component.getByText("Application.timeframeFuture")).toBeTruthy();
  expect(await axe(component.container)).toHaveNoViolations();
});

test("Resolution done", async () => {
  const component = render(
    <TimeframeStatus
      applicationPeriodBegin={futureDate}
      applicationPeriodEnd={futureDate}
      isResolved
      resolutionDate="2021-05-18T09:59:24.575633Z"
    />
  );

  expect(component.getByText("ApplicationRound.resolutionDate")).toBeTruthy();
  expect(await axe(component.container)).toHaveNoViolations();
});
