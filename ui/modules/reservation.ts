import { isAfter, isValid, subMinutes } from "date-fns";
import camelCase from "lodash/camelCase";
import { convertHMSToSeconds, secondsToHms } from "common/src/common/util";
import { ApplicationRound, OptionType } from "common/types/common";
import {
  ApplicationRoundType,
  ReservationsReservationReserveeTypeChoices,
  ReservationsReservationStateChoices,
  ReservationType,
  ReservationUnitByPkType,
} from "common/types/gql-types";
import {
  areSlotsReservable,
  doBuffersCollide,
  doReservationsCollide,
  isReservationLongEnough,
  isReservationShortEnough,
  isStartTimeWithinInterval,
} from "common/src/calendar/util";

export const getDurationOptions = (
  minReservationDuration: number,
  maxReservationDuration: number,
  step = "00:15:00"
): OptionType[] => {
  // const minMinutes = convertHMSToSeconds(minReservationDuration);
  // const maxMinutes = convertHMSToSeconds(maxReservationDuration);
  const durationStep = convertHMSToSeconds(step);

  if (!minReservationDuration || !maxReservationDuration || !durationStep)
    return [];

  const durationSteps = [];
  for (
    let i = minReservationDuration;
    i <= maxReservationDuration;
    i += durationStep
  ) {
    durationSteps.push(i);
  }
  const timeOptions = durationSteps.map((n) => {
    const hms = secondsToHms(n);
    const minute = String(hms.m).padEnd(2, "0");
    return {
      label: `${hms.h}:${minute}`,
      value: `${hms.h}:${minute}`,
    };
  });

  return timeOptions;
};

export const isReservationInThePast = (
  reservation: ReservationType
): boolean => {
  if (!reservation?.begin) return null;

  const now = new Date().setSeconds(0, 0);
  return !isAfter(new Date(reservation.begin).setSeconds(0, 0), now);
};

export const isReservationWithinCancellationPeriod = (
  reservation: ReservationType
): boolean => {
  const reservationUnit = reservation.reservationUnits?.[0];
  let now = new Date().getTime() / 1000;
  const begin = new Date(reservation.begin).getTime() / 1000;
  if (reservationUnit?.cancellationRule?.canBeCancelledTimeBefore)
    now += reservationUnit.cancellationRule.canBeCancelledTimeBefore;

  return now > begin;
};

export const canUserCancelReservation = (
  reservation: ReservationType,
  skipTimeCheck = false
): boolean => {
  const reservationUnit = reservation.reservationUnits?.[0];
  if (!reservationUnit?.cancellationRule) return false;
  if (reservationUnit?.cancellationRule?.needsHandling) return false;
  if (
    skipTimeCheck === false &&
    isReservationWithinCancellationPeriod(reservation)
  )
    return false;

  return true;
};

export type ReserveeType = "individual" | "nonprofit" | "business";

const reservationApplicationFields = {
  individual: [
    "reservee_first_name",
    "reservee_last_name",
    "reservee_address_street",
    "reservee_address_zip",
    "reservee_address_city",
    "reservee_email",
    "reservee_phone",
    "billing_first_name",
    "billing_last_name",
    "billing_phone",
    "billing_email",
    "billing_address_street",
    "billing_address_zip",
    "billing_address_city",
  ],
  nonprofit: [
    "reservee_organisation_name",
    "home_city",
    "reservee_is_unregistered_association",
    "reservee_id",
    "reservee_first_name",
    "reservee_last_name",
    "reservee_address_street",
    "reservee_address_zip",
    "reservee_address_city",
    "reservee_email",
    "reservee_phone",
    "billing_first_name",
    "billing_last_name",
    "billing_phone",
    "billing_email",
    "billing_address_street",
    "billing_address_zip",
    "billing_address_city",
  ],
  business: [
    "reservee_organisation_name",
    "home_city",
    "reservee_id",
    "reservee_first_name",
    "reservee_last_name",
    "reservee_address_street",
    "reservee_address_zip",
    "reservee_address_city",
    "reservee_email",
    "reservee_phone",
    "billing_first_name",
    "billing_last_name",
    "billing_phone",
    "billing_email",
    "billing_address_street",
    "billing_address_zip",
    "billing_address_city",
  ],
  common: [
    "reservee_type",
    "name",
    "purpose",
    "num_persons",
    "age_group",
    "description",
    "applying_for_free_of_charge",
    "free_of_charge_reason",
  ],
};

