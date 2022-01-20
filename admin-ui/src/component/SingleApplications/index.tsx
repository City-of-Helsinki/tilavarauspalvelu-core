import React, { useState } from "react";
import { useQuery } from "@apollo/client";
import { IconArrowRight, IconCalendarClock, IconLocation } from "hds-react";
import { TFunction, useTranslation } from "react-i18next";
import styled from "styled-components";
import {
  Query,
  QueryReservationsArgs,
  ReservationType,
} from "../../common/gql-types";
import { RESERVATIONS_QUERY } from "../../common/queries";
import { useNotification } from "../../context/NotificationContext";
import DataTable, { CellConfig } from "../DataTable";
import KorosHeading, { Heading, SubHeading } from "../KorosHeading";
import Loader from "../Loader";
import withMainMenu from "../withMainMenu";
import { reservationDateTime } from "./util";

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

const getCellConfig = (t: TFunction): CellConfig => {
  return {
    cols: [
      {
        title: t("SingleApplications.heading.unit"),
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
        title: t("SingleApplications.heading.applicant"),
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
        title: t("SingleApplications.heading.name"),
        key: "name",
      },
      {
        title: t("SingleApplications.heading.price"),
        key: "resourceType",
        transform: ({ price }: ReservationType) => (
          <div
            style={{
              display: "flex",
              alignContent: "center",
              justifyContent: "space-between",
            }}
          >
            <span>{price || "-"}</span>
            <IconArrowRight />
          </div>
        ),
      },
    ],
    index: "pk",
    sorting: "name",
    order: "asc",
    rowLink: ({ pk }: ReservationType) => `/singleApplications/${pk}`,
  };
};

const SingleApplicationsView = (): JSX.Element => {
  const [loadedReservations, setReservations] = useState<ReservationType[]>([]);
  const { notifyError } = useNotification();
  const { t } = useTranslation();
  const [cellConfig] = useState<CellConfig>(getCellConfig(t));

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

export const SingleApplications = withMainMenu(SingleApplicationsView);
