import React, { useState } from "react";
import { gql, useQuery } from "@apollo/client";
import styled from "styled-components";
import { useTranslation } from "next-i18next";
import type { Query, QueryUserArgs } from "common/types/gql-types";
import { formatDate } from "@/common/util";
import { HorisontalFlex } from "@/styles/layout";

type Props = {
  userPk: number;
};

// NOTE separate query because all requests for dateOfBirth are logged
// so don't make them automatically or inside other queries
const DATE_OF_BIRTH_QUERY = gql`
  query getDateOfBirth($pk: Int!) {
    user(pk: $pk) {
      pk
      dateOfBirth
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

/// Component for toggling the visibility of the user's birth date
/// @param userPk - pk of the user
/// Only makes the query if the user clicks the show button to minimise logging
export function BirthDate({ userPk }: Props): JSX.Element {
  const [visible, setVisible] = useState(false);

  const {
    data,
    loading: isLoading,
    error,
  } = useQuery<Query, QueryUserArgs>(DATE_OF_BIRTH_QUERY, {
    variables: {
      pk: userPk,
    },
    fetchPolicy: "network-only",
    skip: !userPk || !visible,
  });

  const { t } = useTranslation();

  const dateOfBirth = data?.user?.dateOfBirth;

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
