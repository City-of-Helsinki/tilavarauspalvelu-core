export const weekdays = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

export const reservationUnitPrefix = '/reservation-unit';

export const reservationUnitPath = (id: number): string =>
  `${reservationUnitPrefix}/${id}`;

export const isBrowser = typeof window !== 'undefined';

// eslint-disable-next-line
export const routeData = (): any =>
  // eslint-disable-next-line no-underscore-dangle
  isBrowser ? window.__ROUTE_DATA__ : undefined;

// eslint-disable-next-line
const CONFIG = isBrowser ? window.__CONFIG__ : undefined;

const getConfig = (
  name:
    | 'REACT_APP_SENTRY_DSN'
    | 'REACT_APP_SENTRY_ENVIRONMENT'
    | 'REACT_APP_TILAVARAUS_API_URL'
) => {
  return CONFIG ? CONFIG[name] : process.env[name];
};

export const sentryDSN = getConfig('REACT_APP_SENTRY_DSN');

export const sentryEnvironment = getConfig('REACT_APP_SENTRY_ENVIRONMENT');

export const apiBaseUrl = getConfig('REACT_APP_TILAVARAUS_API_URL');
