import React from "react";
import { useFormContext } from "react-hook-form";
import type { Reservation } from "common/src/reservation-form/types";
import { ReserverMetaFields, ReservationMetaFields } from "common/src/reservation-form/MetaFields";
import { useGeneralFields, useApplicationFields } from "common/src/hooks";
import { type MetadataSetsFragment } from "@gql/gql-types";
import { useFilterOptions } from "@/hooks/useFilterOptions";
import { type OptionsRecord } from "common";

type Props = {
  reservationUnit: MetadataSetsFragment;
};

export const ReservationMetadataSetForm = ({ reservationUnit }: Props): JSX.Element => {
  const { ageGroups, purposes } = useFilterOptions();
  const options: Omit<OptionsRecord, "municipalities"> = {
    ageGroups,
    reservationPurposes: purposes,
  };

  // TODO naming: generalFields = reservationFields (Varauksen tiedot)
  // or maybe metadataReservationFields?
  const generalFields = useGeneralFields(reservationUnit);

  return (
    <ReservationMetaFields
      fields={generalFields}
      reservationUnit={reservationUnit}
      options={options}
      noHeadingMarginal
    />
  );
};

// TODO this component can be wholly deprecated maybe? translations / options?
export const ReserverMetadataSetForm = ({ reservationUnit }: Props): JSX.Element => {
  const { watch } = useFormContext<Reservation>();
  const { ageGroups, purposes } = useFilterOptions();
  const options: Omit<OptionsRecord, "municipalities"> = {
    ageGroups,
    reservationPurposes: purposes,
  };

  // TODO naming: applicationFields = reserverFields (Varaajan tiedot)
  const reservationApplicationFields = useApplicationFields(reservationUnit, watch("reserveeType"));

  return (
    <ReserverMetaFields fields={reservationApplicationFields} reservationUnit={reservationUnit} options={options} />
  );
};
