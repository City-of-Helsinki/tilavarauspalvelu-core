import { useMemo } from "react";
import { type MetadataSetsFragment } from "../../gql/gql-types";
import { filterNonNullable } from "../helpers";
import { getReservationApplicationFields } from "../reservation-form/util";

// TODO is the hook necessary?
export function useGeneralFields(reservationUnit: MetadataSetsFragment) {
  return useMemo(() => {
    const fields = filterNonNullable(
      reservationUnit.metadataSet?.supportedFields
    );
    return getReservationApplicationFields({
      supportedFields: fields,
      reserveeType: "common",
    }).filter((n) => n !== "reserveeType");
  }, [reservationUnit.metadataSet?.supportedFields]);
}
