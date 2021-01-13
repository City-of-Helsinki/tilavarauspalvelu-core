import Application from '../application/Application';
import Home from '../home/Home';
import ReservationUnit from '../reservation-unit/ReservationUnit';
import Search from '../search/Search';
import {
  getApplicationPeriod,
  getApplicationPeriods,
  getReservationUnit,
} from './api';
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
    loadData: (): Promise<ApplicationPeriodType[]> => getApplicationPeriods(),
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
  {
    path: '/application/:id',
    component: Application,
    loadData: (params: IDParameter): Promise<ApplicationPeriodType> =>
      getApplicationPeriod(params),
    dataKey: 'applicationPeriod',
  },
];

export default Routes;
