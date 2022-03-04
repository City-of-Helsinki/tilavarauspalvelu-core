import React, { useState } from "react";
import { useQuery } from "@apollo/client";
import { IconArrowRight, IconCalendarClock, IconLocation } from "hds-react";
import { TFunction, useTranslation } from "react-i18next";
import styled from "styled-components";
import {
  Query,
  QueryReservationsArgs,
  ReservationsReservationStateChoices,
  ReservationType,
} from "../../../common/gql-types";
import { RESERVATIONS_QUERY } from "../../../common/queries";
import { useNotification } from "../../../context/NotificationContext";
import DataTable, { CellConfig } from "../../DataTable";
import KorosHeading, { Heading, SubHeading } from "../../KorosHeading";
import Loader from "../../Loader";
import withMainMenu from "../../withMainMenu";
import { reservationDateTime } from "./util";
import { useData } from "../../../context/DataContext";

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

const StyledDataTable = styled(DataTable)`
  tbody > tr {
    background: var(--color-silver-light);
  }
  tbody td {
    border: none !important;
    padding: 1em;
  }
`;

const RedDot = styled.div`
  border-radius: 50%;
  background-color: red;
  width: 1em;
  height: 1em;
  margin-right: 0.5em;
`;

const AlignVertically = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
`;

const getCellConfig = (t: TFunction): CellConfig => {
  return {
    cols: [
      {
        title: t("RequestedReservations.heading.unit"),
        key: "nameFi",
        transform: ({ reservationUnits, begin, end }: ReservationType) => (
          <>
            <div
              style={{ fontSize: "var(--fontsize-heading-s)", fontWeight: 600 }}
            >
              {reservationUnits?.map((ru) => ru?.nameFi).join(", ")}
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "2em 1fr",
                alignItems: "center",
              }}
            >
              <IconLocation />
              <div>
                {reservationUnits?.map((ru) => ru?.unit?.nameFi).join(", ")}
              </div>
              <IconCalendarClock />
              <div>{reservationDateTime(begin, end, t)}</div>
            </div>
          </>
        ),
      },
      {
        title: t("RequestedReservations.heading.applicant"),
        key: "lastName",
        transform: ({
          reserveeFirstName,
          reserveeLastName,
          reserveeEmail,
        }: ReservationType) => (
          <>
            <div>
              {reserveeFirstName} {reserveeLastName}
            </div>
            <div>{reserveeEmail}</div>
          </>
        ),
      },
      {
        title: t("RequestedReservations.heading.name"),
        key: "name",
      },
      {
        title: t("RequestedReservations.heading.price"),
        key: "price",
        transform: ({ price }: ReservationType) => <div>{price || "-"}</div>,
      },
      {
        title: t("RequestedReservations.heading.state"),
        key: "state",
        transform: ({ state }: ReservationType) => (
          <AlignVertically>
            <AlignVertically>
              {state ===
              ReservationsReservationStateChoices.RequiresHandling ? (
                <RedDot />
              ) : (
                <span />
              )}
              <div>{t(`RequestedReservation.state.${state}`)}</div>
            </AlignVertically>
            <IconArrowRight size="m" style={{ marginLeft: "1em" }} />
          </AlignVertically>
        ),
      },
    ],
    index: "pk",
    sorting: "name",
    order: "asc",
    rowLink: ({ pk }: ReservationType) => `/reservations/requested/${pk}`,
  };
};

const RequestedReservationsView = (): JSX.Element => {
  const [loadedReservations, setReservations] = useState<ReservationType[]>([]);
  const { notifyError } = useNotification();
  const { t } = useTranslation();
  const [cellConfig] = useState<CellConfig>(getCellConfig(t));

  const { handlingCount } = useData();

  const { loading } = useQuery<Query, QueryReservationsArgs>(
    RESERVATIONS_QUERY,
    {
      variables: {
        requested: true,
      },
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
  const numHandledMonthlyApplications = 12;

  return (
    <>
      <KorosHeading>
        <Insights>
          <Insight
            count={`${handlingCount} kpl`}
            label={t("RequestedReservations.insightCountHandledApplications", {
              count: handlingCount,
            })}
          />
          <Insight
            count={`${numHandledMonthlyApplications} kpl`}
            label={t(
              "RequestedReservations.insightCountMonthlyHandledApplications"
            )}
          />
          <Insight
            count={numApplications}
            label={t("RequestedReservations.insightCountTotalApplications")}
          />
        </Insights>
      </KorosHeading>
      <StyledDataTable
        cellConfig={cellConfig}
        config={{
          filtering: false,
          rowFilters: false,
        }}
        hasGrouping={false}
        groups={[{ id: 1, data: loadedReservations }]}
        filterConfig={[]}
      />
    </>
  );
};

export default withMainMenu(RequestedReservationsView);
