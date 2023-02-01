import { NextApiRequest } from "next";
import axios, { AxiosRequestConfig } from "axios";
import createAuthRefreshInterceptor from "axios-auth-refresh";
import applyCaseMiddleware from "axios-case-converter";
import { isBrowser, authEnabled, PROFILE_TOKEN_HEADER } from "../const";
import {
  getAccessToken,
  getApiAccessTokens,
  updateApiAccessTokens,
} from "./util";

const axiosOptions = {
  timeout: 20000,
  headers: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    "Content-Type": "application/json",
  },
};

const axiosClient = applyCaseMiddleware(axios.create(axiosOptions));
if (isBrowser && authEnabled) {
  axiosClient.interceptors.request.use(
    (req: AxiosRequestConfig & NextApiRequest) => {
      const [apiAccessToken, profileApiAccessToken] = getApiAccessTokens();

      if (apiAccessToken) {
        req.headers.Authorization = `Bearer ${apiAccessToken}`;
      }
      if (profileApiAccessToken) {
        req.headers[PROFILE_TOKEN_HEADER] = `${profileApiAccessToken}`;
      }
      return req;
    }
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const refreshAuthLogic = (failedRequest: any) => {
    const accessToken = getAccessToken();
    return updateApiAccessTokens(accessToken).then((apiAccessTokens) => {
      const [apiAccessToken, profileApiAccessToken] = apiAccessTokens;
      if (apiAccessToken) {
        // eslint-disable-next-line no-param-reassign
        failedRequest.response.config.headers.Authorization = `Bearer ${apiAccessToken}`;
      }
      if (profileApiAccessToken) {
        // eslint-disable-next-line no-param-reassign
        failedRequest.response.config.headers[
          PROFILE_TOKEN_HEADER
        ] = `${profileApiAccessToken}`;
      }
      return Promise.resolve();
    });
  };

  createAuthRefreshInterceptor(axiosClient, refreshAuthLogic);
}

export default axiosClient;
