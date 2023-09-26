import axios, { type AxiosRequestConfig, type AxiosResponse } from "axios";
import applyCaseMiddleware from "axios-case-converter";
import {
  Application,
  ApplicationRound,
  ReservationUnit,
  Parameter,
  Reservation,
  RecurringReservation,
  ApplicationStatus,
  ReservationStatus,
} from "./types";
import { API_BASE_URL } from "./const";

const axiosOptions = {
  headers: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    "Content-Type": "application/json",
  },
};
const axiosClient = applyCaseMiddleware(axios.create(axiosOptions));
axiosClient.defaults.withCredentials = true;

const apiBaseUrl = API_BASE_URL;

const applicationRoundsBasePath = "application_round";
const reservationUnitsBasePath = "reservation_unit";
const parameterBasePath = "parameters";
const applicationBasePath = "application";
const reservationBasePath = "reservation";
const recurringReservationPath = "recurring_reservation";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface QueryParameters {}

interface RequestParameters {
  path: string;
  headers?: { [key: string]: string };
  parameters?: QueryParameters;
  data?: unknown;
}

enum ApiResponseFormat {
  json = "json",
}

interface ApiParameters extends QueryParameters {
  format: ApiResponseFormat;
}

// TODO replace with fetch
async function request<T>(requestConfig: AxiosRequestConfig): Promise<T> {
  const config: AxiosRequestConfig = requestConfig;

  const response: AxiosResponse<T> = await axiosClient.request<
    T,
    AxiosResponse<T>
  >(config);
  return response.data;
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
    url: `${apiBaseUrl}/${path}`,
    headers: {
      "Content-Type": "application/json",
    },
    method: "get",
    params: apiParameters,
  });
}

export function getApplicationRound(
  params: IDParameter
): Promise<ApplicationRound> {
  return apiGet<ApplicationRound>({
    path: `v1/${applicationRoundsBasePath}/${params.id}`,
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
  id: number;
}

export function getReservationUnit(id: number): Promise<ReservationUnit> {
  return apiGet<ReservationUnit>({
    path: `v1/${reservationUnitsBasePath}/${id}`,
  });
}

export type ParameterNames =
  | "purpose"
  | "age_group"
  | "ability_group"
  | "reservation_unit_type"
  | "city";

export function getParameters(name: ParameterNames): Promise<Parameter[]> {
  return apiGet<Parameter[]>({
    path: `v1/${parameterBasePath}/${name}`,
  });
}

export function getApplication(id: number): Promise<Application> {
  return apiGet<Application>({
    path: `v1/${applicationBasePath}/${id}`,
  });
}

export interface ApplicationParameters {
  applicationRound?: number;
  status?: string;
}

export interface ApplicationStatusPayload {
  status: ApplicationStatus;
  applicationId: number;
}

interface IRecurringReservationParams {
  application?: number;
  applicationEvent?: number;
  ordering?: string;
  reservationUnit?: string;
  search?: string;
}

interface IReservationParams {
  active?: boolean;
  ordering?: string;
  reservationUnit?: string;
  search?: string;
  state?: ReservationStatus;
}

export function getRecurringReservations(
  parameters: IRecurringReservationParams
): Promise<RecurringReservation[]> {
  return apiGet({
    path: `v1/${recurringReservationPath}`,
    parameters,
  });
}

export function getRecurringReservation(
  id: number
): Promise<RecurringReservation> {
  return apiGet({
    path: `v1/${recurringReservationPath}/${id}`,
  });
}

export function getReservations(
  parameters: IReservationParams
): Promise<Reservation[]> {
  return apiGet({
    path: `v1/${reservationBasePath}`,
    parameters,
  });
}

export function getReservation(id: number): Promise<Reservation> {
  return apiGet({
    path: `v1/${reservationBasePath}/${id}`,
  });
}
