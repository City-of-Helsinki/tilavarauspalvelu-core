import { AxiosRequestConfig, AxiosResponse } from "axios";
import omit from "lodash/omit";
import axiosClient from "./auth/axiosClient";
import {
  Application,
  ApplicationRound,
  ReservationUnit,
  Parameter,
  AllocationRequest,
  AllocationResult,
  ApplicationEventStatus,
  ApplicationEventsDeclinedReservationUnits,
  Reservation,
  RecurringReservation,
  ApplicationRoundStatus,
  ApplicationStatus,
  ReservationStatus,
  ReservationUnitCapacity,
  ReservationUnitCalendarUrl,
  UnitWIP,
} from "./types";

const apiBaseUrl: string = process.env.REACT_APP_TILAVARAUS_API_URL || "";

const applicationRoundsBasePath = "application_round";
const reservationUnitsBasePath = "reservation_unit";
const parameterBasePath = "parameters";
const applicationBasePath = "application";
const allocationRequestBasePath = "allocation_request";
const allocationResultBasePath = "allocation_results";
const applicationEventStatusBasePath = "application_event_status";
const declinedApplicationEventReservationUnitsBasePath =
  "application_event_declined_reservation_unit";
const applicationEventWeeklyAmountReductionBasePath =
  "application_event_weekly_amount_reduction";
const reservationBasePath = "reservation";
const recurringReservationPath = "recurring_reservation";
const reservationUnitCapacityBasePath = "reservation_unit/capacity";
const applicationStatusBasePath = "application_status";
const reservationUnitCalendarUrlBasePath = "reservation_unit_calendar_url";

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

async function apiDelete<T>({ path }: RequestParameters): Promise<T> {
  return request<T>({
    url: `${apiBaseUrl}/${path}`,
    headers: {
      "Content-Type": "application/json",
    },
    method: "delete",
    validateStatus,
  });
}

async function apiPatch<T>({ path, data }: RequestParameters): Promise<T> {
  return request<T>({
    url: `${apiBaseUrl}/${path}`,
    headers: {
      "Content-Type": "application/json",
    },
    method: "patch",
    data,
    validateStatus,
  });
}

export function getApplicationRounds(): Promise<ApplicationRound[]> {
  return apiGet<ApplicationRound[]>({
    path: `v1/${applicationRoundsBasePath}`,
  });
}

export function getApplicationRound(
  params: IDParameter
): Promise<ApplicationRound> {
  return apiGet<ApplicationRound>({
    path: `v1/${applicationRoundsBasePath}/${params.id}`,
  });
}

export function saveApplicationRound(
  applicationRound: ApplicationRound
): Promise<ApplicationRound> {
  return apiPut<ApplicationRound>({
    data: applicationRound,
    path: `v1/${applicationRoundsBasePath}/${applicationRound.id}/`,
  });
}

