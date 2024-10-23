import { GraphQLError } from "graphql";
import { addDays, addHours, startOfDay } from "date-fns";
import {
  ReservationStateChoice,
  UpdateStaffReservationDocument,
  RecurringReservationDocument,
  UpdateRecurringReservationDocument,
  ReservationTypeChoice,
  CustomerTypeChoice,
  type RecurringReservationQuery,
  ReservationQuery,
} from "@gql/gql-types";
import { base64encode } from "common/src/helpers";
import { toApiDateUnsafe } from "common/src/common/util";

export const CHANGED_WORKING_MEMO = "Sisaisen kommentti";

export const MUTATION_DATA = {
  input: {
    pk: 1,
    reservationUnitPks: [1],
    type: ReservationTypeChoice.Behalf,
    reservationBlockWholeDay: false,
    bufferTimeBefore: 0,
    bufferTimeAfter: 0,
    reserveeType: CustomerTypeChoice.Business,
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

function getValidInterval(daysToAdd: number) {
  const now = new Date();
  const begin = addHours(addDays(startOfDay(now), daysToAdd + 1), 6);
  return [begin.toISOString(), addHours(begin, 1).toISOString()];
}

function createReservationEdge({
  startingPk,
  recurringPk,
  state = ReservationStateChoice.Confirmed,
}: {
  startingPk: number;
  recurringPk: number;
  state?: ReservationStateChoice;
}): NonNullable<
  RecurringReservationQuery["recurringReservation"]
>["reservations"] {
  const params = {
    bufferTimeAfter: 0,
    bufferTimeBefore: 0,
    paymentOrder: [],
    reservationUnits: [],
    recurringReservation: {
      id: base64encode(`RecurringReservationNode:${recurringPk}`),
      pk: recurringPk,
    },
    state,
  };

  const begin1 = getValidInterval(0)[0];
  const end1 = getValidInterval(0)[1];
  const begin2 = getValidInterval(7)[0];
  const end2 = getValidInterval(7)[1];
  if (begin1 == null || end1 == null || begin2 == null || end2 == null) {
    throw new Error("Invalid dates");
  }
  return [
    {
      ...params,
      begin: begin1,
      end: end1,
      pk: startingPk,
      id: base64encode(`ReservationNode:${startingPk}`),
    },
    {
      ...params,
      begin: begin2,
      end: end2,
      pk: startingPk + 1,
      id: base64encode(`ReservationNode:${startingPk + 1}`),
    },
  ];
}

function convertDate(str: string) {
  const date = new Date(str);
  return toApiDateUnsafe(date);
}

function correctRecurringReservationQueryResult(
  startingPk: number,
  recurringPk: number,
  options?: {
    shouldFailAll?: boolean;
    shouldFailOnce?: boolean;
    allDenied?: boolean;
  }
) {
  const reservations = createReservationEdge({
    startingPk,
    recurringPk,
  });
  const recurringReservation: NonNullable<
    RecurringReservationQuery["recurringReservation"]
  > = {
    id: base64encode(`RecurringReservationNode:${recurringPk}`),
    pk: recurringPk,
    // TODO this should not be empty
    weekdays: [],
    // TODO refactor the magic numbers out
    beginDate: convertDate(getValidInterval(0)[0]),
    endDate: convertDate(getValidInterval(7)[1]),
    reservations,
    rejectedOccurrences: [],
  };

  return [
    {
      request: {
        query: RecurringReservationDocument,
        variables: {
          id: base64encode(`RecurringReservationNode:${recurringPk}`),
        },
      },
      result: {
        data: {
          recurringReservation,
        },
      },
    },
    {
      request: {
        query: UpdateRecurringReservationDocument,
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
        query: UpdateStaffReservationDocument,
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
        query: UpdateStaffReservationDocument,
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
}

export function createMocks() {
  return [
    // single reservation success
    {
      request: {
        query: UpdateStaffReservationDocument,
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
        query: UpdateStaffReservationDocument,
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
        query: UpdateStaffReservationDocument,
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
        query: UpdateStaffReservationDocument,
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
}

type ReservationType = NonNullable<ReservationQuery["reservation"]>;
export const mockReservation: ReservationType = {
  pk: 1,
  begin: "2024-01-01T10:00:00+00:00",
  end: "2024-01-01T14:00:00+00:00",
  bufferTimeAfter: 0,
  bufferTimeBefore: 0,
  state: ReservationStateChoice.Confirmed,
  id: base64encode("ReservationNode:1"),
  reservationUnits: [],
  paymentOrder: [],
  workingMemo: "empty",
  handlingDetails: "",
};

export function createMockRecurringReservation(props: {
  pk: number;
  recurringPk: number;
}): ReservationType {
  return {
    ...mockReservation,
    pk: props.pk,
    id: base64encode(`ReservationNode:${props.pk}`),
    recurringReservation: {
      pk: props.recurringPk,
      description: "",
      id: base64encode(`RecurringReservationNode:${props.recurringPk}`),
      name: "recurring",
    },
  };
}
