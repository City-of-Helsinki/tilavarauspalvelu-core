import React from "react";
import { useFormContext } from "react-hook-form";
import { Reservation } from "common/src/reservation-form/types";
import { ReservationUnitType } from "common/types/gql-types";
import {
  ReserverMetaFields,
  ReservationMetaFields,
} from "common/src/reservation-form/MetaFields";
import { useApplicationFields, useGeneralFields, useOptions } from "./hooks";

type Props = {
  reservationUnit: ReservationUnitType;
};

export const ReservationMetadataSetForm = ({
  reservationUnit,
}: Props): JSX.Element => {
  const options = useOptions();
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
export const ReserverMetadataSetForm = ({
  reservationUnit,
}: Props): JSX.Element => {
  const { watch } = useFormContext<Reservation>();

  const options = useOptions();

  // TODO naming: applicationFields = reserverFields (Varaajan tiedot)
  const reservationApplicationFields = useApplicationFields(
    reservationUnit,
    watch("reserveeType")
  );

  return (
    <ReserverMetaFields
      fields={reservationApplicationFields}
      reservationUnit={reservationUnit}
      options={options}
    />
  );
};
