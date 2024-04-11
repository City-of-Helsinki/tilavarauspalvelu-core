import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { addDays, formatISO, startOfDay, subDays } from "date-fns";
import SingleReservationUnitFilter from "../filters/SingleReservationUnitFilter";
import { AutoGrid, HorisontalFlex } from "@/styles/layout";
import { ReservationUnitCalendar } from "./ReservationUnitCalendar";
import WeekNavigation from "./WeekNavigation";

type Params = {
  unitId: string;
  reservationUnitId: string;
};

export function ReservationUnitCalendarView(): JSX.Element {
  const today = formatISO(startOfDay(new Date()));

  const [begin, setBegin] = useState(today);
  const [reservationUnitPk, setReservationUnitPk] = useState(-1);
  const { unitId } = useParams<Params>();

  return (
    <>
      <AutoGrid>
        <SingleReservationUnitFilter
          unitPk={unitId}
          value={{ value: reservationUnitPk, label: "x" }}
          onChange={(ru) => setReservationUnitPk(Number(ru.value))}
        />
      </AutoGrid>
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
        begin={begin}
        reservationUnitPk={reservationUnitPk}
      />
    </>
  );
}
