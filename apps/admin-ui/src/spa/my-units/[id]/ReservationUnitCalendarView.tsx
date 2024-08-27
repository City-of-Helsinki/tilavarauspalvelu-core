import React, { useEffect, useState } from "react";
import { addDays, formatISO, startOfDay, subDays } from "date-fns";
import { AutoGrid, HorisontalFlex } from "@/styles/layout";
import { ReservationUnitCalendar } from "./ReservationUnitCalendar";
import WeekNavigation from "./WeekNavigation";
import { SortedSelect } from "@/component/SortedSelect";
import { useTranslation } from "react-i18next";

export function ReservationUnitCalendarView({
  reservationUnitOptions,
  unitPk,
}: {
  reservationUnitOptions: { label: string; value: number }[];
  unitPk: number;
}): JSX.Element {
  const { t } = useTranslation();

  const today = formatISO(startOfDay(new Date()));

  const [begin, setBegin] = useState(today);
  const [reservationUnitPk, setReservationUnitPk] = useState(-1);

  const valueOption =
    reservationUnitOptions.find((o) => o.value === reservationUnitPk) ?? null;

  // Set the first reservation unit as the default
  useEffect(() => {
    if (reservationUnitOptions.length > 0) {
      setReservationUnitPk(reservationUnitOptions[0].value);
    }
  }, [reservationUnitOptions]);

  const onChange = (reservationUnits: { label: string; value: number }) => {
    setReservationUnitPk(reservationUnits.value);
  };

  return (
    <>
      <AutoGrid>
        <SortedSelect
          style={{
            zIndex: "var(--tilavaraus-admin-stack-select-over-calendar)",
          }}
          disabled={reservationUnitOptions.length === 0}
          sort
          label={t("ReservationUnitsFilter.label")}
          placeholder={t("common.select")}
          options={reservationUnitOptions}
          value={valueOption}
          onChange={onChange}
          id="reservation-unit"
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
        unitPk={unitPk}
      />
    </>
  );
}
