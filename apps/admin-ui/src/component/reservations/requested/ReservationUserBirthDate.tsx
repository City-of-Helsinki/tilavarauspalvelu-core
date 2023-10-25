import React from "react";
import { useQuery } from "@apollo/client";
import { Query, QueryReservationByPkArgs } from "common/types/gql-types";
import { GET_BIRTHDATE_BY_RESERVATION_PK } from "./queries";
import { BirthDate } from "../../BirthDate";
import Loader from "../../Loader";

type Props = {
  reservationPk?: number;
  showLabel: string;
  hideLabel: string;
};

const ReservationUserBirthDate = ({
  reservationPk,
  showLabel,
  hideLabel,
}: Props): JSX.Element => {
  const { loading, data } = useQuery<Query, QueryReservationByPkArgs>(
    GET_BIRTHDATE_BY_RESERVATION_PK,
    {
      skip: !reservationPk,
      variables: {
        pk: reservationPk,
      },
    }
  );

  if (loading) {
    return <Loader />;
  }

  const user = data?.reservationByPk?.user;
  const dateOfBirth = user?.dateOfBirth ?? undefined;
  return (
    <BirthDate
      dateOfBirth={dateOfBirth}
      showLabel={showLabel}
      hideLabel={hideLabel}
    />
  );
};

export default ReservationUserBirthDate;
