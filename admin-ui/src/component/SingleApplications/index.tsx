import React, { useState } from "react";
import { useQuery } from "@apollo/client";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import {
  Query,
  QueryReservationsArgs,
  ReservationType,
} from "../../common/gql-types";
import { RESERVATIONS_QUERY } from "../../common/queries";
import { useNotification } from "../../context/NotificationContext";
import Loader from "../Loader";
import withMainMenu from "../withMainMenu";
import SingleApplicationCard from "./SingleApplicationCard";
import KorosHeading, { Heading, SubHeading } from "../KorosHeading";

const Insight = ({
  count,
  label,
}: {
  count: number | string;
  label: string;
}): JSX.Element => (
  <div style={{ textAlign: "center" }}>
    <Heading>{count}</Heading>
    <SubHeading>{label}</SubHeading>
  </div>
);

const Insights = styled.div`
  display: grid;
  width: 100%;
  grid-template-columns: 1fr 1fr 1fr;
  justify-items: center;
`;

const SingleApplicationsView = (): JSX.Element => {
  const [loadedReservations, setReservations] = useState<ReservationType[]>([]);
  const { notifyError } = useNotification();
  const { t } = useTranslation();

  const { loading } = useQuery<Query, QueryReservationsArgs>(
    RESERVATIONS_QUERY,
    {
      variables: { handlingRequired: true },
      fetchPolicy: "network-only",
      onCompleted: ({ reservations }) => {
        if (reservations) {
          setReservations(
            reservations.edges.map((e) => e?.node as ReservationType)
          );
        }
      },
      onError: () => {
        notifyError("errors.errorFetchingData");
      },
    }
  );

  if (loading) {
    return <Loader />;
  }

  const numApplications = 357;
  const numUnhandledApplications = 2;
  const numHandledMonthlyApplications = 12;

  return (
    <>
      <KorosHeading>
        <Insights>
          <Insight
            count={`${numUnhandledApplications} kpl`}
            label={t("SingleApplications.insightCountHandledApplications")}
          />
          <Insight
            count={`${numHandledMonthlyApplications} kpl`}
            label={t(
              "SingleApplications.insightCountMonthlyHandledApplications"
            )}
          />
          <Insight
            count={numApplications}
            label={t("SingleApplications.insightCountTotalApplications")}
          />
        </Insights>
      </KorosHeading>
      <h1>Loaded {loadedReservations.length} reservations</h1>
      {loadedReservations.map((reservation) => (
        <SingleApplicationCard key={reservation.pk} reservation={reservation} />
      ))}
    </>
  );
};

export const SingleApplications = withMainMenu(SingleApplicationsView);
