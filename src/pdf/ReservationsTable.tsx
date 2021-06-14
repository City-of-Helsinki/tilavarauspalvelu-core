import { StyleSheet, Text, View } from '@react-pdf/renderer';
import React from 'react';
import {
  ApplicationEvent,
  Reservation,
  ReservationState,
  ReservationUnit,
} from '../common/types';
import { B, FAMILY_BOLD, FAMILY_REGULAR, SIZE_SMALL } from './Typography';

const styles = StyleSheet.create({
  header: {
    display: 'flex',
    flexDirection: 'row',
    fontFamily: FAMILY_BOLD,
    fontSize: SIZE_SMALL,
  },
  row: {
    display: 'flex',
    flexDirection: 'row',
    fontSize: SIZE_SMALL,
    fontFamily: FAMILY_REGULAR,
  },
});

const parseDate = (isoDateTime: string) => new Date(Date.parse(isoDateTime));

const date = (isoDateTime: string) => {
  const d = parseDate(isoDateTime);
  return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
};

const time = (isoDateTime: string) => {
  const d = parseDate(isoDateTime);
  return `${d.getHours().toString().padStart(2, '0')}:${d
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const timeSpan = (begin: string, end: string) => `${time(begin)}-${time(end)}`;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const state = (reservationState: ReservationState) =>
  reservationState === 'confirmed' ? 'Myönnetään' : 'Ei käytettävissä';

type Props = {
  reservations: Reservation[];
  reservationUnit: ReservationUnit;
  applicationEvent: ApplicationEvent;
};

const width = [130, 140, 75, 60, 60];
const MARGIN = 5;

const Td = ({
  w,
  children,
}: {
  w: number;
  children: React.ReactNode;
}): JSX.Element => (
  <View
    style={{
      width: w,
      marginRight: MARGIN,
      justifyContent: 'center',
    }}>
    {children}
  </View>
);

const Th = ({ w, children }: { w: number; children: React.ReactNode }) => (
  <Td w={w}>{children}</Td>
);

const ReservationsTable = ({
  reservations,
  reservationUnit,
  applicationEvent,
}: Props): JSX.Element => (
  <View wrap style={{ display: 'flex' }}>
    <View wrap style={styles.header}>
      <Th w={width[0]}>
        <Text>Vuoron nimi</Text>
      </Th>
      <Th w={width[1]}>
        <Text>Tilan nimi</Text>
      </Th>
      <Th w={width[2]}>
        <Text>Päätös</Text>
      </Th>
      <Th w={width[3]}>
        <Text>Päivä</Text>
      </Th>
      <Th w={width[4]}>
        <Text>Kellonaika</Text>
      </Th>
    </View>
    {reservations.map((reservation) => (
      <View wrap={false} key={reservation.id}>
        <View style={styles.row}>
          <Td w={width[0]}>
            <Text>{applicationEvent.name}</Text>
          </Td>
          <Td w={width[1]}>
            <Text>
              {reservationUnit.name.fi}, {reservationUnit.building.name}
            </Text>
          </Td>
          <Td w={width[2]}>
            <Text>{state(reservation.state)}</Text>
          </Td>
          <Td w={width[3]}>
            <B>{date(reservation.begin)}</B>
          </Td>
          <Td w={width[4]}>
            <Text>{timeSpan(reservation.begin, reservation.end)}</Text>
          </Td>
        </View>
        <View style={{ borderBottom: 1 }} />
      </View>
    ))}
  </View>
);

export default ReservationsTable;
