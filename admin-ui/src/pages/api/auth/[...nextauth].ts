/* eslint-disable no-console */
/* eslint-disable camelcase */
import axios from "axios";
import { NextApiRequest, NextApiResponse } from "next";
import NextAuth, { NextAuthOptions, Awaitable, User } from "next-auth";
import { JWT } from "next-auth/jwt";
import { env } from "app/env.mjs";
import { logAxiosError } from "common/src/axiosUtils";

type TunnistamoProfile = {
  iss: string;
  sub: string;
  aud: string;
  exp: number;
  iat: number;
  auth_time: number;
  at_hash: string;
  name: string;
  given_name: string;
  family_name: string;
  nickname: string;
  email: string;
  email_verified: boolean;
  azp: string;
  sid: string;
  amr: string;
  loa: string;
};

const getApiAccessTokens = async (accessToken: string | undefined) => {
  if (!accessToken) {
    throw new Error("Access token not available. Cannot update");
  }
  if (!env.OIDC_PROFILE_API_SCOPE || !env.OIDC_TILAVARAUS_API_SCOPE) {
    throw new Error("Application configuration error, missing api urls.");
  }
  const data = await axios
    .request({
      responseType: "json",
      method: "POST",
      url: env.OIDC_ACCESS_TOKEN_URL,
      headers: {
        Authorization: `Bearer ${accessToken}`,
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

  const apiAccessToken: string = data[env.OIDC_TILAVARAUS_API_SCOPE];
  const profileApiAccessToken: string = data[env.OIDC_PROFILE_API_SCOPE];

  return [apiAccessToken, profileApiAccessToken];
};

// Tunnistamo tokens are valid for 10 minutes
// Half the expire time so leaving the browser inactive for 5 minutes at the tail end of 9 min session
// doesn't cut the session.
const EXP_MS = (10 / 2) * 60 * 1000;

const refreshAccessToken = async (token: JWT) => {
  try {
    const data = await axios
      .request({
        url: env.OIDC_TOKEN_URL,
        method: "POST",
        data: {
          client_id: env.OIDC_CLIENT_ID,
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
    const [tilavarausAPIToken, profileAPIToken] = await getApiAccessTokens(
      access_token
    );

    return {
      ...token,
      accessToken: access_token,
      // HACK to deal with incorrect exp value
      accessTokenExpires: Date.now() + EXP_MS, // account.expires_at * 1000,
      refreshToken: refresh_token ?? token.refreshToken, // Fall back to old refresh token
      apiTokens: {
        tilavaraus: tilavarausAPIToken,
        profile: profileAPIToken,
      },
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

const options = (): NextAuthOptions => {
  const wellKnownUrl = `${env.OIDC_URL}/.well-known/openid-configuration`;

  const authorization = {
    params: {
      scope: env.OIDC_SCOPE,
      response_type: "code",
      redirect_uri: env.OIDC_CALLBACK_URL,
    },
  };

  return {
    providers: [
      {
        id: "tunnistamo",
        name: "Tunnistamo OIDC",
        type: "oauth",
        issuer: env.OIDC_URL,
        clientId: env.OIDC_CLIENT_ID,
        clientSecret: env.OIDC_CLIENT_SECRET,
        idToken: true,
        checks: ["pkce", "state"],
        wellKnown: wellKnownUrl,
        accessTokenUrl: env.OIDC_ACCESS_TOKEN_URL,
        token: env.OIDC_TOKEN_URL,
        profileUrl: env.OIDC_PROFILE_API_SCOPE,
        authorization,
        // TODO don't copy unneccessary fields just bloats the cookie
        // TODO replace casting with schema validation
        profile(profile: TunnistamoProfile): Awaitable<User> {
          return {
            id: profile.sub,
            ...profile,
          };
        },
      },
    ],
    session: {
      strategy: "jwt",
    },
    callbacks: {
      async jwt({ token, user, account }) {
        // Initial sign in
        if (account && user) {
          const [tilavarausAPIToken, profileAPIToken] =
            await getApiAccessTokens(account.access_token);
          if (account.access_token == null) {
            throw new Error("No access token");
          }
          if (account.refresh_token == null) {
            throw new Error("No refresh token");
          }
          const accessTokenExpires =
            (account.expires_at ?? Date.now() + EXP_MS / 1000) * 1000;

          return {
            accessToken: account.access_token,
            accessTokenExpires,
            refreshToken: account.refresh_token,
            user,
            apiTokens: {
              tilavaraus: tilavarausAPIToken,
              profile: profileAPIToken,
            },
          };
        }

        if (!token) {
          throw new Error("No token");
        }

        if (Date.now() < token.accessTokenExpires) {
          return token;
        }

        const refreshedToken = await refreshAccessToken(token);

        if (refreshedToken?.error) {
          throw new Error(refreshedToken.error);
        }

        return refreshedToken;
      },
      async session({ session, token }) {
        if (!token) {
          // TODO what should this return on no token? DefaultSession / throw error?
          return session;
        }

        const { accessToken, accessTokenExpires, user, apiTokens } = token;

        return { ...session, accessToken, accessTokenExpires, user, apiTokens };
      },
      async redirect({ url }) {
        return url;
      },
    },
    pages: {
      signIn: `/`,
      signOut: "/logout",
    },
    debug: env.NEXT_ENV === "development",
  };
};

export default function nextAuthApiHandler(
  req: NextApiRequest,
  res: NextApiResponse
): ReturnType<typeof NextAuth> {
  return NextAuth(req, res, options());
}
