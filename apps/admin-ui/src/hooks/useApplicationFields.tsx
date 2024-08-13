import { useMemo } from "react";
import { CustomerTypeChoice, MetadataSetsFragment } from "@gql/gql-types";
import { filterNonNullable } from "common/src/helpers";
import { containsField } from "common/src/metaFieldsHelpers";
import { getReservationApplicationFields } from "common/src/reservation-form/util";

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
