import React from "react";
import { addDays } from "date-fns";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MockedProvider } from "@apollo/client/testing";
import { ReservationSeriesForm } from "./ReservationSeriesForm";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createGraphQLMocks, createReservationUnits, mondayMorningReservations, YEAR } from "./__test__/mocks";
import { formatDate } from "common/src/modules/date-utils";
import { Weekday } from "@gql/gql-types";

const { mockedSearchParams, useSearchParams } = vi.hoisted(() => {
  const params = vi.fn();
  return {
    useSearchParams: params,
    mockedSearchParams: params,
  };
});

vi.mock("next/navigation", () => ({
  useSearchParams,
}));

const { useRouter } = vi.hoisted(() => {
  const mockedRouterReplace = vi.fn();
  mockedSearchParams.mockReturnValue(new URLSearchParams());
  const query = {
    id: "1",
  };
  return {
    useRouter: () => ({
      replace: mockedRouterReplace,
      query,
    }),
  };
});

vi.mock("next/router", () => ({
  useRouter,
}));

const DEFAULT_DATES = {
  begin: new Date(YEAR, 0, 1),
  end: new Date(YEAR, 12, 31),
};

function customRender(
  props: {
    begin: Date;
    end: Date;
  } = DEFAULT_DATES
) {
  const mocks = createGraphQLMocks(props);
  const reservationUnitOptions = createReservationUnits().map((unit) => ({
    label: unit.nameFi ?? "",
    value: unit.pk ?? 0,
  }));
  return render(
    <MockedProvider
      mocks={mocks}
      addTypename={false}
      // Have to cache bypass (setting cache to InMemoryCache is not enough)
      // NOTE if copying this approach any override in the query will take precedence
      // so for query specific fetchPolicies an alternative approach to cache is required
      defaultOptions={{
        watchQuery: { fetchPolicy: "no-cache" },
        query: { fetchPolicy: "no-cache" },
        mutate: { fetchPolicy: "no-cache" },
      }}
    >
      <ReservationSeriesForm reservationUnitOptions={reservationUnitOptions} unitPk={1} />
    </MockedProvider>
  );
}

const getReservationUnitBtn = () => {
  // Find and click the button so the listbox is visible
  const btn = screen.getByLabelText(/filters:label.reservationUnit/, {
    selector: "button",
  });
  expect(btn).toBeInTheDocument();
  return btn;
};

beforeEach(() => {
  vi.useFakeTimers({
    now: new Date(2024, 0, 1, 0, 0, 0),
  });
});
afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
});

test("Render recurring reservation form with all but unit field disabled", async () => {
  const view = customRender();
  const user = userEvent.setup({
    advanceTimers: vi.advanceTimersByTime.bind(vi),
  });

  const resUnitSelectLabel = await screen.findByText("filters:label.reservationUnit");
  expect(resUnitSelectLabel).toBeDefined();

  const btn = getReservationUnitBtn();
  await user.click(btn);
  expect(btn).not.toBeRequired();

  const listbox = view.getByRole("listbox");

  const units = createReservationUnits();
  const name1 = units[0]?.nameFi;
  const name2 = units[1]?.nameFi;
  if (name1 == null || name2 == null) {
    throw new Error("Reservation unit names not defined");
  }
  expect(name1).toBeDefined();
  expect(name2).toBeDefined();
  expect(listbox).toBeInTheDocument();
  expect(within(listbox).getByText(name1)).toBeInTheDocument();
  expect(within(listbox).getByText(name2)).toBeInTheDocument();

  const selectorFields = ["repeatPattern"];
  for (const f of selectorFields) {
    const el = view.getByRole("combobox", { name: RegExp(f) });
    expect(el).toBeInTheDocument();
    expect(el).toHaveAttribute("aria-disabled", "true");
  }
  const dateFields = ["startingDate", "endingDate"];
  for (const f of dateFields) {
    const labelElem = view.getByRole("textbox", { name: RegExp(f) });
    expect(labelElem).toBeInTheDocument();
    expect(labelElem).toBeDisabled();
  }

  const submitBtn = await screen.findByRole("button", {
    name: "common:reserve",
  });
  expect(submitBtn).toBeDefined();

  const cancelBtn = await screen.findByRole("link", {
    name: "common:cancel",
  });
  expect(cancelBtn).toBeDefined();
  expect(cancelBtn).toBeInTheDocument();
  expect(cancelBtn).not.toBeDisabled();
});

test.todo("Selecting unit should replace url params with reservation unit id");

