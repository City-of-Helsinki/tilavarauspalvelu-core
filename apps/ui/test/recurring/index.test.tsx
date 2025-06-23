import { ApplicationRoundStatusChoice } from "@/gql/gql-types";
import RecurringLander from "@/pages/recurring";
import { render } from "@testing-library/react";
import { vi, describe, test, expect, afterEach, beforeEach } from "vitest";
import { createMockApplicationRound } from "@test/application.mocks";

beforeEach(() => {
  vi.useFakeTimers({
    now: new Date(2024, 0, 1, 0, 0, 0),
  });
});
afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
});

describe("RecurringLander", () => {
  test("should render empty recurring lander page", () => {
    const view = render(<RecurringLander applicationRounds={[]} />);
    const title = view.getByRole("heading", {
      name: "recurringLander:heading",
    });
    expect(title).toBeInTheDocument();
    expect(view.getByText("recurringLander:subHeading")).toBeInTheDocument();
    const activeRounds = view.getByRole("heading", {
      name: "recurringLander:roundHeadings.active",
    });
    expect(activeRounds).toBeInTheDocument();
    expect(view.getByText("recurringLander:noRounds")).toBeInTheDocument();
    expect(view.queryByText("recurringLander:roundHeadings.pending")).not.toBeInTheDocument();
    expect(view.queryByText("recurringLander:roundHeadings.past")).not.toBeInTheDocument();
  });

  // TODO test frontend splitting and sorting of application rounds
  // don't test the card rendering (separate component)
  // so cases:
  // - only active rounds (a few)
  test("should render recurring lander with only active roudns", () => {
    const rounds = [
      createMockApplicationRound({
        pk: 1,
        status: ApplicationRoundStatusChoice.Open,
        applicationPeriodBeginsAt: new Date("2024-04-01"),
        applicationPeriodEndsAt: new Date("2024-05-01"),
      }),
      createMockApplicationRound({
        pk: 2,
        status: ApplicationRoundStatusChoice.Open,
        applicationPeriodBeginsAt: new Date("2024-01-01"),
        applicationPeriodEndsAt: new Date("2024-02-01"),
      }),
      createMockApplicationRound({
        pk: 3,
        status: ApplicationRoundStatusChoice.Open,
        applicationPeriodBeginsAt: new Date("2024-02-01"),
        applicationPeriodEndsAt: new Date("2024-03-01"),
      }),
    ];
    const view = render(<RecurringLander applicationRounds={rounds} />);
    expect(view.getByRole("heading", { name: "recurringLander:heading" })).toBeInTheDocument();
    expect(view.getByText("recurringLander:subHeading")).toBeInTheDocument();
    expect(
      view.getByRole("heading", {
        name: "recurringLander:roundHeadings.active",
      })
    ).toBeInTheDocument();
    expect(view.queryByText("recurringLander:noRounds")).not.toBeInTheDocument();
    expect(view.queryByText("recurringLander:roundHeadings.pending")).not.toBeInTheDocument();
    expect(view.queryByText("recurringLander:roundHeadings.past")).not.toBeInTheDocument();

    const startLinks = view.queryAllByRole("link", {
      name: "applicationRound:startNewApplication",
    });
    expect(startLinks).toHaveLength(3);
    const criteriaLinks = view.queryAllByRole("link", {
      name: "applicationRound:card.criteria",
    });
    expect(criteriaLinks).toHaveLength(3);
    // TODO check the sort order (based on applicationPeriodBeginsAt)
  });

  test("should render recurring lander with one of each status", () => {
    const rounds = [
      createMockApplicationRound({
        pk: 1,
        status: ApplicationRoundStatusChoice.Upcoming,
        applicationPeriodBeginsAt: new Date("2024-04-01"),
        applicationPeriodEndsAt: new Date("2024-05-01"),
      }),
      createMockApplicationRound({
        pk: 2,
        status: ApplicationRoundStatusChoice.Handled,
        applicationPeriodBeginsAt: new Date("2024-01-01"),
        applicationPeriodEndsAt: new Date("2024-02-01"),
      }),
      createMockApplicationRound({
        pk: 3,
        status: ApplicationRoundStatusChoice.Open,
        applicationPeriodBeginsAt: new Date("2024-02-01"),
        applicationPeriodEndsAt: new Date("2024-03-01"),
      }),
    ];
    const view = render(<RecurringLander applicationRounds={rounds} />);
    expect(view.getByRole("heading", { name: "recurringLander:heading" })).toBeInTheDocument();
    expect(view.getByText("recurringLander:subHeading")).toBeInTheDocument();
    expect(
      view.getByRole("heading", {
        name: "recurringLander:roundHeadings.active",
      })
    ).toBeInTheDocument();
    expect(view.queryByText("recurringLander:noRounds")).not.toBeInTheDocument();
    expect(view.queryByText("recurringLander:roundHeadings.pending")).toBeInTheDocument();
    expect(view.queryByText("recurringLander:roundHeadings.past")).toBeInTheDocument();

    const startLinks = view.queryAllByRole("link", {
      name: "applicationRound:startNewApplication",
    });
    expect(startLinks).toHaveLength(1);
    const criteriaLinks = view.queryAllByRole("link", {
      name: "applicationRound:card.criteria",
    });
    expect(criteriaLinks).toHaveLength(3);

    // TODO check the split?
  });
  test.todo("should render recurring lander with only upcoming rounds");
  test.todo("should render recurring lander with only past rounds");
});
