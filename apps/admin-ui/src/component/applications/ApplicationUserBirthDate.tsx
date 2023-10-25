import React from "react";
import { useQuery } from "@apollo/client";
import { Query, QueryReservationByPkArgs } from "common/types/gql-types";
import { BirthDate } from "../BirthDate";
import { GET_BIRTHDATE_BY_APPLICATION_PK } from "./queries";
import Loader from "../Loader";

type Props = {
  applicationPk?: number;
  showLabel: string;
  hideLabel: string;
};

const ApplicationUserBirthDate = ({
  applicationPk,
  showLabel,
  hideLabel,
}: Props): JSX.Element => {
  const { loading, data } = useQuery<Query, QueryReservationByPkArgs>(
    GET_BIRTHDATE_BY_APPLICATION_PK,
    {
      skip: !applicationPk,
      variables: {
        pk: applicationPk,
      },
    }
  );

  if (loading) {
    return <Loader />;
  }

  const applicant = data?.applications?.edges[0]?.node?.applicant;
  const birthDate = applicant?.dateOfBirth ?? undefined;

  return (
    <BirthDate
      dateOfBirth={birthDate}
      showLabel={showLabel}
      hideLabel={hideLabel}
    />
  );
};

export { ApplicationUserBirthDate };
