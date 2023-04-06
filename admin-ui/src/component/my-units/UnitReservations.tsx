import React from "react";
import { breakpoints } from "common/src/common/style";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import Loader from "../Loader";
import Legend from "../reservations/requested/Legend";
import { legend } from "./eventStyleGetter";
import UnitCalendar from "./UnitCalendar";
import { useUnitResources } from "./hooks";

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

const UnitReservations = ({
  begin,
  unitPk,
  reservationUnitTypes,
}: Props): JSX.Element => {
  const currentDate = new Date(begin);

  const { t } = useTranslation();

  const { loading, resources, refetch } = useUnitResources(
    currentDate,
    unitPk,
    reservationUnitTypes
  );

  return (
    <>
      <Container>
        {loading ? (
          <Loader />
        ) : (
          <UnitCalendar
            date={currentDate}
            resources={resources}
            refetch={refetch}
          />
        )}
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
