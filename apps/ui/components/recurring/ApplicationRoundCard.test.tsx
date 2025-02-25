import {
  ApplicationRoundStatusChoice,
  type ApplicationRoundCardFragment,
} from "@/gql/gql-types";
import { render } from "@testing-library/react";
import { ApplicationRoundCard } from "./ApplicationRoundCard";
import { vi, describe, test, expect, beforeAll, afterAll } from "vitest";

function createApplicationRoundCard({
  status,
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
    reservationPeriodBegin: "2024-02-01T00:00:00Z",
    reservationPeriodEnd: "2025-01-01T00:00:00Z",
    applicationPeriodBegin: "2023-01-01T00:00:00Z",
    applicationPeriodEnd: "2024-02-01T00:00:00Z",
  };
}

beforeAll(() => {
  vi.useFakeTimers({
    now: new Date(2024, 0, 1, 0, 0, 0),
  });
});
afterAll(() => {
  vi.useRealTimers();
});

describe("ApplicationRoundCard", () => {
  test("should render both links for open rounds", () => {
    const card = createApplicationRoundCard({
      name: "Test",
      status: ApplicationRoundStatusChoice.Open,
    });
    const view = render(<ApplicationRoundCard applicationRound={card} />);
    // TODO check the link target
    expect(
      view.getByRole("link", {
        name: "applicationRound:startNewApplication",
      })
    ).toBeInTheDocument();
    // TODO check the link target
    expect(
      view.getByRole("link", { name: "applicationRound:card.criteria" })
    ).toBeInTheDocument();
  });

  test("should not render start for invalid round status", () => {
    const card = createApplicationRoundCard({ name: "Test" });
    const view = render(<ApplicationRoundCard applicationRound={card} />);
    expect(
      view.queryByRole("link", {
        name: "applicationRound:startNewApplication",
      })
    ).not.toBeInTheDocument();
    // TODO check the link target
    expect(
      view.getByRole("link", { name: "applicationRound:card.criteria" })
    ).toBeInTheDocument();
  });

  test.each([
    [
      ApplicationRoundStatusChoice.Handled,
      ApplicationRoundStatusChoice.Upcoming,
      ApplicationRoundStatusChoice.ResultsSent,
      ApplicationRoundStatusChoice.InAllocation,
    ],
  ])("should not render start round for %s", (status) => {
    const card = createApplicationRoundCard({ name: "Test", status });
    const view = render(<ApplicationRoundCard applicationRound={card} />);
    expect(
      view.queryByRole("link", {
        name: "applicationRound:startNewApplication",
      })
    ).not.toBeInTheDocument();
    // TODO check the link target
    expect(
      view.getByRole("link", { name: "applicationRound:card.criteria" })
    ).toBeInTheDocument();
  });
});
