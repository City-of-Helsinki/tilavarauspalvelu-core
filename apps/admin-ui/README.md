# tilavarauspalvelu-admin-ui

## Prerequisites

1. Node 16 (`nvm use`)
1. Yarn

## Developing locally

### backend

First check out the latest version of the backend/api project from https://github.com/City-of-Helsinki/tilavarauspalvelu-core
and follow it's instructions.

Alternatively you can use an Azure development backend by changing the environment variable.

### https

Because we use tunnistamo SSO we require https and a valid domain (not localhost).

Make sure /etc/hosts point domain local-tilavaraus.hel.fi to 127.0.0.1. This is important because tunnistamo currently does not provide SameSite information for the cookies it uses. Some browsers (like Chrome) default the SameSite to be Lax. Because of this tunnistamo and the site it is authenticating for need to share same-site context. Without fulfilling this requirement the silent renew might not work properly due to browser blocking required cookies.

```
127.0.0.1       local-tilavaraus.hel.fi
```

Create a self-signed certificate for SSL connection on developpment server by running the following command in the common directory

```sh
# in common module
yarn generate-certificate
```

### environment variables

Use `.env.local` for development, you can copy the defaults from `.env.example`.

```sh
# in admin-ui
cp .env.example .env.local
```

| Name                                            | Description                                                   |
| ----------------------------------------------- | ------------------------------------------------------------- |
| NEXT_PUBLIC_TILAVARAUS_API_URL                  | tilavaraus-core base url                                      |
| NEXT_PUBLIC_RESERVATION_UNIT_PREVIEW_URL_PREFIX | https://tilavaraus.dev.hel.ninja/reservation-unit             |
| NEXT_PUBLIC_COOKIEHUB_ENABLED                   | Whether Cookiehub should be enabled                           |
| NEXT_PUBLIC_HOTJAR_ENABLED                      | Whether Hotjar should be enabled                              |
| NEXT_PUBLIC_BASE_URL                            | The baseUrl to use usually /kasittely                         |
| NEXT_PUBLIC_TUNNISTAMO_URL                      | Tunnistamo base path, used for logout page                    |
| NEXTAUTH_SECRET                                 | Generate one with: `openssl rand -base64 32`                  |
| NEXTAUTH_URL                                    | https://local-tilavaraus.hel.fi:3001/kasittely/api/auth       |
| OIDC_CLIENT_ID                                  | tilavaraus-admin-ui-dev                                       |
| OIDC_CLIENT_SECRET                              | Generate one with: `openssl rand -hex 32`                     |
| OIDC_URL                                        | https://tunnistamo.test.hel.ninja/openid                      |
| OIDC_TOKEN_URL                                  | https://tunnistamo.test.hel.ninja/openid/token                |
| OIDC_ACCESS_TOKEN_URL                           | https://tunnistamo.test.hel.ninja/api-tokens/                 |
| OIDC_TILAVARAUS_API_SCOPE                       | https://api.hel.fi/auth/tilavarausapidev                      |
| OIDC_PROFILE_API_SCOPE                          | https://api.hel.fi/auth/helsinkiprofile                       |
| OIDC_SCOPE                                      | openid profile https://api.hel.fi/auth/helsinkiprofile https://api.hel.fi/auth/tilavarausapidev |
| OIDC_CALLBACK_URL                               | https://local-tilavaraus.hel.fi:3001/kasittely/api/auth/callback/tunnistamo |
| NEXT_PUBLIC_OIDC_END_SESSION                    | https://tunnistamo.test.hel.ninja/openid/end-session |

NEXTAUTH_URL

This has to match the hostname you are running, and the basepath the app is running in.
Related to OIDC_CALLBACK_URL

format: {hostname}/{basePath}/api/auth

NEXTAUTH_SECRET

Secret to sign cookies and to sign and encrypt JSON Web Tokens
You can use: openssl rand -base64 32

OIDC_CALLBACK_URL

This has to be configured on the Authentication service (Tunnistamo).
Check current valid values from Confluence.

format: {hostname}/{basePath}/api/auth/callback/tunnistamo

NEXT_PUBLIC_TILAVARAUS_API_URL

local core runs by default in http://localhost:8000 you can also use the development server that runs in Azure.

### Start UI

```sh
# in admin-ui
yarn start
```

### Access with browser

With the standard env the admin-ui is accessible from: https://local-tilavaraus.hel.fi:3001/kasittely

### Test data

Some test data can be loaded to the backend with following command:

```
docker exec tilavarauspalvelu-core_dev_1 python manage.py loaddata fixtures/cases.json
```

You can also manually add test data by visiting the django admin at http://127.0.0.1:8000/admin after you create admin user:

```
docker exec -ti tilavarauspalvelu-core_dev_1 python manage.py createsuperuser
```

## GraphQL

Assuming you are using local backend.
Interactive graphql: `http://localhost:8000/graphql/`

Using the graphql console qequires login in to django at `http://localhost:8000/admin/`

### when the backend has changed

New api changes require updating the schema and typescript types.

Update the version backend version in `http://localhost:8000` using git and rebuild it (follow the backend README).

```sh
# in common module
yarn update-schema generate-gql-types
```

- Protip for VSCode users: install https://marketplace.visualstudio.com/items?itemName=GraphQL.vscode-graphql to get autocomplete suggestions and query validation when writing queries.

## Available Scripts

In the project directory, you can run:

### `yarn start`

### `yarn test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `yarn ts-check`

Typescript check

### `yarn lint`

Runs eslint against _.ts and _.tsx files in `./src`.

### `yarn lint:css`

Run stylelint to validate style declarations in `./src/**/*.tsx`.

### `yarn build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.