export function patchApplicationRoundStatus(
  id: number,
  status: ApplicationRoundStatus
): Promise<ApplicationRound> {
  return apiPatch<ApplicationRound>({
    data: { status },
    path: `v1/${applicationRoundsBasePath}/${id}/`,
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

export function getApplications(
  params: ApplicationParameters
): Promise<Application[]> {
  return apiGet<Application[]>({
    parameters: params,
    path: `v1/${applicationBasePath}`,
  });
}

export function setApplicationStatus(
  applicationId: number,
  status: ApplicationStatus
): Promise<Application> {
  return apiPost<Application>({
    data: { applicationId, status },
    path: `v1/${applicationStatusBasePath}/`,
  });
}

interface AllocationRequestParams {
  applicationRoundId: number;
  applicationRoundBasketIds: number[];
}

export function triggerAllocation(
  params: AllocationRequestParams
): Promise<AllocationRequest> {
  return apiPost({
    data: params,
    path: `v1/${allocationRequestBasePath}/`,
  });
}

export function getAllocationStatus(id: number): Promise<AllocationRequest> {
  return apiGet({
    path: `v1/${allocationRequestBasePath}/${id}`,
  });
}

interface AllocationResultsParams {
  applicant?: number;
  applicationRoundId: number;
  serviceSectorId?: number;
  applicationEvent?: string;
  reservationUnit?: number;
}

export function getAllocationResults(
  params: AllocationResultsParams
): Promise<AllocationResult[]> {
  return apiGet({
    parameters: params,
    path: `v1/${allocationResultBasePath}`,
  });
}

interface AllocationResultParams {
  id: number;
  serviceSectorId?: number;
}

export function getAllocationResult(
  params: AllocationResultParams
): Promise<AllocationResult> {
  return apiGet({
    parameters: omit(params, "id"),
    path: `v1/${allocationResultBasePath}/${params.id}`,
  });
}

export function deleteAllocationResult(id: number): Promise<void> {
  return apiDelete({
    path: `v1/${allocationResultBasePath}/${id}/`,
  });
}

export interface ApplicationStatusPayload {
  status: ApplicationStatus;
  applicationId: number;
}

export function setApplicationStatuses(
  payload: ApplicationStatusPayload[]
): Promise<ApplicationStatusPayload[]> {
  return apiPost({
    data: payload,
    path: `v1/${applicationStatusBasePath}/`,
  });
}

interface ApplicationEventPayload {
  status: ApplicationEventStatus;
  applicationEventId: number;
}

export function setApplicationEventStatuses(
  payload: ApplicationEventPayload[]
): Promise<ApplicationEventPayload[]> {
  return apiPost({
    data: payload,
    path: `v1/${applicationEventStatusBasePath}/`,
  });
}

export function getDeclinedApplicationEventReservationUnits(
  applicationEventId: number
): Promise<ApplicationEventsDeclinedReservationUnits> {
  return apiGet({
    path: `v1/${declinedApplicationEventReservationUnitsBasePath}/${applicationEventId}`,
  });
}

export function setDeclinedApplicationEventReservationUnits(
  applicationEventId: number,
  reservationUnitIds: number[]
): Promise<ApplicationEventsDeclinedReservationUnits> {
  return apiPut({
    data: {
      declinedReservationUnitIds: reservationUnitIds,
    },
    path: `v1/${declinedApplicationEventReservationUnitsBasePath}/${applicationEventId}/`,
  });
}

export function setApplicationEventScheduleResultStatus(
  id: number,
  accepted: boolean
): Promise<AllocationResult> {
  return apiPatch({
    path: `v1/${allocationResultBasePath}/${id}/`,
    data: {
      accepted,
    },
  });
}

export function rejectApplicationEventSchedule(
  applicationEventScheduleResultId: number
): Promise<void> {
  return apiPost({
    path: `v1/${applicationEventWeeklyAmountReductionBasePath}/`,
    data: { applicationEventScheduleResultId },
  });
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

interface IReservationUnitCapacityParams {
  reservationUnit: number;
  periodStart: string;
  periodEnd: string;
}

export function getReservationUnitCapacity(
  parameters: IReservationUnitCapacityParams
): Promise<ReservationUnitCapacity> {
  return apiGet({
    path: `v1/${reservationUnitCapacityBasePath}`,
    parameters,
  });
}

export function getReservationUnitCalendarUrl(
  reservationUnitId: number
): Promise<ReservationUnitCalendarUrl> {
  return apiGet({
    path: `v1/${reservationUnitCalendarUrlBasePath}/${reservationUnitId}`,
  });
}

export async function getUnits(): Promise<UnitWIP[]> {
  const result = [
    {
      id: 1,
      name: "Toimipiste #1",
      service: "Palvelu",
      area: "",
    },
    {
      id: 2,
      name: "Toimipiste #2",
      service: "",
      area: "Alue",
    },
    {
      id: 3,
      name: "Toimipiste #3",
      service: "Palvelu #2",
      area: "Alue #2",
    },
  ];
  return result;
}
