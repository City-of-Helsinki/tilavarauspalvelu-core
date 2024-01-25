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
  --build-arg NEXT_PUBLIC_TILAVARAUS_API_URL=http://127.0.0.1:4000

docker run -e TZ=Europe/Helsinki \
  -e NEXT_PUBLIC_TILAVARAUS_API_URL=http://127.0.0.1:4000 \
  -e PORT=4000 \
  -p 4000:4000 -d --ipc=host --name tilavaraus-ui-test \
  tilavaraus-ui-mocked

cd apps/ui
pnpm test:browser
```

### Mocking network requests

You can write handlers for rest and graphql requests in '/mocks/handlers.ts'. Can also be used for mocking browser data.

## Configurable environment variables

See `.env.local.example` and Azure DevOps library for values.

| Name                           | Description                                                     |
| ------------------------------ | --------------------------------------------------------------- |
| NEXT_PUBLIC_BASE_URL           | application baseUrl                                             |
| TILAVARAUS_API_URL             | tilavaraus-core base url                                        |
| PROFILE_UI_URL                 | helsinki profile frontend url for a link                        |
| MAPBOX_TOKEN                   | token tor mapbox service                                        |
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
