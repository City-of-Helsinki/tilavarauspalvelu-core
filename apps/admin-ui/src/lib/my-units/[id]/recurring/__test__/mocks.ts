import { addDays, addHours, nextMonday, set } from "date-fns";
import {
  Authentication,
  ReservationStartInterval,
  TermsType,
  ReservationTypeChoice,
  CreateStaffReservationDocument,
  ReservationUnitDocument,
  type ReservationUnitQuery,
  CreateReservationSeriesDocument,
  type CreateStaffReservationFragment,
  CurrentUserDocument,
  type CurrentUserQuery,
  FilterOptionsDocument,
  type FilterOptionsQuery,
  TermsOfUseDocument,
  type TermsOfUseQuery,
  CalendarReservationFragment,
  AccessType,
  ReservationStateChoice,
  type ReservationsByReservationUnitQueryVariables,
  ReservationsByReservationUnitDocument,
  type ReservationsByReservationUnitQuery,
} from "@gql/gql-types";
import { base64encode } from "common/src/helpers";
import { RELATED_RESERVATION_STATES } from "common/src/const";
import { toApiDateUnsafe } from "common/src/common/util";

export function createReservationUnits(): CreateStaffReservationFragment[] {
  return [
    createReservationUnitFragment({ pk: 1, nameFi: "Unit" }),
    createReservationUnitFragment({ pk: 2, nameFi: "Absolute" }),
  ];
}

const emptyTerms = {
  id: "",
  textFi: "",
  nameFi: "",
  termsType: TermsType.PaymentTerms,
};

// TODO remove and use fakeTimers with doNotFake option
// requires refactoring the mocks to use constructors instead of static values
export const YEAR = 2024;

const supportedFields = [
  "reservee_type",
  "reservee_first_name",
  "reservee_last_name",
  "reservee_organisation_name",
  "reservee_phone",
  "reservee_email",
  "reservee_identifier",
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
  "municipality",
  "age_group",
  "applying_for_free_of_charge",
  "free_of_charge_reason",
  "name",
  "description",
  "num_persons",
  "purpose",
];

const requiredFields = [
  "reservee_first_name",
  "reservee_type",
  "reservee_email",
  "age_group",
  "name",
  "description",
  "num_persons",
  "purpose",
];

function createReservationUnitFragment({ pk, nameFi }: { pk: number; nameFi: string }): CreateStaffReservationFragment {
  return {
    authentication: Authentication.Weak,
    nameFi,
    pk,
    id: base64encode(`ReservationUnitNode:${pk}`),
    minPersons: null,
    maxPersons: null,
    bufferTimeBefore: 0,
    bufferTimeAfter: 0,
    reservationStartInterval: ReservationStartInterval.Interval_15Mins,
    pricingTerms: emptyTerms,
    paymentTerms: emptyTerms,
    cancellationTerms: emptyTerms,
    serviceSpecificTerms: emptyTerms,
    metadataSet: {
      id: "1",
      supportedFields: supportedFields.map((x) => ({
        fieldName: x,
        id: x,
      })),
      requiredFields: requiredFields.map((x) => ({
        fieldName: x,
        id: x,
      })),
    },
  };
}

