// eslint-disable-next-line @typescript-eslint/no-unused-vars
import NextAuth from "next-auth";

declare module "next-auth/jwt" {
  interface JWT {
    accessToken: string;
    accessTokenExpires: number;
    refreshToken: string;
    user: User;
    apiTokens: APITokens;
    error?: string;
  }
  interface JwtParams {
    token: JWT;
    user: User;
    account: TunnistamoAccount;
  }
}

declare module "next-auth" {
  type APITokens = {
    tilavaraus: string;
    profile: string;
  };
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

  interface User {
    id: string;
    name?: string;
    given_name?: string;
    family_name?: string;
    email: string;
  }
  interface Session {
    accessToken: string;
    accessTokenExpires: number;
    apiTokens: APITokens;
  }
}
