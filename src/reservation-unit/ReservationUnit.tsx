import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Container from '../component/Container';
import { ReservationUnit as ReservationUnitType } from '../common/types';
import { getReservationUnit } from '../common/api';
import Head from './Head';

type ParamTypes = {
  id: string;
};

const ReservationUnit = (): JSX.Element | null => {
  const { id } = useParams<ParamTypes>();

  const [
    reservationUnit,
    setReservationUnit,
  ] = useState<ReservationUnitType | null>(null);

  useEffect(() => {
    async function fetchData() {
      const unit = await getReservationUnit({ id });
      setReservationUnit(unit);
    }
    fetchData();
  }, [id]);

  return reservationUnit ? (
    <>
      <Head reservationUnit={reservationUnit} />
      <Container>
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
  ) : null;
};

export default ReservationUnit;
