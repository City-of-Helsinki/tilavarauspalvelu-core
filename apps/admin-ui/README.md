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

local core runs by default in http://127.0.0.1:8000 you can also use the development server that runs in Azure.

## Available Scripts

In the project directory, you can run:

### `pnpm dev`

With the standard env the admin-ui is accessible from: https://local-tilavaraus.hel.fi:3001/kasittely

### `pnpm test`

### `pnpm test:watch`

### `pnpm tsc`

Typescript check

### `pnpm lint`

### `pnpm lint:css`

Run stylelint to validate style declarations in `./src/**/*.tsx`.

### `pnpm build`

