import React, { useEffect, useState } from "react";
import { addDays, formatISO, startOfDay, subDays } from "date-fns";
import { AutoGrid, Flex } from "@/styles/layout";
import { ReservationUnitCalendar } from "./ReservationUnitCalendar";
import WeekNavigation from "./WeekNavigation";
import { useTranslation } from "next-i18next";
import { Select } from "hds-react";

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
        <Select
          style={{
            zIndex: "var(--tilavaraus-admin-stack-select-over-calendar)",
          }}
          disabled={reservationUnitOptions.length === 0}
          label={t("ReservationUnitsFilter.label")}
          placeholder={t("common.select")}
          options={reservationUnitOptions}
          value={valueOption}
          onChange={onChange}
          id="reservation-unit"
        />
      </AutoGrid>
      <Flex $justify="center" $direction="row">
        <WeekNavigation
          date={begin}
          onPrev={() => {
            setBegin(subDays(new Date(begin), 7).toISOString());
          }}
          onNext={() => {
            setBegin(addDays(new Date(begin), 7).toISOString());
          }}
        />
      </Flex>
      <ReservationUnitCalendar
        begin={begin}
        reservationUnitPk={reservationUnitPk}
        unitPk={unitPk}
      />
    </>
  );
}
