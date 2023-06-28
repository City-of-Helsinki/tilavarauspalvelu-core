# tilavarauspalvelu-admin-ui

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

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

| Name                                          | Description                                                   |
| --------------------------------------------- | ------------------------------------------------------------- |
| REACT_APP_TILAVARAUS_API_URL                  | tilavaraus-core base url                                      |
| REACT_APP_OIDC_CLIENT_ID                      | Oidc client id                                                |
| REACT_APP_OIDC_URL                            | https://tunnistamo.test.hel.ninja/openid                      |
| REACT_APP_OIDC_SCOPE                          | openid profile email https://api.hel.fi/auth/tilavarausapidev |
| REACT_APP_TILAVARAUS_API_SCOPE                | https://api.hel.fi/auth/tilavarausapidev                      |
| REACT_APP_DISABLE_AUTH                        | Flag to disable authentication                                |
| REACT_APP_RESERVATION_UNIT_PREVIEW_URL_PREFIX | https://tilavaraus.dev.hel.ninja/reservation-unit             |
| REACT_APP_COOKIEHUB_ENABLED                   | Whether Cookiehub should be enabled                           |
| REACT_APP_HOTJAR_ENABLED                      | Whether Hotjar should be enabled                              |
| REACT_APP_API_TOKEN_URL                       | https://tunnistamo.test.hel.ninja/api-tokens/                 |

`REACT_APP_TILAVARAUS_API_URL`

local core runs by default in http://localhost:8000 you can also use the development server that runs in Azure.

### Start UI

```sh
# in admin-ui
yarn start
```

### Access with browser

UI is at https://local-tilavaraus.hel.fi:3000/kasittely

The UI development server exposes the proxied backend at http://127.0.0.1:3000/api/ which the UI uses.

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

Interactive graphql: `http://localhost:8000/graphql`

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
