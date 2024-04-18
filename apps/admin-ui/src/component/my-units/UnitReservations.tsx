import React from "react";
import { breakpoints } from "common/src/common/style";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import Loader from "../Loader";
import Legend from "../reservations/requested/Legend";
import { legend } from "./eventStyleGetter";
import { UnitCalendar } from "./UnitCalendar";
import { useUnitResources } from "./hooks";
import { fromUIDate, isValidDate } from "common/src/common/util";

type Props = {
  // date in ui string format
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

const LegendContainer = styled.div`
  max-width: 100%;
  overflow: auto hidden;
  @media (max-width: ${breakpoints.s}) {
    div {
      flex-wrap: nowrap;
    }
  }
`;

export function UnitReservations({
  begin,
  unitPk,
  reservationUnitTypes,
}: Props): JSX.Element {
  const currentDate = fromUIDate(begin);

  // TODO if the date is invalid show it to the user and disable the calendar
  if (currentDate == null || Number.isNaN(currentDate.getTime())) {
    // eslint-disable-next-line no-console
    console.warn("UnitReservations: Invalid date", begin);
  }

  const { t } = useTranslation();

  const { loading, resources, refetch } = useUnitResources(
    currentDate ?? new Date(),
    unitPk,
    reservationUnitTypes
  );

  const date =
    currentDate && isValidDate(currentDate) ? currentDate : new Date();

  return (
    <>
      {loading ? (
        <Loader />
      ) : (
        <UnitCalendar date={date} resources={resources} refetch={refetch} />
      )}
      <LegendContainer>
        <Legends>
          {legend.map((l) => (
            <Legend key={l.label} style={l.style} label={t(l.label)} />
          ))}
        </Legends>
      </LegendContainer>
    </>
  );
}
