import axios from "axios";
import CustomUserStore from "./CustomUserStore";
import { oidcUrl, apiScope } from "../const";

const apiAccessTokenStorage = localStorage;
const customUserStore = new CustomUserStore();

export const getApiAccessToken = (): string | null =>
  apiAccessTokenStorage.getItem(`oidc.apiToken.${apiScope}`);

export const setApiAccessToken = (accessToken: string): void =>
  apiAccessTokenStorage.setItem(`oidc.apiToken.${apiScope}`, accessToken);

export const getAccessToken = (): string | undefined => {
  return customUserStore.getAccessToken();
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

export const localLogout = (): void => {
  Object.keys(apiAccessTokenStorage).forEach((key) => {
    if (key != null && key.startsWith("oidc.api")) {
      apiAccessTokenStorage.removeItem(key);
    }
  });
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