// First monday off the month has reservation from 9:00 - 12:00
export const mondayMorningReservations = Array.from(Array(12).keys()).map((x) => {
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
const everydayReservations = Array.from(Array(365).keys()).reduce((agv: { begin: Date; end: Date }[], i) => {
  const begin = set(firstDay, {
    date: i,
    hours: 15,
    minutes: 0,
    milliseconds: 0,
  });
  const end = addHours(begin, 1);
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
}, []);

const reservationsByUnitResponse: CalendarReservationFragment[] = mondayMorningReservations
  .concat(everydayReservations)
  // backend returns days unsorted but our mondays are first
  // we could also randomize the array so blocking times are neither at the start nor the end
  .sort((x, y) => x.begin.getTime() - y.begin.getTime())
  .map((x) => ({
    __typename: "ReservationNode",
    id: base64encode(`ReservationNode:1`),
    beginsAt: x.begin.toUTCString(),
    endsAt: x.end.toUTCString(),
    bufferTimeBefore: 0,
    bufferTimeAfter: 0,
    accessType: AccessType.Unrestricted,
    name: "Test reservation",
    reserveeName: "Test reservee",
    pk: 1,
    state: ReservationStateChoice.Confirmed,
    user: null,
    type: ReservationTypeChoice.Normal,
    affectedReservationUnits: [],
    reservationSeries: null,
  }));

const AdminUserMock: CurrentUserQuery = {
  currentUser: {
    id: "UserNode:1",
    username: "test",
    firstName: "Test",
    lastName: "User",
    email: "test@foobar.com",
    isSuperuser: true,
    isAdAuthenticated: true,
    pk: 1,
    unitRoles: [],
    generalRoles: [],
  },
};

const OptionsMock: FilterOptionsQuery = {
  reservationPurposes: {
    edges: [],
  },
  ageGroups: {
    edges: [],
  },
  unitGroups: {
    edges: [],
  },
  reservationUnitTypes: {
    edges: [],
  },
  reservationUnitsAll: [],
  unitsAll: [],
};

const TermsOfUseMock: TermsOfUseQuery = {
  termsOfUse: {
    edges: [],
  },
};

const otherMocks = [
  {
    request: {
      query: FilterOptionsDocument,
    },
    result: {
      data: OptionsMock,
    },
  },
  {
    request: {
      query: TermsOfUseDocument,
      variables: {
        termsType: TermsType.GenericTerms,
      },
    },
    result: {
      data: TermsOfUseMock,
    },
  },
  {
    request: {
      query: CurrentUserDocument,
    },
    result: {
      data: AdminUserMock,
    },
  },
  {
    request: {
      query: ReservationUnitDocument,
      variables: { id: base64encode(`ReservationUnitNode:1`) },
    },
    result: {
      data: createReservationUnitResponse(),
    },
  },
  {
    request: {
      query: CreateStaffReservationDocument,
    },
    result: {
      data: {
        pk: 1,
      },
    },
  },
  {
    request: {
      query: CreateReservationSeriesDocument,
    },
    result: {
      data: {
        pk: 1,
      },
    },
  },
];

function createInIntervalQueryMock({ begin, end }: { begin: Date; end: Date }) {
  const beginDate = toApiDateUnsafe(begin);
  const endDate = toApiDateUnsafe(end);
  const variables: ReservationsByReservationUnitQueryVariables = {
    id: base64encode(`ReservationUnitNode:1`),
    pk: 1,
    beginDate,
    endDate,
    state: RELATED_RESERVATION_STATES,
  };
  return {
    request: {
      query: ReservationsByReservationUnitDocument,
      variables,
    },
    result: {
      data: createReservationsInIntervalResponse(),
    },
  };
}

// TODO parametrize the mock generation
export function createGraphQLMocks({ begin, end }: { begin: Date; end: Date }) {
  const now = new Date();
  return [
    createInIntervalQueryMock({ begin: now, end: addDays(Date.now(), 1) }),
    createInIntervalQueryMock({ begin, end }),
    // NOTE: Apollo mock provider is a stack so add as many results as there are fetches
    createInIntervalQueryMock({ begin, end: addDays(end, 1) }),
    createInIntervalQueryMock({ begin, end: addDays(end, 1) }),
    ...otherMocks,
  ];
}

function createReservationUnitResponse(): ReservationUnitQuery {
  return {
    reservationUnit: createReservationUnitFragment({
      pk: 1,
      nameFi: "Studiohuone 1 + soittimet",
    }),
  };
}

function createReservationsInIntervalResponse(): ReservationsByReservationUnitQuery {
  return {
    reservationUnit: {
      id: base64encode(`ReservationUnitNode:1`),
      reservations: reservationsByUnitResponse,
    },
    affectingReservations: reservationsByUnitResponse,
  };
}
