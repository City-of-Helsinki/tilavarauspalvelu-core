import axios from "axios";
import { oidcUrl, oidcClientId, apiScope } from "../const";

export const getApiAccessToken = (): string | null =>
  sessionStorage.getItem(`oidc.apiToken.${apiScope}`);

export const setApiAccessToken = (accessToken: string): void =>
  sessionStorage.setItem(`oidc.apiToken.${apiScope}`, accessToken);

export const getAccessToken = (): string | undefined => {
  const key = `oidc.user:${oidcUrl}/:${oidcClientId}`;
  const data = sessionStorage.getItem(key);

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
    url: `${oidcUrl}/api-tokens/`,
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

// XXX, TODO, some apis (for example reservationUnitCancellationRules)
// require api authentication but don't notify the caller about missing
// credentials. We need to hook this up properly but it will be done in
// separate task.
export const assertApiAccessTokenIsAvailable = (): Promise<boolean> => {
  if (getApiAccessToken()) {
    return Promise.resolve(false);
  }

  return updateApiAccessToken(getAccessToken())
    .then(() => true)
    .finally(() => true);
};
