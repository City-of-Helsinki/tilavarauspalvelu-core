import axios from "axios";
import {
  apiScope,
  profileApiScope,
  isBrowser,
  apiTokenUrl,
  oidcClientId,
  oidcUrl,
} from "../const";

export const getApiAccessTokens = (): [string | null, string | null] => {
  if (!isBrowser) {
    return [null, null];
  }
  return [
    sessionStorage.getItem(`oidc.apiToken.${apiScope}`),
    sessionStorage.getItem(`oidc.apiToken.${profileApiScope}`),
  ];
};

const setApiAccessTokens = (
  accessToken: string,
  profileApiAccessToken: string
): void => {
  if (!isBrowser) {
    return;
  }
  if (accessToken) {
    sessionStorage.setItem(`oidc.apiToken.${apiScope}`, accessToken);
  }
  if (profileApiAccessToken) {
    sessionStorage.setItem(
      `oidc.apiToken.${profileApiScope}`,
      profileApiAccessToken
    );
  }
};

export const clearApiAccessToken = (): void => {
  if (!isBrowser) {
    return;
  }
  sessionStorage.removeItem(`oidc.apiToken.${apiScope}`);
  sessionStorage.removeItem(`oidc.apiToken.${profileApiScope}`);
};

export const getAccessToken = (): string | null => {
  const key = `oidc.user:${oidcUrl}:${oidcClientId}`;
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

export const updateApiAccessTokens = async (
  accessToken: string | undefined
): Promise<[string, string]> => {
  if (!accessToken) {
    throw new Error("Access token not available. Cannot update");
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
  const profileApiAccessToken = data[profileApiScope];
  setApiAccessTokens(apiAccessToken, profileApiAccessToken);

  return [apiAccessToken, profileApiAccessToken];
};
