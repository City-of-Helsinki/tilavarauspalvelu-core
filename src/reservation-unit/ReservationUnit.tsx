import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Container from '../component/Container';
import { ReservationUnit as ReservationUnitType } from '../common/types';
import { getReservationUnit } from '../common/api';
import Head from './Head';
import Back from './Back';
import Notification from './Notification';

type ParamTypes = {
  id: string;
};

const ReservationUnit = (): JSX.Element => {
  const { id } = useParams<ParamTypes>();

  const [reservationUnit, setReservationUnit] = useState<ReservationUnitType>(
    {} as ReservationUnitType
  );

  useEffect(() => {
    async function fetchData() {
      // eslint-disable-next-line
      const backendData = window.__ROUTE_DATA__?.reservationUnit;
      if (backendData) {
        setReservationUnit(backendData);
        // eslint-disable-next-line
        window.__ROUTE_DATA__.reservationUnit = undefined;
      } else {
        const unit = await getReservationUnit({ id });
        setReservationUnit(unit);
      }
    }
    fetchData();
  }, [id]);

  return (
    <>
      <Notification applicationPeriod={null} />
      <Container>
        <Back />
        <Head reservationUnit={reservationUnit} />
        <div
          style={{
            display: 'grid',
            gap: '1em',
            gridTemplateColumns: '7fr 3fr',
          }}>
          <div>
            <h2>Kuvaus</h2>
            <h2>Ehdot ja käyttössäännöt</h2>
            <h2>Hakeminen</h2>
            <h2>Poikkeusajat</h2>
            <h2>Tilan vuorot</h2>
          </div>
          <div>
            <h2>Osoite</h2>
          </div>
        </div>
      </Container>
    </>
  );
};

export default ReservationUnit;
