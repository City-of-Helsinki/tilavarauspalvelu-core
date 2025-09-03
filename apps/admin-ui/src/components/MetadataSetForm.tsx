import React from "react";
import { useFormContext } from "react-hook-form";
import type { ReservationFormT } from "common/src/reservation-form/types";
import { ReserverMetaFields, ReservationMetaFields } from "common/src/reservation-form/MetaFields";
import { ReserveeType, type MetadataSetsFragment } from "@gql/gql-types";
import { useFilterOptions } from "@/hooks/useFilterOptions";
import { filterNonNullable } from "common/src/modules/helpers";
import { getReservationApplicationFields } from "common/src/reservation-form/util";
import { containsField } from "common/src/modules/metaFieldsHelpers";

type Props = {
  reservationUnit: MetadataSetsFragment;
};

export function ReservationMetadataSetForm({ reservationUnit }: Props): JSX.Element {
  const { ageGroups, reservationPurposes } = useFilterOptions();
  const options = {
    ageGroup: ageGroups,
    purpose: reservationPurposes,
  };

  // TODO naming: generalFields = reservationFields (Varauksen tiedot)
  // or maybe metadataReservationFields?
  const fields = filterNonNullable(reservationUnit.metadataSet?.supportedFields);
  const generalFields = getReservationApplicationFields({
    supportedFields: fields,
    reserveeType: "common",
  }).filter((n) => n !== "reserveeType");

  return (
    <ReservationMetaFields
      fields={generalFields}
      reservationUnit={reservationUnit}
      options={options}
      noHeadingMarginal
    />
  );
}

// TODO this component can be wholly deprecated maybe? translations / options?
export function ReserverMetadataSetForm({ reservationUnit }: Props): JSX.Element {
  const { watch } = useFormContext<ReservationFormT>();
  const { ageGroups, reservationPurposes } = useFilterOptions();
  const options = {
    ageGroup: ageGroups,
    purpose: reservationPurposes,
  };

  const fields = filterNonNullable(reservationUnit.metadataSet?.supportedFields);

  const reserveeType = watch("reserveeType");
  const type = reserveeType != null && containsField(fields, "reserveeType") ? reserveeType : ReserveeType.Individual;
  // TODO naming: applicationFields = reserverFields (Varaajan tiedot)
  const reservationApplicationFields = getReservationApplicationFields({
    supportedFields: fields,
    reserveeType: type,
  });

  return (
    <ReserverMetaFields fields={reservationApplicationFields} reservationUnit={reservationUnit} options={options} />
  );
}
