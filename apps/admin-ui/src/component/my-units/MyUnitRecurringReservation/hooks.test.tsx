import React from "react";
import { render, waitFor } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import { add, format, set } from "date-fns";
import userEvent from "@testing-library/user-event";
import { RecurringReservationForm } from "app/schemas";
import { NewReservationListItem } from "app/component/ReservationsList";
import { useCreateRecurringReservation } from "./hooks";
import { mocks } from "./__test__/mocks";
import { ReservationMade } from "./RecurringReservationDone";
import { CREATE_RECURRING_RESERVATION } from "./queries";
import { CREATE_STAFF_RESERVATION } from "../create-reservation/queries";

const N_DAYS = 10;
const today = new Date();
const startingDate = add(
  set(today, {
    hours: 10,
    minutes: 0,
    milliseconds: 0,
    seconds: 0,
  }),
  { years: 1 }
);
const endingDate = add(startingDate, { days: N_DAYS });

const FAIL_INDEX = 2;

const createRecurringMock = (
  pk: number,
  unitPk: number,
  shouldFail: "once" | "twice" | "no"
) => [
  {
    request: {
      query: CREATE_RECURRING_RESERVATION,
      variables: {
        input: {
          beginDate: format(startingDate, "yyyy-MM-dd"),
          endDate: format(endingDate, "yyyy-MM-dd"),
          beginTime: "10:00",
          endTime: "12:00",
          name: "test series name",
          description: "",
          recurrenceInDays: 7,
          reservationUnitPk: unitPk,
          weekdays: [0, 1, 2, 3, 4, 5, 6],
        },
      },
    },
    result: {
      data: {
        createRecurringReservation: {
          errors: null,
          pk,
        },
      },
    },
  },
  // Individual staff reservation calls can fail, define them here
  // FAIL should be first since it's consumed by the mock
  ...Array.from(
    { length: shouldFail === "once" ? 1 : shouldFail === "twice" ? 2 : 0 },
    (_, i) => i
  ).map(() => ({
    request: {
      query: CREATE_STAFF_RESERVATION,
      variables: {
        input: {
          begin: add(startingDate, { days: FAIL_INDEX }).toISOString(),
          end: set(add(startingDate, { days: FAIL_INDEX }), {
            hours: 12,
          }).toISOString(),
          recurringReservationPk: pk,
          reservationUnitPks: [unitPk],
          type: "BEHALF",
          workingMemo: "",
        },
      },
    },
    error: new Error("Error"),
  })),
  ...Array.from({ length: N_DAYS }, (_, i) => i).map((i) => ({
    request: {
      query: CREATE_STAFF_RESERVATION,
      variables: {
        input: {
          begin: add(startingDate, { days: i }).toISOString(),
          end: set(add(startingDate, { days: i }), {
            hours: 12,
          }).toISOString(),
          recurringReservationPk: pk,
          reservationUnitPks: [unitPk],
          type: "BEHALF",
          workingMemo: "",
        },
      },
    },
    result: {
      data: {
        createStaffReservation: {
          errors: null,
          pk: 1000 + pk + i,
        },
      },
    },
  })),
];

const extendedMocks = [
  ...mocks,
  ...createRecurringMock(100, 46, "once"),
  ...createRecurringMock(200, 102, "twice"),
];

const TestComponent = ({
  onSuccess,
  unitPk,
}: {
  onSuccess: (res: ReservationMade[]) => void;
  unitPk: number;
}) => {
  const [mutationFn] = useCreateRecurringReservation();

  const handleClick = async () => {
    const reservationsToMake: NewReservationListItem[] = Array.from(
      { length: N_DAYS },
      (_, i) => ({
        date: add(startingDate, { days: i }),
        startTime: "10:00",
        endTime: "12:00",
      })
    );

    const data: RecurringReservationForm = {
      reservationUnit: { label: "46", value: unitPk },
      type: "BEHALF" as const,
      seriesName: "test series name",
      comments: "",
      bufferTimeBefore: false,
      bufferTimeAfter: false,
      startingDate: format(startingDate, "d.M.yyyy"),
      endingDate: format(endingDate, "d.M.yyyy"),
      startTime: "10:00",
      endTime: "12:00",
      repeatOnDays: [0, 1, 2, 3, 4, 5, 6],
      repeatPattern: { value: "weekly", label: "" } as const,
    };

    const [, result] = await mutationFn(
      data,
      reservationsToMake,
      unitPk,
      [], //  metaFields,
      { before: undefined, after: undefined } // buffers
    );

    onSuccess(result);
  };

  return (
    <button type="button" onClick={handleClick}>
      mutate
    </button>
  );
};

const wrappedRender = (unitPk: number, onSuccess: () => void) =>
  render(
    <MockedProvider mocks={extendedMocks} addTypename={false}>
      <TestComponent unitPk={unitPk} onSuccess={onSuccess} />
    </MockedProvider>
  );

const successRetVal = Array.from({ length: N_DAYS }, (_, i) => ({
  startTime: "10:00",
  endTime: "12:00",
  date: add(startingDate, { days: i }),
  reservationPk: 1100 + i,
  error: undefined,
}));

it("success if single reservation fails once and then succeeds", async () => {
  const cb = jest.fn();
  const view = wrappedRender(46, cb);

  const btn = view.getByRole("button", { name: /mutate/i });
  expect(btn).toBeInTheDocument();
  const user = userEvent.setup();
  await user.click(btn);

  await waitFor(() => expect(cb).toHaveBeenCalledTimes(1));
  expect(cb).toBeCalledWith(successRetVal);
});

const failureRetVal = Array.from({ length: N_DAYS }, (_, i) => ({
  startTime: "10:00",
  endTime: "12:00",
  date: add(startingDate, { days: i }),
  reservationPk: i === FAIL_INDEX ? undefined : 1000 + 200 + i,
  error: i === FAIL_INDEX ? "ApolloError: Error" : undefined,
}));

it("report a single failure if single reservation fails twice", async () => {
  const cb = jest.fn();
  const view = wrappedRender(102, cb);
  const btn = view.getByRole("button", { name: /mutate/i });
  expect(btn).toBeInTheDocument();
  const user = userEvent.setup();
  await user.click(btn);

  await waitFor(() => expect(cb).toHaveBeenCalledTimes(1));
  expect(cb).toBeCalledWith(failureRetVal);
});
