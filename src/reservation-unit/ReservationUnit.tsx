import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import Container from '../component/Container';
import { ReservationUnit as ReservationUnitType } from '../common/types';
import { getReservationUnit } from '../common/api';
import Head from './Head';
import { routeData } from '../common/const';
import Address from './Address';
import StartApplicationBar from '../component/StartApplicationBar';

type ParamTypes = {
  id: string;
};

const TwoColoumnLayout = styled.div`
  display: grid;
  gap: var(--spacing-m);
  grid-template-columns: 7fr 3fr;
`;

const ReservationUnit = (): JSX.Element | null => {
  const { id } = useParams<ParamTypes>();

  const [
    reservationUnit,
    setReservationUnit,
  ] = useState<ReservationUnitType | null>(null);

  useEffect(() => {
    async function fetchData() {
      const backendData = routeData()?.reservationUnit;
      if (backendData) {
        setReservationUnit(backendData);
        routeData().reservationUnit = undefined;
      } else {
        const unit = await getReservationUnit(Number(id));
        setReservationUnit(unit);
      }
    }
    fetchData();
  }, [id]);

  return reservationUnit ? (
    <>
      <Head reservationUnit={reservationUnit} />
      <Container>
        <TwoColoumnLayout>
          <div>
            <h2>Kuvaus</h2>
            <h2>Ehdot ja käyttössäännöt</h2>
            <h2>Hakeminen</h2>
            <h2>Poikkeusajat</h2>
            <h2>Tilan vuorot</h2>
          </div>
          <Address reservationUnit={reservationUnit} />
          <div>
            <Address reservationUnit={reservationUnit} />
          </div>
        </TwoColoumnLayout>
      </Container>
      <StartApplicationBar count={0} />
    </>
  ) : null;
};

export default ReservationUnit;
