import React, { useState } from "react";
import { addDays, formatISO, startOfDay, subDays } from "date-fns";
import { useSearchParams } from "next/navigation";
import styled from "styled-components";
import { toNumber } from "ui/src/modules/helpers";
import { AutoGrid, Flex } from "ui/src/styled";
import { SelectFilter } from "@/components/QueryParamFilters";
import { ReservationUnitCalendar } from "./ReservationUnitCalendar";
import { WeekNavigation } from "./WeekNavigation";

const SelectFilterStyled = styled(SelectFilter)`
  z-index: var(--tilavaraus-admin-stack-select-over-calendar);
`;

export function ReservationUnitCalendarView({
  reservationUnitOptions,
  unitPk,
}: {
  reservationUnitOptions: Array<{ label: string; value: number }>;
  unitPk: number;
}): JSX.Element {
  const params = useSearchParams();
  const reservationUnitPk = toNumber(params.get("reservationUnit")) ?? reservationUnitOptions[0]?.value;
  const today = formatISO(startOfDay(new Date()));

  const [begin, setBegin] = useState(today);

  return (
    <>
      <AutoGrid>
        <SelectFilterStyled name="reservationUnit" clearable={false} options={reservationUnitOptions} enableSearch />
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
      {reservationUnitPk && (
        <ReservationUnitCalendar begin={begin} reservationUnitPk={reservationUnitPk} unitPk={unitPk} />
      )}
    </>
  );
}
