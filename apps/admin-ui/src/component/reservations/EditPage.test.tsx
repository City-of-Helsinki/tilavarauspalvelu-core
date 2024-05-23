import React from "react";
import { MockedProvider } from "@apollo/client/testing";
import { act, render, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes, generatePath } from "react-router-dom";
import userEvent from "@testing-library/user-event";
// @ts-expect-error -- FIXME
import * as router from "react-router";
import { CustomerTypeChoice, ReservationDocument } from "@gql/gql-types";
import NotificationContextMock, {
  notifySuccess,
} from "app/__mocks__/NotificationContextMock";

import EditPage from "./EditPage";
import {
  CHANGED_WORKING_MEMO,
  mockReservation,
  mocks,
} from "./hooks/__test__/mocks";
import { base64encode } from "common/src/helpers";

const extendedReservation = {
  ...mockReservation,
  reserveeType: CustomerTypeChoice.Business,
  numPersons: 10,
  // NORMAL, BLOCKED, STAFF, BEHALF
  type: "BEHALF",
  name: "Yhdistys varaaja",
  reserveeAddressCity: "TRE",
  reserveeAddressStreet: "Katuosoite",
  reserveeAddressZip: "44444",
  reserveeEmail: "",
  reserveeFirstName: "Etunimi",
  reserveeId: "44444444",
  reserveeIsUnregisteredAssociation: true,
  reserveeLastName: "Sukunimi",
  reserveeOrganisationName: "Yhdistys007",
  reserveePhone: "43434343",
  state: "CONFIRMED",
  taxPercentageValue: "0.00",
  reservationUnits: [
    {
      pk: 1,
      nameFi: "Testitila",
      maxPersons: 10,
      bufferTimeBefore: 15,
      bufferTimeAfter: 15,
      unit: {
        pk: 101,
        nameFi: "unitName",
        serviceSectors: [
          {
            pk: 201,
          },
        ],
      },
      reservationStartInterval: "INTERVAL_15_MINS",
      metadataSet: {
        name: "metadata",
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
        requiredFields: [],
      },
    },
  ],
};

const extendedMocks = [
  ...mocks,
  {
    request: {
      query: ReservationDocument,
      variables: { id: base64encode("ReservationNode:1") },
    },
    result: {
      data: {
        reservation: extendedReservation,
      },
    },
  },
];

const mockedNavigate = jest.fn();

beforeEach(() => {
  // Hide radio button warnings
  jest.spyOn(console, "warn").mockImplementation(() => {});
  jest.spyOn(router, "useNavigate").mockImplementation(() => mockedNavigate);
});

const wrappedRender = (pk: number) => {
  const route = generatePath("/reservations/:id/edit", { id: String(pk) });
  const routeBase = generatePath("/reservations/:id", { id: String(pk) });

  return render(
    <MockedProvider mocks={extendedMocks} addTypename={false}>
      <NotificationContextMock>
        <MemoryRouter initialEntries={[routeBase, route]}>
          <Routes>
            <Route path="/reservations/:id" element={<div>DONE</div>} />
            <Route path="/reservations/:id/edit" element={<EditPage />} />
          </Routes>
        </MemoryRouter>
      </NotificationContextMock>
    </MockedProvider>
  );
};

describe("EditPage", () => {
  // TODO broken after GQL refactor
  test.skip("Render the edit page with the form data", async () => {
    const view = wrappedRender(1);

    // FIXME breaks after GQL refactor
    await waitFor(() =>
      expect(view.queryByText("common.cancel")).toBeInTheDocument()
    );
    await waitFor(() =>
      expect(view.queryAllByText(/page is loading/i)).toHaveLength(0)
    );
    expect(view.getByText("Reservation.EditPage.save")).toBeInTheDocument();

    expect(
      view.getByLabelText("reservationApplication:reservationType.BEHALF")
    ).toBeChecked();
    expect(
      view.getByText("reservationApplication:comment")
    ).toBeInTheDocument();
    expect(view.queryAllByText(/seriesName/i)).toHaveLength(0);
    const typeSelection = view.getByTestId(
      "reservation__checkbox--reservee-type"
    );
    expect(typeSelection).toBeInTheDocument();
    // TODO something has changed reserveeTypes to reserveetypes in the tests
    expect(
      within(typeSelection).getByText(/reserveeTypes.labels.business/i)
    ).toBeInTheDocument();
    // NOTE HDS issue: number field label is not a label
    expect(view.getByText(/label.common.numPersons/)).toBeInTheDocument();
    expect(view.getByLabelText(/label.common.name/)).toHaveValue(
      extendedReservation.name ?? "FAIL HERE"
    );
    expect(
      view.getByLabelText(/business.reserveeOrganisationName/)
    ).toHaveValue(extendedReservation.reserveeOrganisationName ?? "FAIL HERE");

    // submit is disabled without changes
    const submitBtn = view.getByRole("button", {
      name: "Reservation.EditPage.save",
    });
    expect(submitBtn).toBeInTheDocument();
    expect(submitBtn).toBeDisabled();

    const user = userEvent.setup();
    const nameInput = view.getByLabelText(/label.common.name/);
    expect(nameInput).toBeInTheDocument();
    await act(() => user.clear(nameInput));
    await act(() => user.type(nameInput, "New name"));
    const memoInput = view.getByLabelText(/reservationApplication:comment/);
    expect(memoInput).toBeInTheDocument();
    await act(() => user.clear(memoInput));
    await act(() => user.type(memoInput, CHANGED_WORKING_MEMO));

    expect(notifySuccess).not.toHaveBeenCalled();
    expect(submitBtn).not.toBeDisabled();
    /* TODO test saving the form (split into it's own test though)
    await act(() => user.click(submitBtn));

    await waitFor(() => expect(mockedNavigate).toHaveBeenCalled());
    await waitFor(() => expect(notifySuccess).toHaveBeenCalled());
    expect(notifyError).not.toHaveBeenCalled();
    // TODO check the url
    */
  });

  test.todo(
    "Form can be submitted with changes and the user is redirected to the reservation page"
  );

  // Backend blocks this, fail it on the frontend as well
  test.todo(
    "Form validation fails for meta field email if it is not a valid email"
  );
});
