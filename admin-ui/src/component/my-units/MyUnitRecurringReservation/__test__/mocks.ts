import { getYear, nextMonday, set } from "date-fns";
import {
  ReservationUnitType,
  ReservationUnitsReservationUnitAuthenticationChoices,
  ReservationUnitsReservationUnitReservationKindChoices,
  ReservationUnitsReservationUnitReservationStartIntervalChoices,
} from "common/types/gql-types";
import { RESERVATION_UNIT_QUERY } from "../../hooks/queries";
import { CREATE_STAFF_RESERVATION } from "../../create-reservation/queries";
import {
  CREATE_RECURRING_RESERVATION,
  GET_RESERVATIONS_IN_INTERVAL,
} from "../queries";

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

export const units: ReservationUnitType[] = [
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
export const YEAR = getYear(new Date()) + 1;

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
export const mondayMorningReservations = Array.from(Array(12).keys()).map(
  (x) => {
    const firstMonday = nextMonday(new Date(YEAR, x, 1));
    const begin = set(firstMonday, { hours: 9, minutes: 0, milliseconds: 0 });
    const end = set(firstMonday, { hours: 12, minutes: 0, milliseconds: 0 });
    return {
      begin,
      end,
    };
  }
);

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

export const mocks = [
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
