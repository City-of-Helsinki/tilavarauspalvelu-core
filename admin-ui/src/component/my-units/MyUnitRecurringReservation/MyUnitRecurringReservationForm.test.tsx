/* eslint-disable @typescript-eslint/no-non-null-assertion */
import React from "react";
import "@testing-library/jest-dom";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MockedProvider } from "@apollo/client/testing";
import { getYear, nextMonday, set } from "date-fns";
import {
  ReservationUnitType,
  ReservationUnitsReservationUnitAuthenticationChoices,
  ReservationUnitsReservationUnitReservationKindChoices,
  ReservationUnitsReservationUnitReservationStartIntervalChoices,
} from "common/types/gql-types";
import { BrowserRouter } from "react-router-dom";
import MyUnitRecurringReservationForm from "./MyUnitRecurringReservationForm";
import { RESERVATION_UNIT_QUERY } from "../hooks/queries";
import { CREATE_STAFF_RESERVATION } from "../create-reservation/queries";
import {
  CREATE_RECURRING_RESERVATION,
  GET_RESERVATIONS_IN_INTERVAL,
} from "./queries";

const unitCommon = {
  reservationStartInterval:
    ReservationUnitsReservationUnitReservationStartIntervalChoices.Interval_15Mins,
  allowReservationsWithoutOpeningHours: true,
  authentication: ReservationUnitsReservationUnitAuthenticationChoices.Weak,
  canApplyFreeOfCharge: false,
  bufferTimeBefore: null,
  bufferTimeAfter: null,
  __typename: "ReservationUnitType",
  isArchived: false,
  isDraft: false,
  requireIntroduction: false,
  requireReservationHandling: false,
  reservationKind: ReservationUnitsReservationUnitReservationKindChoices.Direct,
  uuid: "",
  id: "",
  contactInformation: "",
} as const;

// TODO mocks should be moved to __tests__ directory or similar
const units: ReservationUnitType[] = [
  {
    ...unitCommon,
    pk: 1,
    nameFi: "Unit",
    images: [],
  },
  {
    ...unitCommon,
    pk: 2,
    nameFi: "Absolute",
    images: [],
  },
];

const emptyTerms = {
  textFi: "",
  nameFi: "",
};

// Use next year for all tests (today to two years in the future is allowed in the form)
// NOTE using jest fake timers would be better but they timeout the tests
const YEAR = getYear(new Date()) + 1;

const unitResponse = [
  {
    node: {
      nameFi: "Studiohuone 1 + soittimet",
      maxPersons: null,
      pk: 1,
      bufferTimeBefore: null,
      bufferTimeAfter: null,
      reservationStartInterval: "INTERVAL_15_MINS",
      pricingTerms: emptyTerms,
      paymentTerms: emptyTerms,
      cancellationTerms: emptyTerms,
      serviceSpecificTerms: emptyTerms,
      termsOfUseFi: "",
      unit: {
        pk: 1,
        nameFi: "unit name",
        serviceSectors: [
          {
            pk: 1,
          },
        ],
      },
      metadataSet: {
        name: "full_meta",
        supportedFields: [
          "reservee_type",
          "reservee_first_name",
          "reservee_last_name",
          "reservee_organisation_name",
          "reservee_phone",
          "reservee_email",
          "reservee_id",
          "reservee_is_unregistered_association",
          "reservee_address_street",
          "reservee_address_city",
          "reservee_address_zip",
          "billing_first_name",
          "billing_last_name",
          "billing_phone",
          "billing_email",
          "billing_address_street",
          "billing_address_city",
          "billing_address_zip",
          "home_city",
          "age_group",
          "applying_for_free_of_charge",
          "free_of_charge_reason",
          "name",
          "description",
          "num_persons",
          "purpose",
        ],
        requiredFields: [
          "reservee_first_name",
          "reservee_type",
          "reservee_email",
          "age_group",
          "name",
          "description",
          "num_persons",
          "purpose",
        ],
        __typename: "ReservationMetadataSetType",
      },
      __typename: "ReservationUnitType",
    },
    __typename: "ReservationUnitTypeEdge",
  },
];

// First monday off the month has reservation from 9:00 - 12:00
const mondayMorningReservations = Array.from(Array(12).keys()).map((x) => {
  const firstMonday = nextMonday(new Date(YEAR, x, 1));
  const begin = set(firstMonday, { hours: 9, minutes: 0, milliseconds: 0 });
  const end = set(firstMonday, { hours: 12, minutes: 0, milliseconds: 0 });
  return {
    begin,
    end,
  };
});

