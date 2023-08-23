/* eslint-disable no-console */
/* eslint-disable camelcase */
import { NextApiRequest, NextApiResponse } from "next";
import NextAuth, { NextAuthOptions, Awaitable, User } from "next-auth";
import { z } from "zod";
import { env } from "app/env.mjs";
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

const options = (): NextAuthOptions => {
  const wellKnown = `${env.OIDC_URL}/.well-known/openid-configuration`;

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
        wellKnown,
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
          if (!account.access_token) {
            throw new Error("Access token not available. Cannot update");
          }
          if (!env.OIDC_PROFILE_API_SCOPE || !env.OIDC_TILAVARAUS_API_SCOPE) {
            throw new Error(
              "Application configuration error, missing api urls."
            );
          }
          if (!env.OIDC_ACCESS_TOKEN_URL) {
            throw new Error(
              "Application configuration error, missing access token url."
            );
          }

          const [tilavaraus, profile] = await getApiAccessTokens({
            accessToken: account.access_token,
            profileApiScope: env.OIDC_PROFILE_API_SCOPE,
            tilavarausApiScope: env.OIDC_TILAVARAUS_API_SCOPE,
            accessTokenUrl: env.OIDC_ACCESS_TOKEN_URL,
          });

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
              tilavaraus,
              profile,
            },
          };
        }

        if (!token) {
          throw new Error("No token");
        }

        if (Date.now() < token.accessTokenExpires) {
          return token;
        }

        const EnvSchema = z.object({
          OIDC_TOKEN_URL: z.string(),
          OIDC_CLIENT_ID: z.string(),
          OIDC_PROFILE_API_SCOPE: z.string(),
          OIDC_TILAVARAUS_API_SCOPE: z.string(),
          OIDC_ACCESS_TOKEN_URL: z.string(),
        });
        const envParsed = EnvSchema.parse(process.env);

        const refreshedToken = await refreshAccessToken(
          token,
          envParsed.OIDC_TOKEN_URL,
          envParsed.OIDC_CLIENT_ID
        );
        const [tilavaraus, profile] = await getApiAccessTokens({
          accessToken: refreshedToken.accessToken,
          profileApiScope: envParsed.OIDC_PROFILE_API_SCOPE,
          tilavarausApiScope: envParsed.OIDC_TILAVARAUS_API_SCOPE,
          accessTokenUrl: envParsed.OIDC_ACCESS_TOKEN_URL,
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
      signOut: "/auth/logout",
      error: "/auth/error",
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
