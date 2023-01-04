import React, { useMemo, useState } from "react";
import { UseFormReturn, useForm } from "react-hook-form";
import {
  Query,
  ReservationsReservationReserveeTypeChoices,
  ReservationUnitType,
} from "common/types/gql-types";
import { useQuery } from "@apollo/client";
import { sortBy } from "lodash";
import { getReservationApplicationFields } from "common/src/reservation-form/util";
import { OPTIONS_QUERY } from "./queries";
import { ReservationFormType } from "./types";
import ReservationForm from "./ReservationForm";

type Props = {
  form: UseFormReturn<ReservationFormType>;
  reservationUnit: ReservationUnitType;
};

const MetadataSetForm = ({ form, reservationUnit }: Props): JSX.Element => {
  const [reserveeType, setReserveeType] = useState<
    ReservationsReservationReserveeTypeChoices | undefined
  >(undefined);

  const { data: optionsData } = useQuery<Query>(OPTIONS_QUERY);

  const purpose = sortBy(optionsData?.purposes?.edges || [], "node.nameFi").map(
    (purposeType) => ({
      label: purposeType?.node?.nameFi as string,
      value: purposeType?.node?.pk as number,
    })
  );

  const ageGroup = sortBy(
    optionsData?.ageGroups?.edges || [],
    "node.minimum"
  ).map((group) => ({
    label: `${group?.node?.minimum}-${group?.node?.maximum || ""}`,
    value: group?.node?.pk as number,
  }));

  const homeCity = sortBy(optionsData?.cities?.edges || [], "node.nameFi").map(
    (cityType) => ({
      label: cityType?.node?.nameFi as string,
      value: cityType?.node?.pk as number,
    })
  );

  const options = { ageGroup, purpose, homeCity };

  const reserveeTypeString =
    reserveeType || ReservationsReservationReserveeTypeChoices.Individual;

  const reservationApplicationFields = useMemo(() => {
    const type = reservationUnit.metadataSet?.supportedFields?.includes(
      "reservee_type"
    )
      ? reserveeTypeString
      : ReservationsReservationReserveeTypeChoices.Individual;

    return getReservationApplicationFields({
      supportedFields: (reservationUnit.metadataSet?.supportedFields ||
        []) as string[],
      reserveeType: type,
      camelCaseOutput: true,
    });
  }, [reservationUnit.metadataSet?.supportedFields, reserveeTypeString]);

  const generalFields = useMemo(() => {
    return getReservationApplicationFields({
      supportedFields: (reservationUnit.metadataSet?.supportedFields ||
        []) as string[],
      reserveeType: "common",
      camelCaseOutput: true,
    }).filter((n) => n !== "reserveeType");
  }, [reservationUnit]);

  return (
    <ReservationForm
      form={form as unknown as ReturnType<typeof useForm>}
      reservationUnit={reservationUnit}
      options={options}
      reserveeType={reserveeType}
      setReserveeType={setReserveeType}
      generalFields={generalFields}
      reservationApplicationFields={reservationApplicationFields}
      reservation={form.getValues()}
    />
  );
};

export default MetadataSetForm;
