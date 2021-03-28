import { OptionType } from './types';

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
export const searchPrefix = '/search';
export const applicationsPrefix = '/applications';
export const applicationPrefix = '/application';

export const mapStyle = {
  version: 8,
  name: 'hel-osm-light',
  metadata: {},
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tiles.hel.ninja/styles/hel-osm-light/{z}/{x}/{y}.png'],
      minzoom: 0,
      maxzoom: 20,
    },
  },
  layers: [
    {
      id: 'osm',
      type: 'raster',
      source: 'osm',
    },
  ],
  id: 'hel-osm-light',
};

export const reservationUnitPath = (id: number): string =>
  `${reservationUnitPrefix}/${id}`;

export const emptyOption = (label: string): OptionType => ({
  label,
  value: undefined,
});

export const participantCountOptions = [
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  15,
  20,
  25,
  30,
  40,
  50,
  60,
  70,
  80,
  90,
  100,
].map((v) => ({ label: `${v}`, value: v } as OptionType));

const option = (label: string, value: string): OptionType => {
  return { label, value };
};

export const durationOptions = [
  option('1 t', '01:00:00'),
  option('1 t 30 min', '01:30:00'),
  option('2 t', '02:00:00'),
  option('2 t 30 min', '01:30:00'),
];

export const isBrowser = typeof window !== 'undefined';

// eslint-disable-next-line
export const routeData = (): any =>
  // eslint-disable-next-line no-underscore-dangle
  isBrowser ? window.__ROUTE_DATA__ : undefined;

// eslint-disable-next-line
const CONFIG = isBrowser ? window.__CONFIG__ : undefined;

type EnvironmentVariables =
  | 'REACT_APP_SENTRY_DSN'
  | 'REACT_APP_SENTRY_ENVIRONMENT'
  | 'REACT_APP_TILAVARAUS_API_URL'
  | 'REACT_APP_DISABLE_AUTH'
  | 'REACT_APP_OIDC_CLIENT_ID'
  | 'REACT_APP_OIDC_URL'
  | 'REACT_APP_OIDC_SCOPE'
  | 'REACT_APP_TILAVARAUS_API_SCOPE';

const getConfig = (name: EnvironmentVariables) =>
  CONFIG ? CONFIG[name] : process.env[name];

export const sentryDSN = getConfig('REACT_APP_SENTRY_DSN');

export const sentryEnvironment = getConfig('REACT_APP_SENTRY_ENVIRONMENT');

export const apiBaseUrl = getConfig('REACT_APP_TILAVARAUS_API_URL');

export const authEnabled = getConfig('REACT_APP_DISABLE_AUTH') !== 'true';

export const oidcClientId = getConfig('REACT_APP_OIDC_CLIENT_ID');

export const oidcUrl = getConfig('REACT_APP_OIDC_URL');

export const oidcScope = getConfig('REACT_APP_OIDC_SCOPE');

export const apiScope = getConfig('REACT_APP_TILAVARAUS_API_SCOPE');