// Every day has 5 x 1 hour reservations from 15 - 21
const firstDay = new Date(YEAR, 1, 1);
const everydayReservations = Array.from(Array(365).keys()).reduce(
  (agv: { begin: Date; end: Date }[], i) => {
    const begin = set(firstDay, {
      date: i,
      hours: 15,
      minutes: 0,
      milliseconds: 0,
    });
    const end = set(firstDay, {
      date: i,
      hours: 16,
      minutes: 0,
      milliseconds: 0,
    });
    return [
      ...agv,
      ...Array.from(Array(5).keys()).map((j) => ({
        begin: set(begin, {
          hours: 15 + j,
        }),
        end: set(end, {
          hours: 16 + j,
        }),
      })),
    ];
  },
  []
);

const reservationsByUnitResponse = mondayMorningReservations
  .concat(everydayReservations)
  // backend returns days unsorted but our mondays are first
  // we could also randomize the array so blocking times are neither at the start nor the end
  .sort((x, y) => x.begin.getTime() - y.begin.getTime())
  .map((x) => ({
    begin: x.begin.toUTCString(),
    end: x.end.toUTCString(),
    __typename: "ReservationType",
  }));

const mocks = [
  {
    request: {
      query: RESERVATION_UNIT_QUERY,
      variables: { pk: ["1"] },
    },
    result: {
      data: {
        reservationUnits: {
          edges: unitResponse,
        },
      },
    },
  },
  {
    request: {
      query: GET_RESERVATIONS_IN_INTERVAL,
      variables: {
        pk: 1,
        from: `${YEAR}-01-01`,
        // NOTE backend problem with date +1
        to: `${YEAR + 1}-01-01`,
      },
    },
    result: {
      data: {
        reservationUnitByPk: {
          reservations: reservationsByUnitResponse,
        },
      },
    },
  },
  {
    request: {
      query: CREATE_STAFF_RESERVATION,
    },
    result: {
      data: {},
    },
  },
  {
    request: {
      query: CREATE_RECURRING_RESERVATION,
    },
    result: {
      data: {},
    },
  },
];

const customRender = () =>
  render(
    <BrowserRouter>
      <MockedProvider mocks={mocks} addTypename={false}>
        <MyUnitRecurringReservationForm reservationUnits={units} />
      </MockedProvider>
    </BrowserRouter>
  );

const getReservationUnitBtn = () => {
  // Find and click the button so the listbox is visible
  const btn = screen.getByLabelText(
    /MyUnits.RecurringReservationForm.reservationUnit/,
    { selector: "button" }
  );
  expect(btn).toBeInTheDocument();
  return btn;
};

beforeEach(() => {
  // Hide radio button warnings
  jest.spyOn(console, "warn").mockImplementation(() => {});
});

test("Render recurring reservation form with all but unit field disabled", async () => {
  const view = customRender();

  const user = userEvent.setup();

  const resUnitSelectLabel = await screen.findByText(
    "MyUnits.RecurringReservationForm.reservationUnit"
  );
  expect(resUnitSelectLabel).toBeDefined();

  const btn = getReservationUnitBtn();
  await user.click(btn);
  expect(btn).not.toBeRequired();

  const listbox = await view.findByLabelText(/reservationUnit/, {
    selector: "ul",
  });

  expect(units[0].nameFi).toBeDefined();
  expect(units[1].nameFi).toBeDefined();
  expect(listbox).toBeInTheDocument();
  expect(within(listbox).getByText(units[0].nameFi!)).toBeInTheDocument();
  expect(within(listbox).getByText(units[1].nameFi!)).toBeInTheDocument();

  const selectorFields = ["repeatPattern"];
  selectorFields.forEach((f) => {
    const labelElem = view.getByRole("button", { name: RegExp(f) });
    expect(labelElem).toBeInTheDocument();
    expect(labelElem).toBeDisabled();
  });
  const dateFields = ["startingDate", "endingDate"];
  dateFields.forEach((f) => {
    const labelElem = view.getByRole("textbox", { name: RegExp(f) });
    expect(labelElem).toBeInTheDocument();
    expect(labelElem).toBeDisabled();
  });

  const submitBtn = await screen.findByRole("button", {
    name: "common.reserve",
  });
  expect(submitBtn).toBeDefined();

  expect(
    await screen.findByRole("button", { name: "common.cancel" })
  ).toBeDefined();
});

const selectUnit = async () => {
  const container = screen.getByText(
    /MyUnits.RecurringReservationForm.reservationUnit/
  );
  const btn = within(container.parentElement!).getByRole("button");
  const user = userEvent.setup();
  expect(btn).toBeInTheDocument();
  expect(btn).toBeVisible();
  expect(btn).not.toBeDisabled();
  // placeholder check because selects use button text checks
  expect(btn).toHaveTextContent("common.select");
  await user.click(btn);

  const listbox = screen.getByLabelText(/reservationUnit/, {
    selector: "ul",
  });
  expect(units[0].nameFi).toBeDefined();

  // Select works for HDS listbox but
  // to check the selected value we have to read the button text not check options
  await userEvent.selectOptions(listbox, "Unit");
  expect(btn).toHaveTextContent("Unit");
};

