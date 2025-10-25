import { useMemo } from "react";
import { type MetadataSetsFragment, ReserveeType } from "../../gql/gql-types";
import { filterNonNullable } from "../modules/helpers";
import { containsField } from "../modules/metaFieldsHelpers";
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
