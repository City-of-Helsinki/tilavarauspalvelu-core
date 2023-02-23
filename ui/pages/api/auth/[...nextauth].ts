import axios from "axios";
import { NextApiRequest, NextApiResponse } from "next";
import NextAuth, { NextAuthOptions, Session, Awaitable, User } from "next-auth";
import { JWT } from "next-auth/jwt";
import getConfig from "next/config";

type TunnistamoAccount = {
  provider: string;
  type: "oauth";
  providerAccountId: string;
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
  expires_at: number;
  id_token: string;
};

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

type TilavarauspalveluUser = Omit<User, "image"> & {
  id: string;
  name: string;
  given_name: string;
  family_name: string;
  nickname: string;
  email: string;
  email_verified: boolean;
};

type APITokens = {
  tilavaraus: string;
  profile: string;
};

type ExtendedJWT = JWT & {
  accessToken: string;
  accessTokenExpires: number;
  refreshToken: string;
  user: TilavarauspalveluUser;
  apiTokens: APITokens;
  error?: string;
};

type JwtParams = {
  token: ExtendedJWT;
  user: TilavarauspalveluUser;
  account: TunnistamoAccount;
};

type ExtendedSession = Session & {
  accessToken: string;
  accessTokenExpires: number;
  user: TilavarauspalveluUser;
  apiTokens: APITokens;
};

type SessionParams = {
  token: ExtendedJWT;
  user: TilavarauspalveluUser;
  session: ExtendedSession;
};

const {
  serverRuntimeConfig: {
    oidcClientId,
    oidcClientSecret,
    oidcIssuer,
    oidcTokenUrl,
    oidcAccessTokenUrl,
    oidcProfileApiUrl,
    oidcTilavarausApiUrl,
    oidcScope,
    oidcCallbackUrl,
    env,
  },
} = getConfig();

const getApiAccessTokens = async (accessToken: string | undefined) => {
  if (!accessToken) {
    throw new Error("Access token not available. Cannot update");
  }
  if (!oidcProfileApiUrl || !oidcTilavarausApiUrl) {
    throw new Error("Application configuration error, missing api urls.");
  }
  const response = await axios.request({
    responseType: "json",
    method: "POST",
    url: oidcAccessTokenUrl,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  const { data } = response;

  if (!data) {
    throw new Error("No api-tokens present");
  }

  const apiAccessToken: string = data[oidcTilavarausApiUrl];
  const profileApiAccessToken: string = data[oidcProfileApiUrl];

  return [apiAccessToken, profileApiAccessToken];
};

const refreshAccessToken = async (token: ExtendedJWT) => {
  try {
    const response = await axios.request({
      url: oidcTokenUrl,
      method: "POST",
      data: {
        client_id: oidcClientId,
        grant_type: "refresh_token",
        refresh_token: token.refreshToken,
      },
      headers: {
        /* eslint-disable @typescript-eslint/naming-convention */
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Bearer ${token.accessToken}`,
      },
    });

    const { data } = response;

    if (!data) {
      throw new Error("Unable to refresh tokens");
    }

    const [tilavarausAPIToken, profileAPIToken] = await getApiAccessTokens(
      data.access_token
    );

    return {
      ...token,
      accessToken: data.access_token,
      accessTokenExpires: Date.now() + data.expires_in * 1000,
      refreshToken: data.refresh_token ?? token.refreshToken, // Fall back to old refresh token
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
  const wellKnownUrl = `${oidcIssuer}/.well-known/openid-configuration`;

  return {
    providers: [
      {
        id: "tunnistamo",
        name: "Tunnistamo OIDC",
        type: "oauth",
        issuer: oidcIssuer,
        clientId: oidcClientId,
        clientSecret: oidcClientSecret,
        idToken: true,
        checks: ["pkce", "state"],
        wellKnown: wellKnownUrl,
        accessTokenUrl: oidcAccessTokenUrl,
        token: oidcTokenUrl,
        profileUrl: oidcProfileApiUrl,
        authorization: {
          params: {
            scope: oidcScope,
            response_type: "code",
            redirect_uri: oidcCallbackUrl,
          },
        },
        profile(profile: TunnistamoProfile): Awaitable<TilavarauspalveluUser> {
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
      async jwt({ token, user, account }: JwtParams): Promise<ExtendedJWT> {
        // Initial sign in
        if (account && user) {
          const [tilavarausAPIToken, profileAPIToken] =
            await getApiAccessTokens(account.access_token);
          return {
            accessToken: account.access_token,
            accessTokenExpires: account.expires_at * 1000,
            refreshToken: account.refresh_token,
            user,
            apiTokens: {
              tilavaraus: tilavarausAPIToken,
              profile: profileAPIToken,
            },
          };
        }

        if (Date.now() < token.accessTokenExpires) {
          return token;
        }

        const refreshedToken = await refreshAccessToken(token);

        if (refreshedToken?.error) {
          return undefined;
        }

        return refreshedToken;
      },
      async session({
        session,
        token,
      }: SessionParams): Promise<ExtendedSession> {
        if (!token) return undefined;

        const { accessToken, accessTokenExpires, user, apiTokens } = token;

        return { ...session, accessToken, accessTokenExpires, user, apiTokens };
      },
      async redirect({ url, baseUrl }) {
        return url.startsWith(baseUrl)
          ? Promise.resolve(url)
          : Promise.resolve(baseUrl);
      },
    },
    pages: {
      signIn: `/`,
      signOut: "/logout",
    },
    debug: env === "development",
  };
};

export default function nextAuthApiHandler(
  req: NextApiRequest,
  res: NextApiResponse
): ReturnType<typeof NextAuth> {
  if (
    !oidcClientId ||
    !oidcClientSecret ||
    !oidcIssuer ||
    !oidcTokenUrl ||
    !oidcAccessTokenUrl ||
    !oidcProfileApiUrl ||
    !oidcTilavarausApiUrl ||
    !oidcScope ||
    !oidcCallbackUrl
  ) {
    throw new Error("Invalid configuration");
  }

  return NextAuth(req, res, options());
}

export type { ExtendedSession, ExtendedJWT };