export const getReservationApplicationFields = (
  supportedFields: string[],
  reserveeType: ReservationsReservationReserveeTypeChoices | "common",
  camelCaseOutput = false
): string[] => {
  if (!supportedFields || supportedFields?.length === 0 || !reserveeType)
    return [];

  const fields = reservationApplicationFields[
    reserveeType.toLocaleLowerCase()
  ].filter((field) => supportedFields.includes(field));

  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < fields.length; i++) {
    if (fields[i].includes("billing_")) {
      fields.splice(i, 0, "show_billing_address");
      break;
    }
  }

  return camelCaseOutput ? fields.map(camelCase) : fields;
};

export const getReservationApplicationMutationValues = (
  payload: Record<string, string | number | boolean>,
  supportedFields: string[],
  reserveeType: ReservationsReservationReserveeTypeChoices
): Record<string, string | number | boolean> => {
  const result = { reserveeType };
  const intValues = ["numPersons"];
  const changes = [
    { field: "homeCity", mutationField: "homeCityPk" },
    { field: "ageGroup", mutationField: "ageGroupPk" },
    { field: "purpose", mutationField: "purposePk" },
  ];
  const fields = getReservationApplicationFields(
    supportedFields,
    reserveeType
  ).map(camelCase);

  const commonFields = getReservationApplicationFields(
    supportedFields,
    "common"
  ).map(camelCase);

  [...fields, ...commonFields].forEach((field: string) => {
    const key = changes.find((c) => c.field === field)?.mutationField || field;
    result[key as string] = intValues.includes(field)
      ? Number(payload[field])
      : payload[field];
  });

  result.reserveeType = reserveeType;

  return result;
};

export type ReservationCancellationReason =
  | "PAST"
  | "NO_CANCELLATION_RULE"
  | "REQUIRES_HANDLING"
  | "BUFFER";

export const getReservationCancellationReason = (
  reservation: ReservationType
): ReservationCancellationReason | null => {
  const reservationUnit = reservation.reservationUnits?.[0];

  if (!reservationUnit) return null;

  if (isReservationInThePast(reservation)) return "PAST";

  if (!reservationUnit.cancellationRule) {
    return "NO_CANCELLATION_RULE";
  }

  if (reservationUnit.cancellationRule?.needsHandling) {
    return "REQUIRES_HANDLING";
  }

  if (
    reservationUnit.cancellationRule?.canBeCancelledTimeBefore &&
    isReservationWithinCancellationPeriod(reservation)
  ) {
    return "BUFFER";
  }

  return null;
};

export const getNormalizedReservationOrderStatus = (
  reservation: ReservationType
): string | null => {
  if (!reservation) return null;

  const shouldShowOrderStatus = (state: ReservationsReservationStateChoices) =>
    !["CREATED", "WAITING_FOR_PAYMENT", "REQUIRES_HANDLING"].includes(state);

  if (shouldShowOrderStatus(reservation.state)) {
    return reservation.orderStatus || null;
  }

  return null;
};

export type IsReservationReservableProps = {
  reservationUnit: ReservationUnitByPkType;
  activeApplicationRounds: ApplicationRound[] | ApplicationRoundType[];
  start: Date;
  end: Date;
  skipLengthCheck;
};

