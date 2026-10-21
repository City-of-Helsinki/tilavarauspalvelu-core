import React, { useState } from "react";
import { formatISO, startOfDay } from "date-fns";
import { useSearchParams } from "next/navigation";
import { toNumber } from "ui/src/modules/helpers";
import { AutoGrid } from "ui/src/styled";
import { SelectFilter } from "@/components/QueryParamFilters";
import { ReservationUnitCalendar } from "./ReservationUnitCalendar";

export function ReservationUnitCalendarView({
  reservationUnitOptions,
  unitPk,
}: {
  reservationUnitOptions: Array<{ label: string; value: number }>;
  unitPk: number;
}): React.ReactElement {
  const params = useSearchParams();
  const reservationUnitPk = toNumber(params.get("reservationUnit")) ?? reservationUnitOptions[0]?.value;
  const today = formatISO(startOfDay(new Date()));

  const [begin, setBegin] = useState(today);

  return (
    <>
      <AutoGrid>
        <SelectFilter
          name="reservationUnit"
          style={{ zIndex: "var(--tilavaraus-admin-stack-select-over-calendar)" }}
          clearable={false}
          options={reservationUnitOptions}
          enableSearch
        />
      </AutoGrid>
      {reservationUnitPk && (
        <ReservationUnitCalendar
          begin={begin}
          onNavigate={(date) => setBegin(date.toISOString())}
          reservationUnitPk={reservationUnitPk}
          unitPk={unitPk}
        />
      )}
    </>
  );
}
