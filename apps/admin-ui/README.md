# tilavarauspalvelu-admin-ui

## environment variables

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

NEXT_PUBLIC_TILAVARAUS_API_URL

local core runs by default in http://127.0.0.1:8000 you can also use the development server that runs in Azure.

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

