import React from "react";
import { useFormContext } from "react-hook-form";
import type { ReservationFormT } from "common/src/reservation-form/types";
import {
  ReservationFormFieldsDetailsSection,
  ReservationFormFieldsReserveeSection,
} from "common/src/reservation-form/MetaFields";
import { ReserveeType, type MetadataSetsFragment } from "@gql/gql-types";
import { useFilterOptions } from "@/hooks/useFilterOptions";
import { type OptionsRecord } from "common";
import { getReservationFormFields, formContainsField } from "common/src/reservation-form/util";

type Props = {
  reservationUnit: MetadataSetsFragment;
};

export function ReservationMetadataSetForm({ reservationUnit }: Props): JSX.Element {
  const { ageGroups, reservationPurposes } = useFilterOptions();
  const options: Omit<OptionsRecord, "municipalities"> = {
    ageGroups,
    reservationPurposes,
  };

  const formType = reservationUnit.reservationForm;
  const generalFields = getReservationFormFields({
    formType,
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
  const options: Omit<OptionsRecord, "municipalities"> = {
    ageGroups,
    reservationPurposes,
  };

  const formType = reservationUnit.reservationForm;

  const reserveeType = watch("reserveeType");
  const type =
    reserveeType != null && formContainsField(formType, "reserveeType") ? reserveeType : ReserveeType.Individual;
  const reserverFields = getReservationFormFields({
    formType,
    reserveeType: type,
  });

  return (
    <ReservationFormFieldsReserveeSection fields={reserverFields} reservationUnit={reservationUnit} options={options} />
  );
}
