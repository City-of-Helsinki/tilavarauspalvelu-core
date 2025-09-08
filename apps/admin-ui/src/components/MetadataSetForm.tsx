import React from "react";
import { useFormContext } from "react-hook-form";
import type { ReservationFormT } from "common/src/reservation-form/types";
import {
  ReservationFormFieldsDetailsSection,
  ReservationFormFieldsReserveeSection,
} from "common/src/reservation-form/MetaFields";
import { ReserveeType, type MetadataSetsFragment } from "@gql/gql-types";
import { useFilterOptions } from "@/hooks/useFilterOptions";
import { filterNonNullable } from "common/src/modules/helpers";
import { containsField } from "common/src/modules/metaFieldsHelpers";
import { getReservationFormFields } from "common/src/reservation-form/util";

type Props = {
  reservationUnit: MetadataSetsFragment;
};

export function ReservationMetadataSetForm({ reservationUnit }: Props): JSX.Element {
  const { ageGroups, reservationPurposes } = useFilterOptions();
  const options = {
    ageGroup: ageGroups,
    purpose: reservationPurposes,
  };

  const fields = filterNonNullable(reservationUnit.metadataSet?.supportedFields);
  const generalFields = getReservationFormFields({
    supportedFields: fields,
    reserveeType: "common",
  }).filter((n) => n !== "reserveeType");

  return (
    <ReservationFormFieldsDetailsSection
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
  const reserverFields = getReservationFormFields({
    supportedFields: fields,
    reserveeType: type,
  });

  return (
    <ReservationFormFieldsReserveeSection fields={reserverFields} reservationUnit={reservationUnit} options={options} />
  );
}
