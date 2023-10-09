import axios, { type AxiosRequestConfig, type AxiosResponse } from "axios";
import applyCaseMiddleware from "axios-case-converter";
import { getCookie } from "typescript-cookie";
import {
  Application,
  ApplicationRound,
  Parameter,
  RecurringReservation,
  ReservationUnit,
} from "common/types/common";
import { REST_API_URL } from "./const";
import { ApiError } from "./ApiError";

const applicationRoundBasePath = "application_round";
const recurringReservationBasePath = "recurring_reservation";
const parameterBasePath = "parameters";
const applicationBasePath = "application";
const applicationEventFeedBasePath = "application_event_calendar";

const axiosOptions = {
  timeout: 20000,
  headers: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    "Content-Type": "application/json",
  },
};
const axiosClient = applyCaseMiddleware(axios.create(axiosOptions));
axiosClient.defaults.withCredentials = true

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
  } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    const errorMessage: string | undefined = error?.response?.data?.detail;
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
    url: `${REST_API_URL}${path}/`,
    headers: {
      "Content-Type": "application/json",
    },
    method: "get",
    params: apiParameters,
  });
}

const validateStatus = (status: number): boolean => status < 300;

async function apiPut<T>({ path, data }: RequestParameters): Promise<T> {
  const csrfToken = getCookie("csrftoken");
  return request<T>({
    url: `${REST_API_URL}${path}`,
    headers: {
      "Content-Type": "application/json",
      ...(csrfToken != null ? {"X-Csrftoken": csrfToken} : {}),
    },
    method: "put",
    data,
    validateStatus,
  });
}

async function apiPost<T>({ path, data }: RequestParameters): Promise<T> {
  const csrfToken = getCookie("csrftoken");
  return request<T>({
    url: `${REST_API_URL}${path}`,
    headers: {
      "Content-Type": "application/json",
      ...(csrfToken != null ? {"X-Csrftoken": csrfToken} : {}),
    },
    method: "post",
    data,
    validateStatus,
  });
}

export function getApplicationRounds(): Promise<ApplicationRound[]> {
  return apiGet<ApplicationRound[]>({
    path: `${applicationRoundBasePath}`,
  });
}

export function getApplicationRound(
  params: IDParameter
): Promise<ApplicationRound> {
  return apiGet<ApplicationRound>({
    path: `${applicationRoundBasePath}/${params.id}`,
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
    path: `${recurringReservationBasePath}`,
    parameters: { application: applicationId },
  });
}

interface IDParameter {
  id: number;
}

export function getReservationUnit(id: number): Promise<ReservationUnit> {
  return apiGet<ReservationUnit>({
    path: `reservation_unit/${id}`,
  });
}

export function getParameters(
  name:
    | "purpose"
    | "age_group"
    | "ability_group"
    | "reservation_unit_type"
    | "city"
): Promise<Parameter[]> {
  return apiGet<Parameter[]>({
    path: `${parameterBasePath}/${name}`,
  });
}

export function getApplication(id: number): Promise<Application> {
  return apiGet<Application>({
    path: `${applicationBasePath}/${id}`,
  });
}

export function saveApplication(
  application: Application
): Promise<Application> {
  if (application.id === undefined) {
    return apiPost<Application>({
      data: application,
      path: `${applicationBasePath}/`,
    });
  }
  return apiPut<Application>({
    data: application,
    path: `${applicationBasePath}/${application.id}/`,
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
  `${REST_API_URL}${applicationEventFeedBasePath}/${uuid}`;
