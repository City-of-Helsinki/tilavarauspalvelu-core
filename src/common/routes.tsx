import React from 'react';
import Home from '../home/Home';
import ReservationUnit from '../reservation-unit/ReservationUnit';
import Search from '../search/Search';
import { getApplicationRounds, getReservationUnit } from './api';
import {
  ApplicationRound as ApplicationRoundType,
  ReservationUnit as ReservationUnitType,
} from './types';
import { reservationUnitPrefix, searchPrefix } from './const';

interface ReservationUnitParams {
  id?: string;
}

type Route = {
  path: string;
  exact?: boolean;
  component: React.FC;
  loadData?: (params: ReservationUnitParams) => any; // eslint-disable-line
  dataKey?: string;
};

const Routes: Route[] = [
  {
    path: '/',
    exact: true,
    component: Home,
    loadData: (): Promise<ApplicationRoundType[]> => getApplicationRounds(),
    dataKey: 'applicationRounds',
  },
  {
    path: searchPrefix,
    component: Search,
  },
  {
    path: `${reservationUnitPrefix}/:id`,
    component: ReservationUnit,
    loadData: (params: ReservationUnitParams): Promise<ReservationUnitType> =>
      getReservationUnit(Number(params.id)),
    dataKey: 'reservationUnit',
  },
];

export default Routes;
