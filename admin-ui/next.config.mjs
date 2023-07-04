import { join } from "path";
import analyser from "@next/bundle-analyzer";
import * as url from "url";

const ROOT_PATH = url.fileURLToPath(new URL(".", import.meta.url));

const withBundleAnalyzer = analyser({
  enabled: process.env.ANALYZE === "true",
});

/** @type {import('next').NextConfig} */
export default withBundleAnalyzer({
  typescript: {
    ignoreBuildErrors: true,
  },
  transpilePackages: ["common"],
  sassOptions: {
    includePaths: [join(ROOT_PATH, "src")],
  },
  async rewrites() {
    return [
      // Do not rewrite API routes
      {
        source: "/api/:any*",
        destination: "/api/:any*",
      },
      // Rewrite everything else to use `pages/index`
      {
        source: "/:any*",
        destination: "/",
      },
    ];
  },
  reactStrictMode: true,
  // common with user ui
  compiler: {
    styledComponents: {
      ssr: true,
      displayName: true,
    },
  },
  serverRuntimeConfig: {
    apiBaseUrl: process.env.TILAVARAUS_API_URL,
    authEnabled: process.env.DISABLE_AUTH !== "true",
    oidcClientId: process.env.OIDC_CLIENT_ID,
    oidcClientSecret: process.env.OIDC_CLIENT_SECRET,
    oidcIssuer: process.env.OIDC_URL,
    oidcTokenUrl: process.env.OIDC_TOKEN_URL,
    oidcAccessTokenUrl: process.env.OIDC_ACCESS_TOKEN_URL,
    oidcScope: process.env.OIDC_SCOPE,
    oidcCallbackUrl: process.env.OIDC_CALLBACK_URL,
    oidcProfileApiUrl: process.env.OIDC_PROFILE_API_SCOPE,
    oidcTilavarausApiUrl: process.env.OIDC_TILAVARAUS_API_SCOPE,
    env: process.env.NEXT_ENV,
  },
  publicRuntimeConfig: {
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL,
    apiBaseUrl: process.env.TILAVARAUS_API_URL,
    authEnabled: process.env.DISABLE_AUTH !== "true",
    oidcEndSessionUrl: process.env.NEXT_PUBLIC_OIDC_END_SESSION,
    sentryDSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    sentryEnvironment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT,
    cookiehubEnabled: process.env.NEXT_PUBLIC_COOKIEHUB_ENABLED === "true",
    matomoEnabled: process.env.NEXT_PUBLIC_MATOMO_ENABLED === "true",
    hotjarEnabled: process.env.NEXT_PUBLIC_HOTJAR_ENABLED === "true",
    mockRequests: process.env.NEXT_PUBLIC_MOCK_REQUESTS === "true",
    mapboxToken: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
  },
});
