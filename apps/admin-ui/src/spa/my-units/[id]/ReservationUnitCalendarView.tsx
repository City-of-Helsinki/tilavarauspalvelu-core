import React, { useEffect, useState } from "react";
import { addDays, formatISO, startOfDay, subDays } from "date-fns";
import { AutoGrid, Flex } from "common/styles/util";
import { ReservationUnitCalendar } from "./ReservationUnitCalendar";
import WeekNavigation from "./WeekNavigation";
import { useTranslation } from "next-i18next";
import { Option, Select } from "hds-react";
import { convertOptionToHDS, toNumber } from "common/src/helpers";

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
    const newVal = reservationUnitOptions[0]?.value;
    if (newVal != null) {
      setReservationUnitPk(newVal);
    }
  }, [reservationUnitOptions]);

  const onChange = (selecte: Option[]) => {
    const value = selecte.find(() => true)?.value;
    const v = toNumber(value);
    if (v != null) {
      setReservationUnitPk(v);
    }
  };

  return (
    <>
      <AutoGrid>
        <Select
          id="reservation-unit"
          disabled={reservationUnitOptions.length === 0}
          style={{
            zIndex: "var(--tilavaraus-admin-stack-select-over-calendar)",
          }}
          texts={{
            label: t("ReservationUnitsFilter.label"),
            placeholder: t("common.select"),
          }}
          clearable={false}
          options={reservationUnitOptions.map(convertOptionToHDS)}
          value={valueOption?.value.toString()}
          onChange={onChange}
        />
      </AutoGrid>
      <Flex $justifyContent="center" $direction="row">
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
