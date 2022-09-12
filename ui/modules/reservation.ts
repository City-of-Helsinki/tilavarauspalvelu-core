import { isAfter } from "date-fns";
import camelCase from "lodash/camelCase";
import { convertHMSToSeconds, secondsToHms } from "common/src/common/util";
import { OptionType } from "common/types/common";
import { ReservationType } from "./gql-types";

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
    "name",
    "description",
    "purpose",
    "num_persons",
    "age_group",
    "reservee_first_name",
    "reservee_last_name",
    "reservee_address_street",
    "reservee_address_zip",
    "reservee_address_city",
    "reservee_email",
    "reservee_phone",
    "applying_for_free_of_charge",
    "free_of_charge_reason",
    "billing_first_name",
    "billing_last_name",
    "billing_phone",
    "billing_email",
    "billing_address_street",
    "billing_address_zip",
    "billing_address_city",
  ],
  nonprofit: [
    "name",
    "description",
    "purpose",
    "num_persons",
    "age_group",
    "reservee_first_name",
    "reservee_last_name",
    "reservee_address_street",
    "reservee_address_zip",
    "reservee_address_city",
    "reservee_email",
    "reservee_phone",
    "reservee_organisation_name",
    "reservee_id",
    "reservee_is_unregistered_association",
    "home_city",
    "applying_for_free_of_charge",
    "free_of_charge_reason",
    "billing_first_name",
    "billing_last_name",
    "billing_phone",
    "billing_email",
    "billing_address_street",
    "billing_address_zip",
    "billing_address_city",
  ],
  business: [
    "name",
    "description",
    "purpose",
    "num_persons",
    "age_group",
    "reservee_first_name",
    "reservee_last_name",
    "reservee_address_street",
    "reservee_address_zip",
    "reservee_address_city",
    "reservee_email",
    "reservee_phone",
    "reservee_organisation_name",
    "reservee_id",
    "home_city",
    "applying_for_free_of_charge",
    "free_of_charge_reason",
    "billing_first_name",
    "billing_last_name",
    "billing_phone",
    "billing_email",
    "billing_address_street",
    "billing_address_zip",
    "billing_address_city",
  ],
  common: ["reservee_type"],
};

export const getReservationApplicationFields = (
  supportedFields: string[],
  reserveeType: ReserveeType,
  camelCaseOutput = false
): string[] => {
  if (supportedFields.length === 0 || !reserveeType) return [];

  const fields = reservationApplicationFields[reserveeType].filter((field) =>
    supportedFields.includes(field)
  );

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
  reserveeType: ReserveeType
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

  fields.forEach((field: string) => {
    const key = changes.find((c) => c.field === field)?.mutationField || field;
    result[key as string] = intValues.includes(field)
      ? Number(payload[field])
      : payload[field];
  });

  return result;
};
