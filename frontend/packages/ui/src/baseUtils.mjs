// @ts-check
const isDev = process.env.NODE_ENV === "development";
export const CSP_HEADER = `
  base-uri 'self';
  form-action 'self';
  default-src 'self';
  font-src 'self' data:
    makasiini.hel.ninja
    https://*.hotjar.com;
  img-src 'self' blob: data:
    https://m.youtube.com https://www.youtube.com
    https://*.hotjar.com
    ${isDev ? "localhost:* 127.0.0.1:*" : ""};
  script-src 'self' blob
    https://m.youtube.com https://www.youtube.com
    https://webanalytics.digiaiiris.com
    https://*.hotjar.com
    'unsafe-inline'
    ${isDev ? "'unsafe-eval'" : ""};
  style-src 'self' 'unsafe-inline' https://*.hotjar.com;
  connect-src 'self' localhost:* 127.0.0.1:*
    https://webanalytics.digiaiiris.com
    https://*.hotjar.com https://*.hotjar.io wss://*.hotjar.com
    https://sentry.test.hel.ninja
    https://sentry.hel.fi;
  object-src 'none';
  frame-src https://palvelukartta.hel.fi;
  frame-ancestors 'none';
  upgrade-insecure-requests;
`;
