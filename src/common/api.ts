import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import applyCaseMiddleware from 'axios-case-converter';
import { ApplicationPeriod, ReservationUnit } from './types';

const axiosclient = applyCaseMiddleware(axios.create());

const apiBaseUrl: string = process.env.REACT_APP_TILANVARAUS_API_URL || '';

const applicationPeriodsBasePath = 'application_periods';
const reservationUnitsBasePath = 'reservation_units';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface RequestParameters extends ReservationUnitsParameters {}

interface GetParameters {
  path: string;
  headers?: { [key: string]: string };
  parameters?: RequestParameters;
}

enum ApiResponseFormat {
  json = 'json',
}

interface ApiParameters extends RequestParameters {
  format: ApiResponseFormat;
}

async function request<T>(requestConfig: AxiosRequestConfig): Promise<T> {
  const config: AxiosRequestConfig = requestConfig;

  try {
    const response: AxiosResponse<T> = await axiosclient.request<
      T,
      AxiosResponse<T>
    >(config);
    return response.data;
  } catch (error) {
    const errorMessage: string | undefined = error.response?.data?.detail;
    if (errorMessage) {
      throw new Error(errorMessage);
    } else {
      throw new Error(error);
    }
  }
}

async function apiGet<T>({
  path,
  parameters = {} as RequestParameters,
}: GetParameters): Promise<T> {
  const apiParameters: ApiParameters = {
    ...parameters,
    format: ApiResponseFormat.json,
  };

  return request<T>({
    url: `${apiBaseUrl}/${path}/`,
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'get',
    params: apiParameters,
  });
}

export function getapplicationPeriods(): Promise<ApplicationPeriod[]> {
  return apiGet<ApplicationPeriod[]>({
    path: `v1/${applicationPeriodsBasePath}`,
  });
}

export interface ReservationUnitsParameters {
  search: string | undefined;
}

export function getReservationUnits(
  params: ReservationUnitsParameters
): Promise<ReservationUnit[]> {
  return apiGet<ReservationUnit[]>({
    parameters: params,
    path: `v1/${reservationUnitsBasePath}`,
  });
}

interface IDParameter {
  id: string;
}

export function getReservationUnit(
  params: IDParameter
): Promise<ReservationUnit> {
  return apiGet<ReservationUnit>({
    path: `v1/${reservationUnitsBasePath}/${params.id}`,
  });
}