test("selecting unit field allows input to other mandatory fields", async () => {
  const view = customRender();

  await selectUnit();

  // TODO select some values from them
  // TODO test start and end time text inputs
  // const = ["startingTime", "endingTime"];
  const selectorFields = ["repeatPattern"];
  selectorFields.forEach((f) => {
    const labelElem = view.getByRole("button", { name: RegExp(f) });
    expect(labelElem).toBeInTheDocument();
    expect(labelElem).not.toBeDisabled();
  });
  const dateFields = ["startingDate", "endingDate"];
  dateFields.forEach((f) => {
    const labelElem = view.getByRole("textbox", { name: RegExp(f) });
    expect(labelElem).toBeInTheDocument();
    expect(labelElem).not.toBeDisabled();
  });

  // TODO need to fill the form
  // and then submit it and check we get both CREATE_RECURRING and CREATE_STAFF mutations
});

// FIXME this fails on CI but not locally
test.skip("Submit is blocked if all mandatory fields are not set", async () => {
  const view = customRender();

  await selectUnit();

  const submit = view.getByRole("button", { name: "common.reserve" });
  expect(submit).toBeInTheDocument();
  const user = userEvent.setup();
  await user.click(submit);
  // check errors printed to the form
  waitFor(() => {
    expect(
      view.getByText("Array must contain at least 1 element(s)")
    ).toBeInTheDocument();
    expect(view.getByText("Invalid date")).toBeInTheDocument();
  });

  // TODO check that there is no calls to Apollo mocks
});

// FIXME this interferes with other tests (nwsapi error)
test.skip("Form has meta when reservation unit is selected.", async () => {
  const view = customRender();

  await selectUnit();

  // TODO check that the radio buttons are not selected by default
  // this is because it's better for usability even if it causes acccessiblity issues

  const typeStaff = view.getByLabelText(/STAFF/);
  expect(typeStaff).toBeInTheDocument();
  const user = userEvent.setup();
  await user.click(typeStaff);

  // Just checking a single meta field for now
  // TODO use camelCase to convert all the metafields from unit[] and run an array check
  const emailInput = view.getByLabelText(/reserveeEmail/);
  expect(emailInput).toBeInTheDocument();
});

test("Form doesn't have meta without a reservation unit.", async () => {
  customRender();

  // TODO check that there is no type of reservation

  // Reverse of meta field exists check
  const emailInput = screen.queryByLabelText(/reserveeEmail/);
  expect(emailInput).not.toBeInTheDocument();
});

// TODO replace screen with view that is passed in here
// TODO this is brittle to any changes in the form layout, should use labels to find the elements not tab
async function fillForm({
  begin,
  end,
  dayNumber,
}: {
  // FI time format for keyboard input
  begin: string;
  end: string;
  dayNumber: 0 | 1 | 2 | 3 | 4 | 5 | 6;
}) {
  // Duplicated code from selectUnit because user type is questionable to recreate / pass
  const container = screen.getByText(
    /MyUnits.RecurringReservationForm.reservationUnit/
  );
  const btn = within(container.parentElement!).getByRole("button");
  const user = userEvent.setup();
  expect(btn).toBeInTheDocument();
  expect(btn).toBeVisible();
  expect(btn).not.toBeDisabled();
  // placeholder check because selects use button text checks
  expect(btn).toHaveTextContent("common.select");
  await user.click(btn);

  const listbox = screen.getByLabelText(/reservationUnit/, {
    selector: "ul",
  });
  expect(units[0].nameFi).toBeDefined();

  // Select works for HDS listbox but
  // to check the selected value we have to read the button text not check options
  await userEvent.selectOptions(listbox, "Unit");

  await user.tab();
  await user.keyboard(begin);
  // find by
  const startDateLabel = screen.getByRole("textbox", {
    name: /ReservationDialog.startingDate/,
  });
  expect(startDateLabel).toHaveValue(begin);

  await user.tab();
  await user.tab();
  await user.keyboard(end);
  const endDateLabel = screen.getByRole("textbox", {
    name: /ReservationDialog.endingDate/,
  });
  expect(endDateLabel).toHaveValue(end);

  await user.tab();
  await user.tab();
  // skip pattern selector (default value)
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

  const button = screen.getByRole("checkbox", {
    name: `dayShort.${dayNumber}`,
  });
  expect(button).toBeInTheDocument();
  await user.click(button);

  // NOTE this logic is wrong in the component (should use checked attribute not classes and component state)
  // toBeChecked doesn't work even though the role is checkbox, type is button
  expect(button.getAttribute("class")).toContain("active");
}

