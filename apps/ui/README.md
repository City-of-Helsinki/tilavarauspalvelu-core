# tilavarauspalvelu-ui ui app

Follow the instructions on the main README before this.

### Graphql workflow

## Available Scripts

In the project directory, you can run:

### `pnpm dev`

Runs the app in the development mode.\
Open [http://localhost:3000]/(http://locahost:3000) to view it in the browser.

### `pnpm dev:test`

Runs the dev server and mocks network requests

### `pnpm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `pnpm test:browser`

Runs end to end tests against local setup. Both ui and api must be running before running this script.

### `pnpm build`

Builds a production version

### `pnpm start`

Starts production version

## Configurable environment variables

See `.env.local.example` and Azure DevOps library for values.

| Name                           | Description                                                     |
| ------------------------------ | --------------------------------------------------------------- |
| NEXT_PUBLIC_BASE_URL           | application baseUrl                                             |
| TILAVARAUS_API_URL             | tilavaraus-core base url                                        |
| PROFILE_UI_URL                 | helsinki profile frontend url for a link                        |
| SENTRY_DSN                     | Sentry dsn                                                      |
| SENTRY_ENVIRONMENT             | Sentry environment, for example 'test', 'prod'                  |
| SENTRY_AUTH_TOKEN              | auth token for sentry cli                                       |
| MATOMO_ENABLED                 | 'true' enables matomo tracking                                  |
| COOKIEHUB_ENABLED              | 'true' enables cookiehub consent module                         |
| HOTJAR_ENABLED                 | 'true' enables hotjar tracking                                  |
| ENABLE_FETCH_HACK              | 'true' to fix localhost dns problem                             |
| SKIP_ENV_VALIDATION            | 'true' to allow empty env values (especially for build / test)  |

`TILAVARAUS_API_URL` is required to be set because the node server doing SSR can't connect to the backend without it.
Unlike a pure browser bundle even if they are running on the same host, the SSR is a separate server behind a reverse proxy.

`ENABLE_FETCH_HACK` has no effect if `API_URL` is not localhost but you should NOT enable it on an actual server deployment.

`SKIP_ENV_VALIDATION` should only be used for building and testing.
