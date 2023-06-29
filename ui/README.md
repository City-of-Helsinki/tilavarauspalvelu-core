This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Prerequisites

1. Node 16 (`nvm use`)
1. Yarn

### Recommended editor/IDE tooling

- eslint
- prettier
- stylelint

## Developing locally

First check out the latest version of the backend/api project from https://github.com/City-of-Helsinki/tilavarauspalvelu-core and change current directory to backend project and start it:

```
docker-compose up backend --build --force-recreate
```

Make sure /etc/hosts point domain local-tilavaraus.hel.fi to 127.0.0.1. This is important because tunnistamo currently does not provide SameSite information for the cookies it uses. Some browsers (like Chrome) default the SameSite to be Lax. Because of this tunnistamo and the site it is authenticating for need to share same-site context. Without fulfilling this requirement the silent renew might not work properly due to browser blocking required cookies.

```
127.0.0.1       local-tilavaraus.hel.fi
```

Create a self-signed certificate for SSL connection on developpment server by running the following command in the common directory

```
yarn generate-certificate
```

### Start UI

```
yarn dev
```

### When GQL api changes and you need to update the Typescript types

go to common module and run

```
yarn generate-gql-types
```

### Access with browser

UI is at https://local-tilavaraus.hel.fi:3000/
Backend is at http://127.0.0.1:8000/v1/

### Test data

Some test data can be loaded to the backend with following command:

```
docker exec tilavarauspalvelu-core_dev_1 python manage.py loaddata fixtures/cases.json
```

You can also manually add test data by visiting the django admin at http://127.0.0.1:8000/admin after you create admin user:

```
docker exec -ti tilavarauspalvelu-core_dev_1 python manage.py createsuperuser
```

### Graphql workflow

When server has new api changes -> update schema & generate new types by running: `yarn update-schema generate-gql-types` in common module.

- Protip for VSCode users: install https://marketplace.visualstudio.com/items?itemName=GraphQL.vscode-graphql to get autocomplete suggestions and query validation when writing queries.

When a query is modified and you need new mock data types run: `generate-gql-types`, see [mocks/handlers/singleSearch.ts](mocks/handlers/singleSearch.ts) for example on how to use type safe mock test data.

## Available Scripts

In the project directory, you can run:

### `yarn dev`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `yarn dev:test`

Runs the dev server and mocks network requests

### `yarn test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `yarn test:browser`

Runs end to end tests against local setup. Both ui and api must be running before running this script.

### `yarn build`

Builds a production version

### `yarn start`

Starts production version

### Mocking network requests

You can write handlers for rest and graphql requests in '/mocks/handlers.ts'. Can also be used for mocking browser data.

## Configurable environment variables

See `.env.local.example` and Azure DevOps library for values.

| Name                           | Description                                                     |
| ------------------------------ | --------------------------------------------------------------- |
| NEXT_PUBLIC_BASE_URL           | application baseUrl                                             |
| TILAVARAUS_API_URL             | tilavaraus-core base url                                        |
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
