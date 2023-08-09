import { GraphQLError } from "graphql";
import { addDays, addHours, set } from "date-fns";
import {
  ReservationType,
  ReservationUnitsReservationUnitAuthenticationChoices,
  ReservationUnitsReservationUnitReservationKindChoices,
  ReservationUnitsReservationUnitReservationStartIntervalChoices,
  ReservationsReservationPriorityChoices,
  ReservationsReservationStateChoices,
} from "common/types/gql-types";
import {
  UPDATE_STAFF_RECURRING_RESERVATION,
  UPDATE_STAFF_RESERVATION,
} from "../queries";
import { RECURRING_RESERVATION_QUERY } from "../../requested/hooks/queries";

export const CHANGED_WORKING_MEMO = "Sisaisen kommentti";

export const MUTATION_DATA = {
  input: {
    pk: 1,
    reservationUnitPks: [1],
    type: "BEHALF",
    bufferTimeBefore: undefined,
    bufferTimeAfter: undefined,
    reserveeType: "BUSINESS",
    reserveeFirstName: "Etunimi",
    reserveeLastName: "Sukunimi",
    reserveeOrganisationName: "Yhdistys007",
    reserveePhone: "43434343",
    reserveeEmail: "",
    reserveeId: "44444444",
    reserveeIsUnregisteredAssociation: true,
    reserveeAddressStreet: "Katuosoite",
    reserveeAddressCity: "TRE",
    reserveeAddressZip: "44444",
    billingFirstName: "",
    billingLastName: "",
    billingPhone: "",
    billingEmail: "",
    billingAddressStreet: "",
    billingAddressCity: "",
    billingAddressZip: "",
    freeOfChargeReason: "",
    name: "New name",
    description: "",
    numPersons: 10,
  },
  workingMemo: {
    pk: 1,
    workingMemo: CHANGED_WORKING_MEMO,
  },
};

const TODAY = new Date();
const getValidInterval = (daysToAdd: number) => {
  const begin = set(addDays(TODAY, daysToAdd + 1), {
    hours: 6,
    minutes: 0,
    seconds: 0,
    milliseconds: 0,
  });
  return [begin.toISOString(), addHours(begin, 1).toISOString()];
};

const createRecurringEdges = (
  startingPk: number,
  recurringPk: number,
  state: ReservationsReservationStateChoices = ReservationsReservationStateChoices.Confirmed
) => [
  {
    node: {
      begin: getValidInterval(0)[0],
      end: getValidInterval(0)[1],
      pk: startingPk,
      recurringReservation: { pk: recurringPk },
      state,
    },
  },
  {
    node: {
      begin: getValidInterval(7)[0],
      end: getValidInterval(7)[1],
      pk: startingPk + 1,
      recurringReservation: { pk: recurringPk },
      state,
    },
  },
];

const correctRecurringReservationQueryResult = (
  startingPk: number,
  recurringPk: number,
  options?: {
    shouldFailAll?: boolean;
    shouldFailOnce?: boolean;
    allDenied?: boolean;
  }
) => [
  {
    request: {
      query: RECURRING_RESERVATION_QUERY,
      variables: {
        pk: recurringPk,
        count: 100,
        offset: 0,
        state: [
          ReservationsReservationStateChoices.Confirmed,
          ReservationsReservationStateChoices.Denied,
        ],
      },
    },
    result: {
      data: {
        reservations: {
          edges: createRecurringEdges(
            startingPk,
            recurringPk,
            options?.allDenied
              ? ReservationsReservationStateChoices.Denied
              : ReservationsReservationStateChoices.Confirmed
          ),
          totalCount: 2,
        },
      },
    },
  },
  {
    request: {
      query: UPDATE_STAFF_RECURRING_RESERVATION,
      variables: {
        input: {
          name: "Modify recurring name",
          pk: recurringPk,
          description: CHANGED_WORKING_MEMO,
        },
      },
    },
    result: {
      data: {
        updateRecurringReservation: {
          pk: recurringPk,
          errors: null,
        },
      },
    },
  },
  {
    request: {
      query: UPDATE_STAFF_RESERVATION,
      variables: {
        input: { ...MUTATION_DATA.input, pk: startingPk },
        workingMemo: { ...MUTATION_DATA.workingMemo, pk: startingPk },
      },
    },
    result: {
      data: {
        staffReservationModify: { pk: startingPk, errors: null },
        updateReservationWorkingMemo: {
          workingMemo: CHANGED_WORKING_MEMO,
          errors: null,
        },
      },
    },
  },
  // NOTE apollo mocks are consumed on use (unlike MSW which uses functions) so create two of them
  ...[
    { fail: (options?.shouldFailAll || options?.shouldFailOnce) ?? false },
    { fail: options?.shouldFailAll ?? false },
  ].map(({ fail }) => ({
    request: {
      query: UPDATE_STAFF_RESERVATION,
      variables: {
        input: { ...MUTATION_DATA.input, pk: startingPk + 1 },
        workingMemo: { ...MUTATION_DATA.workingMemo, pk: startingPk + 1 },
      },
    },
    ...(fail
      ? { error: new Error("Error") }
      : {
          result: {
            data: {
              staffReservationModify: { pk: startingPk + 1, errors: null },
              updateReservationWorkingMemo: {
                workingMemo: CHANGED_WORKING_MEMO,
                errors: null,
              },
            },
          },
        }),
  })),
];

