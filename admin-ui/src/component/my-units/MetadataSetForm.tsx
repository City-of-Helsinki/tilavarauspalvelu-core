import React, { useState } from "react";
import {
  ReservationsReservationReserveeTypeChoices,
  ReservationUnitType,
} from "common/types/gql-types";
import MetaFields from "common/src/reservation-form/MetaFields";
import {
  useApplicatioonFields,
  useGeneralFields,
  useOptions,
  useReservationTranslation,
} from "./hooks";

type Props = {
  reservationUnit: ReservationUnitType;
};

const MetadataSetForm = ({ reservationUnit }: Props): JSX.Element => {
  const [reserveeType, setReserveeType] = useState<
    ReservationsReservationReserveeTypeChoices | undefined
  >(undefined);
  const { t } = useReservationTranslation();

  const options = useOptions();

  const generalFields = useGeneralFields(reservationUnit);
  const reservationApplicationFields = useApplicatioonFields(
    reservationUnit,
    reserveeType
  );

  return (
    <MetaFields
      reservationUnit={reservationUnit}
      options={options}
      reserveeType={reserveeType}
      setReserveeType={setReserveeType}
      generalFields={generalFields}
      reservationApplicationFields={reservationApplicationFields}
      t={t}
    />
  );
};

export default MetadataSetForm;
