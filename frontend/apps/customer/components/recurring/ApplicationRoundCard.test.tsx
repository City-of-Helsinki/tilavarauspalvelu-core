import { ApplicationRoundStatusChoice, type ApplicationRoundCardFragment } from "@/gql/gql-types";
import { render } from "@testing-library/react";
import { ApplicationRoundCard } from "./ApplicationRoundCard";
import { vi, describe, test, expect, beforeEach, afterEach } from "vitest";
import { getApplicationRoundPath } from "@/modules/urls";

function createApplicationRoundCard({
  status = ApplicationRoundStatusChoice.Open,
  name = "Test",
}: {
  status?: ApplicationRoundStatusChoice;
  name: string;
}): ApplicationRoundCardFragment {
  return {
    id: "1",
    pk: 1,
    nameFi: `${name} FI`,
    nameSv: `${name} SV`,
    nameEn: `${name} EN`,
    status,
    reservationPeriodBeginDate: "2024-02-01T00:00:00Z",
    reservationPeriodEndDate: "2025-01-01T00:00:00Z",
    applicationPeriodBeginsAt: "2023-01-01T00:00:00Z",
    applicationPeriodEndsAt: "2024-02-01T00:00:00Z",
  };
}

beforeEach(() => {
  vi.useFakeTimers({
    now: new Date(2024, 0, 1, 0, 0, 0),
  });
});
afterEach(() => {
  vi.useRealTimers();
});

describe("ApplicationRoundCard Open Round", () => {
  test("should render both links", () => {
    const card = createApplicationRoundCard({
      name: "Test",
    });
    const view = render(<ApplicationRoundCard applicationRound={card} />);
    const startLink = view.getByRole("link", {
      name: "applicationRound:startNewApplication",
    });
    expect(startLink).toBeInTheDocument();
    expect(startLink).toHaveAttribute("href", getApplicationRoundPath(1).replace(/\/+$/, ""));
    const criteriaLink = view.getByRole("link", {
      name: "applicationRound:card.criteria",
    });
    expect(criteriaLink).toBeInTheDocument();
    expect(criteriaLink).toHaveAttribute("href", getApplicationRoundPath(1, "criteria"));
  });
});

describe.for([
  [ApplicationRoundStatusChoice.Handled],
  [ApplicationRoundStatusChoice.Upcoming],
  [ApplicationRoundStatusChoice.ResultsSent],
  [ApplicationRoundStatusChoice.InAllocation],
] as const)("should not render start round for %s", ([status]) => {
  test("should not render start for invalid round status", () => {
    const card = createApplicationRoundCard({ name: "Test", status });
    const view = render(<ApplicationRoundCard applicationRound={card} />);
    const startLink = view.queryByRole("link", {
      name: "applicationRound:startNewApplication",
    });
    expect(startLink).not.toBeInTheDocument();
    const criteriaLink = view.getByRole("link", {
      name: "applicationRound:card.criteria",
    });
    expect(criteriaLink).toBeInTheDocument();
    expect(criteriaLink).toHaveAttribute("href", getApplicationRoundPath(1, "criteria"));
  });
});
