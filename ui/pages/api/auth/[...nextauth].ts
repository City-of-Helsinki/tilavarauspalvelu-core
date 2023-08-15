/* eslint-disable camelcase */
import { NextApiRequest, NextApiResponse } from "next";
import NextAuth, { NextAuthOptions, Session, Awaitable, User } from "next-auth";
import { JWT } from "next-auth/jwt";
import getConfig from "next/config";
import {
  refreshAccessToken,
  getApiAccessTokens,
} from "common/src/next-auth/helpers";

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

const EXP_MS = (10 / 2) * 60 * 1000;

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
      async jwt({ token, user, account }): Promise<JWT> {
        // Initial sign in
        if (account && user) {
          const [tilavaraus, profile] = await getApiAccessTokens({
            accessToken: account.access_token,
            profileApiScope: oidcProfileApiUrl,
            tilavarausApiScope: oidcTilavarausApiUrl,
            accessTokenUrl: oidcAccessTokenUrl,
          });
          return {
            accessToken: account.access_token,
            // HACK to deal with incorrect exp value
            accessTokenExpires: Date.now() + EXP_MS, // account.expires_at * 1000,
            refreshToken: account.refresh_token,
            user,
            apiTokens: {
              tilavaraus,
              profile,
            },
          };
        }

        if (Date.now() < token.accessTokenExpires) {
          return token;
        }

        const refreshedToken = await refreshAccessToken(
          token,
          oidcTokenUrl,
          oidcClientId
        );
        const [tilavaraus, profile] = await getApiAccessTokens({
          accessToken: refreshedToken.accessToken,
          profileApiScope: oidcProfileApiUrl,
          tilavarausApiScope: oidcTilavarausApiUrl,
          accessTokenUrl: oidcAccessTokenUrl,
        });

        if (refreshedToken?.error) {
          throw new Error(refreshedToken.error);
        }

        return {
          ...refreshedToken,
          apiTokens: {
            tilavaraus,
            profile,
          },
        };
      },
      async session({ session, token }): Promise<Session> {
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

const authOptions = options();

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

  return NextAuth(req, res, authOptions);
}

export { authOptions };
