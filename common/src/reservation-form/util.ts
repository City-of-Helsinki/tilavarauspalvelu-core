import { camelCase, get } from "lodash";
import { ReservationsReservationReserveeTypeChoices } from "../../types/gql-types";
import { reservationApplicationFields } from "./types";

export const getReservationApplicationFields = ({
  supportedFields,
  reserveeType,
  camelCaseOutput = false,
}: {
  supportedFields: string[];
  reserveeType: ReservationsReservationReserveeTypeChoices | "common";
  camelCaseOutput?: boolean;
}): string[] => {
  if (!supportedFields || supportedFields?.length === 0 || !reserveeType)
    return [];

  const fields = get(
    reservationApplicationFields,
    reserveeType.toLocaleLowerCase()
  ).filter((field: string) => supportedFields.includes(field));

  for (let i = 0; i < fields.length; i += 1) {
    if (fields[i].includes("billing_")) {
      fields.splice(i, 0, "show_billing_address");
      break;
    }
  }

  return camelCaseOutput ? fields.map(camelCase) : fields;
};
