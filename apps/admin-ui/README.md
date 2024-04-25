# tilavarauspalvelu-admin-ui

## environment variables

Use `.env.local` for development, you can copy the defaults from `.env.example`.

```sh
# in admin-ui
cp .env.example .env.local
```

| Name                                | Description                                                   |
| ------------------------------------| ------------------------------------------------------------- |
| NEXT_PUBLIC_BASE_URL                | The baseUrl to use usually /kasittely                         |
| TILAVARAUS_API_URL                  | tilavaraus-core base url                                      |
| RESERVATION_UNIT_PREVIEW_URL_PREFIX | https://tilavaraus.dev.hel.ninja/reservation-unit             |

`TILAVARAUS_API_URL` is required to be set because the node server doing SSR can't connect to the backend without it.
Unlike a pure browser bundle even if they are running on the same host, the SSR is a separate server behind a reverse proxy.

`SKIP_ENV_VALIDATION` should only be used for building and testing.

## Available Scripts

In the project directory, you can run:

### `pnpm dev`

With the standard env the admin-ui [http://localhost:3001/kasittely]/(http://localhost:3001/kasittely) to view it in the browser.

### `pnpm test`

### `pnpm test:watch`

### `pnpm tsc`

Typescript check

### `pnpm lint`

### `pnpm lint:css`

Run stylelint to validate style declarations in `./src/**/*.tsx`.

### `pnpm build`

