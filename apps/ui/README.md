# tilavarauspalvelu-ui ui app

Follow the instructions on the main README before this.

### Access with browser

UI is at https://local-tilavaraus.hel.fi:3000/
Backend is at http://127.0.0.1:8000/v1/

### Graphql workflow

## Available Scripts

In the project directory, you can run:

### `pnpm dev`

Runs the app in the development mode.\
Open [https://local-tilavaraus.hel.fi:3000]/(https://local-tilavaraus.hel.fi:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

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

## Cypress tests

### Running without docker

``` sh
cd apps/ui
# start the test server
pnpm dev:test
# headless
pnpm test:browser
# GUI
pnpm test:browser:open
```

### Running against a docker container

Mind that you need to specify both build args for browser variables and envs for the server variables.
There is no easy env file for these on purpose (no .envs should be loaded to docker).
The variables are explicit, to make it easier to match them to what we have on the CI.
If you find using them alot locally add a docker-compose file.

``` sh
# in repo root
docker build -t tilavaraus-ui-mocked \
  -f ./Dockerfile \
  --build-arg APP=ui \
  --build-arg NEXT_PUBLIC_TILAVARAUS_API_URL=http://localhost:4000 \
  --build-arg=NEXT_PUBLIC_MOCK_REQUESTS=true \
  --build-arg DISABLE_AUTH=true .

docker run -e TZ=Europe/Helsinki \
  -e DISABLE_AUTH=true \
  -e NEXT_PUBLIC_TILAVARAUS_API_URL=http://localhost:4000 \
  -e PORT=4000 \
  -e NEXT_PUBLIC_MOCK_REQUESTS=true \
  -e NEXTAUTH_SECRET=not-a-good-secret \
  -p 4000:4000 -d --ipc=host --name tilavaraus-ui-test \
  tilavaraus-ui-mocked

cd apps/ui
pnpm test:browser
```

### Mocking network requests

You can write handlers for rest and graphql requests in '/mocks/handlers.ts'. Can also be used for mocking browser data.

### GraphQL schema changes

If the queries change significantly the mocks in `mocks` might need to be updated after you've ran `generate-gql-types`.

## Configurable environment variables

See `.env.local.example` and Azure DevOps library for values.

| Name                           | Description                                                     |
| ------------------------------ | --------------------------------------------------------------- |
| NEXT_PUBLIC_BASE_URL           | application baseUrl                                             |
| NEXT_PUBLIC_TILAVARAUS_API_URL | tilavaraus-core base url                                        |
| NEXTAUTH_URL                   | the root path of next-auth apiroute                             |
| NEXTAUTH_SECRET                | secret used by next to sign cookies and webtokens               |
| DISABLE_AUTH                   | used for cypress testing, disables the next-auth private routes |
| NEXT_PUBLIC_MOCK_REQUESTS      | 'true' enables network level request mocking                    |
| NEXT_PUBLIC_MAPBOX_TOKEN       | token tor mapbox service                                        |
| NEXT_PUBLIC_SENTRY_DSN         | Sentry dsn                                                      |
| NEXT_PUBLIC_SENTRY_ENVIRONMENT | Sentry environment, for example 'test', 'prod'                  |
| SENTRY_AUTH_TOKEN              | auth token for sentry cli                                       |
| NEXT_PUBLIC_MATOMO_ENABLED     | 'true' enables matomo tracking                                  |
| OIDC_CLIENT_ID                 | Oidc client id                                                  |
| OIDC_CLIENT_SECRET             | secret used by oidc provider for encrypting therequests         |
| OIDC_URL                       | issuer for OIDC authentication                                  |
| OIDC_TOKEN_URL                 | path for OIDC token fetching authentication                     |
| OIDC_ACCESS_TOKEN_URL          | path for api token fetching                                     |
| OIDC_TILAVARAUS_API_SCOPE      | url for scope of tilavaraus api                                 |
| OIDC_PROFILE_API_SCOPE         | url for scope of profile api                                    |
| OIDC_SCOPE                     | scope for the OIDC provider                                     |
| OIDC_CALLBACK_URL              | url for OIDC authentication callback                            |
| NEXT_PUBLIC_OIDC_END_SESSION   | url for ending session with OIDC-provider                       |
| NEXT_PUBLIC_COOKIEHUB_ENABLED  | 'true' enables cookiehub consent module                         |
| NEXT_PUBLIC_HOTJAR_ENABLED     | 'true' enables hotjar tracking                                  |
| NEXT_ENV                       | 'development' or 'production'                                   |
