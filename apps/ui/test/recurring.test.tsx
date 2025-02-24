import {
  ApplicationRoundStatusChoice,
  type ApplicationRoundFieldsFragment,
} from "@/gql/gql-types";
import RecurringLander from "../pages/recurring";
import { render } from "@testing-library/react";
import { base64encode } from "common/src/helpers";

function createApplicationRound({
  pk = 1,
  status,
  applicationPeriodEnd,
  applicationPeriodBegin,
}: {
  pk?: number;
  status: ApplicationRoundStatusChoice;
  applicationPeriodEnd: Date;
  applicationPeriodBegin: Date;
}): ApplicationRoundFieldsFragment {
  return {
    id: base64encode(`ApplicationRoundNode:${pk}`),
    pk,
    nameFi: "Test FI",
    nameSv: "Test SV",
    nameEn: "Test EN",
    status,
    reservationPeriodBegin: "2024-02-01T00:00:00Z",
    reservationPeriodEnd: "2025-01-01T00:00:00Z",
    publicDisplayBegin: "2024-02-01T00:00:00Z",
    publicDisplayEnd: "2025-01-01T00:00:00Z",
    applicationPeriodBegin: applicationPeriodBegin.toISOString(),
    applicationPeriodEnd: applicationPeriodEnd.toISOString(),
    reservationUnits: [],
  };
}

beforeAll(() => {
  jest.useFakeTimers({
    now: new Date(2024, 0, 1, 0, 0, 0),
  });
});
afterAll(() => {
  jest.useRealTimers();
});

describe("RecurringLander", () => {
  test("should render empty recurring lander page", () => {
    const view = render(<RecurringLander applicationRounds={[]} />);
    expect(
      view.getByRole("heading", { name: "recurringLander:heading" })
    ).toBeInTheDocument();
    expect(view.getByText("recurringLander:subHeading")).toBeInTheDocument();
    expect(
      view.getByRole("heading", {
        name: "recurringLander:roundHeadings.active",
      })
    ).toBeInTheDocument();
    expect(view.getByText("recurringLander:noRounds")).toBeInTheDocument();
    expect(
      view.queryByText("recurringLander:roundHeadings.pending")
    ).not.toBeInTheDocument();
    expect(
      view.queryByText("recurringLander:roundHeadings.past")
    ).not.toBeInTheDocument();
  });

  // TODO test frontend splitting and sorting of application rounds
  // don't test the card rendering (separate component)
  // so cases:
  // - only active rounds (a few)
  test("should render recurring lander with only active roudns", () => {
    const rounds = [
      createApplicationRound({
        pk: 1,
        status: ApplicationRoundStatusChoice.Open,
        applicationPeriodBegin: new Date("2024-04-01"),
        applicationPeriodEnd: new Date("2024-05-01"),
      }),
      createApplicationRound({
        pk: 2,
        status: ApplicationRoundStatusChoice.Open,
        applicationPeriodBegin: new Date("2024-01-01"),
        applicationPeriodEnd: new Date("2024-02-01"),
      }),
      createApplicationRound({
        pk: 3,
        status: ApplicationRoundStatusChoice.Open,
        applicationPeriodBegin: new Date("2024-02-01"),
        applicationPeriodEnd: new Date("2024-03-01"),
      }),
    ];
    const view = render(<RecurringLander applicationRounds={rounds} />);
    expect(
      view.getByRole("heading", { name: "recurringLander:heading" })
    ).toBeInTheDocument();
    expect(view.getByText("recurringLander:subHeading")).toBeInTheDocument();
    expect(
      view.getByRole("heading", {
        name: "recurringLander:roundHeadings.active",
      })
    ).toBeInTheDocument();
    expect(
      view.queryByText("recurringLander:noRounds")
    ).not.toBeInTheDocument();
    expect(
      view.queryByText("recurringLander:roundHeadings.pending")
    ).not.toBeInTheDocument();
    expect(
      view.queryByText("recurringLander:roundHeadings.past")
    ).not.toBeInTheDocument();

    expect(
      view.queryAllByRole("link", {
        name: "applicationRound:startNewApplication",
      })
    ).toHaveLength(3);
    expect(
      view.queryAllByRole("link", { name: "applicationRound:card.criteria" })
    ).toHaveLength(3);
    // TODO check the sort order (based on applicationPeriodBegin)
  });

  // - one of each status
  test("should render recurring lander with one of each status", () => {
    const rounds = [
      createApplicationRound({
        pk: 1,
        status: ApplicationRoundStatusChoice.Upcoming,
        applicationPeriodBegin: new Date("2024-04-01"),
        applicationPeriodEnd: new Date("2024-05-01"),
      }),
      createApplicationRound({
        pk: 2,
        status: ApplicationRoundStatusChoice.Handled,
        applicationPeriodBegin: new Date("2024-01-01"),
        applicationPeriodEnd: new Date("2024-02-01"),
      }),
      createApplicationRound({
        pk: 3,
        status: ApplicationRoundStatusChoice.Open,
        applicationPeriodBegin: new Date("2024-02-01"),
        applicationPeriodEnd: new Date("2024-03-01"),
      }),
    ];
    const view = render(<RecurringLander applicationRounds={rounds} />);
    expect(
      view.getByRole("heading", { name: "recurringLander:heading" })
    ).toBeInTheDocument();
    expect(view.getByText("recurringLander:subHeading")).toBeInTheDocument();
    expect(
      view.getByRole("heading", {
        name: "recurringLander:roundHeadings.active",
      })
    ).toBeInTheDocument();
    expect(
      view.queryByText("recurringLander:noRounds")
    ).not.toBeInTheDocument();
    expect(
      view.queryByText("recurringLander:roundHeadings.pending")
    ).toBeInTheDocument();
    expect(
      view.queryByText("recurringLander:roundHeadings.past")
    ).toBeInTheDocument();

    expect(
      view.queryAllByRole("link", {
        name: "applicationRound:startNewApplication",
      })
    ).toHaveLength(1);
    expect(
      view.queryAllByRole("link", { name: "applicationRound:card.criteria" })
    ).toHaveLength(3);

    // TODO check the split?
  });
  test.todo("should render recurring lander with only upcoming rounds");
  test.todo("should render recurring lander with only past rounds");
});
