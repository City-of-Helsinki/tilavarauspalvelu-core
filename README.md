# tilavarauspalvelu-ui
- [End user UI](apps/ui/)
- [Admin UI](apps/admin-ui/)
- [Common UI components](packages/common/)

## Making a release

Draft a new release in https://github.com/City-of-Helsinki/tilavarauspalvelu-ui/releases - `ui` and `admin-ui` pipelines will pick up releases named `v-*`.

Old releases are named `release-*`

Include a changelog if applicable.

## Prerequisites

1. Node 18 (`nvm use`)
1. pnpm

## Scripts

Running scripts in the repo root uses turborepo to run the commands to all packages.

You can target commands using:
```
# only that package
pnpm {command} --filter {package_name}

# only that package and it's dependencies
pnpm {command} --filter {package_name}...
```

You can disable cache (in most cases, ex. tsc uses it's own cache)
``` sh
# disable reads (this is usually what you want)
pnpm lint --force
# disable writes (usually if you are adding new commands)
pnpm dev --no-cache
```

Install deps
``` sh
pnpm i
```

Update GraphQL schema and types.
``` sh
pnpm codegen
```

Start both frontends in dev mode
``` sh
pnpm dev
```

Lint all packages
``` sh
pnpm lint
# automatic fixing
pnpm lint:fix
```

Stylelint all packages
``` sh
pnpm lint:css
```

Typecheck all packages
``` sh
pnpm tsc:check
# if you need to remove caches
pnpm tsc:clean
```

Build all packages
```
pnpm build
```

Test all packages
```
pnpm test
```

### run commands inside individual projects

Usually you only want to do this if you are testing something or you are writing a new master command.

Example you need to use different options to the typescript compile.

``` sh
# go to app / package directory (not root) ex.
cd apps/ui
pnpm tsc ...
```

### adding a new command

#### If you need to run the command inside a package

- Add the command you want to all the individual packages `package.json` you want.
Leave the packages you don't want untouched.
- Add the master command to turbo.json
- Add `turbo $cmd` to `/package.json`
- Run the command `pnpm $cmd`

#### if you need to run it on the root level

- Add the `$cmd` directly to `/package.json`
- Run the command `pnpm $cmd`

## Repo structure

Main applications that don't depend on each other, can be built, and ran.
```
/apps
```

Dependencies that are used by multiple applications
```
/packages
```

## Developing locally

### backend

First check out the latest version of the backend/api project from https://github.com/City-of-Helsinki/tilavarauspalvelu-core
and follow it's instructions.

Alternatively you can use an Azure development backend by changing the environment variable.

### access

If you run all the apps using `pnpm dev` in the root.

Admin-ui: [http://localhost:3001/kasittely]/(http://localhost:3001/kasittely)

UI: [http://localhost:3000]/(http://localhost:3000)

## GraphQL

Assuming you are using local backend.
Interactive graphql: `http://localhost:8000/graphql/`

Using the graphql console requires login to django at `http://localhost:8000/admin/`

### Updates to graphql schema

New api changes require updating the schema and typescript types.

Update the version backend version in `http://localhost:8000` using git and rebuild it (follow the backend README).

```sh
# in repo root
pnpm codegen
```

## FAQ

### What's a server issue

How do you know it's server side? it's in the terminal logs not in the browser network request / logs.

In general for a basic page render that requires data
Nextjs does everything twice: it renders twice, it fetches twice, one on the server (SSR), one on the client (hydration).
On the server it uses Node, on the client it uses the browser.

Especially for fetch this is an issue since the native fetch in Node is rather quirky,
unlike browser APIs.

### Node 18 / 20 fetch failed server side

Check that your `/etc/hosts` has
```
127.0.0.1       localhost
# IMPORTANT! ipv6 address after ipv4
::1             localhost
```

Use `ENABLE_FETCH_HACK=true` env for UI app. That changes SSR fetches to 127.0.0.1 instead of localhost.
This will break authenticated queries for SSR though (not used currently) because it can't include credentials.

#### other possible solutions

Other possible solutions replace localhost with 127.0.0.1
This should fix the issue, but the backend authentication to tunnistamo doesn't work because it expects localhost as a callback address.

Try disabling node fetch api
``` sh
node --no-experimental-fetch
# e.g.
NODE_OPTIONS="--no-experimental-fetch" pnpm dev
# or
cd apps/ui
NODE_OPTIONS="--no-experimental-fetch" next dev
```

#### Explanation

Node 18+ uses IPv6 as default so either we have to tell it to use IPv4 or change to 127.0.0.1 to explicitly
tell it that we are connecting to IPv4 address and not to :1.

127.0.0.1 would be the prefered solution except it breaks callback addresses that are configured to use localhost.

### Disable node fetch api

Turn off experimental fetch in the start script.
For example MSW requires this for local testing (non Docker), might help with other libraries also,
primarily those that manipulate or intercept requests.

```
"NODE_OPTIONS='--no-experimental-fetch' {cmd} ...
```

Or add this code before making a network request. DON'T use it on the client (only node server).
``` js
const dns = await import('node:dns');
dns.setDefaultResultOrder('ipv4first');
```

### Other server issues

Try downgrading node to 16, if it helps post a bug ticket.
