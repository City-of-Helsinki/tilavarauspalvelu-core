import { useMemo } from "react";
import { ReserveeType } from "../../gql/gql-types";
import type { MetadataSetsFragment } from "../../gql/gql-types";
import { filterNonNullable } from "../helpers";
import { containsField } from "../metaFieldsHelpers";
import { getReservationApplicationFields } from "../reservation-form/util";

// TODO is the hook necessary?
export function useApplicationFields(reservationUnit: MetadataSetsFragment, reserveeType?: ReserveeType) {
  return useMemo(() => {
    const fields = filterNonNullable(reservationUnit.metadataSet?.supportedFields);

    const type = reserveeType != null && containsField(fields, "reserveeType") ? reserveeType : ReserveeType.Individual;

    return getReservationApplicationFields({
      supportedFields: fields,
      reserveeType: type,
    });
  }, [reservationUnit.metadataSet?.supportedFields, reserveeType]);
}
