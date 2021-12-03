import axios, { AxiosRequestConfig } from "axios";
import createAuthRefreshInterceptor from "axios-auth-refresh";
import applyCaseMiddleware from "axios-case-converter";
import { authEnabled } from "../const";
import {
  getApiAccessToken,
  updateApiAccessToken,
  getAccessToken,
} from "./util";

const axiosOptions = {
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
  },
};

const axiosClient = applyCaseMiddleware(axios.create(axiosOptions));

axiosClient.interceptors.request.use((req: AxiosRequestConfig) => {
  const apiAccessToken = getApiAccessToken();

  if (apiAccessToken) {
    req.headers.Authorization = `Bearer ${apiAccessToken}`;
  }
  return req;
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const refreshAuthLogic = (failedRequest: any) => {
  return updateApiAccessToken(getAccessToken())
    .then((apiAccessToken) => {
      // eslint-disable-next-line no-param-reassign
      failedRequest.response.config.headers.Authorization = `Bearer ${apiAccessToken}`;
      return Promise.resolve();
    })
    .catch((e) => {
      // eslint-disable-next-line
      console.error("Auth refresh failed", e);
    });
};

if (authEnabled) {
  createAuthRefreshInterceptor(axiosClient, refreshAuthLogic);
}

export default axiosClient;