test("Form is disabled if it's not filled", async () => {
  const view = customRender();
  const submit = view.getByRole("button", { name: /common.reserve/ });
  expect(submit).toBeInTheDocument();
  expect(submit).toBeDisabled();
});

test("Form can't be submitted without reservation type selection", async () => {
  const view = customRender();
  await fillForm({
    begin: `1.6.${YEAR}`,
    end: `30.6.${YEAR}`,
    dayNumber: 1,
  });

  const submit = view.getByRole("button", { name: /common.reserve/ });
  expect(submit).toBeInTheDocument();
  expect(submit).not.toBeDisabled();
  fireEvent.submit(submit);
  await view.findByText(/required/i);
}, 15_000);

test("Form submission without any blocking reservations", async () => {
  const view = customRender();

  await fillForm({
    begin: `1.6.${YEAR}`,
    end: `30.6.${YEAR}`,
    dayNumber: 1,
  });

  const typeStaff = screen.getByLabelText(/STAFF/);
  await userEvent.click(typeStaff);

  const list = view.getByTestId("reservations-list");
  expect(list).toBeInTheDocument();

  const elems = within(list).getAllByText(/ti (?:\d+\.\d+\.\d+), 10:00-11:00/);
  expect(elems).toHaveLength(4);
  const overlaps = within(list).queryAllByText(/overlapping/);
  expect(overlaps).toHaveLength(0);

  const submit = screen.getByText(/common.reserve/);
  expect(submit).toBeInTheDocument();
  expect(submit).not.toBeDisabled();
  fireEvent.submit(submit);
  // TODO need await after fireEvent it doesn't wait

  expect(view.queryByText(/required/)).not.toBeInTheDocument();
  /* TODO submit checking doesn't work
   * we either have to provide extra context (like router) to the component
   * or refactor it so that we can check a mock callback
   * or mock library calls
   */
  // TODO test submit and check both CREATE_RECURRING and CREATE_STAFF mutations get called
  // we need to return the specific values from those mutations
  // and check that the wanted 4 reservations were made (or if we want to test errors)
}, 15_000);

test("Form submission with a lot of blocking reservations", async () => {
  const view = customRender();

  await fillForm({
    begin: `1.1.${YEAR}`,
    end: `31.12.${YEAR}`,
    dayNumber: 0,
  });

  const typeStaff = screen.getByLabelText(/STAFF/);
  await userEvent.click(typeStaff);

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
  const listCountLabel = view.getByText(
    /RecurringReservationForm.reservationsList/
  );
  expect(listCountLabel).toBeInTheDocument();

  const overlaps = within(list).queryAllByText(/overlapping/);
  expect(overlaps).toHaveLength(mondayMorningReservations.length);

  // TODO test submit, but it doesn't work without extra context

  // NOTE This test is long running by design. jest.setTimeout doesn't work for async functions
}, 60_000);

test("Reservations can be removed and restored", async () => {
  const view = customRender();

  await fillForm({
    begin: `1.6.${YEAR}`,
    end: `30.6.${YEAR}`,
    dayNumber: 1,
  });

  const typeStaff = screen.getByLabelText(/STAFF/);
  await userEvent.click(typeStaff);

  const list = view.getByTestId("reservations-list");
  expect(list).toBeInTheDocument();

  const elems = within(list).getAllByText(/ti (?:\d+\.\d+\.\d+), 10:00-11:00/);
  expect(elems).toHaveLength(4);
  const overlaps = within(list).queryAllByText(/overlapping/);
  expect(overlaps).toHaveLength(0);

  const removeButtons = within(list).queryAllByRole("button");
  expect(removeButtons).toHaveLength(4);
  removeButtons.forEach((x) => {
    expect(x).toHaveTextContent(/common.remove/);
  });

  userEvent.click(removeButtons[0]);
  await within(list).findByText(/common.restore/);
  const restore = within(list).getByText(/common.restore/);
  expect(within(list).queryAllByText(/common.remove/)).toHaveLength(3);

  userEvent.click(restore);
  waitFor(
    async () => (await within(list).findAllByText(/common.remove/)).length === 4
  );
}, 30_000);

// NOTE this requires us to fix submission checking
test.todo("Removed reservations are not included in the mutation");

test.todo(
  "Submit without any valid dates is disabled even though form is fully filled"
);

test.todo("Form has reservation type selection.");
test.todo("Form submission can bypass required meta field");
test.todo("Cancel button returns to previous page");
test.todo("Succesful form submission calls makes a GQL request");
test.todo("Succesful form submission calls a cb after GQL request");
test.todo("Form can't be submitted if all fields are not defined");
test.todo("If STAFF or BEHALF form shows and requires seriesName");
test.todo("If STAFF or BEHALF form shows metafields");
test.todo("If BLOCKED form has no metafields or seriesName");
