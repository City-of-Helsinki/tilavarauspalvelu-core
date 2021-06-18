This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Prerequisites

1. Node lts/fermium (`nvm use`)
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

Start UI

```
yarn start
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

## Available Scripts

In the project directory, you can run:

### `yarn dev`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `yarn test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `yarn test:e2e-local`

Runs end to end tests against local setup. Both ui and api must be running before running this script.

### `yarn test:axe-local`

Runs accessibility tests against local setup. Both ui and api must be running before running this script.

### `yarn build`

Builds a production version

### `yarn start`

Starts production version

## Configurable environment variables

| Name                             | Description                                                   |
| -------------------------------- | ------------------------------------------------------------- |
| NEXT_PUBLIC_TILAVARAUS_API_URL   | tilavaraus-core base url                                      |
| NEXT_PUBLIC_SENTRY_DSN           | Sentry dsn                                                    |
| NEXT_PUBLIC_SENTRY_ENVIRONMENT   | Sentry environment, for example 'test', 'prod'                |
| NEXT_PUBLIC_OIDC_CLIENT_ID       | Oidc client id                                                |
| NEXT_PUBLIC_OIDC_URL             | https://api.hel.fi/sso                                        |
| NEXT_PUBLIC_OIDC_SCOPE           | openid profile email https://api.hel.fi/auth/tilavarausapidev |
| NEXT_PUBLIC_TILAVARAUS_API_SCOPE | https://api.hel.fi/auth/tilavarausapidev                      |
| NEXT_PUBLIC_ENABLE_MATOMO        | 'true' enables matomo tracking                                |
