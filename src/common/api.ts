import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import applyCaseMiddleware from 'axios-case-converter';
import { ApplicationPeriod } from './types';

const axiosclient = applyCaseMiddleware(axios.create());

const apiBaseUrl: string = process.env.REACT_APP_TILANVARAUS_API_URL || '';

const applicationPeriodsBasePath = 'application_periods';

interface RequestParameters {
  [key: string]:
    | string
    | number
    | boolean
    | ReadonlyArray<string>
    | ReadonlyArray<number>
    | ReadonlyArray<boolean>
    | undefined
    | null;
}

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

async function apiGet<T>({ path, parameters = {} }: GetParameters): Promise<T> {
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

export function anotherFuntion(): Promise<ApplicationPeriod[]> {
  return apiGet<ApplicationPeriod[]>({
    path: `v1/${applicationPeriodsBasePath}`,
  });
}
