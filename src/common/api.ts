import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import applyCaseMiddleware from 'axios-case-converter';
import { apiBaseUrl } from './const';
import {
  Application,
  ApplicationPeriod,
  ReservationUnit,
  Parameter,
} from './types';

const axiosOptions = {
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
};

let axiosClient = applyCaseMiddleware(axios.create(axiosOptions));

const applicationRoundBasePath = 'application_round';
const reservationUnitsBasePath = 'reservation_unit';
const parameterBasePath = 'parameters';
const applicationBasePath = 'application';

export const setApiToken = (token: string | null): void => {
  const newAxiosOptions = {
    ...axiosOptions,
    headers: { ...axiosOptions.headers } as { [name: string]: string },
  };

  if (token) {
    newAxiosOptions.headers.Authorization = `Bearer ${token}`;
  }

  axiosClient = applyCaseMiddleware(axios.create(newAxiosOptions));
};

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface QueryParameters extends ReservationUnitsParameters {}

interface RequestParameters {
  path: string;
  headers?: { [key: string]: string };
  parameters?: QueryParameters;
  data?: Application;
}

enum ApiResponseFormat {
  json = 'json',
}

interface ApiParameters extends QueryParameters {
  format: ApiResponseFormat;
}

async function request<T>(requestConfig: AxiosRequestConfig): Promise<T> {
  const config: AxiosRequestConfig = requestConfig;

  try {
    const response: AxiosResponse<T> = await axiosClient.request<
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
  parameters = {} as QueryParameters,
}: RequestParameters): Promise<T> {
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

const validateStatus = (status: number): boolean => status < 300;

async function apiPut<T>({ path, data }: RequestParameters): Promise<T> {
  return request<T>({
    url: `${apiBaseUrl}/${path}`,
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'put',
    data,
    validateStatus,
  });
}

async function apiPost<T>({ path, data }: RequestParameters): Promise<T> {
  return request<T>({
    url: `${apiBaseUrl}/${path}`,
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'post',
    data,
    validateStatus,
  });
}

export function getApplicationPeriods(): Promise<ApplicationPeriod[]> {
  return apiGet<ApplicationPeriod[]>({
    path: `v1/${applicationRoundBasePath}`,
  });
}

export function getApplicationPeriod(
  params: IDParameter
): Promise<ApplicationPeriod> {
  return apiGet<ApplicationPeriod>({
    path: `v1/${applicationRoundBasePath}/${params.id}`,
  });
}

export interface ReservationUnitsParameters {
  applicationRound?: number;
  search?: string;
  purpose?: number;
  reservationUnitType?: number;
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

export function getReservationUnit(id: number): Promise<ReservationUnit> {
  return apiGet<ReservationUnit>({
    path: `v1/${reservationUnitsBasePath}/${id}`,
  });
}

export function getParameters(
  name:
    | 'purpose'
    | 'age_group'
    | 'ability_group'
    | 'reservation_unit_type'
    | 'district'
): Promise<Parameter[]> {
  return apiGet<Parameter[]>({
    path: `v1/${parameterBasePath}/${name}`,
  });
}

export function getApplication(id: number): Promise<Application> {
  return apiGet<Application>({
    path: `v1/${applicationBasePath}/${id}`,
  });
}

export function saveApplication(
  application: Application
): Promise<Application> {
  if (application.id === undefined) {
    return apiPost<Application>({
      data: application,
      path: `v1/${applicationBasePath}/`,
    });
  }
  return apiPut<Application>({
    data: application,
    path: `v1/${applicationBasePath}/${application.id}/`,
  });
}
