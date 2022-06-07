# tilavarauspalvelu-admin-ui

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Prerequisites

1. Node 16 (`nvm use`)
1. Yarn

## Developing locally

First check out the latest version of the backend/api project from https://github.com/City-of-Helsinki/tilavarauspalvelu-core and change current directory to backend project and start it:

```
docker-compose up --build
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
yarn start
```

### When GQL api changes and you need to update the Typescript types

```
yarn generate-gql-types
```

### Access with browser

UI is at https://local-tilavaraus.hel.fi:3000/
Backend is at http://127.0.0.1:8000/v1/

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

### Graphql workflow

When server has new api changes -> update schema & generate new types by running: `yarn update-schema generate-gql-types`

- Protip for VSCode users: install https://marketplace.visualstudio.com/items?itemName=GraphQL.vscode-graphql to get autocomplete suggestions and query validation when writing queries.

## Configurable environment variables

Use `.env.local` for development.

| Name                                          | Description                                                      |
| --------------------------------------------- | ---------------------------------------------------------------- |
| REACT_APP_TILAVARAUS_API_URL                  | tilavaraus-core base url                                         |
| REACT_APP_OIDC_CLIENT_ID                      | Oidc client id                                                   |
| REACT_APP_OIDC_URL                            | https://api.hel.fi/sso                                           |
| REACT_APP_OIDC_SCOPE                          | openid profile email https://api.hel.fi/auth/tilavarausapidev    |
| REACT_APP_TILAVARAUS_API_SCOPE                | https://api.hel.fi/auth/tilavarausapidev                         |
| REACT_APP_DISABLE_AUTH                        | Flag to disable authentication                                   |
| REACT_APP_RESERVATION_UNIT_PREVIEW_URL_PREFIX | https://tvp-ui-dev.agw.arodevtest.hel.fi/reservation-unit/single |
| REACT_APP_COOKIEHUB_ENABLED                   | Whether Cookiehub should be enabled                              |
| REACT_APP_HOTJAR_ENABLED                      | Whether Hotjar should be enabled                                 |

## Available Scripts

In the project directory, you can run:

### `yarn start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `yarn test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `yarn test:e2e-local`

Runs end to end tests againt local setup. Both ui and api must be running before running the tests.

### `yarn lint`

Runs eslint against _.ts and _.tsx files in `./src`.

### `yarn lint:css`

Run stylelint to validate style declarations in `./src/**/*.tsx`.

### `yarn build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `yarn eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).