describe("With unit selected", () => {
  beforeEach(() => {
    const params = new URLSearchParams();
    params.set("reservationUnit", Number(1).toString());
    mockedSearchParams.mockReturnValue(params);
  });

  test("allows input to other mandatory fields", async () => {
    const view = customRender();

    await waitForFormToBeEnabled();

    const labelElem = view.getByRole("combobox", { name: RegExp(/repeatPattern/) });
    expect(labelElem).toBeInTheDocument();
    expect(labelElem).not.toBeDisabled();

    const dateFields = ["startingDate", "endingDate"];
    for (const f of dateFields) {
      const labelElem = view.getByRole("textbox", { name: RegExp(f) });
      expect(labelElem).toBeInTheDocument();
      expect(labelElem).not.toBeDisabled();
    }
  });

  test("Submit is disabled if all mandatory fields are not set", async () => {
    customRender();
    await waitForFormToBeEnabled();
    const submit = screen.getByRole("button", { name: "common:reserve" });
    expect(submit).toBeInTheDocument();
    expect(submit).toBeDisabled();
  });

  test("Form has meta when reservation unit is selected.", async () => {
    const view = customRender();
    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime.bind(vi),
    });

    await waitForFormToBeEnabled();

    // TODO check that the radio buttons are not selected by default
    // this is because it's better for usability even if it causes acccessiblity issues
    const typeStaff = view.getByLabelText(/STAFF/);
    expect(typeStaff).toBeInTheDocument();
    const typeClosed = view.getByLabelText(/BLOCKED/);
    expect(typeClosed).toBeInTheDocument();
    const typeBehalf = view.getByLabelText(/BEHALF/);
    expect(typeBehalf).toBeInTheDocument();

    await user.click(typeBehalf);

    // we only really need to know that one of the meta fields is there to test this forms logic
    // all meta fields should have separate tests
    const metaView = view.getByTestId("reservation__form--reservee-info");
    expect(metaView).toBeInTheDocument();
    const emailInput = await within(metaView).findByLabelText(/reserveeEmail/);
    expect(emailInput).toBeInTheDocument();
  });
});

test("Form doesn't have meta without a reservation unit.", () => {
  customRender();

  // TODO check that there is no type of reservation

  // Reverse of meta field exists check
  const emailInput = screen.queryByLabelText(/reserveeEmail/);
  expect(emailInput).not.toBeInTheDocument();
});

test("Form is disabled if it's not filled", () => {
  const view = customRender();
  const submit = view.getByRole("button", { name: /common:reserve/ });
  expect(submit).toBeInTheDocument();
  expect(submit).toBeDisabled();
});

