import { useQuery } from "@apollo/client";
import { CalendarEvent } from "common/src/calendar/Calendar";
import { breakpoints } from "common/src/common/style";
import { toApiDate } from "common/src/common/util";
import {
  Query,
  QueryReservationUnitsArgs,
  ReservationType,
  ReservationUnitByPkTypeReservationsArgs,
  ReservationUnitType,
} from "common/types/gql-types";
import { addDays } from "date-fns";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { combineResults } from "../../common/util";
import { useNotification } from "../../context/NotificationContext";
import Loader from "../Loader";
import Legend from "../reservations/requested/Legend";
import { legend } from "./eventStyleGetter";
import { RESERVATION_UNITS_BY_UNIT } from "./queries";
import UnitCalendar, { Resource } from "./UnitCalendar";

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

const merge = (
  reservationUnits: ReservationUnitType[],
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
      const events = (reservationUnit.reservations?.map(
        (reservation) =>
          reservation && {
            title: reservation.name ?? "",
            event: reservation,
            start: new Date(reservation.begin),
            end: new Date(reservation.end),
          }
      ) || []) as CalendarEvent<ReservationType>[];

      return {
        title: reservationUnit.nameFi as string,
        pk: reservationUnit.pk as number,
        isDraft: reservationUnit.isDraft,
        events,
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
  const currentDate = new Date(begin);

  const { t } = useTranslation();

  const {
    loading: reservationUnitsLoading,
    data: reservationUnitsData,
    fetchMore,
  } = useQuery<
    Query,
    QueryReservationUnitsArgs & ReservationUnitByPkTypeReservationsArgs
  >(RESERVATION_UNITS_BY_UNIT, {
    variables: {
      offset: 0,
      first: 100,
      unit: [unitPk],
      from: toApiDate(currentDate),
      to: toApiDate(addDays(currentDate, 1)),
      includeWithSameComponents: true,
    },
    onCompleted: ({ reservationUnits }) => {
      if (reservationUnits?.pageInfo.hasNextPage) {
        setHasMore(true);
      }
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
          offset: reservationUnitsData?.reservationUnits?.edges.length,
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
          reservationUnitTypes
        )
      );
    }
  }, [reservationUnitsData, reservationUnitTypes]);

  if (reservationUnitsLoading) {
    return <Loader />;
  }

  return (
    <>
      <Container>
        <UnitCalendar date={new Date(begin)} resources={resourcesData} />
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
