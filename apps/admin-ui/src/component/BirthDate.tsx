import React, { useState } from "react";
import { gql } from "@apollo/client";
import styled from "styled-components";
import { useTranslation } from "next-i18next";
import { useReservationDateOfBirthQuery, useApplicationDateOfBirthQuery } from "@gql/gql-types";
import { formatDate } from "@/common/util";
import { Flex } from "common/styled";
import { createNodeId, getNode } from "common/src/helpers";

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

/// Component for toggling the visibility of the user's birthdate
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
  } = useReservationDateOfBirthQuery({
    variables: {
      id: createNodeId("ReservationNode", reservationPk ?? 0),
    },
    fetchPolicy: "no-cache",
    skip: !reservationPk || !visible,
  });

  const {
    data: dataApplication,
    loading: isApplicationLoading,
    error: errorApplication,
  } = useApplicationDateOfBirthQuery({
    variables: {
      id: createNodeId("ApplicationNode", applicationPk ?? 0),
    },
    fetchPolicy: "no-cache",
    skip: !applicationPk || !visible,
  });

  const { t } = useTranslation();

  const data = "reservationPk" in props ? dataReservation : dataApplication;
  const isLoading = "reservationPk" in props ? isReservationLoading : isApplicationLoading;
  const error = "reservationPk" in props ? errorReservation : errorApplication;

  const node = getNode(data);
  const dateOfBirth = node?.user?.dateOfBirth;

  const hideLabel = t("reservation:hideBirthDate");
  const showLabel = t("reservation:showBirthDate");

  return (
    <Flex $gap="2-xs" $direction="row">
      {isLoading ? (
        <span>{t("common:loading")}</span>
      ) : error != null ? (
        <span>{t("common:error")}</span>
      ) : (
        <>
          {visible ? <span>{dateOfBirth ? formatDate(dateOfBirth) : "-"}</span> : <span>XX.XX.XXXX</span>}
          <Button type="button" onClick={() => setVisible(!visible)}>
            {visible ? hideLabel : showLabel}
          </Button>
        </>
      )}
    </Flex>
  );
}

// NOTE separate query because all requests for dateOfBirth are logged
// so don't make them automatically or inside other queries
export const APPLICATION_DATE_OF_BIRTH_QUERY = gql`
  query ApplicationDateOfBirth($id: ID!) {
    node(id: $id) {
      ... on ApplicationNode {
        id
        user {
          id
          pk
          dateOfBirth
        }
      }
    }
  }
`;
