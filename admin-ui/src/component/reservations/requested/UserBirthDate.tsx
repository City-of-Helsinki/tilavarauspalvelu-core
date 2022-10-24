import React, { useState } from "react";
import { useQuery } from "@apollo/client";
import { LoadingSpinner } from "hds-react";
import { Query, QueryReservationByPkArgs } from "../../../common/gql-types";
import { GET_BIRTHDATE_BY_RESERVATION_PK } from "./queries";
import { HorisontalFlex } from "../../../styles/layout";
import { formatDate } from "../../../common/util";

type Props = {
  reservationPk: number;
  showLabel: string;
  hideLabel: string;
};

const UserBirthDate = ({
  reservationPk,
  showLabel,
  hideLabel,
}: Props): JSX.Element => {
  const [visible, setVisible] = useState(false);

  const { loading, data } = useQuery<Query, QueryReservationByPkArgs>(
    GET_BIRTHDATE_BY_RESERVATION_PK,
    {
      skip: !visible,
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
    <HorisontalFlex style={{ gap: "var(--spacing-2-xs)" }}>
      {data?.reservationByPk && visible ? (
        <span>{formatDate(data?.reservationByPk?.user?.dateOfBirth)}</span>
      ) : (
        <span>XX.XX.XXXX</span>
      )}
      <button
        style={{
          margin: 0,
          padding: 0,
          border: "none",
          background: "none",
          color: "var(--color-bus)",
          textDecoration: "underline",
        }}
        type="button"
        onClick={() => setVisible(!visible)}
      >
        {visible ? hideLabel : showLabel}
      </button>
    </HorisontalFlex>
  );
};

export default UserBirthDate;
