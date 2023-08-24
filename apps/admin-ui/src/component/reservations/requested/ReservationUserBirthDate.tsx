import React, { useState } from "react";
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
  const [loaded, setLoaded] = useState(false);

  const { loading, data } = useQuery<Query, QueryReservationByPkArgs>(
    GET_BIRTHDATE_BY_RESERVATION_PK,
    {
      skip: !loaded,
      fetchPolicy: "no-cache",
      variables: {
        pk: reservationPk,
      },
    }
  );

  if (loading) {
    return <Loader />;
  }

  return (
    <BirthDate
      user={data?.reservationByPk?.user || null}
      showLabel={showLabel}
      hideLabel={hideLabel}
      onShow={() => setLoaded(true)}
    />
  );
};

export default ReservationUserBirthDate;