describe("Filling the form", () => {
  beforeEach(() => {
    const params = new URLSearchParams();
    params.set("reservationUnit", Number(1).toString());
    mockedSearchParams.mockReturnValue(params);
  });
  // TODO replace screen with view that is passed in here
  // TODO this is brittle to any changes in the form layout, should use labels to find the elements not tab
  // TODO should break this function into smaller pieces and remove expects from it (otherwise we end up testing the test)
  async function fillForm({
    begin,
    end,
    weekday,
  }: {
    // FI time format for keyboard input
    begin: string;
    end: string;
    weekday: Weekday;
  }) {
    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime.bind(vi),
    });

    await waitForFormToBeEnabled();

    const startDateLabel = screen.getByRole("textbox", {
      name: /common:startingDate/,
    });
    expect(startDateLabel).not.toBeDisabled();
    await user.click(startDateLabel);
    await user.keyboard(begin);
    expect(startDateLabel).toHaveValue(begin);

    await user.tab();
    await user.tab();
    await user.keyboard(end);
    const endDateLabel = screen.getByRole("textbox", {
      name: /common:endingDate/,
    });
    expect(endDateLabel).toHaveValue(end);

    await user.tab();
    await user.tab();
    // Use default value: "weekly"
    // TODO could make sure it's selected here
    await user.tab();

    await user.keyboard("10");
    await user.keyboard("00");
    await user.tab();

    // Label selectors don't work for HDS components for some reason
    const startTime = screen.getByTestId("recurring-reservation-start-time");
    expect(startTime).toBeInTheDocument();
    expect(startTime).toHaveValue("10:00");

    await user.keyboard("11");
    await user.keyboard("00");
    await user.tab();
    const endTime = screen.getByTestId("recurring-reservation-end-time");
    expect(endTime).toBeInTheDocument();
    expect(endTime).toHaveValue("11:00");

    const button = screen.getByRole("button", {
      name: `translation:dayShort.${weekday}`,
    });
    expect(button).toBeInTheDocument();
    await user.click(button);

    // NOTE this logic is wrong in the component (should use checked attribute not classes and component state)
    // toBeChecked doesn't work even though the role is checkbox, type is button
    expect(button.getAttribute("class")).toContain("active");
  }

  test("Form can't be submitted without reservation type selection", async () => {
    const begin = new Date(YEAR, 5, 1);
    const end = addDays(begin, 30);
    const view = customRender({ begin, end });
    await fillForm({
      begin: formatDate(begin),
      end: formatDate(end),
      weekday: Weekday.Tuesday,
    });
    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime.bind(vi),
    });

    const submit = view.getByRole("button", { name: /common:reserve/ });
    expect(submit).toBeInTheDocument();
    expect(submit).not.toBeDisabled();
    await user.click(submit);
    await expect.poll(() => view.queryByText(/required/i)).toBeInTheDocument();
  }, 10000);

  test("Form submission without any blocking reservations", async () => {
    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime.bind(vi),
    });
    const begin = new Date(YEAR, 5, 1);
    const end = addDays(begin, 30);
    const view = customRender({ begin, end });
    await fillForm({
      begin: formatDate(begin),
      end: formatDate(end),
      weekday: Weekday.Tuesday,
    });

    const typeStaff = screen.getByLabelText(/STAFF/);
    await user.click(typeStaff);

    const list = view.getByTestId("reservations-list");
    expect(list).toBeInTheDocument();

    const elems = within(list).getAllByText(/ti (?:\d+\.\d+\.\d+), 10:00-11:00/);
    expect(elems).toHaveLength(4);
    const overlaps = within(list).queryAllByText(/overlapping/);
    expect(overlaps).toHaveLength(0);

    const submit = screen.getByText(/common:reserve/);
    expect(submit).toBeInTheDocument();
    expect(submit).not.toBeDisabled();
    await user.click(submit);

    expect(view.queryByText(/required/)).not.toBeInTheDocument();
    /* TODO submit checking doesn't work
     * we either have to provide extra context (like router) to the component
     * or refactor it so that we can check a mock callback
     * or mock library calls
     */
    // TODO test submit and check both CREATE_RECURRING and CREATE_STAFF mutations get called
    // we need to return the specific values from those mutations
    // and check that the wanted 4 reservations were made (or if we want to test errors)
  });

  test("Form submission with a lot of blocking reservations", async () => {
    const begin = new Date(YEAR, 0, 1);
    const end = new Date(YEAR, 11, 31);
    const view = customRender({ begin, end });
    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime.bind(vi),
    });
    await fillForm({
      begin: formatDate(begin),
      end: formatDate(end),
      weekday: Weekday.Monday,
    });

    const typeStaff = screen.getByLabelText(/STAFF/);
    await user.click(typeStaff);

    // Handle 52 / 53 mondays in a year
    let nMondays = 0;
    for (let day = 0; day < 367; day += 1) {
      const isMonday = (d: Date) => d.getDay() === 1;
      const d = new Date(YEAR, 0, day);
      if (d.getFullYear() > YEAR) {
        break;
      }
      if (isMonday(d)) {
        nMondays += 1;
      }
    }

    const list = view.getByTestId("reservations-list");
    expect(list).toBeInTheDocument();
    const elems = within(list).getAllByText(/ma (?:\d+\.\d+\.\d+), 10:00-11:00/);
    expect(elems).toHaveLength(nMondays);

    // Can't check the count printed before the list because it's using i18n (would need to modify the TFunction mock)
    const listCountLabel = view.getByText(/ReservationSeriesForm.reservationsList/);
    expect(listCountLabel).toBeInTheDocument();

    const overlaps = within(list).queryAllByText(/overlapping/);
    expect(overlaps).toHaveLength(mondayMorningReservations.length);

    // TODO test submit, but it doesn't work without extra context
  });

  test("Reservations can be removed and restored", async () => {
    const begin = new Date(YEAR, 5, 1);
    const end = addDays(begin, 30);
    const view = customRender({ begin, end });
    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime.bind(vi),
    });
    await fillForm({
      begin: formatDate(begin),
      end: formatDate(end),
      weekday: Weekday.Tuesday,
    });

    const typeStaff = screen.getByLabelText(/STAFF/);
    await user.click(typeStaff);

    const list = view.getByTestId("reservations-list");
    expect(list).toBeInTheDocument();

    const elems = within(list).getAllByText(/ti (?:\d+\.\d+\.\d+), 10:00-11:00/);
    expect(elems).toHaveLength(4);
    const overlaps = within(list).queryAllByText(/overlapping/);
    expect(overlaps).toHaveLength(0);

    const removeButtons = within(list).queryAllByRole("button");
    expect(removeButtons).toHaveLength(4);
    removeButtons.forEach((x) => {
      expect(x).toHaveTextContent(/common:remove/);
    });

    const testButton = removeButtons[0];
    if (testButton == null) {
      throw new Error("No remove button found");
    }
    await user.click(testButton);
    await within(list).findByText(/common:restore/);
    const restore = within(list).getByText(/common:restore/);
    expect(within(list).queryAllByText(/common:remove/)).toHaveLength(3);

    await user.click(restore);
    await waitFor(async () => (await within(list).findAllByText(/common:remove/)).length === 4);
  });
});

// NOTE this requires us to fix submission checking
test.todo("Removed reservations are not included in the mutation");

test.todo("Submit without any valid dates is disabled even though form is fully filled");

test.todo("Form has reservation type selection.");
test.todo("Form submission can bypass required meta field");
test.todo("Cancel button returns to previous page");
test.todo("Succesful form submission calls makes a GQL request");
test.todo("Succesful form submission calls a cb after GQL request");
test.todo("Form can't be submitted if all fields are not defined");
test.todo("If STAFF or BEHALF form shows and requires seriesName");
test.todo("If STAFF or BEHALF form shows metafields");
test.todo("If BLOCKED form has no metafields or seriesName");

// Have to await because of gql query
async function waitForFormToBeEnabled() {
  await expect.poll(() => screen.findByLabelText(/ReservationSeriesForm.name/)).toBeInTheDocument();
}
