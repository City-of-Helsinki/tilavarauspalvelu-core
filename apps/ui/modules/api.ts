import axios, { type AxiosRequestConfig, type AxiosResponse } from "axios";
import applyCaseMiddleware from "axios-case-converter";
import { getCookie } from "typescript-cookie";
import { type Application } from "common/types/common";
import { REST_API_URL } from "./const";
import { ApiError } from "./ApiError";

const applicationBasePath = "application";

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
