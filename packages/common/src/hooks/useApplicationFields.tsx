import { useMemo } from "react";
import {
  CustomerTypeChoice,
  type MetadataSetsFragment,
} from "../../gql/gql-types";
import { filterNonNullable } from "../helpers";
import { containsField } from "../metaFieldsHelpers";
import { getReservationApplicationFields } from "../reservation-form/util";

// TODO is the hook necessary?
export function useApplicationFields(
  reservationUnit: MetadataSetsFragment,
  reserveeType?: CustomerTypeChoice
) {
  return useMemo(() => {
    const fields = filterNonNullable(
      reservationUnit.metadataSet?.supportedFields
    );

    const type =
      reserveeType != null && containsField(fields, "reserveeType")
        ? reserveeType
        : CustomerTypeChoice.Individual;

    return getReservationApplicationFields({
      supportedFields: fields,
      reserveeType: type,
    });
  }, [reservationUnit.metadataSet?.supportedFields, reserveeType]);
}
