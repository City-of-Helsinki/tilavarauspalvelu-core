import React, { useState } from "react";
import { useQuery } from "@apollo/client";
import { LoadingSpinner } from "hds-react";
import { Query, QueryReservationByPkArgs } from "../../../common/gql-types";
import { GET_BIRTHDATE_BY_RESERVATION_PK } from "./queries";
import { BirthDate } from "../../BirthDate";

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
    return <LoadingSpinner />;
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
