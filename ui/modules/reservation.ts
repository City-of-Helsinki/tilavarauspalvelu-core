import { isAfter } from "date-fns";
import camelCase from "lodash/camelCase";
import { convertHMSToSeconds, secondsToHms } from "common/src/common/util";
import { OptionType } from "common/types/common";
import {
  ReservationsReservationReserveeTypeChoices,
  ReservationType,
} from "./gql-types";

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

export const isReservationWithinCancellationPeriod = (
  reservation: ReservationType
): boolean => {
  const reservationUnit = reservation.reservationUnits?.[0];
  let now = new Date().getTime() / 1000;
  const begin = new Date(reservation.begin).getTime() / 1000;
  if (reservationUnit?.cancellationRule?.canBeCancelledTimeBefore)
    now += reservationUnit.cancellationRule.canBeCancelledTimeBefore;

  return isAfter(now, begin);
};

export const canUserCancelReservation = (
  reservation: ReservationType
): boolean => {
  const reservationUnit = reservation.reservationUnits?.[0];
  if (!reservationUnit?.cancellationRule) return false;
  if (reservationUnit?.cancellationRule?.needsHandling) return false;
  if (isReservationWithinCancellationPeriod(reservation)) return false;

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
