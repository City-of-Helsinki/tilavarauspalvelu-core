import React from "react";
import { render, screen } from "@testing-library/react";
import endOfYesterday from "date-fns/endOfYesterday";
import endOfTomorrow from "date-fns/endOfTomorrow";
import TimeframeStatus from "./TimeframeStatus";

const pastDate = endOfYesterday().toISOString();
const today = new Date().toISOString();
const futureDate = endOfTomorrow().toISOString();

jest.mock("react-i18next", () => ({
  useTranslation: () => {
    return {
      t: (str: string) => str,
      i18n: {
        changeLanguage: () => new Promise(() => {}),
      },
    };
  },
}));

test("Past times ok", () => {
  render(
    <TimeframeStatus
      applicationPeriodBegin={pastDate}
      applicationPeriodEnd={pastDate}
    />
  );

  expect(screen.getByText("Application.timeframePast")).toBeTruthy;
});

test("Today ending time ok", () => {
  render(
    <TimeframeStatus
      applicationPeriodBegin={pastDate}
      applicationPeriodEnd={today}
    />
  );

  expect(screen.getByText("Application.timeframePast (common.today)"))
    .toBeTruthy;
});

test("Future times ok", () => {
  render(
    <TimeframeStatus
      applicationPeriodBegin={futureDate}
      applicationPeriodEnd={futureDate}
    />
  );

  expect(screen.getByText("Application.timeframeFuture")).toBeTruthy;
});
