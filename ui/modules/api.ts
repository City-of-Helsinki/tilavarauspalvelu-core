import { AxiosRequestConfig, AxiosResponse } from "axios";
import {
  Application,
  ApplicationRound,
  Parameter,
  RecurringReservation,
  ReservationUnit,
} from "common/types/common";
import { apiBaseUrl } from "./const";
import axiosClient from "./auth/axiosClient";
import { ApiError } from "./ApiError";

const applicationRoundBasePath = "application_round";
const recurringReservationBasePath = "recurring_reservation";
const parameterBasePath = "parameters";
const applicationBasePath = "application";
const applicationEventFeedBasePath = "application_event_calendar";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface QueryParameters {}

interface RequestParameters {
  path: string;
  headers?: { [key: string]: string };
  parameters?: QueryParameters;
  data?: Application;
}

enum ApiResponseFormat {
  json = "json",
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
      throw new ApiError(
        `${errorMessage} url:'${requestConfig.url}'`,
        error.response?.status
      );
    } else {
      throw new ApiError(
        `ApiError url:'${requestConfig.url}' `,
        error.response?.status
      );
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
      "Content-Type": "application/json",
    },
    method: "get",
    params: apiParameters,
  });
}

const validateStatus = (status: number): boolean => status < 300;

async function apiPut<T>({ path, data }: RequestParameters): Promise<T> {
  return request<T>({
    url: `${apiBaseUrl}/${path}`,
    headers: {
      "Content-Type": "application/json",
    },
    method: "put",
    data,
    validateStatus,
  });
}

async function apiPost<T>({ path, data }: RequestParameters): Promise<T> {
  return request<T>({
    url: `${apiBaseUrl}/${path}`,
    headers: {
      "Content-Type": "application/json",
    },
    method: "post",
    data,
    validateStatus,
  });
}

export function getApplicationRounds(): Promise<ApplicationRound[]> {
  return apiGet<ApplicationRound[]>({
    path: `v1/${applicationRoundBasePath}`,
  });
}

export function getApplicationRound(
  params: IDParameter
): Promise<ApplicationRound> {
  return apiGet<ApplicationRound>({
    path: `v1/${applicationRoundBasePath}/${params.id}`,
  });
}

export interface ReservationUnitsParameters {
  applicationRound?: number;
  application?: number;
  search?: string;
  purpose?: number;
  reservationUnitType?: number;
  unit?: number;
  limit?: number;
  after?: string;
}

export function getRecurringReservations(
  applicationId: number
): Promise<RecurringReservation[]> {
  return apiGet<RecurringReservation[]>({
    path: `v1/${recurringReservationBasePath}`,
    parameters: { application: applicationId },
  });
}

interface IDParameter {
  id: number;
}

export function getReservationUnit(id: number): Promise<ReservationUnit> {
  return apiGet<ReservationUnit>({
    path: `v1/reservation_unit/${id}`,
  });
}

export function getParameters(
  name:
    | "purpose"
    | "age_group"
    | "ability_group"
    | "reservation_unit_type"
    | "district"
    | "city"
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

export const cancelApplication = async (
  applicationId: number
): Promise<void> => {
  const application = await getApplication(applicationId);
  application.status = "cancelled";
  await saveApplication(application);
};

export const applicationEventCalendarFeedUrl = (uuid: string): string =>
  `${apiBaseUrl}/v1/${applicationEventFeedBasePath}/${uuid}`;
