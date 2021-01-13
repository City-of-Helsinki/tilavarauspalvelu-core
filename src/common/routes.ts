import Home from '../home/Home';
import ReservationUnit from '../reservation-unit/ReservationUnit';
import Search from '../search/Search';
import { getapplicationPeriods, getReservationUnit } from './api';
import {
  ApplicationPeriod as ApplicationPeriodType,
  ReservationUnit as ReservationUnitType,
} from './types';

interface IDParameter {
  id: string;
}

const Routes = [
  {
    path: '/',
    exact: true,
    component: Home,
    loadData: (): Promise<ApplicationPeriodType[]> => getapplicationPeriods(),
    dataKey: 'applicationPeriods',
  },
  {
    path: '/search',
    component: Search,
  },
  {
    path: '/reservation-unit/:id',
    component: ReservationUnit,
    loadData: (params: IDParameter): Promise<ReservationUnitType> =>
      getReservationUnit(params),
    dataKey: 'reservationUnit',
  },
];

export default Routes;
