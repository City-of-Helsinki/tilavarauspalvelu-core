/* eslint-disable camelcase */
import axios from "axios";
import { JWT } from "next-auth/jwt";
import { logAxiosError } from "../axiosUtils";

export const getApiAccessTokens = async (params: {
  accessToken: string;
  profileApiScope: string;
  tilavarausApiScope: string;
  accessTokenUrl: string;
}) => {
  const data = await axios
    .request({
      responseType: "json",
      method: "POST",
      url: params.accessTokenUrl,
      headers: {
        Authorization: `Bearer ${params.accessToken}`,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        "Content-Type": "application/x-www-form-urlencoded",
      },
    })
    .then((x) => x.data)
    .catch((error) => {
      logAxiosError(error);
      throw new Error("Error getting api access tokens");
    });

  if (!data) {
    throw new Error("No api-tokens present");
  }

  const apiAccessToken: string = data[params.tilavarausApiScope];
  const profileApiAccessToken: string = data[params.profileApiScope];

  return [apiAccessToken, profileApiAccessToken];
};

// Tunnistamo tokens are valid for 10 minutes
// Half the expire time so leaving the browser inactive for 5 minutes at the tail end of 9 min session
// doesn't cut the session.
const EXP_MS = (10 / 2) * 60 * 1000;
export const refreshAccessToken = async (
  token: JWT,
  tokenUrl: string,
  clientId: string
) => {
  try {
    const data = await axios
      .request({
        url: tokenUrl,
        method: "POST",
        data: {
          client_id: clientId,
          grant_type: "refresh_token",
          refresh_token: token.refreshToken,
        },
        headers: {
          /* eslint-disable @typescript-eslint/naming-convention */
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${token.accessToken}`,
        },
      })
      .then((x) => x.data)
      .catch((error) => {
        logAxiosError(error);
        throw new Error("Error getting RefreshToken from Tunnistamo");
      });

    if (!data) {
      throw new Error("Unable to refresh tokens");
    }

    if (typeof data !== "object") {
      throw new Error("RefreshToken req.data is NOT an object");
    }
    const { access_token, expires_in, refresh_token } = data as Record<
      string,
      unknown
    >;

    if (!access_token || typeof access_token !== "string") {
      throw new Error("RefreshToken req.data contains NO access_token");
    }
    if (!expires_in || typeof expires_in !== "number") {
      throw new Error("RefreshToken req.data contains contains NO expires_in");
    }
    if (!refresh_token || typeof refresh_token !== "string") {
      throw new Error("RefreshToken req.data contains NO refresh_token");
    }

    return {
      ...token,
      accessToken: access_token,
      // HACK to deal with incorrect exp value
      accessTokenExpires: Date.now() + EXP_MS, // account.expires_at * 1000,
      refreshToken: refresh_token ?? token.refreshToken, // Fall back to old refresh token
    };
  } catch (error) {
    // eslint-disable-next-line
    console.error(error);

    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
};