export const mocks = [
  // single reservation success
  {
    request: {
      query: UPDATE_STAFF_RESERVATION,
      variables: MUTATION_DATA,
    },
    result: {
      data: {
        staffReservationModify: { pk: 1, errors: null },
        updateReservationWorkingMemo: {
          workingMemo: CHANGED_WORKING_MEMO,
          errors: null,
        },
      },
    },
  },
  // single reservation Failure mocks: networkError once then succceed
  ...[{ fail: true }, { fail: false }].map(({ fail }) => ({
    request: {
      query: UPDATE_STAFF_RESERVATION,
      variables: {
        input: { ...MUTATION_DATA.input, pk: 101 },
        workingMemo: { ...MUTATION_DATA.workingMemo, pk: 101 },
      },
    },
    error: fail ? new Error("Error") : undefined,
    result: !fail
      ? {
          data: {
            staffReservationModify: { pk: 101, errors: null },
            updateReservationWorkingMemo: {
              workingMemo: CHANGED_WORKING_MEMO,
              errors: null,
            },
          },
        }
      : undefined,
  })),
  // networkError twice
  ...[1, 2].map(() => ({
    request: {
      query: UPDATE_STAFF_RESERVATION,
      variables: {
        input: { ...MUTATION_DATA.input, pk: 102 },
        workingMemo: { ...MUTATION_DATA.workingMemo, pk: 102 },
      },
    },
    error: new Error("Error"),
  })),
  // graphQLError
  {
    request: {
      query: UPDATE_STAFF_RESERVATION,
      variables: {
        input: { ...MUTATION_DATA.input, pk: 111 },
        workingMemo: { ...MUTATION_DATA.workingMemo, pk: 111 },
      },
    },
    result: {
      errors: [new GraphQLError("Error")],
    },
  },
  ...correctRecurringReservationQueryResult(21, 1),
  ...correctRecurringReservationQueryResult(31, 2, { shouldFailOnce: true }),
  ...correctRecurringReservationQueryResult(41, 3, { allDenied: true }),
  ...correctRecurringReservationQueryResult(51, 4, { shouldFailAll: true }),
];

export const mockReservation: ReservationType = {
  pk: 1,
  begin: "2024-01-01T10:00:00+00:00",
  end: "2024-01-01T14:00:00+00:00",
  id: "be4fa7a2-05b7-11ee-be56-0242ac120002",
  priority: ReservationsReservationPriorityChoices.A_200,
  state: ReservationsReservationStateChoices.Confirmed,
  workingMemo: "empty",
};

export const mockRecurringReservation: ReservationType = {
  ...mockReservation,
  pk: 21,
  recurringReservation: {
    pk: 1,
    id: "be4fa7a2-05b7-11ee-be56-0242ac120003",
    name: "recurring",
    description: "",
    created: "2021-09-01T10:00:00+00:00",
    reservationUnit: {
      pk: 1,
      id: "be4fa7a2-05b7-11ee-be56-0242ac120004",
      images: [],
      isArchived: false,
      isDraft: false,
      contactInformation: "",
      canApplyFreeOfCharge: false,
      maxPersons: 10,
      authentication: ReservationUnitsReservationUnitAuthenticationChoices.Weak,
      allowReservationsWithoutOpeningHours: true,
      requireReservationHandling: false,
      requireIntroduction: false,
      reservationKind:
        ReservationUnitsReservationUnitReservationKindChoices.DirectAndSeason,
      reservationStartInterval:
        ReservationUnitsReservationUnitReservationStartIntervalChoices.Interval_15Mins,
      uuid: "be4fa7a2-05b7-11ee-be56-0242ac120004",
    },
  },
};

export const NotificationMock = {
  notification: null,
  notifyError: () => {},
  notifySuccess: () => {},
  setNotification: () => {},
  clearNotification: () => {},
};
