import axios from "axios";
import {
  apiScope,
  oidcUrl,
  oidcClientId,
  isBrowser,
  apiTokenUrl,
} from "../const";

export const getApiAccessToken = (): string | null =>
  isBrowser && sessionStorage.getItem(`oidc.apiToken.${apiScope}`);

const setApiAccessToken = (accessToken: string): void =>
  isBrowser && sessionStorage.setItem(`oidc.apiToken.${apiScope}`, accessToken);

export const clearApiAccessToken = (): void =>
  isBrowser && sessionStorage.removeItem(`oidc.apiToken.${apiScope}`);

export const getAccessToken = (): string | null => {
  const key = `oidc.user:${oidcUrl}/:${oidcClientId}`;
  const data = isBrowser && sessionStorage.getItem(key);

  if (data) {
    try {
      const parsed = JSON.parse(data);
      return parsed.access_token;
    } catch (Exception) {
      return undefined;
    }
  }
  return undefined;
};

export const updateApiAccessToken = async (
  accessToken: string | undefined
): Promise<string> => {
  if (!accessToken) {
    throw new Error("Api access token not available. Cannot update");
  }
  if (!apiScope) {
    throw new Error("Application configuration error, illegal api scope.");
  }
  const response = await axios.request({
    responseType: "json",
    method: "POST",
    url: apiTokenUrl,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  const { data } = response;

  const apiAccessToken = data[apiScope];
  setApiAccessToken(apiAccessToken);

  return apiAccessToken;
};
