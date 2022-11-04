import React, { useEffect, useState } from "react";
import { useQuery } from "@apollo/client";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { addDays } from "date-fns";
import { intersection } from "lodash";
import { breakpoints } from "common/src/common/style";
import {
  Query,
  QueryReservationsArgs,
  QueryReservationUnitsArgs,
  ReservationType,
  ReservationUnitType,
} from "../../common/gql-types";
import { combineResults } from "../../common/util";
import { useNotification } from "../../context/NotificationContext";
import Legend from "../reservations/requested/Legend";
import { RESERVATIONS_BY_UNIT, RESERVATION_UNITS_BY_UNIT } from "./queries";
import { legend } from "./resourceEventStyleGetter";
import ResourceCalendar, { Resource } from "./UnitCalendar";
import Loader from "../Loader";

type Props = {
  begin: string;
  unitPk: string;
  reservationUnitTypes: number[];
};

const Legends = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xl);
  padding: var(--spacing-m) 0;
`;

const Container = styled.div`
  max-width: 100%;
  overflow-x: auto;
`;

const LegendContainer = styled.div`
  max-width: 100%;
  overflow-x: auto;
  @media (max-width: ${breakpoints.s}) {
    div {
      flex-wrap: nowrap;
    }
  }
`;

const updateQuery = (
  previousResult: Query,
  { fetchMoreResult }: { fetchMoreResult: Query }
): Query => {
  if (!fetchMoreResult) {
    return previousResult;
  }

  return combineResults(previousResult, fetchMoreResult, "reservations");
};

const intersectingReservationUnits = (
  allReservationUnits: ReservationUnitType[],
  currentReservationUnit: number
): number[] => {
  const spacePks = allReservationUnits
    .filter((ru) => ru.pk === currentReservationUnit)
    .flatMap((ru) => ru.spaces?.map((space) => space?.pk));

  return allReservationUnits
    .filter(
      (ru) =>
        intersection(
          ru.spaces?.map((space) => space?.pk),
          spacePks
        ).length > 0
    )
    .map((ru) => ru.pk as number);
};

const merge = (
  reservationUnits: ReservationUnitType[],
  reservations: ReservationType[],
  reservationUnitTypes: number[]
): Resource[] => {
  return reservationUnits
    .filter((reservationUnit) => {
      return reservationUnitTypes.length === 0
        ? true
        : reservationUnitTypes.includes(
            reservationUnit.reservationUnitType?.pk as number
          );
    })
    .map((reservationUnit) => {
      const reservationUnitIds = intersectingReservationUnits(
        reservationUnits,
        reservationUnit.pk as number
      );

      return {
        title: reservationUnit.nameFi as string,
        pk: reservationUnit.pk as number,
        events: reservations
          .filter(
            (reservation) =>
              intersection(
                reservationUnitIds,
                (reservation?.reservationUnits || []).map((ru) => ru?.pk)
              ).length > 0
          )
          .map((reservation) => ({
            title: reservation.name as string,
            event: reservation,
            start: reservation.begin,
            end: reservation.end,
          })),
        url: String(reservationUnit.pk || 0),
      };
    });
};

const UnitReservations = ({
  begin,
  unitPk,
  reservationUnitTypes,
}: Props): JSX.Element => {
  const [resourcesData, setResourcesData] = useState<Resource[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const { notifyError } = useNotification();

  const { t } = useTranslation();

  const { data: reservationsData, fetchMore } = useQuery<
    Query,
    QueryReservationsArgs
  >(RESERVATIONS_BY_UNIT, {
    fetchPolicy: "network-only",
    variables: {
      offset: 0,
      first: 100,
      reservationUnitType: reservationUnitTypes.map(String),
      unit: [unitPk],
      begin: new Date(begin),
      end: addDays(new Date(begin), 1),
    },
    onCompleted: ({ reservations }) => {
      if (reservations?.pageInfo.hasNextPage) {
        setHasMore(true);
      }
    },
    onError: () => {
      notifyError(t("errors.errorFetchingData"));
    },
  });

  const { loading: reservationUnitsLoading, data: reservationUnitsData } =
    useQuery<Query, QueryReservationUnitsArgs>(RESERVATION_UNITS_BY_UNIT, {
      variables: {
        offset: 0,
        first: 100,
        unit: [unitPk],
      },
      onError: () => {
        notifyError(t("errors.errorFetchingData"));
      },
    });

  useEffect(() => {
    if (hasMore) {
      setHasMore(false);
      fetchMore({
        variables: {
          offset: reservationsData?.reservations?.edges.length,
        },
        updateQuery,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, setHasMore]);

  useEffect(() => {
    if (reservationUnitsData) {
      setResourcesData(
        merge(
          (reservationUnitsData?.reservationUnits?.edges || []).map(
            (e) => e?.node as ReservationUnitType
          ),
          (reservationsData?.reservations?.edges || []).map(
            (e) => e?.node as ReservationType
          ),
          reservationUnitTypes
        )
      );
    }
  }, [reservationUnitsData, reservationsData, reservationUnitTypes]);

  if (reservationUnitsLoading) {
    return <Loader />;
  }

  return (
    <>
      <Container>
        <ResourceCalendar resources={resourcesData} />
      </Container>
      <LegendContainer>
        <Legends>
          {legend.map((l) => (
            <Legend key={l.label} style={l.style} label={t(l.label)} />
          ))}
        </Legends>
      </LegendContainer>
    </>
  );
};

export default UnitReservations;
