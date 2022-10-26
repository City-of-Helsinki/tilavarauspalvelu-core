import React, { useState } from "react";
import { useQuery } from "@apollo/client";
import { LoadingSpinner } from "hds-react";
import { Query, QueryReservationByPkArgs } from "../../common/gql-types";
import { BirthDate } from "../BirthDate";
import { GET_BIRTHDATE_BY_APPLICATION_PK } from "./queries";

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
  const [loaded, setLoaded] = useState(false);

  const { loading, data } = useQuery<Query, QueryReservationByPkArgs>(
    GET_BIRTHDATE_BY_APPLICATION_PK,
    {
      skip: !loaded,
      fetchPolicy: "no-cache",
      variables: {
        pk: applicationPk,
      },
    }
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <BirthDate
      user={data?.applications?.edges[0]?.node?.applicantUser || null}
      showLabel={showLabel}
      hideLabel={hideLabel}
      onShow={() => setLoaded(true)}
    />
  );
};

export default ApplicationUserBirthDate;
