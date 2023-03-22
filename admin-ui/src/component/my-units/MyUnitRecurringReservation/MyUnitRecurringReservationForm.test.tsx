/* eslint-disable @typescript-eslint/no-non-null-assertion */
import React from "react";
import "@testing-library/jest-dom";
import { render, screen, waitFor, within } from "@testing-library/react";
// eslint-disable-next-line import/no-extraneous-dependencies
import { expect, test, jest } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { MockedProvider } from "@apollo/client/testing";
import {
  ReservationUnitType,
  ReservationUnitsReservationUnitAuthenticationChoices,
  ReservationUnitsReservationUnitReservationKindChoices,
  ReservationUnitsReservationUnitReservationStartIntervalChoices,
} from "common/types/gql-types";
import { BrowserRouter } from "react-router-dom";
import MyUnitRecurringReservationForm from "./MyUnitRecurringReservationForm";
import {
  CREATE_STAFF_RESERVATION,
  RESERVATION_UNIT_QUERY,
} from "../create-reservation/queries";
import { CREATE_RECURRING_RESERVATION } from "./queries";
import { ReservationMade } from "./RecurringReservationDone";

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
  },
  {
    ...unitCommon,
    pk: 2,
    nameFi: "Absolute",
  },
];

const unitResponse = [
  {
    node: {
      nameFi: "Studiohuone 1 + soittimet",
      maxPersons: null,
      pk: 1,
      bufferTimeBefore: null,
      bufferTimeAfter: null,
      reservationStartInterval: "INTERVAL_15_MINS",
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

const customRender = (cb: (res: ReservationMade[]) => void) =>
  render(
    <BrowserRouter>
      <MockedProvider mocks={mocks} addTypename={false}>
        <MyUnitRecurringReservationForm
          reservationUnits={units}
          onReservation={cb}
        />
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

test("Render recurring reservation form with all but unit field disabled", async () => {
  const cb = jest.fn();
  const view = customRender(cb);

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
  const cb = jest.fn();
  const view = customRender(cb);

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
  const cb = jest.fn();
  const view = customRender(cb);

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

test("Form has meta when reservation unit is selected.", async () => {
  const cb = jest.fn();
  const view = customRender(cb);

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
  const cb = jest.fn();
  customRender(cb);

  // TODO check that there is no type of reservation

  // Reverse of meta field exists check
  const emailInput = screen.queryByLabelText(/reserveeEmail/);
  expect(emailInput).not.toBeInTheDocument();
});

test.todo("Form has reservation type selection.");
test.todo("Form submission can bypass required meta field");
test.todo("Cancel button returns to previous page");
test.todo("Succesful form submission calls makes a GQL request");
test.todo("Succesful form submission calls a cb");
test.todo("Form can't be submitted if all fields are not defined");
