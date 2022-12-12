import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { addDays, formatISO, startOfDay, subDays } from "date-fns";

import SingleReservationUnitFilter from "../filters/SingleReservationUnitFilter";
import { Grid, HorisontalFlex, Span6 } from "../../styles/layout";
import ReservationUnitCalendar from "./ReservationUnitCalendar";
import WeekNavigation from "./WeekNavigation";

type Params = {
  unitId: string;
  reservationUnitId: string;
};

const ReservationUnitCalendarView = (): JSX.Element => {
  const today = formatISO(startOfDay(new Date()));

  const [begin, setBegin] = useState(today);
  const [reservationUnitId, setReservationUnitId] = useState(-1);
  const { unitId } = useParams<Params>();

  const hasReservationUnitId = reservationUnitId > 0;

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
          />
        </>
      )}
    </>
  );
};

export default ReservationUnitCalendarView;
