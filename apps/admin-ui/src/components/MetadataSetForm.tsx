import React from "react";
import { useFormContext } from "react-hook-form";
import type { ReservationFormT } from "common/src/reservation-form/types";
import { ReservationFormGeneralSection, ReservationFormReserveeSection } from "common/src/reservation-form/MetaFields";
import { ReserveeType, type MetadataSetsFragment } from "@gql/gql-types";
import { useFilterOptions } from "@/hooks/useFilterOptions";
import { formContainsField, getReservationFormFields } from "common/src/reservation-form/util";

type Props = {
  reservationUnit: MetadataSetsFragment;
};

export function ReservationMetadataSetForm({ reservationUnit }: Props): JSX.Element {
  const { ageGroups, reservationPurposes } = useFilterOptions();
  const options = {
    ageGroup: ageGroups,
    purpose: reservationPurposes,
  };

  const fields = getReservationFormFields({
    formType: reservationUnit.reservationForm,
    reserveeType: "common",
  }).filter((n) => n !== "reserveeType");

  return <ReservationFormGeneralSection fields={fields} reservationUnit={reservationUnit} options={options} />;
}

// TODO this component can be wholly deprecated maybe? translations / options?
export function ReserverMetadataSetForm({ reservationUnit }: Props): JSX.Element {
  const { watch } = useFormContext<ReservationFormT>();
  const { ageGroups, reservationPurposes } = useFilterOptions();
  const options = {
    ageGroup: ageGroups,
    purpose: reservationPurposes,
  };

  const formType = reservationUnit.reservationForm;

  const reserveeType = watch("reserveeType");
  const type =
    reserveeType != null && formContainsField(formType, "reserveeType") ? reserveeType : ReserveeType.Individual;
  const fields = getReservationFormFields({
    formType,
    reserveeType: type,
  });

  return <ReservationFormReserveeSection fields={fields} reservationUnit={reservationUnit} options={options} />;
}
