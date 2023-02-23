import axios from "axios";
import createAuthRefreshInterceptor from "axios-auth-refresh";
import applyCaseMiddleware from "axios-case-converter";
import { authEnabled } from "../const";
import { getApiAccessToken, updateApiAccessToken } from "./util";

const axiosOptions = {
  headers: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    "Content-Type": "application/json",
  },
};

const axiosClient = applyCaseMiddleware(axios.create(axiosOptions));
const apiAccessToken = getApiAccessToken();

axiosClient.interceptors.request.use((req) => {
  if (apiAccessToken) {
    req.headers.Authorization = `Bearer ${apiAccessToken}`;
  }
  return req;
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const refreshAuthLogic = (failedRequest: any) => {
  const detail = failedRequest.response.data.detail as string;

  if (
    detail.indexOf("Autentikaatiotunnuksia ei") !== -1 ||
    detail.indexOf("AnonymousUser") !== -1 ||
    detail.indexOf("has expired") !== -1 ||
    detail.indexOf("too old") !== -1 ||
    detail.indexOf("No permission to mutate") !== -1
  ) {
    return updateApiAccessToken()
      .then((token) => {
        // eslint-disable-next-line no-param-reassign
        failedRequest.response.config.headers.Authorization = `Bearer ${token}`;
        return Promise.resolve();
      })
      .catch((e) => {
        // eslint-disable-next-line
        console.error("Auth refresh failed", e);
      });
  }

  return Promise.reject();
};

if (authEnabled) {
  createAuthRefreshInterceptor(axiosClient, refreshAuthLogic);
}

export default axiosClient;
