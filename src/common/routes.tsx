import Application from '../application/Application';
import Home from '../home/Home';
import ReservationUnit from '../reservation-unit/ReservationUnit';
import Search from '../search/Search';
import { getApplicationPeriods, getReservationUnit } from './api';
import {
  ApplicationPeriod as ApplicationPeriodType,
  ReservationUnit as ReservationUnitType,
} from './types';

interface ReservationUnitParams {
  id?: string;
}

type Route = {
  path: string;
  exact?: boolean;
  component: React.FC;
  loadData?: (params: ReservationUnitParams) => any; // eslint-disable-line
  dataKey?: string;
  startApplicationBar?: boolean;
};

const Routes: Route[] = [
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
    startApplicationBar: true,
  },
  {
    path: '/reservation-unit/:id',
    component: ReservationUnit,
    loadData: (params: ReservationUnitParams): Promise<ReservationUnitType> =>
      getReservationUnit(Number(params.id)),
    dataKey: 'reservationUnit',
    startApplicationBar: true,
  },
  {
    path: '/application/:applicationPeriodId/:applicationId',
    component: Application,
  },
];

export default Routes;
