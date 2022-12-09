import { useQuery } from "@apollo/client";
import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { addDays, subDays } from "date-fns";
import { intersection } from "lodash";
import {
  Query,
  QueryUnitsArgs,
  ReservationUnitType,
} from "common/types/gql-types";
import { useNotification } from "../../context/NotificationContext";
import Loader from "../Loader";
import { UNIT_QUERY } from "./queries";
import SingleReservationUnitFilter from "../filters/SingleReservationUnitFilter";
import { Grid, HorisontalFlex, Span6 } from "../../styles/layout";
import ReservationUnitCalendar from "./ReservationUnitCalendar";
import WeekNavigation from "./WeekNavigation";

type Params = {
  unitId: string;
  reservationUnitId: string;
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

const ReservationUnitCalendarView = (): JSX.Element => {
  const today = new Date(new Date().setHours(0, 0, 0, 0));

  const { notifyError } = useNotification();
  const [begin, setBegin] = useState(today.toISOString());
  const [reservationUnitId, setReservationUnitId] = useState(-1);
  const { unitId } = useParams<Params>();

  const hasReservationUnitId = reservationUnitId > 0;

  const { loading: unitLoading, data: unitData } = useQuery<
    Query,
    QueryUnitsArgs
  >(UNIT_QUERY, {
    variables: {
      pk: [unitId],
      offset: 0,
    },
    onError: (err) => {
      notifyError(err.message);
    },
  });

  if (unitLoading) {
    return <Loader />;
  }

  const unit = unitData?.units?.edges[0];

  return (
    <>
      <Grid>
        <Span6>
          <SingleReservationUnitFilter
            unitPk={unitId}
            value={{ value: reservationUnitId, label: "x" }}
            onChange={(ru) => {
              setReservationUnitId(Number(ru.value));
            }}
          />
        </Span6>
      </Grid>
      {hasReservationUnitId && (
        <>
          <HorisontalFlex style={{ justifyContent: "center" }}>
            <WeekNavigation
              date={begin}
              onPrev={() => {
                setBegin(subDays(new Date(begin), 7).toISOString());
              }}
              onNext={() => {
                setBegin(addDays(new Date(begin), 7).toISOString());
              }}
            />
          </HorisontalFlex>
          <ReservationUnitCalendar
            key={begin + reservationUnitId}
            begin={begin}
            reservationUnitPk={reservationUnitId}
            intersectingReservationUnits={intersectingReservationUnits(
              unit?.node?.reservationUnits as ReservationUnitType[],
              reservationUnitId
            )}
          />
        </>
      )}
    </>
  );
};

export default ReservationUnitCalendarView;
