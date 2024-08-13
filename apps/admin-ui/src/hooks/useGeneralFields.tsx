import { useMemo } from "react";
import { MetadataSetsFragment } from "@gql/gql-types";
import { filterNonNullable } from "common/src/helpers";
import { getReservationApplicationFields } from "common/src/reservation-form/util";

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
