import React, { useState } from "react";
import { gql, useQuery } from "@apollo/client";
import styled from "styled-components";
import { useTranslation } from "next-i18next";
import type { Query, QueryUserArgs } from "common/types/gql-types";
import { formatDate } from "@/common/util";
import { HorisontalFlex } from "@/styles/layout";
import { base64encode } from "common/src/helpers";

// NOTE separate query because all requests for dateOfBirth are logged
// so don't make them automatically or inside other queries
const RESERVATION_DATE_OF_BIRTH_QUERY = gql`
  query getReservationDateOfBirth($id: ID!) {
    reservation(id: $id) {
      user {
        pk
        dateOfBirth
      }
    }
  }
`;

const APPLICATION_DATE_OF_BIRTH_QUERY = gql`
  query getApplicationDateOfBirth($id: ID!) {
    application(id: $id) {
      user {
        pk
        dateOfBirth
      }
    }
  }
`;

const Button = styled.button`
  margin: 0;
  padding: 0;
  border: none;
  background: none;
  color: var(--color-bus);
  text-decoration: underline;
`;

type Props =
  | {
      reservationPk: number;
    }
  | {
      applicationPk: number;
    };

/// Component for toggling the visibility of the user's birth date
/// Queries through reservation or application because of permission checks (most users are not allowed query users api)
/// @param reservationPk - the pk of the reservation
/// @param applicationPk - the pk of the application
/// Only makes the query if the user clicks the show button to minimise logging
export function BirthDate(props: Props): JSX.Element {
  const [visible, setVisible] = useState(false);

  const reservationPk = "reservationPk" in props ? props.reservationPk : null;
  const applicationPk = "applicationPk" in props ? props.applicationPk : null;

  const {
    data: dataReservation,
    loading: isReservationLoading,
    error: errorReservation,
  } = useQuery<Query, QueryUserArgs>(RESERVATION_DATE_OF_BIRTH_QUERY, {
    variables: {
      id: base64encode(`ReservationNode:${reservationPk}`),
    },
    fetchPolicy: "no-cache",
    skip: !reservationPk || !visible,
  });

  const {
    data: dataApplication,
    loading: isApplicationLoading,
    error: errorApplication,
  } = useQuery<Query, QueryUserArgs>(APPLICATION_DATE_OF_BIRTH_QUERY, {
    variables: {
      id: base64encode(`ApplicationNode:${applicationPk}`),
    },
    fetchPolicy: "no-cache",
    skip: !applicationPk || !visible,
  });

  const { t } = useTranslation();

  const data = "reservationPk" in props ? dataReservation : dataApplication;
  const isLoading =
    "reservationPk" in props ? isReservationLoading : isApplicationLoading;
  const error = "reservationPk" in props ? errorReservation : errorApplication;

  const user = data?.reservation?.user || data?.application?.user;
  const dateOfBirth = user?.dateOfBirth;

  const hideLabel = t("RequestedReservation.hideBirthDate");
  const showLabel = t("RequestedReservation.showBirthDate");

  return (
    <HorisontalFlex style={{ gap: "var(--spacing-2-xs)" }}>
      {isLoading ? (
        <span>{t("common.loading")}</span>
      ) : error != null ? (
        <span>{t("common.error")}</span>
      ) : (
        <>
          {visible ? (
            <span>{dateOfBirth ? formatDate(dateOfBirth) : "-"}</span>
          ) : (
            <span>XX.XX.XXXX</span>
          )}
          <Button type="button" onClick={() => setVisible(!visible)}>
            {visible ? hideLabel : showLabel}
          </Button>
        </>
      )}
    </HorisontalFlex>
  );
}