export const isReservationReservable = (
  props: IsReservationReservableProps
): boolean => {
  const {
    reservationUnit,
    activeApplicationRounds,
    start,
    end,
    skipLengthCheck = false,
  } = props;

  const {
    reservations,
    bufferTimeBefore,
    bufferTimeAfter,
    openingHours,
    maxReservationDuration,
    minReservationDuration,
    reservationStartInterval,
    reservationsMinDaysBefore,
    reservationBegins,
    reservationEnds,
  } = reservationUnit;

  if (
    !isValid(start) ||
    !isValid(end) ||
    doBuffersCollide(reservations, {
      start,
      end,
      bufferTimeBefore,
      bufferTimeAfter,
    }) ||
    !isStartTimeWithinInterval(
      start,
      openingHours?.openingTimes,
      reservationStartInterval
    ) ||
    !areSlotsReservable(
      [new Date(start), subMinutes(new Date(end), 1)],
      openingHours?.openingTimes,
      activeApplicationRounds,
      reservationBegins ? new Date(reservationBegins) : undefined,
      reservationEnds ? new Date(reservationEnds) : undefined,
      reservationsMinDaysBefore
    ) ||
    (!skipLengthCheck &&
      !isReservationLongEnough(start, end, minReservationDuration)) ||
    !isReservationShortEnough(start, end, maxReservationDuration) ||
    doReservationsCollide(reservations, { start, end })
    // || !isSlotWithinTimeframe(start, reservationsMinDaysBefore, start, end)
  ) {
    return false;
  }

  return true;
};

export const isReservationConfirmed = (reservation: ReservationType): boolean =>
  reservation.state === "CONFIRMED";

export const isReservationFreeOfCharge = (
  reservation: ReservationType
): boolean => parseInt(String(reservation.price), 10) === 0;

export type CanReservationBeChangedProps = {
  reservation: ReservationType;
  newReservation?: ReservationType;
  reservationUnit?: ReservationUnitByPkType;
  activeApplicationRounds?: ApplicationRoundType[];
};

export const canReservationTimeBeChanged = (
  props: CanReservationBeChangedProps
): [boolean, string?] => {
  const {
    reservation,
    newReservation,
    reservationUnit,
    activeApplicationRounds,
  } = props;

  if (!reservation) return [false];

  // existing reservation state is not CONFIRMED
  if (!isReservationConfirmed(reservation)) {
    return [false, "RESERVATION_MODIFICATION_NOT_ALLOWED"];
  }

  // existing reservation begin time is in the future
  if (isReservationInThePast(reservation)) {
    return [false, "RESERVATION_BEGIN_IN_PAST"];
  }

  // existing reservation is free
  if (!isReservationFreeOfCharge(reservation)) {
    return [false, "CANCELLATION_NOT_ALLOWED"];
  }

  // existing reservation has valid cancellation rule that does not require handling
  if (!canUserCancelReservation(reservation, true)) {
    return [false, "CANCELLATION_NOT_ALLOWED"];
  }

  // existing reservation cancellation buffer is not exceeded
  if (!canUserCancelReservation(reservation)) {
    return [false, "CANCELLATION_TIME_PAST"];
  }

  // existing reservation has been handled
  if (reservation.handledAt) {
    return [false, "RESERVATION_MODIFICATION_NOT_ALLOWED"];
  }

  if (reservation && newReservation) {
    //  new reservation is free
    if (!isReservationFreeOfCharge(newReservation)) {
      return [false, "RESERVATION_MODIFICATION_NOT_ALLOWED"];
    }

    //  new reservation is valid
    if (
      !isReservationReservable({
        reservationUnit,
        activeApplicationRounds,
        start: Boolean(newReservation.begin) && new Date(newReservation.begin),
        end: Boolean(newReservation.end) && new Date(newReservation.end),
        skipLengthCheck: false,
      })
    ) {
      return [false, "RESERVATION_TIME_INVALID"];
    }
  }

  return [true];
};
